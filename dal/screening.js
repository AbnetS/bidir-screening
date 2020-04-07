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
const Question      = require('../models/question');
const Client        = require('../models/client');
const Section       = require('../models/section');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Screening.attributes;
var population = [{
  path: 'questions',
  select: Question.attributes,
  options: {
    sort: { number: '1' }
  },
  populate: {
    path: 'sub_questions',
    select: Question.attributes,
    options: {
      sort: { number: '1' }
    }
  }
},{
  path: 'sections',
  select: Section.attributes,
  options: {
    sort: { number: '1' }
  },
  populate: {
    path: 'questions',
    select: Question.attributes,
    options: {
      sort: { number: '1' }
    },
    populate: {
      path: 'sub_questions',
      select: Question.attributes,
      options: {
        sort: { number: '1' }
      }
    }
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
exports.get = function get(query, sort) {
  debug('getting screening ', query);

  if (sort && sort === "last") {
    return Screening.findOne(query, returnFields)
      .sort({ date_created: "desc" })
      .populate(population)
      .exec();
  } else {
    return Screening.findOne(query, returnFields)
      .populate(population)
      .exec();
  }

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

/**
 * get a collection of screenings belonging to latest cycle using pagination only for loans in progress.
 * 
 * Screenings for granted and paid loans are not returned
 *
 * @desc get a collection of latest screenings from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */

exports.getLatestCycleScreening = function* getCollection(query, qs, fields){

  let page = qs.page;
  let limit = qs.limit;
  let skip = (page -1) * limit;

  let allDocs = yield Screening.aggregate([      
    {$match: query},
    {$sort: { date_created: -1 }},
    {$group: {
      _id: "$client",
      "client":{$push: "$client"}            
    }},
    {$lookup: {
      from: "clients",
      localField: "client",
      foreignField: "_id",
      as: "populatedClient"
    }},
    {$match: { "populatedClient.status": {$nin: ["loan_granted", "Loan-Granted", "loan_paid"]}}}
  
  ]).cursor({}).exec().toArray();

  //let total_count = allDocs.filter (item => item.populatedClient[0].status.includes ("ACAT")).length;
  let total_count = allDocs.length;



  let screenings = yield Screening.aggregate([
    {$match: query},  
    {$lookup: {
      from: "clients",
      localField: "client",
      foreignField: "_id",
      as: "populatedClient"
    }},
    {$match: { "populatedClient.status": {$nin: ["loan_granted", "Loan-Granted", "loan_paid"]}}},   
    {$sort: { date_created: 1 }},
    {$group: {
      _id: "$client",
      "last_doc": { "$last": "$$ROOT" }           
    }},
    {$skip: skip},
    {$limit: limit}
  ]).cursor({}).exec().toArray();


  let populatedScreening = {};

      
  let populatedData = [];
  for (let screening of screenings){
    populatedScreening = yield Screening.populate(screening.last_doc,population);    
    delete populatedScreening.populatedClient;
    populatedData.push(populatedScreening);
  
  };

  let data = {
    total_pages: Math.ceil(total_count / limit) || 1,
    total_docs_count: total_count,
    current_page: page,
    docs: populatedData
  }; 


  return data;

}

/**
 * get a screening.
 *
 * @desc get a screening with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getLast = function get(query, screening) {
  debug('getting screening ', query);

  return Screening.findOne(query, returnFields)
    .sort({
      date_created: -1
    })
    .populate(population)
    .exec();

};