#!/usr/bin/env node
/**
 * Add Nerd Nite Boss
 *
 * Creates a boss, adds it to a city and add it to the bosses list
 *
 * Input: Boss's name, personal email address and city
 *
 * Outcomes:
 *  Boss's NN email already exists  - REJECT
 *  Bosses personal email exists    - REJECT
 *  City does not exists            - CREATE BOSS, CREATE CITY
 *  City exists                     - CREATE BOSS, ADD TO CITY
 *
 */
(function () {
  "use strict";
  var Getopt = require("node-getopt"),
    BossAdder = require('./BossAdder'),

    getopt = new Getopt([
      ["n", "name=ARG", "Name of the boss"],
      ["e", "email=ARG", "External email address"],
      ["c", "city=ARG", "City that the boss runs"],
      ["r", "reuseBoss", "Reuse a pre-existing boss"],
      ["h", "help"]
    ]),
    cliArgs = process.argv.slice(2),
    options;

  function usage(messages) {
    var rc = 0;
    if (messages) {
      messages.forEach(function (message) {
        console.error("ERROR: " + message);
      });
      rc = 1;
    }
    getopt.showHelp();
    process.exit(rc);
  }

  function getOptions(args) {
    var input = getopt.parse(args),
      options = input.options,
      messages = [];
    if (options.help) {
      usage();
    }
    if (!options.name) {
      messages.push("Please provide a name for the boss. It will need to be in quotes");
    }
    if (!options.city) {
      messages.push("Please provide the name of the city. If it is more than one word, it will need to be in quotes");
    }
    if (!options.email && !options.reuseBoss) {
      messages.push("Please provide an external email address for the boss or indicate that you want to reuse a pre-existing boss");
    }
    if (options.email && options.reuseBoss) {
      messages.push("You should not provide an external email address if you wish to reuse a boss");
    }

    if (messages.length > 0) {
      usage(messages);
    }

    return options;
  }

  
  options = getOptions(cliArgs);
  

  var bossAdder = new BossAdder();
  bossAdder.run(options).finally(bossAdder.done);

}());
