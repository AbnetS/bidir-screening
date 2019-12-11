'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:client-router');

const clientController  = require('../controllers/client');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

/**
 * @api {post} /screening/clients/create Create new Client
 * @apiVersion 1.0.0
 * @apiName CreateClient
 * @apiGroup Client
 *
 * @apiDescription Register a new Client. Request should be sent in _multipart/form-data_
 *                 This endpoint also creates a screening form for the newly registered client.
 *
 * @apiParam {String} first_name First Name
 * @apiParam {String} last_name Last Name
 * @apiParam {String} [grandfather_name] Grandfather's Name
 * @apiParam {String} gender Gender
 * @apiParam {String} national_id_no National Id number
 * @apiParam {String} [national_id_card] National ID Card Url
 * @apiParam {String} [date_of_birth] Date of Birth
 * @apiParam {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiParam {String} [woreda] Woreda
 * @apiParam {String} [kebele] Kebele
 * @apiParam {String} [house_no] House No
 * @apiParam {String} [spouse] Spouse
 * @apiParam {String} [spouse.first_name] Spouse First Name
 * @apiParam {String} [spouse.last_name] Spouse Last Name
 * @apiParam {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiParam {String} [spouse.national_id_no] Spouse National Id number
 * @apiParam {String} [geolocation] Geolocation Info of the client's house
 * @apiParam {String} [geolocation.latitude] Latitude
 * @apiParam {String} [geolocation.longitude] Longitude
 * @apiParam {String} [email] Email Address
 * @apiParam {String} phone Phone Number
 * @apiParam {Number} household_members_count Household Members Count
 * @apiParam {String} branch Branch Id Client is being registered for
 * @apiParam {Boolean} [for_group] true only if a client belongs to a group. Defaults to false for individual clients
 *
 * @apiParamExample Request Example:
 *  {
        "first_name":     "Roba",
        "last_name":      "Gudeta",
        "grandfather_name": "Alem",
        "gender":         "Female",
        "national_id_no":  "B166-897",
        "date_of_birth":  "1980-11-05T00:00:00.000Z",
        "civil_status":  "single",
        "woreda":         "11",
        "kebele":         "12",
        "house_no":       "34",
        "phone":          "0916789087",
        "household_members_count": 5,
        "branch": "5b9283679fb7f20001f1494d",
        "for_group":false
 *  }
 *
 * @apiSuccess {String} _id client id
 * @apiSuccess {String} first_name First Name
 * @apiSuccess {String} last_name Last Name
 * @apiSuccess {String} grandfather_name Grandfather's Name
 * @apiSuccess {String} gender Gender
 * @apiSuccess {String} national_id_no National Id number
 * @apiSuccess {String} national_id_card National ID Card Url
 * @apiSuccess {String} date_of_birth Date of Birth
 * @apiSuccess {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiSuccess {String} woreda Woreda
 * @apiSuccess {String} kebele Kebele
 * @apiSuccess {String} house_no House No
 * @apiSuccess {String} [spouse] Spouse
 * @apiSuccess {String} [spouse.first_name] Spouse First Name
 * @apiSuccess {String} [spouse.last_name] Spouse Last Name
 * @apiSuccess {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiSuccess {String} [spouse.national_id_no] Spouse National Id number
 * @apiSuccess {String} [geolocation] Geolocation Info
 * @apiSuccess {String} [geolocation.latitude] Latitude
 * @apiSuccess {String} [geolocation.longitude] Longitude
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Boolean} for_group An attribute to show if the client is individual or belongs to a group
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly registered client
 * @apiSuccess {String} cbs_status Status indicating whether the client's record is sent to the core banking solution, if any
 * @apiSuccess {String} cbs_status_message Message returned from the CBS if there was a problem when trying to send client record
 * @apiSuccess {String} status Status showing the status of the client's loan process. Default to "new" for a newly started loan
 * 
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5def92fdd3bb2200014c7f1e",
        "last_modified": "2019-12-10T12:43:41.174Z",
        "date_created": "2019-12-10T12:43:41.174Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            ...
        },
        "created_by": {
            "_id": "5ce0047a8958650001a8001a",
            ...
        },
        "loan_cycle_number": 1,
        "cbs_status_message": "None",
        "cbs_status": "NO ATTEMPT",
        "for_group": false,
        "status": "new",
        "household_members_count": "5",
        "phone": "0916789087",
        "email": "",
        "geolocation": {
            "status": "NO ATTEMPT",
            "S2_Id": "NULL",        
            "longitude": 0,
            "latitude": 0
        },
        "spouse": {
            "national_id_no": "",
            "grandfather_name": "",
            "last_name": "",
            "first_name": ""
        },
        "house_no": "34",
        "kebele": "12",
        "woreda": "11",
        "civil_status": "single",
        "date_of_birth": "1980-11-05T00:00:00.000Z",
        "national_id_card": "",
        "national_id_no": "B166-897",
        "grandfather_name": "Alem",
        "last_name": "Gudeta",
        "first_name": "Roba",
        "gender": "Female",
        "picture": ""
    }
 *
 */
