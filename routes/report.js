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
 * @api {get} /reports/:id?type=Male|Female Get clients by gender
 * @apiVersion 1.0.0
 * @apiName ViewByGender
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
 * @apiSuccess {String} [geolocation] Geolocation Info
 * @apiSuccess {String} [geolocation.latitude] Latitude
 * @apiSuccess {String} [geolocation.longitude] Longitude
 * @apiSuccess {String} [email] Email Address
 * @apiSuccess {String} phone Phone Number
 * @apiSuccess {Number} household_members_count Household Members Count
 * @apiSuccess {Object} branch Branch Client is being registered for
 * @apiSuccess {Object} created_by User registering this
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
 *    },
 *    spouse: {
 *      first_name: "",
 *      last_name: "",
 *      grandfather_name: "",
 *      national_id_no: "",
 *    },
 *    geolocation: {
 *      latitude: 0,
 *      longitude: 0
 *    }
 *    }]
 *  }
 */

/**
 * @api {get} /reports/:id?name=<loan|screening|acar> Get clients by Loan Cycle Stage
 * @apiVersion 1.0.0
 * @apiName ClientsByStage
 * @apiGroup Client
 *
 * @apiDescription Get a collection of clients by loan cycle stage. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. Set Status in query `name=<loan|screening|acat>`
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
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    spouse: {
 *      first_name: "",
 *      last_name: "",
 *      grandfather_name: "",
 *      national_id_no: "",
 *    },
 *    geolocation: {
 *      latitude: 0,
 *      longitude: 0
 *    }
 *    }]
 *  }
 */

/**
 * @api {get} /reports/:id?crop=<reference> Get clients by Crop
 * @apiVersion 1.0.0
 * @apiName ClientsByCrops
 * @apiGroup Client
 *
 * @apiDescription Get a collection of clients by lcrop. The endpoint has pagination
 * out when id of crop is specified otherwise returns arrays of crop groups with clients. 
 * Use these params to query with pagination: `page=<RESULTS_PAGE`
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
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    spouse: {
 *      first_name: "",
 *      last_name: "",
 *      grandfather_name: "",
 *      national_id_no: "",
 *    },
 *    geolocation: {
 *      latitude: 0,
 *      longitude: 0
 *    }
 *    }]
 *  }
 */

/**
 * @api {post} /reports/create Create Report Type
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup ReportType
 *
 * @apiDescription Create a report type
 *
 * @apiParam {String} title Report Title
 * @apiParam {String} type Report Type
 *
 * apiParamExample Request Example:
 * {
 *    title: "View Clients By Gender", 
 *    type: "CLIENTS_BY_GENDER", 
 *  }
 *
 * @apiSuccess {String} _id Report Type Reference
 * @apiSuccess {String} title Report Title
 * @apiSuccess {String} type Report Type
 *
 * @apiSuccessExample Response Example:
 * {
 *    _id: "556e1174a8952c9521286a60"
 *    title: "View Clients By Gender", 
 *    type: "CLIENTS_BY_GENDER",
 * }
 */
router.post('/sample', acl(['*']), reportsController.testJsReport);

 router.post('/create', acl(['*']), reportsController.create);

/**
 * @api {get} /reports/all Get Report Types
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup ReportType
 *
 * @apiDescription Get All report type
 *
 *
 * @apiSuccess {String} _id Report Type Reference
 * @apiSuccess {String} title Report Title
 * @apiSuccess {String} type Report Type
 *
 * @apiSuccessExample Response Example:
 * [{
 *    _id: "556e1174a8952c9521286a60"
 *    title: "View Clients By Gender", 
 *    type: "CLIENTS_BY_GENDER",
 * }]
 */
router.get('/all', acl(['*']), reportsController.getCollection);

/**
 * @api {get} /reports/:id?QUERY_KEY=<QUERY_VALUE> Get Report Type Data
 * @apiVersion 1.0.0
 * @apiName GetData
 * @apiGroup ReportTYPE
 *
 * @apiDescription Get Report Type Data/Stats Generated. Pass All Possible
 * query parameters are defined by the report type.
 *
 * @apiSuccess {Number} clients_under_screening Total Clients under screening
 * @apiSuccess {Number} clients_under_loan Total Clients under loan
 * @apiSuccess {Number} clients_under_acat Total Clients under ACAT
 *
 * @apiSuccessExample Response Example:
 * [{ 
 *    clients_under_screening: 100,
 *    clients_under_loan: 167,
 *    clients_under_acat: 12
 *   }]
 */
router.get('/:id', acl(['*']), reportsController.fetchOne);

router.get('/:id/pdf', acl(['*']), reportsController.fetchPdf)

router.get('/:id/docx', acl(['*']), reportsController.fetchDocx)

router.get('/:id/test', acl(['*']), reportsController.testPlatform)



router.put('/:id', acl(['*']), reportsController.update);

router.put('/update', acl(['*']), updatorController.update);





// Expose Client Router
module.exports = router;
