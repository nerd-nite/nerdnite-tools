'use strict';
var  pool = require('./dbPool')
  , createSlug = require('./slugger')
  , Promise = require('bluebird');

function errorReporter(message) {
  return function(err) {
    if(err) {
      return Promise.reject(message + ': ' + err);
    } else {
      return Promise.reject(message);
    }
  }
}

function slugInUse(slug) {
  return Promise.all([
    pool.query('SELECT COUNT(*) FROM boss WHERE _id = ?', [slug])
    , pool.query('SELECT COUNT(*) FROM boss_alias WHERE alias = ?', [slug])
    , pool.query('SELECT COUNT(*) FROM city WHERE _id = ?', [slug])
    , pool.query('SELECT COUNT(*) FROM city_alias WHERE alias = ?', [slug])
  ]).reduce(function (acc, result) {
    return acc || result[0]['COUNT(*)'] > 0;
  }, false);
}


function createAlias(name, alias) {
  var bossAlias = {
    alias: alias
    , 'boss_id': createSlug(name)
  };

  return pool.query('INSERT INTO boss_alias SET ?', bossAlias);
}

var AliasAdder = function () {

};

module.exports = AliasAdder;

AliasAdder.prototype.run = function (options) {
  var slug = createSlug(options.name);

  return Promise.all([
    slugInUse(slug)
    , slugInUse(options.alias)
  ])
    .spread(function(bossSlugInUse, aliasSlugInUse) {
      if (bossSlugInUse && ! aliasSlugInUse) {
        console.log('Creating alias');
        return createAlias(options.name, options.alias)
          .then(function() {
            console.log('Success');
          })
          .catch(errorReporter('Could not create boss: '));
      } else if(!bossSlugInUse) {
        return errorReporter('Could not find the boss: ' + slug)();
      } else {
        return errorReporter('Alias already exists: ' + options.alias)();
      }

    })
    .catch(errorReporter('AliasAdder error'));
};

AliasAdder.prototype.done = function () {
  pool.end();
};