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
const Client       = require('../models/client');
const Screening    = require('../models/screening');
const Loan         = require('../models/loan');
const ClientACAT    = require('../models/clientACAT');

const TokenDal           = require('../dal/token');
const HistoryDal          = require('../dal/history');
const LogDal             = require('../dal/log');
const UserDal             = require('../dal/user');
const ClientDal       = require('../dal/client');
const ScreeningDal    = require('../dal/screening');
const LoanDal         = require('../dal/loan');
const ClientACATDal    = require('../dal/clientACAT');

let hasPermission = checkPermissions.isPermitted('CLIENT');

/**
 * Search history.
 *
 * @desc Fetch a history with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.search = function* searchHistory(next) {
  debug(`search history`);

  try {
    if (!this.query.client) {
      throw new Error('Client Reference Missing in query');
    }

    let query = {
      client: this.query.client
    };

    let history = yield HistoryDal.get(query);
    if (!history || !history._id) {
      throw new Error("Client Loan Cycle History Not Found")
    }

    yield LogDal.track({
      event: 'view_history',
      history: this.state._user._id ,
      message: `View history - ${history._id}`
    });

    history = history.toJSON();

    let cycles = yield populateHistory(history);

    history.cycles = cycles;


    if (this.query.loanCycle) {

      let num = +this.query.loanCycle;

      let cycle = _.find(history.cycles, { cycle_number: num })

      if (this.query.application === "acat") {
        this.body = cycle.acat ? cycle.acat : {}
      } else if (this.query.application === "loan") {
        this.body = cycle.loan ? cycle.loan : {}
      } else if (this.query.application === "screening") {
        this.body = cycle.screening ? cycle.screening : {}
      } else {
        this.body = cycle || {};
      }

    } else {
      this.body = history;

    }

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'HISTORY_RETRIEVAL_ERROR',
      message: ex.message
    }));
  }

};

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
    if (!history || !history._id) {
      throw new Error("Not Found")
    }

    history = history.toJSON();
    let cycles = yield populateHistory(history);

    history.cycles = cycles;

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

    if (this.query.loanCycle) {
      query.cycle_number = +this.query.loanCycle;
    }

    let histories = yield HistoryDal.getCollectionByPagination(query, opts);

    for(let history of histories.docs) {
      let cycles = yield populateHistory(history)
      history.cycles = cycles
    }

    this.body = histories;
    
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_HISTORIES_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

function populateHistory(history) {
 return co(function* (){
    let cycles = [];

    for(let cycle of history.cycles) {
      let loan = yield LoanDal.get({ _id: cycle.loan });
      let screening = yield ScreeningDal.get({ _id: cycle.screening });
      let acat = yield ClientACATDal.get({ _id: cycle.acat });
      let starter = yield UserDal.get({ _id: cycle.started_by });
      let editor = yield UserDal.get({ _id: cycle.last_edit_by });


      cycles.push({
        loan: (loan && loan._id) ? loan.toJSON() : {},
        acat: (acat && acat._id) ? acat.toJSON() : {},
        screening: (screening && screening._id) ? screening.toJSON() : {},
        cycle_number: cycle.cycle_number,
        started_by: (starter && starter._id) ? starter.toJSON() : {},
        last_edit_by: (editor && editor._id) ? editor.toJSON() : {}
      })
    }

    return cycles;
 })
}