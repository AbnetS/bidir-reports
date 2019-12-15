'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:client-router');

const updatorController  = require('../controllers/updator');
const reportsController  = require('../controllers/reports');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

/**
 * @api {post} /reports/create Create Report Type
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup Report Type
 *
 * @apiDescription Create a report type
 *
 * @apiParam {String} title Report Title
 * @apiParam {String} type Report Type
 * @apiParam {String} description Report description
 * @apiParam {Boolean} has_parameters Indicates whether the report has parameters
 * @apiParam {Object[]} parameters Parameters
 
 * 
 * @apiParamExample Request Example:
 * {
* 	    "title": "Active Clients List",
        "type": "ACTIVE_CLIENTS_LIST",
        "description":"This report contains list of clients.If filtering is applied, it will be based on the last loan cycle data.",
        "has_parameters": true,
        "parameters": [
                {
                    "name": "Branch",
                    "code": "branch",
                    "type": "SELECT",
                    "required": false,
                    "constants": [],
                    "is_constant": false,
                    "remark":"All branches that the user is allowed to access will be considered",
                    "get_from": "lists/branches"
                },...
        ]
        
 * }
 *
 * @apiSuccess {String} title Report Title
 * @apiSuccess {String} type Report Type
 * @apiSuccess {String} description Report description
 * @apiSuccess {Boolean} has_parameters Indicates whether the report has parameters
 * @apiSuccess {Object[]} parameters Parameters
 * @apiSuccess {String} parameters.name Name of the parameter
 * @apiSuccess {String} parameters.code Code of the parameter
 * @apiSuccess {String} parameters.required Determines whether the parameter is mandatory
 * @apiSuccess {String} parameters.remark Remark
 * @apiSuccess {String} parameters.type Type of parameter /'SELECT', 'TEXT', 'DATE','DATERANGE','SEARCH'/
 * @apiSuccess {Boolean} parameters.is_constant If the parameters has a constant set of choices
 * @apiSuccess {Object[]} parameters.constants List of Constants if is_constant is true
 * @apiSuccess {String} parameters.get_from Url from which constants of the parameter are obtained
 *
 * @apiSuccessExample Response Example:
 * {
        "_id": "5d57ac5355497c57987f19cd",
        "title": "Active Clients List",
        "type": "ACTIVE_CLIENTS_LIST",
        "has_parameters": true,
        "parameters": [
            {
                "required": false,
                "constants": [],
                "_id": "5dd52eb2d67d03053090e907",
                "name": "Loan Officer",
                "code": "loanOfficer",
                "type": "SELECT",
                "is_constant": false,
                "remark": "All loan officers will be considered",
                "get_from": "lists/loanOfficers"
            },
            {
                ...
            }...
        ],
        "date_created": "2019-08-17T07:27:15.074Z",
        "last_modified": "2019-11-20T12:16:50.282Z",
        "description": "This report contains list of clients.If filtering is applied, it will be based on the last loan cycle data."
 * }
 */
router.post('/create', acl(['*']), reportsController.create);

/**
 * @api {get} /reports/all Get All Report Types
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Report Type
 *
 * @apiDescription Get All report types
 *
 *
 * @apiSuccess {Object[]} List List of all reports 
 */
router.get('/all', acl(['*']), reportsController.getCollection);

/**
 * @api {put} /reports/:id Update Report Type
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Report Type
 *
 * @apiDescription Update a report type
 *
 * @apiParam {String} title Report Title
 * @apiParam {String} type Report Type
 * @apiParam {String} description Report description
 * @apiParam {Boolean} has_parameters Indicates whether the report has parameters
 * @apiParam {Object[]} parameters Parameters
 * 
 * @apiParamExample Request Example:
 * {
* 	    "title": "Active Clients List Report"
   }

 * @apiSuccess {String} title Report Title
 * @apiSuccess {String} type Report Type
 * @apiSuccess {String} description Report description
 * @apiSuccess {Boolean} has_parameters Indicates whether the report has parameters
 * @apiSuccess {Object[]} parameters Parameters
 * @apiSuccess {String} parameters.name Name of the parameter
 * @apiSuccess {String} parameters.code Code of the parameter
 * @apiSuccess {String} parameters.required Determines whether the parameter is mandatory
 * @apiSuccess {String} parameters.remark Remark
 * @apiSuccess {String} parameters.type Type of parameter /'SELECT', 'TEXT', 'DATE','DATERANGE','SEARCH'/
 * @apiSuccess {Boolean} parameters.is_constant If the parameters has a constant set of choices
 * @apiSuccess {Object[]} parameters.constants List of Constants if is_constant is true
 * @apiSuccess {String} parameters.get_from Url from which constants of the parameter are obtained
 *
 * @apiSuccessExample Response Example:
 * {
        "_id": "5d57ac5355497c57987f19cd",
        "title": "Active Clients List Report",
        "type": "ACTIVE_CLIENTS_LIST",
        "has_parameters": true,
        "parameters": [
            {
                "required": false,
                "constants": [],
                "_id": "5dd52eb2d67d03053090e907",
                "name": "Loan Officer",
                "code": "loanOfficer",
                "type": "SELECT",
                "is_constant": false,
                "remark": "All loan officers will be considered",
                "get_from": "lists/loanOfficers"
            },
            {
                ...
            }...
        ],
        "date_created": "2019-08-17T07:27:15.074Z",
        "last_modified": "2019-11-20T12:16:50.282Z",
        "description": "This report contains list of clients.If filtering is applied, it will be based on the last loan cycle data."
 * }

 **/
