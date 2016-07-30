#!/usr/bin/env node
'use strict';
/**
 * Remove Nerd Nite Boss
 *
 * Removes a boss from a Nerd Nite City or from the entire system
 *
 * Input: Boss's name and city name
 *
 * Outcomes:
 *  Boss's NN email doesn't exists  - REJECT
 *  City does not exists            - REJECT
 *  City exists (and is not system) - REMOVE BOSS FROM CITY
 *  City is 'system'                - REMOVE BOSS FROM SYSTEM
 *
 */
(function () {
  var Getopt = require('node-getopt')
    , BossRemover = require('./BossRemover')
    , getopt = new Getopt([
    ['n', 'name=ARG', 'Name of the boss']
    , ['c', 'city=ARG', 'City to remove the boss from (or "system")']
    , ['h', 'help']
  ])
    , cliArgs = process.argv.slice(2)
    , options;

  function usage(messages) {
    var rc = 0;
    if (messages) {
      messages.forEach(function (message) {
        console.error('ERROR: ' + message);
      });
      rc = 1;
    }
    getopt.showHelp();
    process.exit(rc);
  }

  function getOptions(args) {
    var input = getopt.parse(args)
      , inputOptions = input.options
      , messages = [];
    if (inputOptions.help) {
      usage();
    }
    if (!inputOptions.name) {
      messages.push('Please provide a name for the boss. It will need to be in quotes');
    }
    if (!inputOptions.city) {
      messages.push('Please provide the name of the city. If it is more than one word, it will need to be in quotes');
    }

    if (messages.length > 0) {
      usage(messages);
    }

    return inputOptions;
  }


  options = getOptions(cliArgs);


  var bossRemover = new BossRemover();
  bossRemover.run(options)
    .catch(function (error) {
      if(error.type && error.type === 'ZOMBIES') {
        console.error('Some things have been left abandoned!');
        error.errors.forEach(function(err) {
          console.error(err);
        });
      } else {
        console.log(error);
      }
    })
    .finally(bossRemover.done);

})();
