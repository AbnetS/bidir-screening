'use strict';
// Access Layer for Screening Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-screening');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Screening     = require('../models/screening');
const Answer        = require('../models/answer');
const Client        = require('../models/client');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Screening.attributes;
var population = [{
  path: 'answers',
  select: Answer.attributes,
  populate: {
    path: 'sub_answers',
    select: Answer.attributes
  }
},{
  path: 'client',
  select: Client.attributes
}];

/**
 * create a new screening.
 *
 * @desc  creates a new screening and saves them
 *        in the database
 *
 * @param {Object}  screeningData  Data for the screening to create
 *
 * @return {Promise}
 */
exports.create = function create(screeningData) {
  debug('creating a new screening');

  return co(function* () {

    let unsavedScreening = new Screening(screeningData);
    let newScreening = yield unsavedScreening.save();
    let screening = yield exports.get({ _id: newScreening._id });

    return screening;


  });

};

/**
 * delete a screening
 *
 * @desc  delete data of the screening with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteScreening(query) {
  debug('deleting screening: ', query);

  return co(function* () {
    let screening = yield exports.get(query);
    let _empty = {};

    if(!screening) {
      return _empty;
    } else {
      yield screening.remove();

      return screening;
    }

  });
};

/**
 * update a screening
 *
 * @desc  update data of the screening with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating screening: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Screening.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a screening.
 *
 * @desc get a screening with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, screening) {
  debug('getting screening ', query);

  return Screening.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of screenings
 *
 * @desc get a collection of screenings from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of screenings');

  return new Promise((resolve, reject) => {
    resolve(
     Screening
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of screenings using pagination
 *
 * @desc get a collection of screenings from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of screenings');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Screening.paginate(query, opts, function (err, docs) {
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
