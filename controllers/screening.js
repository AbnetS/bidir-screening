'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:screening-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');
const emquery    = require('emquery');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const checkPermissions   = require('../lib/permissions');

const Account            = require('../models/account');
const Screening          = require('../models/screening');
const Question           = require('../models/question');
const Form               = require('../models/form');
const Section            = require('../models/section');
const History            = require('../models/history');
const ClientACAT         = require('../models/clientACAT');
const Loan               = require('../models/loan');

const TokenDal           = require('../dal/token');
const ScreeningDal       = require('../dal/screening');
const QuestionDal          = require('../dal/question');
const LogDal             = require('../dal/log');
const NotificationDal    = require('../dal/notification');
const ClientDal          = require('../dal/client');
const TaskDal            = require('../dal/task');
const AccountDal         = require('../dal/account');
const SectionDal         = require('../dal/section');
const HistoryDal          = require('../dal/history');

let hasPermission = checkPermissions.isPermitted('SCREENING');
let PREQS = [];

/**
 * Create a screening.
 *
 * @desc create a screening using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */
exports.create = function* createScreening(next) {
  debug('create screening');

  let body = this.request.body;

  this.checkBody('client')
      .notEmpty('Screening Client is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'SCREENING_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {

    let client = yield ClientDal.get({ _id: body.client });
    if(!client) {
      throw new Error('Client With Those Details Does Not Exist!!');
    }

    let screening = yield validateCycle(body);

    let history = yield History.findOne({client: client._id}).exec()
    if (!history) {
      throw new Error('Client Has No Loan History');

    } else {
      history = history.toJSON();

      let cycleOk = true;
      let whichCycle;
      let missingApplications = [];

      for(let cycle of history.cycles) {
        if (!cycle.acat || !cycle.loan || !cycle.screening) {
          !cycle.screening ? missingApplications.push('Screening') : null;
          !cycle.loan ? missingApplications.push('Loan'): null;
          !cycle.acat ? missingApplications.push('ACAT'): null;
          cycleOk = false;
          whichCycle = cycle.cycle_number;
          break;
        }
      }

      if (!cycleOk) {
        throw new Error(`Loan Cycle (${whichCycle}) is in progress. Missing ${missingApplications.join(',')} Application(s)`);
      }
    }

    let screeningBody = {};
    let questions = [];
    let sections = [];

      // Create Answer Types
     PREQS = [];
      for(let question of screening.questions) {
        question = yield createQuestion(question);

        if(question) {
          questions.push(question._id);
        }
      }

      yield createPrerequisites();

      // Create Section Types
      PREQS = [];
      for(let section of screening.sections) {
        section = yield Section.findOne({ _id: section }).exec();
        if(!section) continue;
        section = section.toJSON();

        let _questions = [];
        delete section._id;
        if(section.questions.length) {

          for(let question of section.questions) {
            PREQS = [];
            question = yield createQuestion(question);
            if(question) {

              _questions.push(question._id);
            }

            
          }

        }

        section.questions = _questions;

        let _section = yield SectionDal.create(section);

        sections.push(_section._id);
      }

      yield createPrerequisites();

      screeningBody.questions = questions.slice();
      screeningBody.sections = sections.slice();
      screeningBody.client = client._id;
      screeningBody.title = screening.title;
      screeningBody.subtitle = screening.subtitle;
      screeningBody.purpose = screening.purpose;
      screeningBody.layout = screening.layout;
      screeningBody.has_sections = screening.has_sections;
      screeningBody.disclaimer = screening.disclaimer;
      screeningBody.signatures = screening.signatures.slice();
      screeningBody.created_by = this.state._user._id;
      screeningBody.branch = client.branch._id;


    // Create Screening Type
    let newscreening = yield ScreeningDal.create(screeningBody);

    yield ClientDal.update({ _id: client._id},{
      status: "new"
    });

    
    if (history) {
      let cycleNumber = history.cycle_number + 1;

      yield History.findOneAndUpdate({
        _id: history._id
      },{
        $set: {
          cycle_number: cycleNumber,
          last_modified:  moment().toISOString()
        },
        $push: {
          cycles: {
            cycle_number: cycleNumber,
            started_by: this.state._user._id,
            last_edit_by: this.state._user._id,
            screening: newscreening._id
          }
        }
      }).exec()
    }

    this.body = newscreening;

  } catch(ex) {
    this.throw(new CustomError({
      type: 'SCREENING_CREATION_ERROR',
      message: ex.message
    }));
  }

};


/**
 * Get a single screening.
 *
 * @desc Fetch a screening with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneScreening(next) {
  debug(`fetch screening: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'SCREENING_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };

  try {
    let screening = yield ScreeningDal.get(query);

    yield LogDal.track({
      event: 'view_screening',
      screening: this.state._user._id ,
      message: `View screening - ${screening.title}`
    });

    this.body = screening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'SCREENING_RETRIEVAL_ERROR',
      message: ex.message
    }));
  }

};



/**
 * Update Screening Status
 *
 * @desc Fetch a screening with the given ID and update their respective status.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateScreening(next) {
  debug(`updating status screening: ${this.params.id}`);

  return this.body = { message: 'Use PUT /screenings/:id' };
  

  let isPermitted = yield hasPermission(this.state._user, 'AUTHORIZE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'SCREENING_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  this.checkBody('status')
      .notEmpty('Status should not be empty')
      .isIn(['inprogress','approved', 'submitted','declined_final', 'declined_under_review'], 'Correct Status is either inprogress, declined_final, approved, submitted or declined_under_review');

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  try {

    let screening = yield ScreeningDal.get(query);

    if(screening.status === 'new') {
      let client = yield ClientDal.update({ _id: screening.client }, { status: 'inprogress' });
    }

    

    screening = yield ScreeningDal.update(query, body);

    /*if(body.status === 'declined') {
      let client = yield ClientDal.get({ _id: screening.client });

      yield NotificationDal.create({
        for: screening.created_by,
        message: `Screening for ${client.first_name} ${client.last_name} has been declined.`
      });
    }*/

    yield LogDal.track({
      event: 'screening_status_update',
      screening: this.state._user._id ,
      message: `Update Status for ${screening.title}`,
      diff: body
    });

    this.body = screening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'SCREENING_STATUS_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update a single screening.
 *
 * @desc Fetch a screening with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.update = function* updateScreening(next) {
  debug(`updating screening: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'SCREENING_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let canApprove = yield hasPermission(this.state._user, 'AUTHORIZE');

  this.checkBody('status')
      .notEmpty('Status should not be empty')
      .isIn(['screening_inprogress','submitted', 'approved','declined_final', 'declined_under_review'], 'Correct Status is either screening_inprogress, approved, submitted, declined_final or declined_under_review');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'SCREENING_UPDATE_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  try {
    if(body.status === 'approved' || body.status === 'declined_final' || body.status === 'declined_under_review' ) {
      if(!canApprove) {
        throw new Error("You Don't have enough permissions to complete this action");
      }
    }
    let screening = yield ScreeningDal.get(query);
    let client    = yield ClientDal.get({ _id: screening.client });
    let comment = body.comment ? body.comment : '';

    if(body.status === 'approved') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'eligible' });
      let task = yield TaskDal.update({ entity_ref: screening._id }, { status: 'completed', comment: comment });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Screening of ${client.first_name} ${client.last_name} has been approved`,
          task_ref: task._id
        });
      }

    } else if(body.status === 'declined_final') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'ineligible' });
      let task = yield TaskDal.update({ entity_ref: screening._id }, { status: 'completed', comment: comment });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Screening of ${client.first_name} ${client.last_name} has been declined in Final`,
          task_ref: task._id
        }); 
      }
      

    } else if(body.status === 'declined_under_review') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'screening_inprogress' });
      let task = yield TaskDal.update({ entity_ref: screening._id }, { status: 'completed', comment: comment });
      if(task) {
        // Create Review Task
        let _task = yield TaskDal.create({
          task: `Review Screening Application of ${client.first_name} ${client.last_name}`,
          task_type: 'review',
          entity_ref: screening._id,
          entity_type: 'screening',
          created_by: this.state._user._id,
          user: task.created_by,
          branch: screening.branch,
          comment: comment
        });
        yield NotificationDal.create({
          for: this.state._user._id,
          message: `Screening Application of ${client.first_name} ${client.last_name} has been declined For Further Review`,
          task_ref: _task._id
        });
      }
      

    } else if(body.status === 'submitted') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'screening_inprogress' });
    }
    
    let mandatory = false;

    if (body.sections) {
      for(let section of body.sections) {
        if(section._id) {
          for(let question of section.questions) {
            yield updateQuestions(question);
          }
        }
      }
      delete body.sections;
    }

    if (body.questions) {
      for(let question of body.questions) {
        if(question._id) {
          yield updateQuestions(question);
        }
      }
      delete body.questions;
    }

    function updateQuestions(question) {
      return co(function* () {
        let subQuestions = Array.isArray(question.sub_questions) ? question.sub_questions.slice() : [];
        let ref = question._id;

        delete question.sub_questions;
        delete question._v;
        delete question.date_created;
        delete question.last_modified;

        yield QuestionDal.update({ _id: ref }, question);

        for(let subQuestion of subQuestions) {
            yield updateQuestions(subQuestion);
        }
      })
    }

    screening = yield ScreeningDal.update(query, body);

    if(body.status && body.status === 'submitted') {
      // Create Task
      yield TaskDal.create({
        task: `Approve Screening For ${client.first_name} ${client.last_name}`,
        task_type: 'approve',
        entity_ref: screening._id,
        entity_type: 'screening',
        created_by: this.state._user._id,
        branch: screening.branch,
        comment: comment
      })
    }

    yield LogDal.track({
      event: 'screening_update',
      screening: this.state._user._id ,
      message: `Update Info for ${screening.title}`,
      diff: body
    });

    this.body = screening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'SCREENING_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of screenings by Pagination
 *
 * @desc Fetch a collection of screenings
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllScreenings(next) {
  debug('get a collection of screenings by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;

  /*if(!this.query.source || (this.query.source != 'web' && this.query.source != 'app')) {
    return this.throw(new CustomError({
      type: 'VIEW_SCREENINGS_COLLECTION_ERROR',
      message: 'Query Source should be either web or app'
    }));
  }

  if(this.query.source == 'web' && !isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_SCREENINGS_COLLECTION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }*/

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');


  try {
    
    let user = this.state._user;
    let account = yield Account.findOne({ user: user._id }).exec();
    let query = {};

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query = {
          created_by: user._id
        };

    // DEFAULT
    } else {
      query = {
          created_by: user._id
        };
    }

    if(this.query.show_active) {
      query.status = {
        $in: ['screening_inprogress','submitted', 'new', 'declined_under_review']
      };
    }

    let screenings = yield ScreeningDal.getCollectionByPagination(query, opts);

    this.body = screenings;
    
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_SCREENINGS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};


/**
 * Remove a single screening.
 *
 * @desc Fetch a screening with the given id from the database
 *       and Remove their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.remove = function* removeScreening(next) {
  debug(`removing screening: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    let screening = yield ScreeningDal.delete(query);
    if(!screening._id) {
      throw new Error('Screening Does Not Exist!');
    }

    for(let question of screening.questions) {
      question = yield QuestionDal.delete({ _id: question._id });
      if(question.sub_questions.length) {
        for(let _question of question.sub_questions) {
          yield QuestionDal.delete({ _id: _question._id });
        }
      }
    }

    yield LogDal.track({
      event: 'screening_delete',
      permission: this.state._user._id ,
      message: `Delete Info for ${screening._id}`
    });

    this.body = screening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'REMOVE_SCREENING_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Search Screenings
 *
 * @desc Search a collection of screenings
 *
 * @param {Function} next Middleware dispatcher
 */
