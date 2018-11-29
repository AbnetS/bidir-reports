'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:client-router');

const reportsController  = require('../controllers/reports');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

/**
 * @api {get} /reports/clients/gender?type=Male|Female Get clients by gender
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
router.get('/clients/gender', acl(['*']), reportsController.viewByGender);

/**
 * @api {get} /reports/clients/stage?name=<loan|screening|acar> Get clients by Loan Cycle Stage
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
router.get('/clients/stage', acl(['*']), reportsController.viewByStage);

// Expose Client Router
module.exports = router;
