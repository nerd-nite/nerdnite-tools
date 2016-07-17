/**
 * Created by danrumney on 7/17/16.
 */
var bosses = require('./bosses.json').bosses,
  cities = require('./cities.json').cities,
  Promise = require('bluebird'),
  pool = require('./dbPool'),
  _ = require('lodash'),
  createSlug = require('./slugger');

//console.log(bosses);

bosses = _.map(bosses, function (boss) {
  if (!boss.aliases) {
    boss.aliases = [];
  }

  boss.aliases.push(boss._id);
  boss.__old_id = boss._id;
  boss._id = createSlug(boss.name);

  return boss;
});

//console.log(bosses);

//console.log(cities);

cities = _.map(cities, function (city) {
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
      throw new Error("Missing boss: " + boss);
    }

    return bossObject._id;
  });

  return city;
});

//console.log(cities);

function bossInserter(boss) {

  delete boss.__old_id;

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
  delete city.__old_id;

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
    return console.log("Done");
  })
  .catch(function (err) {
    return console.error("Failed: " + err);
  })
  .finally(function () {
    pool.end();
  });