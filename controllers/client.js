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
const fs         = require('fs-extra');
const request    = require('request-promise');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const googleBuckets      = require('../lib/google-buckets');
const checkPermissions   = require('../lib/permissions');
const FORM               = require('../lib/enums').FORM;
const CBS                = require('../lib/cbs');

const Account            = require('../models/account');
const Question           = require('../models/question');
const Form               = require('../models/form');
const Section            = require('../models/section');
const History            = require('../models/history');
const Client             = require ('../models/client');

const TokenDal           = require('../dal/token');
const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const ScreeningDal       = require('../dal/screening');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const QuestionDal        = require('../dal/question');
const SectionDal         = require('../dal/section');
const HistoryDal         = require('../dal/history');
const ACATConfigDal      = require('../dal/ACATConfig');

let hasPermission = checkPermissions.isPermitted('CLIENT');

let PREQS = [];
let cbs = null;

exports.connectToCBS = function* connectToCBS(next){
  debug('connect to CBS')

  try {
    let ACATConfig = yield ACATConfigDal.get({})
    if (!ACATConfig) {
      ACATConfig = yield ACATConfigDal.create({})
    }

    cbs = new CBS(ACATConfig.cbs)

    yield cbs.initialize();

    this.body = {
      message: "Connected Successfully"
    }

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'CONNECT_TO_CBS_ERROR',
      message: ex.message
    }));
  }
}

exports.updateCBSCOnfig = function* updateCBSCOnfig(next){
  debug('update CBS Config')

  let body = this.request.body;


  try {
    let ACATConfig = yield ACATConfigDal.get({})
    if (!ACATConfig) {
      ACATConfig = yield ACATConfigDal.create({})
    }

    let data = {
      cbs: body
    }

    ACATConfig = yield ACATConfigDal.update({ _id: ACATConfig._id}, data)

    this.body =  ACATConfig;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_CBS_CONFIG_ERROR',
      message: ex.message
    }));
  }
}

/**
 * Create a client.
 *
 * @desc create a client using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */

