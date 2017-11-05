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
 * @apiDescription Create new Client
 *
 * @apiParam {String} signup_type Signup type either social or basic or anon
 * @apiParam {String} picture Profile Picture image
 * @apiParam {String} full_name Full Names
 * @apiParam {String} [email] Email Address
 * @apiParam {String} [phone] Phone Number
 * @apiParam {String} clientname Clientname either the phone_number or email, if Anonymous, app should create a unique one
 * @apiParam {String} [password] Password
 * @apiParam {String} [age] Age
 * @apiParam {String} [city] City
 * @apiParam {String} [Country] Country
 * @apiParam {String} gender Male or Female
 * @apiParam {String} [facebook] Facebook Link
 * @apiParam {String} [google] Instagram Link
 *
 * @apiParamExample Request Example:
 *  {
 *    picture: "https://fb.cdn.ugusgu.us./client/285475474224/profile.png",
 *    full_name: "Mary Jane",
 *    email: "mary.jane@gmail.com",
 *    clientname: "mary.jane@gmail.com",
 *    city: "Nairobi",
 *    country: "Kenya",
 *    gender: "Female",
 *    facebook: "https://facebook.com/clients/mary.jane",
 *    signup_type: "social"
 *  }
 *
 * @apiSuccess {String} _id client id
 * @apiSuccess {Object} player Player Data
 * @apiSuccess {Boolean} is_active Activeness
 * @apiSuccess {String} role Client Role
 * @apiSuccess {String} realm Client Realm
 * @apiSuccess {String} last_login Last Login Time Stamp
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60"
 *    is_active: true,
 *    clientname: "mary.jane@gmail.com",
 *    last_login: '2017-03-16T10:50:52.305Z',
 *    role: "player",
 *    realm: "client",
 *    player: {
 *      _id : "556e1174a8952c9521286a60",
 *      client : "556e1174a8952c9521286a60",
 *      device : "556e1174a8952c9521286a60",
 *      preferences : "556e1174a8952c9521286a60",
 *      score_board : "556e1174a8952c9521286a60",
 *      friends : "556e1174a8952c9521286a60",
 *      facebook: "https://facebook.com/clients/mary.jane"
 *      full_name: "Mary Jane",
 *      phone: "",
 *      country: "Kenya",
 *      city: "Nairobi",
 *      email: "mary.jane@gmail.com",
 *      ...
 *    }
 *  }
 *
 */
router.post('/create', acl(['admin', 'officer']), clientController.create);


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
 * @apiSuccess {Object} player Player Data
 * @apiSuccess {Boolean} is_active Activeness
 * @apiSuccess {String} role Client Role
 * @apiSuccess {String} realm Client Realm
 * @apiSuccess {String} last_login Last Login Time Stamp
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *      _id : "556e1174a8952c9521286a60"
 *      is_active: true,
 *      clientname: "mary.jane@gmail.com",
 *      last_login: '2017-03-16T10:50:52.305Z',
 *      role: "player",
 *      realm: "client",
 *      player: {
 *        _id : "556e1174a8952c9521286a60",
 *        client : "556e1174a8952c9521286a60",
 *        device : "556e1174a8952c9521286a60",
 *        preferences : "556e1174a8952c9521286a60",
 *        score_board : "556e1174a8952c9521286a60",
 *        friends : "556e1174a8952c9521286a60",
 *        facebook: "https://facebook.com/clients/mary.jane"
 *        full_name: "Mary Jane",
 *        phone: "",
 *        country: "Kenya",
 *        city: "Nairobi",
 *        email: "mary.jane@gmail.com",
 *        ...
 *      }
 *    }]
 *  }
 */
router.get('/paginate', acl(['admin']), clientController.fetchAllByPagination);

/**
 * @api {get} /screening/clients/:id Get Client Client
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Client
 *
 * @apiDescription Get a user client with the given id
 *
 * @apiSuccess {String} _id client id
 * @apiSuccess {Object} player Player Data
 * @apiSuccess {Boolean} is_active Activeness
 * @apiSuccess {String} role Client Role
 * @apiSuccess {String} realm Client Realm
 * @apiSuccess {String} last_login Last Login Time Stamp
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60"
 *    is_active: true,
 *    clientname: "mary.jane@gmail.com",
 *    last_login: '2017-03-16T10:50:52.305Z',
 *    role: "player",
 *    realm: "client",
 *    player: {
 *      _id : "556e1174a8952c9521286a60",
 *      client : "556e1174a8952c9521286a60",
 *      device : "556e1174a8952c9521286a60",
 *      preferences : "556e1174a8952c9521286a60",
 *      score_board : "556e1174a8952c9521286a60",
 *      friends : "556e1174a8952c9521286a60",
 *      facebook: "https://facebook.com/clients/mary.jane"
 *      full_name: "Mary Jane",
 *      phone: "",
 *      country: "Kenya",
 *      city: "Nairobi",
 *      email: "mary.jane@gmail.com",
 *      ...
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
 * @apiSuccess {Object} player Player Data
 * @apiSuccess {Boolean} is_active Activeness
 * @apiSuccess {String} role Client Role
 * @apiSuccess {String} realm Client Realm
 * @apiSuccess {String} last_login Last Login Time Stamp
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60"
 *    is_active: true,
 *    clientname: "mary.jane@gmail.com",
 *    last_login: '2017-03-16T10:50:52.305Z',
 *    role: "player",
 *    realm: "client",
 *    player: {
 *      _id : "556e1174a8952c9521286a60",
 *      client : "556e1174a8952c9521286a60",
 *      device : "556e1174a8952c9521286a60",
 *      preferences : "556e1174a8952c9521286a60",
 *      score_board : "556e1174a8952c9521286a60",
 *      friends : "556e1174a8952c9521286a60",
 *      facebook: "https://facebook.com/clients/mary.jane"
 *      full_name: "Mary Jane",
 *      phone: "",
 *      country: "Kenya",
 *      city: "Nairobi",
 *      email: "mary.jane@gmail.com",
 *      ...
 *    }
 *  }
 */
router.put('/:id', acl(['*']), clientController.update);

// Expose Client Router
module.exports = router;
