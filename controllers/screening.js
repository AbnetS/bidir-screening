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

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const checkPermissions   = require('../lib/permissions');

const TokenDal           = require('../dal/token');
const ScreeningDal       = require('../dal/screening');
const AnswerDal          = require('../dal/answer');
const LogDal             = require('../dal/log');
const NotificationDal    = require('../dal/notification');
const ClientDal          = require('../dal/client');


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

  let isPermitted = yield checkPermissions.isPermitted(this.state._user, 'AUTHORIZE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'SCREENING_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  this.checkBody('status')
      .notEmpty('Status should not be empty')
      .isIn(['incomplete','approved', 'completed','declined', 'submitted'], 'Correct Status is either incomplete, declined, approved, submitted or completed');

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  try {

    let screening = yield ScreeningDal.get(query);

    if(screening.status == body.status) {
      throw new Error(`Screening Is Already ${body.status}`);
    }

    screening = yield ScreeningDal.update(query, body);

    if(body.status === 'declined') {
      let client = yield ClientDal.get({ _id: screening.client });
      yield NotificationDal.create({
        for: screening.created_by,
        message: `Screening for ${client.first_name} ${client.last_name} has been declined.`
      });
    }

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

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {

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

    let screening = yield ScreeningDal.update(query, body);

    yield LogDal.track({
      event: 'screening_update',
      screening: this.state._user._id ,
      message: `Update Info for ${screening.title}`,
      diff: body
    });

    this.body = screening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_SCREENING_ERROR',
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

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = 1) : null;

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  try {
    let screenings = yield ScreeningDal.getCollectionByPagination(query, opts);

    this.body = screenings;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_SCREENINGS_COLLECTION_ERROR',
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