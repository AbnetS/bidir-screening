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
 * @api {get} /screenings/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get screenings collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Screening
 *
 * @apiDescription Get a collection of screenings. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. __QUERY SOURCE MUST BE SPECIFIED LIKE ?source=<web|app>__
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
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
 * @api {get} /screenings/search?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Search screenings
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup Screening
 *
 * @apiDescription Get a collection of screenings by search. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. __QUERY SOURCE MUST BE SPECIFIED LIKE ?source=<web|app>__
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
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
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *    }]
 *  }
 */
router.get('/search', acl(['*']), screeningController.search);


/**
 * @api {get} /screenings/:id Get Screening Screening
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Screening
 *
 * @apiDescription Get a user screening with the given id
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
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
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
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
 * @api {delete} /screenings/:id Delete Screening
 * @apiVersion 1.0.0
 * @apiName DeleteScreening
 * @apiGroup Screening 
 *
 * @apiDescription Delete a Screening with the given id
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
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
