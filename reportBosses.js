#!/usr/bin/env node
'use strict';
/**
 * Report the Bosses associated with a city
 *
 */
(function () {

  var pool = require('./dbPool')
    , Promise = require('bluebird')
    , Handlebars = require('handlebars')
    , _ = require('lodash')

    , Mandrill = require('mandrill-api/mandrill').Mandrill
    , mandrillClient = new Mandrill(process.env.MANDRILL_KEY);

  require('./templates');

  var bosses = pool.query('SELECT * FROM boss');
  var bossAliasQuery = pool.query('SELECT * FROM boss_alias');
  var cityBosses = pool.query('SELECT * FROM boss_city');
  var cityAliases = pool.query('SELECT * FROM city_alias');

  bosses.then(function (rows) {
    return Promise.all(rows.map(function (row) {
      var boss = {
        _id: row._id
        , name: row.name
        , email: row.email
      };
      return bossAliasQuery
        .then(function(aliasRows) {
          boss.aliases = aliasRows.filter(function(aliasRow) {
            return aliasRow.boss_id === boss._id;
          })
            .map(function (aliasRow) {
              return aliasRow.alias;
            });
          return cityBosses;
        })
        .then(function (cityBossRows) {
          boss.cities = cityBossRows.filter(function(cityBossRow) {
            return cityBossRow.boss_id === boss._id;
          })
            .map(function (cityBossRow) {
              return cityBossRow.city_id;
            });
          return cityAliases;
        })
        .then(function (cityAliasRows) {
          var bossCityAliases = cityAliasRows.filter(function (cityAliasRow) {
            return _.includes(boss.cities, cityAliasRow.city_id);
          })
            .map(function (cityAliasRow) {
              return cityAliasRow.alias;
            });

          boss.cities = boss.cities.concat(bossCityAliases);
        })
        .then(function () {
          console.log(boss);
          var message = {
            text: Handlebars.templates.bossReport(boss)
            , subject: 'Nerd Nite Boss Report'
            , 'from_email': 'web@nerdnite.com'
            , to: [{
              email: boss._id + '@nerdnite.com'
              , type: 'to'
            }]
          };
          console.log(message.text);
          return new Promise(function (resolve, reject) {
            mandrillClient.messages.send({message: message, async: true}, resolve, reject);
          });
        })
    }));
  })
    .finally(function() {
      pool.end();
    });
})();