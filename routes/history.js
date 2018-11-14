'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:history-router');

const historyController  = require('../controllers/history');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();


/**
 * @api {get} /screenings/histories/search?client=ID Search histories
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup History
 *
 * @apiDescription Search History. `/search?client=ID&&loanCycle=Number`
 *
 * @apiSuccess {String} _id history id
 * @apiSuccess {String} history_text History Text Title
 * @apiSuccess {String} remark History Remark
 * @apiSuccess {String} type History Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_histories Nested Sub Historys References
 * @apiSuccess {Boolean} required History required or not(true or false)
 * @apiSuccess {Array} validation_factor History Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values History History Values
 * @apiSuccess {Array} options History Choices Options
 * @apiSuccess {Boolean} show Show History true or false
 * @apiSuccess {Array} prerequisities History Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *      _id : "556e1174a8952c9521286a60",
 *      title: "History Title",
 *      remark: "This is a remark",
 *      type: "YES_NO",
 *      sub_histories: [{
 *      _id : "556e1174a8952c9521286a60",
 *        ....
 *      }],
 *      required: true,
 *      validation_factor: 'NONE',
 *      options: ['Yes', 'No'],
 *      values: [],
 *      measurement_unit: '',
 *      show: true,
 *      prerequisities: []
 *    }]
 *  }
 */
router.get('/search', acl(['*']), historyController.search);

/**
 * @api {get} /screenings/histories/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get histories collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup History
 *
 * @apiDescription Get a collection of histories. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id history id
 * @apiSuccess {String} history_text History Text Title
 * @apiSuccess {String} remark History Remark
 * @apiSuccess {String} type History Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_histories Nested Sub Historys References
 * @apiSuccess {Boolean} required History required or not(true or false)
 * @apiSuccess {Array} validation_factor History Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values History History Values
 * @apiSuccess {Array} options History Choices Options
 * @apiSuccess {Boolean} show Show History true or false
 * @apiSuccess {Array} prerequisities History Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *      _id : "556e1174a8952c9521286a60",
 *      title: "History Title",
 *      remark: "This is a remark",
 *      type: "YES_NO",
 *      sub_histories: [{
 *      _id : "556e1174a8952c9521286a60",
 *        ....
 *      }],
 *      required: true,
 *      validation_factor: 'NONE',
 *      options: ['Yes', 'No'],
 *      values: [],
 *      measurement_unit: '',
 *      show: true,
 *      prerequisities: []
 *    }]
 *  }
 */
router.get('/paginate', acl(['*']), historyController.fetchAllByPagination);

/**
 * @api {get} /screenings/histories/:clientId Get Client History
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup History
 *
 * @apiDescription Get a client history with the given id
 *
 * @apiSuccess {String} _id history id
 * @apiSuccess {String} history_text History Text Title
 * @apiSuccess {String} remark History Remark
 * @apiSuccess {String} type History Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_histories Nested Sub Historys References
 * @apiSuccess {Boolean} required History required or not(true or false)
 * @apiSuccess {Array} validation_factor History Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values History History Values
 * @apiSuccess {Array} options History Choices Options
 * @apiSuccess {Boolean} show Show History true or false
 * @apiSuccess {Array} prerequisities History Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 *
 * @apiSuccessExample Response Example:
 *  {
 *      _id : "556e1174a8952c9521286a60",
 *      title: "History Title",
 *      remark: "This is a remark",
 *      type: "YES_NO",
 *      sub_histories: [{
 *      _id : "556e1174a8952c9521286a60",
 *        ....
 *      }],
 *      required: true,
 *      validation_factor: 'NONE',
 *      options: ['Yes', 'No'],
 *      values: [],
 *      measurement_unit: '',
 *      show: true,
 *      prerequisities: []
 *  }
 *
 */
router.get('/:id', acl(['*']), historyController.fetchOne);


// Expose History Router
module.exports = router;
