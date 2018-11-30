'use strict';
// Access Layer for ACATConfig Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-config');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const ACATConfig        = require('../models/ACATConfig');
const Permission       = require('../models/permission');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = ACATConfig.attributes;
var population = [{
  path: 'permissions',
  select: Permission.attributes
}];

/**
 * create a new config.
 *
 * @desc  creates a new config and saves them
 *        in the database
 *
 * @param {Object}  configData  Data for the config to create
 *
 * @return {Promise}
 */
exports.create = function create(configData) {
  debug('creating a new config');

  return co(function* () {
    let unsavedACATConfig = new ACATConfig(configData);
    let newACATConfig = yield unsavedACATConfig.save();
    let config = yield exports.get({ _id: newACATConfig._id });

    return config;

  });

};

/**
 * delete a config
 *
 * @desc  delete data of the config with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteACATConfig(query) {
  debug('deleting config: ', query);

  return co(function* () {
    let config = yield exports.get(query);
    let _empty = {};

    if(!config) {
      return _empty;
    } else {
      yield config.remove();

      return config;
    }

  });
};

/**
 * update a config
 *
 * @desc  update data of the config with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating config: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return ACATConfig.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a config.
 *
 * @desc get a config with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, config) {
  debug('getting config ', query);

  return ACATConfig.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of configs
 *
 * @desc get a collection of configs from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of configs');

  return new Promise((resolve, reject) => {
    resolve(
     ACATConfig
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of configs using pagination
 *
 * @desc get a collection of configs from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of configs');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    ACATConfig.paginate(query, opts, function (err, docs) {
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
