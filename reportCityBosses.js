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

  var bosses = pool.query('SELECT * FROM boss').then(function (rows) {
    return _.keyBy(rows, '_id');
  });
  var cities = pool.query('SELECT * FROM city');
  var cityAliases = pool.query('SELECT * FROM city_alias');
  var cityBosses = pool.query('SELECT * FROM boss_city');

  function getMapBuilder(from, to) {
    return function (rows) {
      var map = {};
      rows.forEach(function (row) {
        if(!map[row[from]]) {
          map[row[from]] =  []
        }
        map[row[from]].push(row[to]);
      });
      return map;
    };
  }


  cityAliases.then(function (rows) {
    var aliasMap = getMapBuilder('city_id', 'alias')(rows);

    return Promise.all([
      cities
      , cityBosses
      , bosses
      , aliasMap
    ]);
  })
    .spread(function (cityRows, cityBossRows, bossMap, aliasMap) {
      var cityBossMap = getMapBuilder('city_id', 'boss_id')(cityBossRows);

    cityRows.forEach(function (cityRow) {
      var city = {
        _id: cityRow._id
        , name: cityRow.name
        , email: cityRow.email
      };
      if(aliasMap[cityRow._id]) {
        city.aliases = aliasMap[cityRow._id];
      }
      if(cityBossMap[cityRow._id]) {
        city.bosses = cityBossMap[cityRow._id].map(function(bossId) {
          return bossMap[bossId].email;
        })
      }

      var message = {
        text: Handlebars.templates.cityReport(city)
        , subject: 'Nerd Nite City Report'
        , 'from_email': 'web@nerdnite.com'
        , to: _.map(city.bosses, function (boss) {
          return {
            email: boss
            , type: 'to'
          };
        })
      };
      console.log(message.text);
      mandrillClient.messages.send({message: message, async: true});
      console.log('Sent message about ' + city.name);

    });
  }).finally(function() {
    pool.end();
  });
})();