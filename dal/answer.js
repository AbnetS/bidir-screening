'use strict';
// Access Layer for Answer Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-answer');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Answer    = require('../models/answer');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Answer.attributes;
var population = [{
  path: 'sub_questions',
  select: Answer.attributes
}];

/**
 * create a new answer.
 *
 * @desc  creates a new answer and saves them
 *        in the database
 *
 * @param {Object}  answerData  Data for the answer to create
 *
 * @return {Promise}
 */
exports.create = function create(answerData) {
  debug('creating a new answer');

  return co(function* () {

    let unsavedAnswer = new Answer(answerData);
    let newAnswer = yield unsavedAnswer.save();
    let answer = yield exports.get({ _id: newAnswer._id });

    return answer;


  });

};

/**
 * delete a answer
 *
 * @desc  delete data of the answer with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteAnswer(query) {
  debug('deleting answer: ', query);

  return co(function* () {
    let answer = yield exports.get(query);
    let _empty = {};

    if(!answer) {
      return _empty;
    } else {
      yield answer.remove();

      return answer;
    }

  });
};

/**
 * update a answer
 *
 * @desc  update data of the answer with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating answer: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Answer.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a answer.
 *
 * @desc get a answer with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, answer) {
  debug('getting answer ', query);

  return Answer.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of answers
 *
 * @desc get a collection of answers from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of answers');

  return new Promise((resolve, reject) => {
    resolve(
     Answer
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of answers using pagination
 *
 * @desc get a collection of answers from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of answers');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Answer.paginate(query, opts, function (err, docs) {
      if(err) {
        return reject(err);
      }

      let data = {
        total_pages: docs.pages,
        total_docs_count: docs.total,
        current_page: docs.page,
        docs: docs.docs
      };

      return resolve(data);

    });
  });


};