router.post('/create', acl('*'), clientController.create);

/**
 * @api {post} /screening/clients/cbs Upload to CBS
 * @apiVersion 1.0.0
 * @apiName UploadToCBS
 * @apiGroup Client
 *
 * @apiDescription Upload Client To CBS
 *
 * @apiParam {String} client Client Id
 * @apiParam {String} branchId CBS Supplied Branch ID
 *
 * @apiParamExample Request Example:
 *  {
 *    branchId: 1,
 *    client : "556e1174a8952c9521286a60"
 *  }
 *
 * @apiSuccess {String} message Message
 *
 * @apiSuccessExample Response Example:
 *  {
 *    message: "uploaded successfully",
 *  }
 *
 */
router.post('/cbs', acl('*'), clientController.uploadToCBS);

/**
 * @api {post} /screening/clients/cbs/bulk BulkUpload to CBS
 * @apiVersion 1.0.0
 * @apiName BulkUploadToCBS
 * @apiGroup Client
 *
 * @apiDescription Upload Client To CBS
 *
 * @apiParam {String} client Client Id
 * @apiParam {String} branchId CBS Supplied Branch ID
 *
 * @apiParamExample Request Example:
 *  [{
 *    branchId: 1,
 *    client : "556e1174a8952c9521286a60"
 *  }]
 *
 * @apiSuccess {String} message Message
 *
 * @apiSuccessExample Response Example:
 *  {
 *    message: "uploaded successfully",
 *  }
 *
 */
router.post('/cbs/bulk', acl('*'), clientController.uploadBulkToCBS);

/**
 * @api {post} /screening/clients/cbs/connect Connect to CBS
 * @apiVersion 1.0.0
 * @apiName ConnectToCBS
 * @apiGroup Client
 *
 * @apiDescription Connect to CBS system
 *
 
 *
 * @apiSuccess {String} message Message
 *
 * @apiSuccessExample Response Example:
 *  {
 *    message: "Connected successfully",
 *  }
 *
 */
router.post('/cbs/connect', acl('*'), clientController.connectToCBS);



/**
 * @api {get} /screening/clients/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE>&for_group=<true/false> Get clients collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Client
 *
 * @apiDescription Get a collection of clients. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. The for_group param is used to either retrieve individual clients (for_group=false)
 * or clients in a group (for_group=true)
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/clients/paginate?per_page=200&for_group=false
 * 
 * @apiSuccess {String} _id client id
 * @apiSuccess {String} first_name First Name
 * @apiSuccess {String} last_name Last Name
 * @apiSuccess {String} grandfather_name Grandfather's Name
 * @apiSuccess {String} gender Gender
 * @apiSuccess {String} national_id_no National Id number
 * @apiSuccess {String} national_id_card National ID Card Url
 * @apiSuccess {String} date_of_birth Date of Birth
 * @apiSuccess {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiSuccess {String} woreda Woreda
 * @apiSuccess {String} kebele Kebele
 * @apiSuccess {String} house_no House No
 * @apiSuccess {String} [spouse] Spouse
 * @apiSuccess {String} [spouse.first_name] Spouse First Name
 * @apiSuccess {String} [spouse.last_name] Spouse Last Name
 * @apiSuccess {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiSuccess {String} [spouse.national_id_no] Spouse National Id number
 * @apiSuccess {String} [geolocation] Geolocation Info
 * @apiSuccess {String} [geolocation.latitude] Latitude
 * @apiSuccess {String} [geolocation.longitude] Longitude
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Boolean} for_group An attribute to show if the client is individual or belongs to a group
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly registered client
 * @apiSuccess {String} cbs_status Status indicating whether the client's record is sent to the core banking solution, if any
 * @apiSuccess {String} cbs_status_message Message returned from the CBS if there was a problem when trying to send client record
 * @apiSuccess {String} status Status showing the status of the client's loan process. Default to "new" for a newly started loan
 *
 * @apiSuccessExample Response Example:
 *  
 {
    "total_pages": 1,
    "total_docs_count": 17,
    "current_page": 1,
    "docs": [
        {
            "_id": "5def9be6d3bb2200014c7f41",
            "last_modified": "2019-12-10T13:21:42.610Z",
            "date_created": "2019-12-10T13:21:42.299Z",
            "branch": {
                "_id": "5b9283679fb7f20001f1494d",
                ...
            }
            ...
        },
        {
            ...
        }
    ]
 */
router.get('/paginate', acl(['*']), clientController.fetchAllByPagination);


