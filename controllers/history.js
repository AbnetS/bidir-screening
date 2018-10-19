'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:history-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const checkPermissions   = require('../lib/permissions');

const Account            = require('../models/account');

const TokenDal           = require('../dal/token');
const HistoryDal          = require('../dal/history');
const LogDal             = require('../dal/log');

let hasPermission = checkPermissions.isPermitted('CLIENT');

/**
 * Get a single history.
 *
 * @desc Fetch a history with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneHistory(next) {
  debug(`fetch history: ${this.params.id}`);

  let query = {
    client: this.params.id
  };

  try {
    let history = yield HistoryDal.get(query);

    yield LogDal.track({
      event: 'view_history',
      history: this.state._user._id ,
      message: `View history - ${history._id}`
    });

    this.body = history;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'HISTORY_RETRIEVAL_ERROR',
      message: ex.message
    }));
  }

};


/**
 * Get a collection of histories by Pagination
 *
 * @desc Fetch a collection of histories
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllHistorys(next) {
  debug('get a collection of histories by pagination');

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
    }

    let histories = yield HistoryDal.getCollectionByPagination(query, opts);

    this.body = histories;
    
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_HISTORIES_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};