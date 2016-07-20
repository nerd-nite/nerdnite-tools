#!/usr/bin/env node
'use strict';
/**
 * Creates a postfix alias map, based on the contents of the DB
 *
 */
(function () {
  var pool = require('./dbPool')
    , Handlebars = require('handlebars')
    , _ = require('lodash')

    , blackList = require('./bosses.blacklist.json');

  require('./templates');

  var bosses = pool.query('SELECT * FROM boss');
  var bossAliasQuery = pool.query('SELECT * FROM boss_alias');
  var cities = pool.query('SELECT * FROM city;');
  var cityBosses = pool.query('SELECT * FROM boss_city');
  var cityAliases = pool.query('SELECT * FROM city_alias');


  function cleanBossMap(bossMap) {
    var newMap = _.clone(bossMap);
    var blackListedIds = _(blackList).values().flatten().value();
    _.forEach(blackListedIds, function (id) {
      delete newMap[id];
    });
    return newMap;
  }

  function createBossAliases() {
    var bossAliasStrings = [];
    return bosses
      .then(function (bossRows) {
        var bossMap = {};
        bossRows.forEach(function (boss) {
          bossMap[boss._id] = boss.email;
          bossAliasStrings.push(Handlebars.templates.alias(boss));
        });
        bossMap = cleanBossMap(bossMap);
        bossAliasStrings.push(Handlebars.templates.bossesAlias({
          emails: Object.keys(bossMap).map(function (id) {
            return bossMap[id];
          })
        }));
        return bossMap;
      })
      .then(function (bossMap) {
        return bossAliasQuery
          .then(function (aliases) {
            aliases.forEach(function (alias) {
              var aliasInfo = {
                _id: alias.alias
                , email: bossMap[alias.boss_id]
              };
              bossAliasStrings.push(Handlebars.templates.alias(aliasInfo));
            });
            return [bossMap, bossAliasStrings];
          });
      });
  }

  function createCityAliases(bossMap,bossAliasStrings) {
    var cityBossMap = {};
    var cityAliasStrings = [];
    return cityBosses
      .then(function (cityBossRows) {
        cityBossRows.forEach(function (cityBossRow) {
          if (!cityBossMap[cityBossRow.city_id]) {
            cityBossMap[cityBossRow.city_id] = [];
          }
          cityBossMap[cityBossRow.city_id].push(cityBossRow.boss_id);
        });
        return cities;
      })
      .then(function (cityRows) {
        var cityMap = {};
        cityRows.forEach(function (city) {
          var bossEmails = [];
          if (city.email) {
            bossEmails = [city.email];
          } else {
            bossEmails = cityBossMap[city._id].map(function (bossId) {
              return bossMap[bossId] || bossId;
            });
          }

          if (bossEmails.length === 0) {
            bossEmails = ['null@nerdnite.com'];
          }
          cityAliasStrings.push(Handlebars.templates.bossAlias({
            _id: city._id
            , bossEmails: bossEmails
          }));
          cityMap[city._id] = bossEmails;
        });
        return cityMap;
      })
      .then(function (cityMap) {
        return cityAliases.then(function (aliases) {
          aliases.forEach(function (alias) {
            var aliasInfo = {
              _id: alias.alias
              , bossEmails: cityMap[alias.city_id]
            };
            cityAliasStrings.push(Handlebars.templates.bossAlias(aliasInfo));
          });
          return [bossAliasStrings, cityAliasStrings];
        });
      });
  }

  function errorOut() {
    console.error.apply(console, arguments);

    process.exit(1);
  }

  createBossAliases()
    .spread(createCityAliases)
    .spread(function (bossAliasStrings, cityAliasStrings) {
      _.uniq(bossAliasStrings).sort().forEach(function (alias) {
        console.log(alias);
      });
      console.log('null@nerdnite.com nn.dan.rumney@gmail.com');
      _.uniq(cityAliasStrings).sort().forEach(function (alias) {
        console.log(alias);
      });
    })
    .catch(errorOut)
    .finally(function() {
      pool.end();
    });

})();
