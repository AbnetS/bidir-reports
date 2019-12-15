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

/**
 * @api {get} /reports/lists/branches Get All Branches
 * @apiVersion 1.0.0
 * @apiName GetBranches
 * @apiGroup Lists
 *
 * @apiDescription Get list of branches /only branch Id and name are returned/.
 *                 This data is used to present list of branches in reports where branch is a parameter.
 * 
 *
 * @apiSuccess {Object[]} List List of branches
 * 
 * @apiSuccessExample Response Example:
 * [
    {
        "send": "5b9283679fb7f20001f1494d",
        "display": "Test Branch"
    },
    {
        "send": "5b926c849fb7f20001f1494c",
        "display": "Meki Branch"
    }
]
 
 * 
 *  */
router.get('/branches', acl(['*']), listsController.fetchAllBranches);

/**
 * @api {get} /reports/lists/loanOfficers Get All Loan Officers
 * @apiVersion 1.0.0
 * @apiName GetLoanOfficers
 * @apiGroup Lists
 *
 * @apiDescription Get list of loan officers /only user Id and name are returned/.
 *                 This data is used to present list of loan officers in reports 
 *                 where loan officer is a parameter.
 * 
 *
 * @apiSuccess {Object[]} List List of Loan officers
 
 * 
 *  */
router.get('/loanOfficers', acl(['*']), listsController.fetchAllLoanOfficers);

/**
 * @api {get} /reports/lists/loanOfficers Get All Crops
 * @apiVersion 1.0.0
 * @apiName GetCrops
 * @apiGroup Lists
 *
 * @apiDescription Get list of crops /only crop Id and name are returned/.
 *                 This data is used to present list of crops in reports 
 *                 where crop is a parameter.
 * 
 *
 * @apiSuccess {Object[]} List List of Crops
 
 * 
 *  */
router.get('/crops', acl(['*']), listsController.fetchAllCrops);

/**
 * @api {get} /reports/lists/clients/search Get All Loan Officers
 * @apiVersion 1.0.0
 * @apiName searchClients
 * @apiGroup Lists
 *
 * @apiDescription Search clients /only client Id and name are returned/.
 *                 This data is used to present list of clients in reports 
 *                 where client is a parameter.
 * 
 *
 * @apiSuccess {Object[]} List List of Clients
 
 * 
 *  */
router.get('/clients/search', acl(['*']), listsController.searchClients);

// Expose Client Router
module.exports = router;