router.put('/:id', acl(['*']), reportsController.update);

/**
 * @api {post} /reports/:id/pdf Generate pdf report
 * @apiVersion 1.0.0
 * @apiName GeneratePdf
 * @apiGroup Report
 *
 * @apiDescription Generates a pdf report of the kind specified by the ID of the report.
 * 
 * @apiParam object List of parameters
 * 
 * @apiParamExample Request Example:
 * {
        "branch":{"send":"5b926c849fb7f20001f1494c","display":"Meki Branch"},
        "crop":{"send":"5b9276f1ac942500011c106e", "display":"Onion"},
        "fromDate":{"send": "02/01/2019", "display": "February 01, 2019"},
        "toDate":{"send": "03/31/2019", "display": "March 31, 2019"}
 * }

 * @apiSuccess {file} file Generated report in pdf format
 * 
 * **/
router.post('/:id/pdf', acl(['*']), reportsController.fetchPdf)

/**
 * @api {post} /reports/:id/docx Generate Word report
 * @apiVersion 1.0.0
 * @apiName GenerateDocx
 * @apiGroup Report
 *
 * @apiDescription Generates a docx report of the kind specified by the ID of the report.
 * 
 * @apiParam object List of parameters
 * 
 * @apiParamExample Request Example:
 * {
        "branch":{"send":"5b926c849fb7f20001f1494c","display":"Meki Branch"},
        "crop":{"send":"5b9276f1ac942500011c106e", "display":"Onion"},
        "fromDate":{"send": "02/01/2019", "display": "February 01, 2019"},
        "toDate":{"send": "03/31/2019", "display": "March 31, 2019"}
 * }

 * @apiSuccess {file} file Generated report in docx format 
 * 
 * 
 **/
router.post('/:id/docx', acl(['*']), reportsController.fetchDocx)

/**
 * @api {post} /reports/dashboard/counts Get Counts
 * @apiVersion 1.0.0
 * @apiName GetCounts
 * @apiGroup Dashboard
 *
 * @apiDescription Get dashboard counts
 * 
 * @apiSuccess {Number} branches Branches count
 * @apiSuccess {Number} users Users count
 * @apiSuccess {Number} individualClients Individual clients count
 * @apiSuccess {Number} groupClients Groups count

 * @apiSuccessExample Response Example:
 {
    "branches": 2,
    "users": 11,
    "individualClients": 2,
    "groupClients": 0
 }
 
 **/
router.get('/dashboard/counts', reportsController.getCounts);


/**
 * @api {post} /reports/dashboard/charts Get Chart Data
 * @apiVersion 1.0.0
 * @apiName GetCharts
 * @apiGroup Dashboard
 *
 * @apiDescription Get dashboard Chart Data
 * 
 * @apiSuccess {String} name Title of the chart
 * @apiSuccess {String} type Type of the chart
 * @apiSuccess {String[]} labels Labels
 * @apiSuccess {Number[]} data Data associated with the labels

 * @apiSuccessExample Response Example:
 [
    {
        "name": "Loan Amount by Crop",
        "type": "BAR",
        "labels": [
            "Head Cabbage",
            "Tomato",
            "Bean",
            "Greenpepper",
            "Cabbage",
            "Cbage",
            "Onion",
            "Maize",
            "Wheat",
            "Banana"
        ],
        "data": [
            320000,
            660000,
            261000,
            405000,
            65000,
            0,
            1296000,
            0,
            0,
            0
        ]
    },
    {...}
]
 
 **/
router.get('/dashboard/charts', reportsController.getDashboardStats);




router.put('/update', acl(['*']), updatorController.update);

router.put('/aggregate', acl(['*']), updatorController.aggregateAchieved);


//****Testing endpoints, remove all later */
//router.post('/sample', acl(['*']), reportsController.testJsReport);
//router.get('/:id/test', acl(['*']), reportsController.testPlatform)
//****END */

router.get('/:id', acl(['*']), reportsController.fetchOne);

router.delete('/:id', acl(['*']), reportsController.deleteOne);

// Expose Client Router
module.exports = router;
