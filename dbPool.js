'use strict';

var mysql = require('promise-mysql')
  , Promise = require('bluebird')
  , dbHost = process.env.DB_HOST
  , dbUser = process.env.DB_USER
  , dbPass = process.env.DB_PASS
  , dbName = 'nerdnite_bosses';

if (!(dbHost && dbUser)) {
  console.error('DB Information not set');
  process.exit();
}

var DBPool = mysql.createPool({
  host: dbHost
  , user: dbUser
  , password: dbPass
  , database: dbName
  , connectionLimit: 4
  , multipleStatements: process.env.ENVIRONMENT === 'test'
  // , debug: true
});

var queryCache = {};
function cachedQueryBuilder(query, thenFunction) {
  return function (options) {
    var paramsProvided = options.params !== undefined;
    var cacheable = !paramsProvided;
    var cacheKey = query;

    if (paramsProvided && typeof options.params === 'string') {
      cacheable = true;
      cacheKey += ':' + options.params;
      options.params = [options.params];
    }

    var result = queryCache[cacheKey];
    if (!result || options.reset) {
      result = paramsProvided ? DBPool.query(query, options.params) : DBPool.query(query);
    }

    if (thenFunction) {
      result = result.then(thenFunction);
    }

    if (cacheable) {
      queryCache[cacheKey] = result;
    }

    return result;
  };
}


DBPool.getAllBosses = cachedQueryBuilder('SELECT * FROM boss');
DBPool.getBoss = cachedQueryBuilder('SELECT * FROM boss WHERE _id = ?', function (rows) {
  return rows ? rows[0] : undefined;
});
DBPool.getAllCities = cachedQueryBuilder('SELECT * FROM city');
DBPool.getCity = cachedQueryBuilder('SELECT * FROM city WHERE _id = ?', function (rows) {
  return rows ? rows[0] : undefined;
});
DBPool.getCityPerBossCount = cachedQueryBuilder('SELECT boss.*, COUNT(boss_city.city_id) as cityCount FROM boss LEFT JOIN boss_city ON boss_city.boss_id = boss._id GROUP BY boss._id;');
DBPool.getBossPerCityCount = cachedQueryBuilder('SELECT city.*, COUNT(boss_city.city_id) as bossCount FROM city LEFT JOIN boss_city ON boss_city.city_id = city._id GROUP BY city._id;');
DBPool.purge = function () {
  return DBPool.query('SHOW TABLES').then(function (tableRows) {
    Promise.all(tableRows.map(function (row) {
      return DBPool.query('SET FOREIGN_KEY_CHECKS = 0;TRUNCATE ' + row['Tables_in_' + dbName] + '; SET FOREIGN_KEY_CHECKS = 1;');
    }));
  });
};

var fixtureQueries = {
  bosses: 'INSERT INTO boss SET ?'
  , cities: 'INSERT INTO city SET ?'
  , bossAliases: 'INSERT INTO boss_alias SET ?'
  , cityAliases: 'INSERT INTO city_alias SET ?'
  , bossCityMappings: 'INSERT INTO boss_city SET ?'
};

/*
 * Loads fixtures in a set order (hence the need to explicitly list the fixture types, rather than iterate over
 * `fixtureQueries`.
 */
DBPool.loadFixtures = function (fixtures) {
  return ['bosses', 'cities', 'bossAliases' , 'cityAliases', 'bossCityMappings'].reduce(function (promise, fixtureType) {
    if(fixtures[fixtureType]) {
      return promise.then(function () {
        return Promise.all(
          fixtures[fixtureType].map(function (boss) {
            return DBPool.query(fixtureQueries[fixtureType], boss);
          })
        )
      })
    } else {
      return promise;
    }
  }, Promise.resolve());
};

DBPool.isSlugInUse = function (slug) {
  return Promise.all([
    DBPool.query('SELECT COUNT(*) FROM boss WHERE _id = ?', [slug])
    , DBPool.query('SELECT COUNT(*) FROM boss_alias WHERE alias = ?', [slug])
    , DBPool.query('SELECT COUNT(*) FROM city WHERE _id = ?', [slug])
    , DBPool.query('SELECT COUNT(*) FROM city_alias WHERE alias = ?', [slug])
  ]).reduce(function (acc, result) {
    return acc || result[0]['COUNT(*)'] > 0;
  }, false);
};

module.exports = DBPool;
