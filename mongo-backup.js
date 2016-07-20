/**
 * Created by danrumney on 7/17/16.
 *
 * Takes a snapshot
 */
'use strict';
var async = require('async')
  , MongoClient = require('mongodb').MongoClient
  , mongoHost = process.env.MONGO_HOST;

if (!mongoHost) {
  console.error('No MONGO_HOST set');
  process.exit();
}


function mongoGetAll(coll) {
  return function(cb) {
    coll.find({}).toArray(cb);
  }
}

MongoClient.connect('mongodb://nerdnite:s4tgd1tw@' + mongoHost + '/nerdnite',
  function (err, db) {
    var citiesColl = db ? db.collection('cities') : null
      , bossesColl = db ? db.collection('bosses') : null;

    if (err) {
      console.error('Failed to connect: ', err);
    }
    else {
      console.info('Connected to MongoDB');
      async.parallel({
        cities: mongoGetAll(citiesColl)
        , bosses: mongoGetAll(bossesColl)
      }, function (findError, results) {
        if (findError) {
          console.log(findError);
          return;
        }

        console.log(JSON.stringify(results));

        db.close();

      });
    }
  });