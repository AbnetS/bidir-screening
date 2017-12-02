'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:screening-router');

const screeningController  = require('../controllers/screening');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

/**
 * @api {post} /screenings/create Create new Screening
 * @apiVersion 1.0.0
 * @apiName CreateScreening
 * @apiGroup Screening
 *
 * @apiDescription Create new Screening. 
 *
 * @apiParam {String} type Screening Type  Screening 
 * @apiParam {String} description Screening Description
 * @apiParam {String} title Screening Title
 * @apiParam {String} process Screening Process
 * @apiParam {Array} answers Screening Answers
 * @apiParam {String} created_by Officer Account registering this
 * @apiParam {String} client Client Reference being screened
 * @apiParam {String} [status] Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiParamExample Request Example:
 *  {
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "Screening Title",
 *    process: "",
 *    answers : [{
 *      title: "Farmer is ...",
 *      remark: "remark",
 *      type: "Yes/No",
 *      sub_answers: [],
 *      ...
 *    }],
 *    created_by : "556e1174a8952c9521286a60",
 *    client : "556e1174a8952c9521286a60".
 *    status: "incomplete"
 *  }
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Screening Type ie Screening or Screening Application
 * @apiSuccess {String} description Screening Description
 * @apiSuccess {String} title Screening Title
 * @apiSuccess {String} process Screening Process
 * @apiSuccess {Array} answers Screening Answers
 * @apiSuccess {String} created_by Officer Account registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "Screening Title",
 *    process: "",
 *    answers: ]{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 *
 */
router.post('/create', acl(['*']), screeningController.create);


/**
 * @api {get} /screenings/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get screenings collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Screening
 *
 * @apiDescription Get a collection of screenings. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Screening Type ie Screening or Screening Application
 * @apiSuccess {String} description Screening Description
 * @apiSuccess {String} title Screening Title
 * @apiSuccess {String} process Screening Process
 * @apiSuccess {Array} answers Screening Answers
 * @apiSuccess {String} created_by Officer Account registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled , approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *    _id : "556e1174a8952c9521286a60",
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "Screening Title",
 *    process: "",
 *    answers: ]{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *    }]
 *  }
 */
router.get('/paginate', acl(['*']), screeningController.fetchAllByPagination);

/**
 * @api {get} /screenings/:id Get Screening Screening
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Screening
 *
 * @apiDescription Get a user screening with the given id
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Screening Type ie Screening or Screening Application
 * @apiSuccess {String} description Screening Description
 * @apiSuccess {String} title Screening Title
 * @apiSuccess {String} process Screening Process
 * @apiSuccess {Array} answers Screening Answers
 * @apiSuccess {String} created_by Officer Account registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "Screening Title",
 *    process: "",
 *    answers: ]{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 *
 */
router.get('/:id', acl(['*']), screeningController.fetchOne);


/**
 * @api {put} /screenings/:id Update Screening Screening
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Screening 
 *
 * @apiDescription Update a Screening screening with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    status "cancelled"
 * }
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Screening Type ie Screening or Screening Application
 * @apiSuccess {String} description Screening Description
 * @apiSuccess {String} title Screening Title
 * @apiSuccess {String} process Screening Process
 * @apiSuccess {Array} answers Screening Answers
 * @apiSuccess {String} created_by Officer Account registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "MFI Screening Title",
 *    process: "",
 *    answers: ]{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "cancelled"
 *  }
 */
router.put('/:id', acl(['*']), screeningController.update);

/**
 * @api {put} /screenings/:id/status Update Screening Status
 * @apiVersion 1.0.0
 * @apiName UpdateStatus
 * @apiGroup Screening 
 *
 * @apiDescription Update a Screening status with the given id
 *
 * @apiParam {String} status Update Status either incomplete, cancelled, submitted, completed or approved
 *
 * @apiParamExample Request example:
 * {
 *    status "cancelled"
 * }
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Screening Type ie Screening or Screening Application
 * @apiSuccess {String} description Screening Description
 * @apiSuccess {String} title Screening Title
 * @apiSuccess {String} process Screening Process
 * @apiSuccess {Array} answers Screening Answers
 * @apiSuccess {String} created_by Officer Account registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "MFI Screening Title",
 *    process: "",
 *    answers: ]{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "cancelled"
 *  }
 */
router.put('/:id/status', acl(['*']), screeningController.updateStatus);

/**
 * @api {delete} /screenings/:id Delete Screening
 * @apiVersion 1.0.0
 * @apiName DeleteScreening
 * @apiGroup Screening 
 *
 * @apiDescription Delete a Screening with the given id
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Screening Type ie Screening or Screening Application
 * @apiSuccess {String} description Screening Description
 * @apiSuccess {String} title Screening Title
 * @apiSuccess {String} process Screening Process
 * @apiSuccess {Array} answers Screening Answers
 * @apiSuccess {String} created_by Officer Account registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "Screening",
 *    description: "This is a Description",
 *    title: "MFI Screening Title",
 *    process: "",
 *    answers: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "cancelled"
 *  }
 */
router.delete('/:id', acl(['*']), screeningController.remove);



// Expose Screening Router
module.exports = router;
