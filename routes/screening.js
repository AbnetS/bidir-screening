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
 * @api {post} /screenings/create Create Screening
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup Screening 
 *
 * @apiDescription Create a Screening for client with the given id.
 *                 Since creating a screening is the beginning of a new loan cycle,
 *                 the client's loan cycle number is updated
 *
 * @apiParam {String} Client Client
 *
 * @apiParamExample Request example:
 * {
 *    client: "556e1174a8952c9521286a60"
 * }
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the screening belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id being screened
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'new', 'inprogress','approved', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5ba8c5ecbaad5600012dadb8",
        "last_modified": "2018-09-24T11:15:47.401Z",
        "date_created": "2018-09-24T11:09:32.723Z",
        "client": {
            "_id": "556e1174a8952c9521286a60",
            ...
        },
        "created_by": "5b926ea8e1d5e7000177b3f5",
        "branch": "5b926c849fb7f20001f1494c",
        "comment": "",
        "status": "new",
        "questions": [
            {
                "_id": "5ba8c5ecbaad5600012dad99",
                "question_text": "Where is the farmer's permanent residence?",
                "prerequisites": [],
                ...
            },
            {
                ...
            }        
        ],
        "disclaimer": "",
        "signatures": [
            "Applicant",
            "Filled By",
            "Checked By"
        ],
        "sections": [],
        "has_sections": false,
        "layout": "THREE_COLUMNS",
        "for_group": false,
        "purpose": "Screening Application For Geleto Elemo",
        "subtitle": "",
        "title": "Client Screening Form"
 *  }
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
 * and `per_page=<RESULTS_PER_PAGE>`. To get only __active__ screenings append `show_active=true`
 * to the query.
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the screening belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id being screened
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'new', 'inprogress','approved', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 15,
        "total_docs_count": 142,
        "current_page": 1,
        "docs": [
            {
                "_id": "5df0a12871d0804290a71156",
                ..
            },
            {
                ...
            }
        ]
 *  }
 */
router.get('/paginate', acl(['*']), screeningController.fetchAllByPagination);

router.get('/ongoing', acl(['*']), screeningController.fetchOngoing);

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
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/screenings/search?search=new
 * 
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the screening belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id being screened
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'new', 'inprogress','approved', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
    *   "total_pages": 2,
        "total_docs_count": 17,
        "current_page": 1,
        "docs": [
            {
                "_id": "5df0a12871d0804290a71156",
                ...
            },
            {
                ...
            }
        ]
    
    *  }
 */
router.get('/search', acl(['*']), screeningController.search);


/**
 * @api {get} /screenings/:id Get Screening
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Screening
 *
 * @apiDescription Get a screening with the given id
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the screening belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id being screened
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'new', 'inprogress','approved', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5ba8c5ecbaad5600012dadb8",
        "last_modified": "2018-09-24T11:15:47.401Z",
        "date_created": "2018-09-24T11:09:32.723Z",
        "client": {
            "_id": "556e1174a8952c9521286a60",
            ...
        },
        "created_by": "5b926ea8e1d5e7000177b3f5",
        "branch": "5b926c849fb7f20001f1494c",
        "comment": "",
        "status": "new",
        "questions": [
            {
                "_id": "5ba8c5ecbaad5600012dad99",
                "question_text": "Where is the farmer's permanent residence?",
                "prerequisites": [],
                ...
            },
            {
                ...
            }        
        ],
        "disclaimer": "",
        "signatures": [
            "Applicant",
            "Filled By",
            "Checked By"
        ],
        "sections": [],
        "has_sections": false,
        "layout": "THREE_COLUMNS",
        "for_group": false,
        "purpose": "Screening Application For Geleto Elemo",
        "subtitle": "",
        "title": "Client Screening Form"
 *  }
 *
 */
router.get('/:id', acl(['*']), screeningController.fetchOne);


/**
 * @api {put} /screenings/:id Update Screening
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Screening 
 *
 * @apiDescription Update a screening with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    status: "submitted"
 * }
 *
 * @apiSuccess {String} _id screening id
 * @apiSuccess {String} type Form Type SCREENING
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the screening belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id being screened
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'new', 'inprogress','approved', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 * 
 * 
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5ba8c5ecbaad5600012dadb8",
        "last_modified": "2018-09-24T11:15:47.401Z",
        "date_created": "2018-09-24T11:09:32.723Z",
        "client": {
            "_id": "556e1174a8952c9521286a60",
            ...
        },
        "created_by": "5b926ea8e1d5e7000177b3f5",
        "branch": "5b926c849fb7f20001f1494c",
        "comment": "",
        "status": "submitted",
        "questions": [
            {
                "_id": "5ba8c5ecbaad5600012dad99",
                "question_text": "Where is the farmer's permanent residence?",
                "prerequisites": [],
                ...
            },
            {
                ...
            }        
        ],
        "disclaimer": "",
        "signatures": [
            "Applicant",
            "Filled By",
            "Checked By"
        ],
        "sections": [],
        "has_sections": false,
        "layout": "THREE_COLUMNS",
        "for_group": false,
        "purpose": "Screening Application For Geleto Elemo",
        "subtitle": "",
        "title": "Client Screening Form"
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
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the screening belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id being screened
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'new', 'inprogress','approved', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5ba8c5ecbaad5600012dadb8",
        "last_modified": "2018-09-24T11:15:47.401Z",
        "date_created": "2018-09-24T11:09:32.723Z",
        "client": {
            "_id": "556e1174a8952c9521286a60",
            ...
        },
        "created_by": "5b926ea8e1d5e7000177b3f5",
        "branch": "5b926c849fb7f20001f1494c",
        "comment": "",
        "status": "submitted",
        "questions": [
            {
                "_id": "5ba8c5ecbaad5600012dad99",
                "question_text": "Where is the farmer's permanent residence?",
                "prerequisites": [],
                ...
            },
            {
                ...
            }        
        ],
        "disclaimer": "",
        "signatures": [
            "Applicant",
            "Filled By",
            "Checked By"
        ],
        "sections": [],
        "has_sections": false,
        "layout": "THREE_COLUMNS",
        "for_group": false,
        "purpose": "Screening Application For Geleto Elemo",
        "subtitle": "",
        "title": "Client Screening Form"
 *  }
 */
router.delete('/:id', acl(['*']), screeningController.remove);

// Expose Screening Router
module.exports = router;
