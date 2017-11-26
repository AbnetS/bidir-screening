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

const TokenDal           = require('../dal/token');
const ScreeningDal       = require('../dal/screening');
const AnswerDal          = require('../dal/answer');
const LogDal             = require('../dal/log');


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
        for(let sub of answer) {
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

  this.checkBody('status')
      .notEmpty('Status should not be empty')
      .isIn(['incomplete','approved', 'completed','cancelled', 'submitted'], 'Correct Status is either incomplete, cancelled, approved, submitted or completed');

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let screening = yield ScreeningDal.update(query, body);

    if(body.status === 'submitted') {
      // Create Task
      yield TaskDal.create({
        task: `Approve Submitted Screening Form of ${screening.client.first_name} ${screening.client.first_name}`,
        task_type: 'approve',
        entity_ref: screening._id,
        entity_type: 'screening'
      })
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