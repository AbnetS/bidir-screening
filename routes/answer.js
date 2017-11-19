'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:answer-router');

const answerController  = require('../controllers/answer');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();


/**
 * @api {get} /screenings/answers/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get answers collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Answer
 *
 * @apiDescription Get a collection of answers. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text Title
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie _Yes/No_, _Fill In Blank_, or _Multiple Choice_
 * @apiSuccess {String} sub_answers Nested Sub Questions References
 * @apiSuccess {Boolean} required Question required or not(true or false)
 * @apiSuccess {Array} options Questions Options
 * @apiSuccess {Array} single_choice Question Single Choice
 * @apiSuccess {Array} multiple_choice Question Multiple Choice
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *    	_id : "556e1174a8952c9521286a60",
 *    	title: "Answer Title",
 *    	remark: "This is a remark",
 *    	type: "Yes/No",
 *    	sub_answers: [{
 *		 	_id : "556e1174a8952c9521286a60",
 *       	....
 *    	}],
 *    	required: true
 *    	options: ['Yes', 'No'],
 *    	single_choice: ['Yes'],
 *    	multiple_choice: []
 *    }]
 *  }
 */
router.get('/paginate', acl(['*']), answerController.fetchAllByPagination);

/**
 * @api {get} /screenings/answers/:id Get Answer Answer
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Answer
 *
 * @apiDescription Get a user answer with the given id
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text Title
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie _Yes/No_, _Fill In Blank_, or _Multiple Choice_
 * @apiSuccess {String} sub_answers Nested Sub Questions References
 * @apiSuccess {Boolean} required Question required or not(true or false)
 * @apiSuccess {Array} options Questions Options
 * @apiSuccess {Array} single_choice Question Single Choice
 * @apiSuccess {Array} multiple_choice Question Multiple Choice
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    title: "Answer Title",
 *    remark: "This is a remark",
 *    type: "Yes/No",
 *    sub_answers: [{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    	required: true
 *    	options: ['Yes', 'No'],
 *    	single_choice: ['Yes'],
 *    	multiple_choice: []
 *  }
 *
 */
router.get('/:id', acl(['*']), answerController.fetchOne);


/**
 * @api {put} /screenings/answers/:id Update Answer Answer
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Answer 
 *
 * @apiDescription Update a Answer answer with the given id
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
 * @apiSuccess {String} type Question Type ie _Yes/No_, _Fill In Blank_, or _Multiple Choice_
 * @apiSuccess {String} sub_answers Nested Sub Questions References
 * @apiSuccess {Boolean} required Question required or not(true or false)
 * @apiSuccess {Array} options Questions Options
 * @apiSuccess {Array} single_choice Question Single Choice
 * @apiSuccess {Array} multiple_choice Question Multiple Choice
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    title: "Answer Title",
 *    remark: "This is a remark too",
 *    type: "Yes/No",
 *    sub_answers: [{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    	required: true
 *    	options: ['Yes', 'No'],
 *    	single_choice: ['Yes'],
 *    	multiple_choice: []
 *  }
 */
router.put('/:id', acl(['*']), answerController.update);

// Expose Answer Router
module.exports = router;
