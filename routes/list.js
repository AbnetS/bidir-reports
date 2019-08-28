'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:client-router');

const updatorController  = require('../controllers/updator');
const listsController  = require('../controllers/lists');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

router.get('/branches', acl(['*']), listsController.fetchAllBranches);

// Expose Client Router
module.exports = router;