router.get('/status', acl(['*']), clientController.viewByStatus);

/**
 * @api {get} /screening/clients/search?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Search clients
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup Client
 *
 * @apiDescription Get a collection of individual clients by search. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id client id
 * @apiSuccess {String} first_name First Name
 * @apiSuccess {String} last_name Last Name
 * @apiSuccess {String} grandfather_name Grandfather's Name
 * @apiSuccess {String} gender Gender
 * @apiSuccess {String} national_id_no National Id number
 * @apiSuccess {String} national_id_card National ID Card Url
 * @apiSuccess {String} date_of_birth Date of Birth
 * @apiSuccess {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiSuccess {String} woreda Woreda
 * @apiSuccess {String} kebele Kebele
 * @apiSuccess {String} house_no House No
 * @apiSuccess {String} [spouse] Spouse
 * @apiSuccess {String} [spouse.first_name] Spouse First Name
 * @apiSuccess {String} [spouse.last_name] Spouse Last Name
 * @apiSuccess {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiSuccess {String} [spouse.national_id_no] Spouse National Id number
 * @apiSuccess {String} [geolocation] Geolocation Info
 * @apiSuccess {String} [geolocation.latitude] Latitude
 * @apiSuccess {String} [geolocation.longitude] Longitude
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Boolean} for_group An attribute to show if the client is individual or belongs to a group
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly registered client
 * @apiSuccess {String} cbs_status Status indicating whether the client's record is sent to the core banking solution, if any
 * @apiSuccess {String} cbs_status_message Message returned from the CBS if there was a problem when trying to send client record
 * @apiSuccess {String} status Status showing the status of the client's loan process. Default to "new" for a newly started loan
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 1,
        "total_docs_count": 2,
        "current_page": 1,
        "docs": [
            {
                "_id": "5df0a12771d0804290a71136",
                ...
            },
            {
                ...
            }
        ]
 */
router.get('/search', acl(['*']), clientController.search);


/**
 * @api {get} /screenings/clients/:id/screenings Get Client Screening
 * @apiVersion 1.0.0
 * @apiName ClientScreening
 * @apiGroup Screening
 *
 * @apiDescription Get client screening. Screening form of the last loan cycle is returned. 
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
            "_id": "5ba8c5ecbaad5600012dad98",
            ...
        },
        "created_by": "5b926ea8e1d5e7000177b3f5",
        "branch": "5b926c849fb7f20001f1494c",
        "comment": "",
        "status": "approved",
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
router.get('/:id/screenings', acl(['*']), clientController.getClientScreening);


/**
 * @api {get} /screening/clients/:id Get Client
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Client
 *
 * @apiDescription Get a client with the given id
 *
 * @apiSuccess {String} _id client id
 * @apiSuccess {String} first_name First Name
 * @apiSuccess {String} last_name Last Name
 * @apiSuccess {String} grandfather_name Grandfather's Name
 * @apiSuccess {String} gender Gender
 * @apiSuccess {String} national_id_no National Id number
 * @apiSuccess {String} national_id_card National ID Card Url
 * @apiSuccess {String} date_of_birth Date of Birth
 * @apiSuccess {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiSuccess {String} woreda Woreda
 * @apiSuccess {String} kebele Kebele
 * @apiSuccess {String} house_no House No
 * @apiSuccess {String} [spouse] Spouse
 * @apiSuccess {String} [spouse.first_name] Spouse First Name
 * @apiSuccess {String} [spouse.last_name] Spouse Last Name
 * @apiSuccess {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiSuccess {String} [spouse.national_id_no] Spouse National Id number
 * @apiSuccess {String} [geolocation] Geolocation Info
 * @apiSuccess {String} [geolocation.latitude] Latitude
 * @apiSuccess {String} [geolocation.longitude] Longitude
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Boolean} for_group An attribute to show if the client is individual or belongs to a group
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly registered client
 * @apiSuccess {String} cbs_status Status indicating whether the client's record is sent to the core banking solution, if any
 * @apiSuccess {String} cbs_status_message Message returned from the CBS if there was a problem when trying to send client record
 * @apiSuccess {String} status Status showing the status of the client's loan process. Default to "new" for a newly started loan
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5ba8c5ecbaad5600012dad98",
        "last_modified": "2018-09-24T11:29:14.749Z",
        "date_created": "2018-09-24T11:09:32.534Z",
        "branch": {
            "_id": "5b926c849fb7f20001f1494c",
            ...
        "created_by": {
            "_id": "5b926ea8e1d5e7000177b3f5",
            ...
        },
        "loan_cycle_number": 1,
        "cbs_status_message": "None",
        "cbs_status": "NO ATTEMPT",
        "for_group": false,
        "status": "ACAT_IN_PROGRESS",
        "household_members_count": "11",
        "phone": "0921362776",
        "email": "",
        "geolocation": {
            "status": "NO ATTEMPT",
            "S2_Id": "NULL",
            "longtude": 0,
            "longitude": 0,
            "latitude": 0
        },
        "spouse": {
            "national_id_no": "5600",
            "grandfather_name": "Elemo",
            "last_name": "Midakso",
            "first_name": "Medeshe"
        },
        "house_no": "",
        "kebele": "B/girrisa",
        "woreda": "DUGDA",
        "civil_status": "married",
        "date_of_birth": "1966-01-01T00:00:00.000Z",
        "national_id_card": "http://api.dev.bidir.gebeya.co/screening/assets/GELETO_63ae66b94c2f.jpg",
        "national_id_no": "22/04/390/2008",
        "grandfather_name": "Fole",
        "last_name": "Elemo",
        "first_name": "Geleto",
        "gender": "male",
        "picture": "http://api.dev.bidir.gebeya.co/screening/assets/GELETO_90c57d5d4867.jpg"
 *  }
 *
 */
