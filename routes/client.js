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
 * @apiDescription Create new Client. Request should be sent in _multipart/form-data_
 *
 * @apiParam {String} first_name First Name
 * @apiParam {String} last_name Last Name
 * @apiParam {String} grandfather_name Grandfather's Name
 * @apiParam {String} gender Gender
 * @apiParam {String} national_id_no National Id number
 * @apiParam {String} national_id_card National ID Card Url
 * @apiParam {String} date_of_birth Date of Birth
 * @apiParam {String} civil_status Civil Status - Single,Married,Divorced,Widow,Widower
 * @apiParam {String} woreda Woreda
 * @apiParam {String} kebele Kebele
 * @apiParam {String} house_no House No
 * @apiParam {String} [spouse] Spouse
 * @apiParam {String} [spouse.first_name] Spouse First Name
 * @apiParam {String} [spouse.last_name] Spouse Last Name
 * @apiParam {String} [spouse.grandfather_name] Spouse Grandfather's Name
 * @apiParam {String} [spouse.national_id_no] Spouse National Id number
 * @apiParam {String} [email] Email Address
 * @apiParam {String} phone Phone Number
 * @apiParam {Number} household_members_count Household Members Count
 * @apiParam {String} branch Branch Client is being registered for
 * @apiParam {String} created_by Officer Account registering this
 *
 * @apiParamExample Request Example:
 *  {
 *    first_name: "Mary",
 *    last_name: "Jane",
 *    grandfather_name: "John Doe",
 *    national_id_no: "242535353",
 *    national_id_card: "<SCANNED_IMAGE_OBJECT>",
 *    date_of_birth: "'1988-11-10T00:00:00.000Z",
 *    civil_status: "single", 
 *    woreda: "Woreda",
 *    kebele: "kebele",
 *    house_no: "House Apartments, 4th Floor, F4"
 *    email: "mary.jane@gmail.com",
 *    gender: "Female",
 *    household_members_count: 1,
 *    branch : "556e1174a8952c9521286a60",
 *    created_by : "556e1174a8952c9521286a60"
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
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    national_id_card: "https://fb.cdn.ugusgu.us./client/285475474224.png",
 *    first_name: "Mary",
 *    last_name: "Jane",
 *    grandfather_name: "John Doe",
 *    national_id_no: "242535353",
 *    date_of_birth: "'1988-11-10T00:00:00.000Z",
 *    civil_status: "single", 
 *    woreda: "Woreda",
 *    kebele: "kebele",
 *    house_no: "House Apartments, 4th Floor, F4"
 *    email: "mary.jane@gmail.com",
 *    gender: "Female",
 *    household_members_count: 1,
 *    branch: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }
 *  }
 *
 */
router.post('/create', acl('*'), clientController.create);


/**
 * @api {get} /screening/clients/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get clients collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Client
 *
 * @apiDescription Get a collection of clients. The endpoint has pagination
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
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *    _id : "556e1174a8952c9521286a60",
 *    national_id_card: "https://fb.cdn.ugusgu.us./client/285475474224.png",
 *    first_name: "Mary",
 *    last_name: "Jane",
 *    grandfather_name: "John Doe",
 *    national_id_no: "242535353",
 *    date_of_birth: "'1988-11-10T00:00:00.000Z",
 *    civil_status: "single", 
 *    woreda: "Woreda",
 *    kebele: "kebele",
 *    house_no: "House Apartments, 4th Floor, F4"
 *    email: "mary.jane@gmail.com",
 *    gender: "Female",
 *    household_members_count: 1,
 *    branch: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }
 *    }]
 *  }
 */
router.get('/paginate', acl(['*']), clientController.fetchAllByPagination);

/**
 * @api {get} /screening/clients/:id Get Client Client
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Client
 *
 * @apiDescription Get a user client with the given id
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
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    national_id_card: "https://fb.cdn.ugusgu.us./client/285475474224.png",
 *    first_name: "Mary",
 *    last_name: "Jane",
 *    grandfather_name: "John Doe",
 *    national_id_no: "242535353",
 *    date_of_birth: "'1988-11-10T00:00:00.000Z",
 *    civil_status: "single", 
 *    woreda: "Woreda",
 *    kebele: "kebele",
 *    house_no: "House Apartments, 4th Floor, F4"
 *    email: "mary.jane@gmail.com",
 *    gender: "Female",
 *    household_members_count: 1,
 *    branch: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }
 *  }
 *
 */
router.get('/:id', acl(['*']), clientController.fetchOne);


/**
 * @api {put} /screening/clients/:id Update Client Client
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Client 
 *
 * @apiDescription Update a Client client with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    notes: "FB"
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
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    national_id_card: "https://fb.cdn.ugusgu.us./client/285475474224.png",
 *    first_name: "Mary",
 *    last_name: "Jane",
 *    grandfather_name: "John Doe",
 *    national_id_no: "242535353",
 *    date_of_birth: "'1988-11-10T00:00:00.000Z",
 *    civil_status: "single", 
 *    woreda: "Woreda",
 *    kebele: "kebele",
 *    house_no: "House Apartments, 4th Floor, F4"
 *    email: "mary.jane@gmail.com",
 *    gender: "Female",
 *    household_members_count: 1,
 *    branch: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }
 *  }
 */
router.put('/:id', acl(['*']), clientController.update);

// Expose Client Router
module.exports = router;
