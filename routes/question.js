'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:question-router');

const questionController  = require('../controllers/question');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();


/**
 * @api {get} /screenings/questions/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get questions collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Question
 *
 * @apiDescription Get a collection of questions. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text Title
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_questions Nested Sub Questions References
 * @apiSuccess {Boolean} required Question required or not(true or false)
 * @apiSuccess {Array} validation_factor Question Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values Question Question Values
 * @apiSuccess {Array} options Question Choices Options
 * @apiSuccess {Boolean} show Show Question true or false
 * @apiSuccess {Array} prerequisities Question Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *      _id : "556e1174a8952c9521286a60",
 *      title: "Question Title",
 *      remark: "This is a remark",
 *      type: "YES_NO",
 *      sub_questions: [{
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
router.get('/paginate', acl(['*']), questionController.fetchAllByPagination);

/**
 * @api {get} /screenings/questions/:id Get Question Question
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Question
 *
 * @apiDescription Get a user question with the given id
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text Title
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_questions Nested Sub Questions References
 * @apiSuccess {Boolean} required Question required or not(true or false)
 * @apiSuccess {Array} validation_factor Question Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values Question Question Values
 * @apiSuccess {Array} options Question Choices Options
 * @apiSuccess {Boolean} show Show Question true or false
 * @apiSuccess {Array} prerequisities Question Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 *
 * @apiSuccessExample Response Example:
 *  {
 *      _id : "556e1174a8952c9521286a60",
 *      title: "Question Title",
 *      remark: "This is a remark",
 *      type: "YES_NO",
 *      sub_questions: [{
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
router.get('/:id', acl(['*']), questionController.fetchOne);


/**
 * @api {put} /screenings/questions/:id Update Question Question
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Question 
 *
 * @apiDescription Update a Question question with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    remark: "This is a remark too"
 * }
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text Title
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_questions Nested Sub Questions References
 * @apiSuccess {Boolean} required Question required or not(true or false)
 * @apiSuccess {Array} validation_factor Question Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values Question Question Values
 * @apiSuccess {Array} options Question Choices Options
 * @apiSuccess {Boolean} show Show Question true or false
 * @apiSuccess {Array} prerequisities Question Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 *
 * @apiSuccessExample Response Example:
 *  {
 *      _id : "556e1174a8952c9521286a60",
 *      title: "Question Title",
 *      remark: "This is a remark",
 *      type: "YES_NO",
 *      sub_questions: [{
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
 */
router.put('/:id', acl(['*']), questionController.update);

// Expose Question Router
module.exports = router;