'use strict';

/**
 * Load Module Dependencies
 */
const Router = require('koa-router');
const debug  = require('debug')('api:app-router');

const rootRouter        = require('./root');
const clientRouter      = require('./client');
const questionRouter      = require('./question');
const screeningRouter   = require('./screening');
const historyRouter   = require('./history');
const cbsRouter   = require('./cbs');

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
//Add question Router
composeRoute('screenings/questions', questionRouter);
//Add History Router
composeRoute('screenings/histories', historyRouter);
//Add History Router
composeRoute('screenings/cbs', cbsRouter);

function composeRoute(endpoint, router){
  appRouter.use(`/${endpoint}`, router.routes(), router.allowedMethods());
}
// Export App Router
module.exports = appRouter;