exports.search = function* searchScreenings(next) {
  debug('get a collection of clients by pagination');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');

  try {
    let user = this.state._user;
    let account = yield Account.findOne({ user: user._id }).exec();
    let query = {};

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query = {
          created_by: user._id
        };

    // DEFAULT
    } else {
      query = {
          created_by: user._id
        };
    }


    let searchTerm = this.query.search;
    if(!searchTerm) {
      throw new Error('Please Provide A Search Term');
    }
    
    query.$or = [];

    let terms = searchTerm.split(/\s+/);
    let groupTerms = { $in: [] };

    for(let term of terms) {
      if(validator.isMongoId(term)) {
        throw new Error('IDs are not supported for Search');
      }

      term = new RegExp(`${term}`, 'i')

      groupTerms.$in.push(term);
    }

    query.$or.push({
        title: groupTerms
      },{
        description: groupTerms
      },{
        status: groupTerms
    })

   
    let screenings = yield ScreeningDal.getCollectionByPagination(query, opts);

    this.body = screenings;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'SEARCH_SCREENINGS_ERROR',
      message: ex.message
    }));
  }
};


// Utilities
function createQuestion(question) {
  return co(function* () {
    if(question) {
      question = yield Question.findOne({ _id: question }).exec();
      if(!question) return;

      question = question.toJSON();
    }


    let subs = [];
    delete question._id;

    if(question.sub_questions.length) {
      for(let sub of question.sub_questions) {
        delete sub._id;
        let ans = yield createQuestion(sub);

        if(ans) {
          subs.push(ans._id);
        }
      }

      question.sub_questions = subs;
    }

    let prerequisites = question.prerequisites.slice();

    question.prerequisites = [];

    question = yield QuestionDal.create(question);

    PREQS.push({
      _id: question._id,
      question_text: question.question_text,
      prerequisites: prerequisites
    });



    return question;

  })
}


