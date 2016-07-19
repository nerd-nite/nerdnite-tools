'use strict';

var mysql = require('promise-mysql')
  , dbHost = process.env.DB_HOST
  , dbUser = process.env.DB_USER
  , dbPass = process.env.DB_PASS;

if (!(dbHost && dbUser)) {
  console.error('DB Inforamation not set');
  process.exit();
}

module.exports = mysql.createPool({
  host: dbHost
  , user: dbUser
  , password: dbPass
  , database: 'nerdnite_bosses'
  , connectionLimit: 4
  , multipleStatements: process.env.ENVIRONMENT === 'test'
  //, debug: process.env.ENVIRONMENT === 'test'
});
