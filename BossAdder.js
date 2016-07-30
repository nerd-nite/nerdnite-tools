'use strict';
var pool = require('./dbPool')
  , createSlug = require('./slugger')
  , Handlebars = require('handlebars')
  , Mandrill = require('mandrill-api/mandrill').Mandrill
  , mandrillClient = new Mandrill(process.env.MANDRILL_KEY)
  , Promise = require('bluebird')
  , fs = require('fs')
  , timestamp = require('./timestamp');

require('./templates');

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

function externalEmailInUse(email) {
  return pool.query('SELECT COUNT(*) AS bossCount FROM boss WHERE email = ?', [email])
    .then(function (results) {
      return results[0].bossCount > 0;
    }).catch(errorReporter('Error checking if external email is in use'));
}

function canUseExternalEmail(options) {
  if (options.reuseBoss) {
    return true;
  } else {
    return externalEmailInUse(options.email).then(function(b) { return !b });
  }
}

function cityExists(city) {
  return slugInUse(createSlug(city));
}

function createBoss(name, email, reuseBoss) {
  var bossSlug = createSlug(name)
    , boss = {
      _id: bossSlug
      , name: name
      , email: email
    }
    , message = {
      text: Handlebars.templates.newBoss(boss)
      , subject: 'Created Nerd Nite Boss'
      , 'from_email': 'web@nerdnite.com'
      , to: [{
        email: boss.email
        , name: boss.name
        , type: 'to'
      }]
    };

  var bossExists = pool.query('SELECT COUNT(*) FROM boss WHERE _id = ?', [boss._id])
    .then(function (result) {
      return result[0]['COUNT(*)'] > 0;
    });

  if (reuseBoss) {
    return bossExists.then(function (bossDoesExist) {
      if (bossDoesExist) {
        return boss;
      } else {
        throw new Error('Not able to find a boss with that name');
      }
    });
  } else {
    return bossExists.then(function (bossDoesExist) {
      if (bossDoesExist) {
        throw new Error('Conflict with boss ID!');
      } else {
        return pool.query('INSERT INTO boss SET ?', boss).then(function () {
          return sendMessage(message).then(function() { return boss; });
        });
      }
    });
  }
}

function createCity(cityName, boss, updatesFileName) {
  var citySlug = createSlug(cityName)
    , city = {
      _id: citySlug
      , name: cityName
    }
    , message = {
      text: Handlebars.templates.newCity({city: city, boss: boss})
      , subject: 'Created Nerd Nite City'
      , 'from_email': 'web@nerdnite.com'
      , to: [{
        email: boss.email
        , name: boss.name
        , type: 'to'
      }]
    };

  return pool.query('INSERT INTO city SET ?', city)
    .then(function () {
      var bossCity = {
        'boss_id': boss._id
        , 'city_id': city._id
      };
      return pool.query('INSERT INTO boss_city SET ?', bossCity);
    })
    .then(function () {
      fs.appendFileSync(updatesFileName, Handlebars.templates.newWPCity(city));
      fs.appendFileSync(updatesFileName, Handlebars.templates.newWPBoss({boss: boss, city: city}));
      return sendMessage(message);
    });
}

function addBossToCity(cityName, boss, updatesFileName) {
  var citySlug = createSlug(cityName)
    , city = {
      _id: citySlug
      , name: city
    }
    , message = {
      text: Handlebars.templates.updateCity({city: city, boss: boss})
      , subject: 'Updated Nerd Nite City'
      , 'from_email': 'web@nerdnite.com'
      , to: [{
        email: boss.email
        , name: boss.name
        , type: 'to'
      }]
    };

  return pool.query('INSERT INTO boss_city SET ?', {'boss_id': boss._id, 'city_id': city._id})
    .then(function () {
      fs.appendFileSync(updatesFileName, Handlebars.templates.newWPBoss({boss: boss, city: city}));
      return sendMessage(message);
    });
}

function sendMessage(message) {
  return process.env.ENVIRONMENT === 'test' ? Promise.resolve() : new Promise(function (resolve, reject) {
    mandrillClient.messages.send({message: message, async: true}, resolve, reject);
  });
}

function confirmOptions(options) {
  options.action = 'add';
  console.log(Handlebars.templates.confirm(options));
}


var BossAdder = function () {

};

module.exports = BossAdder;

BossAdder.prototype.run = function (options) {
  if(!options.name) {
    return Promise.reject('Must provide a name for a boss');
  }
  if(!options.city) {
    return Promise.reject('Must provide a city for a boss');
  }
  
  var slug = createSlug(options.name)
    , updatesFileName = timestamp() + '.updates.sh';

  confirmOptions(options);

  return Promise.all([
    slugInUse(slug)
    , canUseExternalEmail(options)
    , cityExists(options.city)
  ])
    .spread(function (slugIsInUse, externalEmailCanBeUsed, cityDoesExist) {
      if (slugIsInUse && !options.reuseBoss) {
        return errorReporter('"' + slug + '" is already in use')();
      }
      if (!externalEmailCanBeUsed && !options.reuseBoss) {
        return errorReporter('"' + options.email + '" is already a target email')();
      }

      return createBoss(options.name, options.email, options.reuseBoss)
        .then(function (newBoss) {
          if (cityDoesExist) {
            return addBossToCity(options.city, newBoss, updatesFileName);
          }
          else {
            return createCity(options.city, newBoss, updatesFileName);
          }
        }, errorReporter('Error trying to create boss'));
    })
    .catch(errorReporter('BossAdder error'));
};

BossAdder.prototype.done = function () {
  pool.end();
};