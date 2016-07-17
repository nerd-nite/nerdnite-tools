#!/usr/bin/env node
/**
 * Creates a postfix alias map, based on the contents of the DB
 *
 */
(function () {
  "use strict";
  var pool = require('./dbPool'),
    Handlebars = require("handlebars"),
    _ = require("lodash"),

    blackList = require("./bosses.blacklist.json");

  require("./templates");

  var bosses = pool.query('SELECT * FROM boss');
  var bossAliases = pool.query('SELECT * FROM boss_alias');
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
    return bosses
      .then(function (bossRows) {
        var bossMap = {};
        bossRows.forEach(function (boss) {
          bossMap[boss._id] = boss.email;
          console.log(Handlebars.templates.alias(boss));
        });
        bossMap = cleanBossMap(bossMap);
        console.log(Handlebars.templates.bossesAlias({
          emails: Object.keys(bossMap).map(function (id) {
            return bossMap[id];
          })
        }));
        return bossMap;
      })
      .then(function (bossMap) {
        return bossAliases
          .then(function (aliases) {
            aliases.forEach(function (alias) {
              var aliasInfo = {
                _id: alias.alias,
                email: bossMap[alias.boss_id]
              };
              console.log(Handlebars.templates.alias(aliasInfo));
            });
            return bossMap;
          });
      });
  }

  function createCityAliases(bossMap) {
    var cityMap = {};
    var cityBossMap = {};
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
            bossEmails = ["null@nerdnite.com"];
          }
          console.log(Handlebars.templates.bossAlias({
            _id: city._id,
            bossEmails: bossEmails
          }));
          cityMap[city._id] = bossEmails;
        });
        return cityMap;
      })
      .then(function (cityMap) {
        cityAliases.then(function (aliases) {
          aliases.forEach(function (alias) {
            var aliasInfo = {
              _id: alias.alias,
              email: cityMap[alias.city_id]
            };
            console.log(Handlebars.templates.bossAlias(aliasInfo));
          });
        });
      });
  }


  function errorOut() {
    console.error.apply(console, arguments);

    process.exit(1);
  }

  createBossAliases()
    .then(createCityAliases)
    .then(function () {
      console.log("null@nerdnite.com nn.dan.rumney@gmail.com");
    })
    .catch(errorOut);

}());
