/**
 * Created by danrumney on 7/17/16.
 */
'use strict';
var async = require('async')
  , Promise = require('bluebird')
  , pool = require('./dbPool')
  , _ = require('lodash')
  , createSlug = require('./slugger')
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
      , bossesCol = db ? db.collection('bosses') : null;

    if (err) {
      console.error('Failed to connect: ', err);
    }
    else {
      console.info('Connected to MongoDB');
      async.parallel({
        cities: mongoGetAll(citiesColl)
        , bosses: mongoGetAll(bossesCol)
      }, function (findError, results) {
        if (findError) {
          console.log(findError);
          return;
        }


        var bosses = _.map(results.bosses, function (boss) {
          if (!boss.aliases) {
            boss.aliases = [];
          }

          boss.aliases.push(boss._id);
          boss.__old_id = boss._id;
          boss._id = createSlug(boss.name);

          return boss;
        });

        var cities = _.map(results.cities, function (city) {
          if (!city.aliases) {
            city.aliases = [];
          }

          city.__old_id = city._id;
          city._id = createSlug(city.name);

          if (city.__old_id !== city._id) {
            city.aliases.push(city.__old_id);
          }
          
          city.bosses = _.map(city.bosses, function (boss) {
            var bossObject = _.find(bosses, {__old_id: boss});
            if (!bossObject) {
              throw new Error('Missing boss: ' + boss);
            }

            return bossObject._id;
          });

          return city;
        });


        function bossInserter(boss) {
          var bossAliases = boss.aliases || [];
          delete boss.aliases;

          var bossInsert = pool.query('INSERT INTO boss SET ?', boss);

          if (bossAliases.length > 0) {
            bossInsert = bossInsert.then(function () {
              return Promise.all(
                bossAliases.map(function (alias) {
                  return pool.query('INSERT INTO boss_alias SET ?', {boss_id: boss._id, alias: alias});
                })
              );
            });
          }

          return bossInsert;
        }

        function cityInserter(city) {
          var cityAliases = city.aliases || [];
          delete city.aliases;

          var cityBosses = city.bosses || [];
          delete city.bosses;

          var cityInsert = pool.query('INSERT INTO city SET ?', city);

          if (cityAliases.length > 0) {
            cityInsert = cityInsert.then(function () {
              return Promise.all(
                cityAliases.map(function (alias) {
                  return pool.query('INSERT INTO city_alias SET ?', {city_id: city._id, alias: alias});
                })
              );
            });
          }

          if (cityBosses.length > 0) {
            cityInsert = cityInsert.then(function () {
              return Promise.all(
                cityBosses.map(function (boss) {
                  return pool.query('INSERT INTO boss_city SET ?', {city_id: city._id, boss_id: boss});
                })
              );
            })
          }

          return cityInsert;
        }


        Promise.all(_.map(bosses, bossInserter))
          .then(function () {
            return Promise.all(_.map(cities, cityInserter));
          })
          .then(function () {
            return console.log('Done');
          })
          .catch(function (insertError) {
            return console.error('Failed: ' + insertError);
          })
          .finally(function () {
            pool.end();
            db.close();
          });
      });
    }
  });