exports.uploadBulkToCBS = function* uploadBulkToCBS(next) {
  debug('Push Clients To CBS');

  if (!cbs.connected) {
    return this.throw(new CustomError({
      type: 'CLIENT_TO_CBS_ERROR',
      message: cbs.connection_err || "Connection To CBS Error!"
    }));
  }

  let body = this.request.body;

  try {
    if (!Array.isArray(body)) {
      throw new Error('Expected An List of clients to CBS');
    }

    let items = body.slice();
    for(let item of items) {
      let client = yield ClientDal.get({ _id: item.client });
      if(!client) {
        throw new Error(`Client ${item.client} does not exists!!`);
      }

      if (client.status !== 'loan_granted') {
        throw new Error(`Client ${item.client} Has Not Been Granted A Loan!`)
      }

      try {
        let imgId = "";
      let cardId = "";

      if (client.picture) {
        imgId = yield cbs.uploadPicture(client.picture);
      }

      if (client.national_id_card) {
        cardId = yield cbs.uploadID(client.national_id_card);
      }

        let cbsClient = yield cbs.createClient({
          client: client,
          cardId: cardId,
          imgId: imgId,
          branchId: item.branchId,
          title: item.title
        });

        yield ClientDal.update({ _id: client._id },{
          cbs_status: "ACCEPTED",
          cbs_status_message: "Success"
        })

      } catch(ex) {
        yield ClientDal.update({ _id: client._id },{
          cbs_status: "DENIED",
          cbs_status_message: ex.message
        })

        throw ex;
      }
    }

    this.body = {
      message: "Uploaded Successfully"
    };

  } catch(ex) {
    
    this.throw(new CustomError({
      type: 'CLIENTS_TO_CBS_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Create a client.
 *
 * @desc create a client using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */

exports.uploadToCBS = function* uploadToCBS(next) {
  debug('Push Client To CBS');

  if (!cbs) {
    return this.throw(new CustomError({
      type: 'CLIENT_TO_CBS_ERROR',
      message: "Connection To CBS Error!"
    }));
  }

  let body = this.request.body;

  this.checkBody('client')
      .notEmpty('Client Reference is Empty');
  this.checkBody('branchId')
      .notEmpty('Branch ID is Empty');
  this.checkBody('title')
      .notEmpty('Client Title is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'CLIENT_TO_CBS_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {

    let client = yield ClientDal.get({ _id: body.client });
    if(!client) {
      throw new Error('Client with those details does not exists!!');
    }

    if (client.status !== 'loan_granted') {
      throw new Error('Client Has Not Been Granted A Loan!')
    }

    try {
      let imgId = 0;
      let cardId = 0;

      if (client.picture) {
        imgId = yield cbs.uploadPicture(client.picture);
        imgId = imgId.pictureId
      }

      if (client.national_id_card) {
        cardId = yield cbs.uploadID(client.national_id_card);
        cardId = cardId.pictureId
      }
      

      let cbsClient = yield cbs.createClient({
        client: client,
        cardId: cardId,
        imgId: imgId,
        branchId: body.branchId,
        title: 0 //body.title
      });

      yield ClientDal.update({ _id: client._id },{
        cbs_status: "ACCEPTED",
        cbs_status_message: "Success"
      })

    } catch(ex) {
      yield ClientDal.update({ _id: client._id },{
        cbs_status: "DENIED",
        cbs_status_message: ex.message
      })

      throw ex;
    }
    
    this.body = {
      message: "Uploaded Successfully"
    };

  } catch(ex) {
    this.throw(new CustomError({
      type: 'CLIENT_TO_CBS_ERROR',
      message: ex.message
    }));
  }

};

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
  //if(!body.grandfather_name) errors.push('Client Grandfather name is Empty');
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
      type: 'CLIENT_CREATE_ERROR',
      message: JSON.stringify(errors)
    }));
  }

  try {
    let screeningForm = yield Form.findOne({ type: 'SCREENING' }).exec();
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

      yield fs.move(body.national_id_card.path, `./assets/${assetName}`)
      yield fs.remove(body.national_id_card.path);
      
      body.national_id_card = `${config.ASSETS.DEV}${assetName}`

      /*try {
        let url       = yield googleBuckets(body.national_id_card.path, assetName);

        body.national_id_card = url;
      } catch(ex) {
        body.national_id_card = `http://api.dev.bidir.gebeya.co/screening/assets/${body.national_id_card.path}`
      }*/
    }

    if(body.picture) {
      let filename  = body.first_name.trim().toUpperCase().split(/\s+/).join('_');
      let id        = crypto.randomBytes(6).toString('hex');
      let extname   = path.extname(body.picture.name);
      let assetName = `${filename}_${id}${extname}`;

      yield fs.move(body.picture.path, `./assets/${assetName}`)
      yield fs.remove(body.picture.path);

      body.picture = `${config.ASSETS.DEV}${assetName}`

      /*try {
        let url       = yield googleBuckets(body.picture.path, assetName);

        body.picture = url;
      } catch(ex) {
        body.picture = `http://api.dev.bidir.gebeya.co/screening/assets/${body.picture.path}`
      }*/
    }

    if(isMultipart) {
      try {
        if(body.spouse) {
          body.spouse = JSON.parse(body.spouse);
        }
        if(body.geolocation) {
          body.geolocation = JSON.parse(body.geolocation);
        }
      } catch(ex) {

      }
    }


    body.created_by = this.state._user._id;


    // Create Client 
    client = yield ClientDal.create(body);

    // Create New Screening
    let questions = [];
    let sections = [];
    let screeningBody = {};
    screeningForm = screeningForm.toJSON();

   // Create Answer Types
   PREQS = [];
    for(let question of screeningForm.questions) {
      question = yield createQuestion(question);

      if(question) {
        questions.push(question._id);
      }
    }

    yield createPrerequisites();

    // Create Section Types
    PREQS = [];
    for(let section of screeningForm.sections) {
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
    screeningBody.title = 'Client Screening Form';
    screeningBody.subtitle = screeningForm.subtitle;
    screeningBody.purpose = `Screening Application For ${client.first_name} ${client.last_name}`;
    screeningBody.layout = screeningForm.layout;
    screeningBody.has_sections = screeningForm.has_sections;
    screeningBody.disclaimer = screeningForm.disclaimer;
    screeningBody.signatures = screeningForm.signatures.slice();
    screeningBody.created_by = this.state._user._id;
    screeningBody.branch = client.branch._id;

    // Create Screening 
    let screening = yield ScreeningDal.create(screeningBody);

    // start history tracking
    if (body.for_group === "false" || body.for_group == false){
      yield HistoryDal.create({
        client: client._id,
        cycles: [{
          started_by: this.state._user._id,
          last_edit_by: this.state._user._id,
          screening: screening._id,
          cycle_number: 1
        }],
        branch: client.branch._id,
        cycle_number: 1
      })
  }

    yield ClientDal.update({ _id: client._id },{
      loan_cycle_number: 1
    })

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
    if(!client) throw new Error('Client Does Not Exist!!');

    yield LogDal.track({
      event: 'view_client',
      user: this.state._user._id ,
      message: `View client - ${client._id}`
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
    if(!client) throw new Error('Client Does Not Exist!!');

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
 * Update a single client geolocation.
 *
 * @desc Fetch a client with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateGeolocation = function* updateGeolocation(next) {
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

  this.checkBody('crop')
      .notEmpty('Crop Name is Empty');
  this.checkBody('latitude')
      .notEmpty('Latitude is Empty');
  this.checkBody('longitude')
      .notEmpty('Longitude is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'CLIENT_UPDATE_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {
    let client = yield ClientDal.get(query);
    if(!client) throw new Error('Client Does Not Exist!!');

    let s2Res = yield sendToS2(body, client);

    body.s2 = s2Res

    yield LogDal.track({
      event: 'client_update',
      client: this.state._user._id ,
      message: `Update Info for ${client.phone}`,
      diff: body
    });

    try {
      s2Res = JSON.parse(s2Res)
    } catch(ex) {
      //
      s2Res = null;
    }

    if (!s2Res) {
      client = yield ClientDal.update({
        _id: client._id
      },{
        geolocation: {
          longitude: body.longitude,
          latitude: body.latitude,
          status: "DECLINED"
        }
      })
    } else {
      client = yield ClientDal.update({
        _id: client._id
      },{
        geolocation: {
          longitude: body.longitude,
          latitude: body.latitude,
          status: "ACCEPTED",
          S2_Id: s2Res.field_id
        }
      })
    }

    this.body = client;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_CLIENT_ERROR',
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
    if(!client) throw new Error('Client Does Not Exist!!');

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
  let groupFilter = this.query.for_group || null;
  let query = {};
  if (groupFilter) {
    query = {for_group:  groupFilter};
  }
  

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };


  try {
    let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
    let canView =  yield hasPermission(this.state._user, 'VIEW');
    let user = this.state._user;
    let account = yield Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
      if (groupFilter){
        query = {for_group: groupFilter};}

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query.created_by = user._id;
        // query = {
        //   for_group: groupFilter,
        //   created_by: user._id
        // };

    // DEFAULT
    } else {
      query.created_by = user._id;
      // query = {
      //     for_group: groupFilter,
      //     created_by: user._id
      //   };
    }

  

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
 * Get a collection of loan granted clients
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.viewByStatus = function* viewByStatus(next) {
  debug('get a collection of clients by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!this.query.status) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_STATUS_ERROR',
      message: "Please Provide a Status"
    }));
  }

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {
    status: this.query.status
  };

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
    if (this.query.loanCycle) {
      // retrieve histories
      let qry = {
        cycle_number: +this.query.loanCycle
      };

      let histories = yield HistoryDal.getCollectionByPagination(qry, opts);
      let ids = [];

      for(let history of histories.docs) {
        ids.push(history.client._id)
      }

      query._id = {
        $in: ids.slice()
      }
    }

    let account = yield Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        //query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query.created_by = user._id;

    // DEFAULT
    } else {
      query.created_by = user._id;
    }

    let clients = yield ClientDal.getCollectionByPagination(query, opts);

    this.body = clients;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_STATUS_ERROR',
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

    

    if (this.query.search) {
      query.$or = [];

      let searchTerm = this.query.search;
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
          gender: groupTerms
        },{
          first_name: groupTerms
        },{
          last_name: groupTerms
        },{
          grandfather_name: groupTerms
        },{
          national_id_no: groupTerms
        },{
          woreda: groupTerms
        },{
          kebele: groupTerms
        },{
          house_no: groupTerms
        },{
          phone: groupTerms
        },{
          household_members_count: groupTerms
        },{
          status: groupTerms
        },{
          civil_status: groupTerms
        },{
          email: groupTerms
        },{
          cbs_status: groupTerms
        });

    } else {
      let qsKeys = Object.keys(this.query)
      if (!qsKeys.length) {
        throw new Error("Please Provide Search Terms")
      }

      for(let key of qsKeys) {
        query[key] = query[key] || {
          $in: []
        };
        let vals = this.query[key];


        if (key == "loan_cycle_number") {
          let nums = Array.isArray(vals) ? vals.map(function iter(item){
            return +item
          }) : [+vals]

          query.loan_cycle_number = {
            $in: nums.slice()
          }

        } else {
          let values = Array.isArray(vals) ? vals.slice() : [vals]

          query[key] = {
            $in: values.slice()
          }
          
        }
      }

      // rebuild with $or
      qsKeys = Object.keys(query);
      let _qs = []
      qsKeys.forEach((item)=>{
        let _item = {}
        _item[item] = query[item]
        _qs.push(_item)
      })

      query = {
        $or: _qs
      }

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

/**
 * Get a client screening.
 *
 * @desc Fetch a screening with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.getClientScreening = function* getClientScreening(next) {
  debug(`fetch client screening: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'CLIENT_SCREENING_VIEW_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    client: this.params.id
  };

  try {
    let screening = yield ScreeningDal.get(query, "last");

    yield LogDal.track({
      event: 'view_client_screening',
      screening: this.state._user._id ,
      message: `View Client screening - ${screening.title}`
    });

    this.body = screening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'CLIENT_SCREENING_VIEW_ERROR',
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

function polygonFromPoint(longitude, latitude) {
  let size = 10;
  let metersPerDegree = 111319.49;
  let sizeInDegree = (1/metersPerDegree) * size;

  // Create square of 10m around the longitude, latitude
  let offset = sizeInDegree / 2;
  let square = [
    [(longitude - offset), (latitude + offset)],  // Upper left
    [(longitude + offset), (latitude + offset)],  // Upper right
    [(longitude + offset), (latitude - offset)],  // Lower right
    [(longitude - offset), (latitude - offset)],  // Lower left
    [(longitude - offset), (latitude + offset)]   // Upper left to close the polygon
  ];

  let squarePoly = {
     "type": "FeatureCollection",
     "crs": {
      "properties": {
       "name": "urn:ogc:def:crs:EPSG::4326"
      },
      "type": "name"
     },
     "features": [
      {
       "type": "Feature",
       "geometry": {
        "type": "Polygon",
        "coordinates": [square]
       },
       "properties": {}
      }
     ]
    }

  return squarePoly
}

function* sendToS2(body, client){
  let squarePoly = polygonFromPoint(body.longitude, body.latitude);
  let s2XML = fs.readFileSync('./config/s2.xml', 'utf8');

  // try S2 First
  let data = {
    USER_ID: "demo-wur",
    GROUP_ID: "Allard", // meki
    TAG: body.crop, // Onion,
    FEATURES: squarePoly
  };

  s2XML = s2XML
    .replace('{{USER_ID}}', data.USER_ID)
    .replace('{{GROUP_ID}}', data.GROUP_ID)
    .replace('{{TAG}}', data.TAG)
    .replace('{{FEATURES}}', JSON.stringify(data.FEATURES, null, '\t'))

  let opts = {
      method: 'POST',
      url: `${config.S2.URL}`,
      body: s2XML,
      headers: {
        "Content-Type": "text/xml"
      },
      qs: {
        service: "WPS",
        version: "1.0.0",
        request: "Execute"
      }
    }

    let res = yield request(opts);

    return res
}


//CLEANUP: Will be removed, done for the purpose of setting a new attribute value in older records.
exports.setForGroup = function* setForGroup(next){
  
    let client = "";
    let branch = "";
    
    let clients = yield ClientDal.getCollection({});
    let updatedClients = [];
    for (let i = 0; i < clients.length; i++)
    {
      let id = "";
      if (!clients[i].for_group)
      {
        id = clients[i]._id;
        let c = yield ClientDal.update({_id:id}, {$set:{			
          for_group:false}});
        updatedClients.push(c);
        
        
      }
      
      


    }

    this.body = {
      count: updatedClients.length,
      Clients:updatedClients};




}