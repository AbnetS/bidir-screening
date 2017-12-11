'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:answer-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');

const TokenDal           = require('../dal/token');
const AnswerDal          = require('../dal/answer');
const LogDal             = require('../dal/log');


/**
 * Get a single answer.
 *
 * @desc Fetch a answer with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneAnswer(next) {
  debug(`fetch answer: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    let answer = yield AnswerDal.get(query);

    yield LogDal.track({
      event: 'view_answer',
      answer: this.state._user._id ,
      message: `View answer - ${answer.title}`
    });

    this.body = answer;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'ANSWER_RETRIEVAL_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Update Answer Status
 *
 * @desc Fetch a answer with the given ID and update their respective status.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateAnswer(next) {
  debug(`updating status answer: ${this.params.id}`);

  this.checkBody('is_active')
      .notEmpty('is_active should not be empty');

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let answer = yield AnswerDal.update(query, body);

    yield LogDal.track({
      event: 'answer_status_update',
      answer: this.state._user._id ,
      message: `Update Status for ${answer.title}`,
      diff: body
    });

    this.body = answer;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'ANSWER_STATUS_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update a single answer.
 *
 * @desc Fetch a answer with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.update = function* updateAnswer(next) {
  debug(`updating answer: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let answer = yield AnswerDal.update(query, body);

    yield LogDal.track({
      event: 'answer_update',
      answer: this.state._user._id ,
      message: `Update Info for ${answer.title}`,
      diff: body
    });

    this.body = answer;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_ANSWER_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of answers by Pagination
 *
 * @desc Fetch a collection of answers
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllAnswers(next) {
  debug('get a collection of answers by pagination');

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
    let answers = yield AnswerDal.getCollectionByPagination(query, opts);

    this.body = answers;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_ANSWERS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};