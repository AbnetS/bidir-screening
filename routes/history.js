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


router.post('/create', acl(['*']), historyController.create);


/**
 * @api {get} /screenings/histories/search?client=ID Search histories
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup History
 *
 * @apiDescription Search History. `/search?client=ID&&loanCycle=Number&&application=screening|loan|acat`
 *                 Searches loan history of a client. Providing client reference is mandatory.
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/screenings/histories/search?client=5df0a12771d0804290a71136
 * api.test.bidir.gebeya.co/screenings/histories/search?client=5bea8a1c2abd190001c98be1&loanCycle=1
 * api.dev.bidir.gebeya.co/screenings/histories/search?application=screening&client=5cbf1ffb06139164e0e657fe&loanCycle=1
 *
 * @apiSuccess {String} _id history id
 * @apiSuccess {String} client Client record for which the history is searched
 * @apiSuccess {String} branch Branch reference Id of the client
 * @apiSuccess {Number} cycle_number The latest loan cycle of the client
 * @apiSuccess {Object[]} cycles Details of each loan cycle 
 * @apiSuccess {Number} cycles.cycle_number Cycle number of the specific loan cycle
 * @apiSuccess {Object} cycles.screening Screening in the specific loan cycle
 * @apiSuccess {Object} cycles.loan Loan Application in the specific loan cycle
 * @apiSuccess {Object} cycles.acat ACAT application in the specific loan cycle
 * @apiSuccess {Object} cycles.started_by User who started the loan cycle
 * @apiSuccess {Object} cycles.last_edit_by User who edited last the loan cycle
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5c55a586b55f705207fcaf1c",
        "client": {
            "_id": "5bfff55696b74500015cb64b",
            ...
        },
        "branch": "5b926c849fb7f20001f1494c",
        "last_modified": "2019-04-09T05:38:15.162Z",
        "cycle_number": 2,
        "cycles":[
            {
                "loan":{...},
                "screening":{...},
                "acat": {...},
                "cycle_number": 1,
                "started_by": {...},
                "last_edit_by": {...}
            },
            {
                "loan":{},
                "screening":{...},
                "acat": {},
                "cycle_number": 2,
                "started_by": {...},
                "last_edit_by": {...}
            }
        ]
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
 * @apiSuccess {String} client Client record for which the history is searched
 * @apiSuccess {String} branch Branch reference Id of the client
 * @apiSuccess {Number} cycle_number The latest loan cycle of the client
 * @apiSuccess {Object[]} cycles Details of each loan cycle 
 * @apiSuccess {Number} cycles.cycle_number Cycle number of the specific loan cycle
 * @apiSuccess {Object} cycles.screening Screening in the specific loan cycle
 * @apiSuccess {Object} cycles.loan Loan Application in the specific loan cycle
 * @apiSuccess {Object} cycles.acat ACAT application in the specific loan cycle
 * @apiSuccess {Object} cycles.started_by User who started the loan cycle
 * @apiSuccess {Object} cycles.last_edit_by User who edited last the loan cycle
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 2,
        "total_docs_count": 110,
        "current_page": 1,
        "docs": [
            {
                ...
            },
            {
                ...
            }
        ]
 *  }
 */
router.get('/paginate', acl(['*']), historyController.fetchAllByPagination);

/**
 * @api {get} /screenings/histories/:clientId Get History
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup History
 *
 * @apiDescription Get the whole loan history of a client
 *
 * @apiSuccess {String} _id history id
 * @apiSuccess {String} client Client record for which the history is searched
 * @apiSuccess {String} branch Branch reference Id of the client
 * @apiSuccess {Number} cycle_number The latest loan cycle of the client
 * @apiSuccess {Object[]} cycles Details of each loan cycle 
 * @apiSuccess {Number} cycles.cycle_number Cycle number of the specific loan cycle
 * @apiSuccess {Object} cycles.screening Screening in the specific loan cycle
 * @apiSuccess {Object} cycles.loan Loan Application in the specific loan cycle
 * @apiSuccess {Object} cycles.acat ACAT application in the specific loan cycle
 * @apiSuccess {Object} cycles.started_by User who started the loan cycle
 * @apiSuccess {Object} cycles.last_edit_by User who edited last the loan cycle
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df0a12871d0804290a71157",
        "last_modified": "2019-12-11T07:56:24.467Z",
        "date_created": "2019-12-11T07:56:24.467Z",
        "client": {
            "_id": "5df0a12771d0804290a71136",
            ...
        },
        "branch": "5b9283679fb7f20001f1494d",
        "cycle_number": 1,
        "cycles": [
            {
                "loan": {},
                "acat": {},
                "screening":{
                    "_id": "5df0a12871d0804290a71156",
                    ...
                },
                "started_by":{...},
                last_edit_by: {...}
            }
        ]
 * }
 *
 */
router.get('/:id', acl(['*']), historyController.fetchOne);

router.put('/:id', acl(['*']), historyController.update);

router.delete('/:id', acl(['*']), historyController.remove);


// Expose History Router
module.exports = router;
