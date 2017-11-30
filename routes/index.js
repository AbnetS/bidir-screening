'use strict';

/**
 * Load Module Dependencies
 */
const Router = require('koa-router');
const debug  = require('debug')('api:app-router');

const rootRouter        = require('./root');
const clientRouter      = require('./client');
const answerRouter      = require('./answer');
const screeningRouter   = require('./screening');

var appRouter = new Router();

const OPEN_ENDPOINTS = [
    /\/assets\/.*/,
    '/'
];

// Open Endpoints/Requires Authentication
appRouter.OPEN_ENDPOINTS = OPEN_ENDPOINTS;

// Add Root Router
composeRoute('', rootRouter);
//Add Screenings Router
composeRoute('screenings', screeningRouter);
//Add client Router
composeRoute('screenings/clients', clientRouter);
//Add answer Router
composeRoute('screenings/answers', answerRouter);

function composeRoute(endpoint, router){
  appRouter.use(`/${endpoint}`, router.routes(), router.allowedMethods());
}
// Export App Router
module.exports = appRouter;
