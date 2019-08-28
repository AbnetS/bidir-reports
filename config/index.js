'use strict';

/**
 * Load Module dependencies.
 */
const path = require('path');

const env = process.env;

const PORT        = env.PORT || 8180;
const API_URL     = env.API_URL || 'http://127.0.0.1:8180';
const NODE_ENV    = env.NODE_ENV || 'development';
const HOST        = env.HOST_IP || 'localhost';

const MONGODB_URL = env.MONGODB_URL || 'mongodb://127.0.0.1:27017/bidir';

let config = {

  // Root Configs
  API_URL: API_URL,

  ENV: NODE_ENV,

  PORT: PORT,

  HOST: HOST,


  MONGODB: {
    URL: MONGODB_URL,
    OPTS: {
      server:{
        auto_reconnect:true
      }
    }
  },

  CORS_OPTS: {
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
  },

  SALT_FACTOR: 12,

  TOKEN: {
    RANDOM_BYTE_LENGTH: 32
  },


  ASSETS: {
    FILE_SIZE: 2 * 1024 * 1024, // 1MB,
    URL: API_URL + '/media/',
    DIR: path.resolve(process.cwd(), './assets') + '/',
    PROD: 'http://api.bidir.gebeya.co/assets/',
    DEV: 'http://api.dev.bidir.gebeya.co/assets/'
  },

  DOCX_WASM_API_KEY: {
    ND_DEV_ID: "39JK0J92MMNMTD2IHI6QA5H5M1",
    ND_DEV_SECRET: "41K5E3NC244HG9QNQPDI4QIO62"
  },

  STATUS_CONSTANTS : {
    new: {status: "New", stage: "New"},
    eligible: {status: "Eligible", stage: "Screening"},
    loan_application_new: {status: "Loan Application New", stage: "Loan Application"},
    loan_application_accepted: {status: "Loan Application Accepted", stage: "Loan Application"},
    ACAT_IN_PROGRESS: {status: "A-CAT In Progress", stage: "A-CAT"},
    //Loan-Granted: "Loan Granted",
    loan_granted: {status: "Loan Granted", stage: "Loan Granted"},
    loan_paid: {status: "Loan Paid", stage: "Loan Paid"}

  }
};

module.exports = config;
