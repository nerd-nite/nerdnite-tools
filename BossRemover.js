'use strict';
var pool = require('./dbPool')
  , createSlug = require('./slugger')
  , Handlebars = require('handlebars')
  , Promise = require('bluebird')
  , fs = require('fs')
  , timestamp = require('./timestamp')
  , _ = require('lodash');

require('./templates');

function errorReporter(message) {
  return function (err) {
    if (err) {
      return Promise.reject(message + ': ' + err);
    } else {
      return Promise.reject(message);
    }
  }
}

/*
 * Checks to make sure that there are no cities without a boss and no bosses without a city
 */
function checkForZombies() {
  return Promise.all([
    pool.getCityPerBossCount({reset: true})
    , pool.getBossPerCityCount({reset: true})
  ])
    .spread(function (cityPerBoss, bossPerCity) {
      var bosslessCities = _.filter(bossPerCity, function (cityRow) {
        return cityRow.bossCount === 0;
      });
      var citilessBosses = _.filter(cityPerBoss, function (bossRow) {
        return bossRow.cityCount === 0;
      });

      if (bosslessCities.length + citilessBosses.length > 0) {
        throw {
          type: 'ZOMBIES'
          , errors: bosslessCities.map(function (bosslessCity) {
            return bosslessCity.name + ' has no bosses'
          })
            .concat(citilessBosses.map(function (citilessBoss) {
              return citilessBoss.name + ' is the boss of no city'
            }))
        };
      }
    });
}

function deleteBossFromSystem(boss, updatesFileName) {

  return pool.query('DELETE FROM boss WHERE ?', {_id: boss._id})
    .then(function () {
      fs.appendFileSync(updatesFileName, Handlebars.templates.removeWPBoss({boss: boss}));
      return checkForZombies();
    });

}

function deleteBossFromCity(boss, city, updatesFileName) {

  return pool.query('DELETE FROM boss_city WHERE ? AND ?  ', [{'boss_id': boss._id }, { 'city_id': city._id}])
    .then(function () {
      fs.appendFileSync(updatesFileName, Handlebars.templates.removeWPBossFromCity({boss: boss, city: city}));
      return checkForZombies()
    });
}

function confirmOptions(options) {
  options.action = 'remove';
  console.log(Handlebars.templates.confirm(options));
}


var BossRemover = function () {
};

module.exports = BossRemover;

BossRemover.prototype.run = function (options) {
  if (!options.name) {
    return Promise.reject('Must provide a name for a boss');
  }
  if (!options.city) {
    return Promise.reject('Must provide the name of the city from which you wish to remove the boss - use \'system\' to completely remove the boss');
  }

  var bossSlug = createSlug(options.name)
    , citySlug = createSlug(options.city)
    , updatesFileName = timestamp() + '.updates.sh';

  confirmOptions(options);

  return Promise.all([
    pool.getBoss({params: bossSlug})
    , pool.getCity({params: citySlug})
  ])
    .spread(function (boss, city) {
      if (!boss) {
        throw new Error('No boss found with id: ' + bossSlug);
      }
      if (!city && citySlug !== 'system') {
        throw new Error('No city found with id: ' + citySlug);
      }


      if (city) {
        return deleteBossFromCity(boss, city, updatesFileName);
      }
      else {
        return deleteBossFromSystem(boss, updatesFileName);
      }
    }, errorReporter('Error trying to create boss'));
};

BossRemover.prototype.done = function () {
  pool.end();
};