router.get('/:id', acl(['*']), clientController.fetchOne);


router.put('/:id/geolocation', acl(['*']), clientController.updateGeolocation);


/**
 * @api {put} /screening/clients/:id Update Client
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Client 
 *
 * @apiDescription Update a client with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    "email": "geleto@gmail.com"
 * }
 *
 * @apiSuccess {String} _id client id
 * @apiSuccess {String} first_name First Name
 * @apiSuccess {String} last_name Last Name
 * @apiSuccess {String} grandfather_name Grandfather's Name
 * @apiSuccess {String} gender Gender
 * @apiSuccess {String} national_id_no National Id number
 * @apiSuccess {String} national_id_card National ID Card Url
 * @apiSuccess {String} date_of_birth Date of Birth
 * @apiSuccess {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiSuccess {String} woreda Woreda
 * @apiSuccess {String} kebele Kebele
 * @apiSuccess {String} house_no House No
 * @apiSuccess {String} [spouse] Spouse
 * @apiSuccess {String} [spouse.first_name] Spouse First Name
 * @apiSuccess {String} [spouse.last_name] Spouse Last Name
 * @apiSuccess {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiSuccess {String} [spouse.national_id_no] Spouse National Id number
 * @apiSuccess {String} [geolocation] Geolocation Info
 * @apiSuccess {String} [geolocation.latitude] Latitude
 * @apiSuccess {String} [geolocation.longitude] Longitude
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Boolean} for_group An attribute to show if the client is individual or belongs to a group
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly registered client
 * @apiSuccess {String} cbs_status Status indicating whether the client's record is sent to the core banking solution, if any
 * @apiSuccess {String} cbs_status_message Message returned from the CBS if there was a problem when trying to send client record
 * @apiSuccess {String} status Status showing the status of the client's loan process. Default to "new" for a newly started loan
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5ba8c5ecbaad5600012dad98",
        "last_modified": "2019-12-11T08:36:32.221Z",
        "date_created": "2018-09-24T11:09:32.534Z",
        "branch": {
            "_id": "5b926c849fb7f20001f1494c",
            ...
        },
        "created_by": {
            "_id": "5b926ea8e1d5e7000177b3f5",
            ...
        },
        "loan_cycle_number": 1,
        "cbs_status_message": "None",
        "cbs_status": "NO ATTEMPT",
        "for_group": false,
        "status": "ACAT_IN_PROGRESS",
        "household_members_count": "11",
        "phone": "0921362776",
        "email": "geleto@gmail.com",
        "geolocation": {
            "status": "NO ATTEMPT",
            "S2_Id": "NULL",
            "longtude": 0,
            "longitude": 0,
            "latitude": 0
        },
        "spouse": {
            "national_id_no": "5600",
            "grandfather_name": "Elemo",
            "last_name": "Midakso",
            "first_name": "Medeshe"
        },
        "house_no": "",
        "kebele": "B/girrisa",
        "woreda": "DUGDA",
        "civil_status": "married",
        "date_of_birth": "1966-01-01T00:00:00.000Z",
        "national_id_card": "http://api.dev.bidir.gebeya.co/screening/assets/GELETO_63ae66b94c2f.jpg",
        "national_id_no": "22/04/390/2008",
        "grandfather_name": "Fole",
        "last_name": "Elemo",
        "first_name": "Geleto",
        "gender": "male",
        "picture": "http://api.dev.bidir.gebeya.co/screening/assets/GELETO_90c57d5d4867.jpg"
 *  }
 */


router.put('/:id', acl(['*']), clientController.update);




router.delete('/:id', acl(['*']), clientController.remove);

router.put('/set', acl(['*']), clientController.setForGroup);






// Expose Client Router
module.exports = router;
