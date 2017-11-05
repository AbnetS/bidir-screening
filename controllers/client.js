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

const TokenDal           = require('../dal/token');
const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');


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

  let body = this.request.body;

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'CLIENT_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {

    let client = yield ClientDal.get({ phone: body.phone });
    if(client) {
      throw new Error('Client with those details already exists!!');
    }

    // Create Client Type
    client = yield ClientDal.create(body);

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
      type: 'CLIENT_RETRIEVAL_ERROR',
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

  this.checkBody('is_active')
      .notEmpty('is_active should not be empty');

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
    let clients = yield ClientDal.getCollectionByPagination(query, opts);

    this.body = clients;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_CLIENTS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};