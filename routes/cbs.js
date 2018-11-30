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
 * @api {post} /screening/cbs/connect Connect to CBS
 * @apiVersion 1.0.0
 * @apiName Connect
 * @apiGroup CBS
 *
 * @apiDescription Connect To CBS
 *
 *
 * @apiSuccess {String} message Message
 *
 * @apiSuccessExample Response Example:
 *  {
 *    message: "connected successfully",
 *  }
 *
 */
router.post('/connect', acl('*'), clientController.connectToCBS);

/**
 * @api {put} /screening/cbs/config Update CBS Config
 * @apiVersion 1.0.0
 * @apiName ConfigUpdate
 * @apiGroup CBS
 *
 * @apiDescription Update CBS Config
 *
 * @apiParam {String} [username] Username
 * @apiParam {String} [password] Password
 * @apiParam {String} [url] url
 * @apiParam {String} [device_id] Device Id
 *
 * @apiParamExample Request Example:
 *  {
 *    username : "556e1174a8952c9521286a60"
 *  }
 *
 *
 * @apiSuccess {String} message Message
 *
 * @apiSuccessExample Response Example:
 *  {
 *    message: "updated successfully",
 *  }
 *
 */
router.put('/config', acl('*'), clientController.updateCBSCOnfig);


// Expose Client Router
module.exports = router;