function createPrerequisites() {
  return co(function*() {
    if(PREQS.length) {
      for(let question of PREQS) {
        let preqs = [];
        for(let  prerequisite of question.prerequisites) {
          let preq = yield Question.findOne({ _id: prerequisite.question }).exec();

          let ques = yield findQuestion(preq.question_text);
          if(ques) {
            preqs.push({
              answer: prerequisite.answer,
              question: ques._id
            })
          }
        }

        yield QuestionDal.update({ _id: question._id }, {
          prerequisites: preqs
        })
      }
    } 
  })
}

function findQuestion(text) {
  return co(function* () {
    let found = null;

    if(PREQS.length) {
      for(let question of PREQS) {

        question = yield Question.findOne({ _id: question._id }).exec();

        if(question.question_text == text) {
          found = question;
          break;
        }
      }
    }

    return found;
  })
}

function validateCycle(body) {
  return co(function*(){
    debug("Validating loan cycle")
    // Validate Screenings
    let screenings = yield Screening.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();
    if(!screenings.length) {
      throw new Error('Client Has No Screening Form Yet!');
    }

    for(let screening of screenings) {
      if(screening.status === "new" || screening.status === "screening_inprogress" || screening.status === "submitted") {
        throw new Error('Client Has A Screening in progress!!')
      }
    }

    // Validate Loans
    let loans = yield Loan.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    for(let loan of loans) {
      if(loan.status === 'new' || loan.status === 'submitted' || loan.status === "inprogress") {
        throw new Error('Client Has A Loan in progress!!')
      }
    }

    // Validate acats
    let clientACATS = yield ClientACAT.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    for(let acat of clientACATS) {
      if(acat.status === 'new' || acat.status === 'submitted' || acat.status === 'resubmitted' || acat.status === "inprogress") {
        throw new Error('Client Has An ACAT in progress!!')
      }
    }

    let screening = yield Screening.findOne({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    return screening;
    
  })
}