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

const TokenDal           = require('../dal/token');
const ScreeningDal       = require('../dal/screening');
const AnswerDal          = require('../dal/answer');
const LogDal             = require('../dal/log');
const NotificationDal    = require('../dal/notification');
const ClientDal          = require('../dal/client');
const TaskDal            = require('../dal/task');

let hasPermission = checkPermissions.isPermitted('SCREENING');

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

    let screening = yield ScreeningDal.get({ client: body.client });
    if(screening) {
      throw new Error('Screening Form for the client already exists!!');
    }

    let answers = [];

    // Create Answer Types
    for(let answer of body.answers) {
      let subs = [];

      if(answer.sub_answers) {
        for(let sub of answer.sub_answers) {
          let ans = yield AnswerDal.create(sub);

          subs.push(ans);
        }
      }
      answer.sub_answers = subs;
      answer = yield AnswerDal.create(answer);

      answers.push(answer);
    }

    body.answers = answers;
    body.client = client._id;
    body.title = 'Screening Form';
    body.description = `Screening Application For ${client.first_name} ${client.last_name}`;
    body.created_by = this.state._user._id;
    body.branch = client.branch._id;

    // Create Screening Type
    screening = yield ScreeningDal.create(body);

    this.body = screening;

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

    if(body.status === 'approved') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'eligible' });
      let task = yield TaskDal.update({ entity_ref: screening._id }, { status: 'completed' });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Screening of ${client.first_name} ${client.last_name} has been approved`,
          task_ref: task._id
        });
      }

    } else if(body.status === 'declined_final') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'ineligible' });
      let task = yield TaskDal.update({ entity_ref: screening._id }, { status: 'completed' });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Screening of ${client.first_name} ${client.last_name} has been declined in Final`,
          task_ref: task._id
        }); 
      }
      

    } else if(body.status === 'declined_under_review') {
      client = yield ClientDal.update({ _id: screening.client }, { status: 'screening_inprogress' });
      let task = yield TaskDal.update({ entity_ref: screening._id }, { status: 'completed' });
      if(task) {
        // Create Review Task
        let _task = yield TaskDal.create({
          task: `Review Screening Application of ${client.first_name} ${client.last_name}`,
          task_type: 'review',
          entity_ref: screening._id,
          entity_type: 'screening',
          created_by: this.state._user._id,
          user: task.created_by,
          branch: screening.branch
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

    if(body.answers) {
      let answers = [];

      for(let answer of body.answers) {
        let answerID = answer._id;

        delete answer._id;
        delete answer._v;
        delete answer.date_created;
        delete answer.last_modified;

        let result = yield AnswerDal.update({ _id: answerID }, answer);

        answers.push(result);
      }

      body.answers = answers;
    }

    screening = yield ScreeningDal.update(query, body);

    if(body.status && body.status === 'submitted') {
      // Create Task
      yield TaskDal.create({
        task: `Approve Screening For of ${client.first_name} ${client.last_name}`,
        task_type: 'approve',
        entity_ref: screening._id,
        entity_type: 'screening',
        created_by: this.state._user._id,
        branch: screening.branch
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

  if(!this.query.source || (this.query.source != 'web' && this.query.source != 'app')) {
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
  }
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

    for(let answer of screening.answers) {
      answer = yield AnswerDal.delete({ _id: answer._id });
      if(answer.sub_answers.length) {
        for(let _answer of answer.sub_answers) {
          yield AnswerDal.delete({ _id: _answer._id });
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
