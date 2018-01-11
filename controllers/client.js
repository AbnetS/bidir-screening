'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:client-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const googleBuckets      = require('../lib/google-buckets');
const checkPermissions   = require('../lib/permissions');

const Account            = require('../models/account');

const TokenDal           = require('../dal/token');
const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const ScreeningDal       = require('../dal/screening');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const AnswerDal          = require('../dal/answer');

let hasPermission = checkPermissions.isPermitted('CLIENT');


/**
 * Create a client.
 *
 * @desc create a client using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */
exports.create = function* createClient(next) {
  debug('create client');

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'CLIENT_CREATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let body = this.request.body;
  let bodyKeys = Object.keys(body);
  let isMultipart = (bodyKeys.indexOf('fields') !== -1) && (bodyKeys.indexOf('files') !== -1);

  // If content is multipart reduce fields and files path
  if(isMultipart) {
    let _clone = {};

    for(let key of bodyKeys) {
      let props = body[key];
      let propsKeys = Object.keys(props);

      for(let prop of propsKeys) {
        _clone[prop] = props[prop];
      }
    }

    body = _clone;

  }

  let errors = [];

  if(!body.first_name) errors.push('Client First Name is Empty');
  if(!body.last_name) errors.push('Client Last Name is Empty');
  if(!body.grandfather_name) errors.push('Client Grandfather name is Empty');
  if(!body.gender) errors.push('Client Gender is Empty');
  if(!body.national_id_no) errors.push('Client National Id No is Empty');
  if(!body.branch || !validator.isMongoId(body.branch)) errors.push('Client Related Branch is Empty');
  //if(!body.created_by|| !validator.isMongoId(body.created_by)) errors.push('Client Created By is Empty');
  if(!body.civil_status) errors.push('Client Civil Status is Empty');
  if(!body.household_members_count) errors.push('Client household_members_count is Empty');
  if(body.civil_status.toLowerCase() !== 'single' && !body.spouse) {
    errors.push('Client Spouse Info is Empty!!')
  }

  if(errors.length) {
    return this.throw(new CustomError({
      type: 'MFI_CREATION_ERROR',
      message: JSON.stringify(errors)
    }));
  }

  try {
    let screeningForm = yield FormDal.get({ type: 'Screening' });
    if(!screeningForm || !screeningForm._id) {
      throw new Error('Screening Form Is Needed To Be Created In Order To Continue!')
    }

    let client = yield ClientDal.get({ national_id_no: body.national_id_no });
    if(client) {
      throw new Error('Client with those details already exists!!');
    }

    if(body.national_id_card) {
      let filename  = body.first_name.trim().toUpperCase().split(/\s+/).join('_');
      let id        = crypto.randomBytes(6).toString('hex');
      let extname   = path.extname(body.national_id_card.name);
      let assetName = `${filename}_${id}${extname}`;

      let url       = yield googleBuckets(body.national_id_card.path, assetName);

      body.national_id_card = url;
    }

    if(body.picture) {
      let filename  = body.first_name.trim().toUpperCase().split(/\s+/).join('_');
      let id        = crypto.randomBytes(6).toString('hex');
      let extname   = path.extname(body.picture.name);
      let assetName = `${filename}_${id}${extname}`;

      let url       = yield googleBuckets(body.picture.path, assetName);

      body.picture = url;
    }

    if(isMultipart) {
      if(body.spouse) {
        body.spouse = JSON.parse(body.spouse);
      }
      if(body.geolocation) {
        body.geolocation = JSON.parse(body.geolocation);
      }
    }

    body.created_by = this.state._user._id;


    // Create Client Type
    client = yield ClientDal.create(body);

    // Create New Screening
    let answers = [];
    let screeningBody = {};
    screeningForm = screeningForm.toJSON();

    // Create Answer Types
    for(let question of screeningForm.questions) {
      let subs = [];
      delete question._id;

      if(question.sub_questions.length) {
        for(let sub of question.sub_questions) {
          delete sub._id;
          let ans = yield AnswerDal.create(sub);

          subs.push(ans);
        }
      }
      question.sub_questions = subs;

      let answer = yield AnswerDal.create(question);

      answers.push(answer);
    }

    screeningBody.answers = answers;
    screeningBody.client = client._id;
    screeningBody.title = 'Screening Form';
    screeningBody.description = `Screening Application For ${client.first_name} ${client.last_name}`;
    screeningBody.created_by = this.state._user._id;
    screeningBody.branch = client.branch._id;

    // Create Screening Type
    let screening = yield ScreeningDal.create(screeningBody);

    this.body = client;

  } catch(ex) {
    this.throw(new CustomError({
      type: 'CLIENT_CREATION_ERROR',
      message: ex.message
    }));
  }

};


/**
 * Get a single client.
 *
 * @desc Fetch a client with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneClient(next) {
  debug(`fetch client: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    let client = yield ClientDal.get(query);

    yield LogDal.track({
      event: 'view_client',
      client: this.state._user._id ,
      message: `View client - ${client.phone}`
    });

    this.body = client;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'CLIENT_VIEW_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Update Client Status
 *
 * @desc Fetch a client with the given ID and update their respective status.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateClient(next) {
  debug(`updating status client: ${this.params.id}`);

  return this.body = { message: 'use PUT /screenings/clients/:id'}

  this.checkBody('status')
      .notEmpty('status should not be empty');

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let client = yield ClientDal.update(query, body);

    yield LogDal.track({
      event: 'client_status_update',
      client: this.state._user._id ,
      message: `Update Status for ${client.phone}`,
      diff: body
    });

    this.body = client;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'CLIENT_STATUS_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update a single client.
 *
 * @desc Fetch a client with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.update = function* updateClient(next) {
  debug(`updating client: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'CLIENT_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let client = yield ClientDal.update(query, body);

    yield LogDal.track({
      event: 'client_update',
      client: this.state._user._id ,
      message: `Update Info for ${client.phone}`,
      diff: body
    });

    this.body = client;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_CLIENT_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of clients by Pagination
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllClients(next) {
  debug('get a collection of clients by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  /*if(!this.query.source || (this.query.source != 'web' && this.query.source != 'app')) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_COLLECTION_ERROR',
      message: 'Query Source should be either web or app'
    }));
  }

  if(this.query.source == 'web' && !isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_COLLECTION_ERROR',
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

    // Super Admin
    if (!account) {
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

    /*if(this.query.source == 'app') {
      if(!account) {
        throw new Error('Please View Using Web!!');
      }
      
      if(!account.multi_branch) {
        query = {
          created_by: user._id
        };
      } else if(canViewAll) {
        if(account.access_branches.length) {
          query.access_branches = { $in: account.access_branches };

        } else if(account.default_branch) {
          query.default_branch = account.default_branch;

        }
      }

    } else if(this.query.source == 'web') {
      if(!account.multi_branch) {
        if(account.access_branches.length) {
          query.access_branches = { $in: account.access_branches };

        } else if(account.default_branch) {
          query.default_branch = account.default_branch;

        }
      }
    }
*/
    let clients = yield ClientDal.getCollectionByPagination(query, opts);

    this.body = clients;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Remove a single client.
 *
 * @desc Fetch a client with the given id from the database
 *       and Remove their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.remove = function* removeClient(next) {
  debug(`removing client: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try { 
    let client = yield ClientDal.delete(query);
    if(!client._id) {
      throw new Error('Client Does Not Exist!');
    }

    yield LogDal.track({
      event: 'client_delete',
      permission: this.state._user._id ,
      message: `Delete Info for ${client._id}`
    });

    this.body = answer;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'REMOVE_CLIENT_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Search Clients
 *
 * @desc Search a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.search = function* searchClients(next) {
  debug('get a collection of clients by pagination');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };


  try {

    let searchTerm = this.query.search;
    if(!searchTerm) {
      throw new Error('Please Provide A Search Term');
    }

    searchTerm = { $regex: new RegExp(`${searchTerm}`), $options: 'i' };

    query = {
      $or: [{
        gender: searchTerm
      },{
        first_name: searchTerm
      },{
        last_name: searchTerm
      },{
        national_id_no: searchTerm
      },{
        woreda: searchTerm
      },{
        kebele: searchTerm
      },{
        house_no: searchTerm
      },{
        phone: searchTerm
      },{
        household_members_count: searchTerm
      },{
        status: searchTerm
      }]
    }

    if(validator.isMongoId(searchTerm)) {
      query.$or.push({
        branch: searchTerm
      })
    }
   
    let clients = yield ClientDal.getCollectionByPagination(query, opts);

    this.body = clients;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'SEARCH_CLIENTS_ERROR',
      message: ex.message
    }));
  }
};
