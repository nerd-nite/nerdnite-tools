#!/usr/bin/env node
/**
 * Add Nerd Nite Alias to a boss
 *
 * Adds an alias to a Boss
 *
 * Input: Boss's name, alias
 *
 * Outcomes:
 *  Boss's name does not exists  - REJECT
 *
 */
(function () {
  "use strict";
  var AliasAdder = require('./AliasAdder'),
    Getopt = require("node-getopt"),
    getopt = new Getopt([
      ["n", "name=ARG", "Name of the boss"],
      ["a", "alias=ARG", "New Alias"],
      ["h", "help"]
    ]),
    cliArgs = process.argv.slice(2),
    options;
  require("./templates");

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

  function getOptions() {
    var input = getopt.parse(cliArgs),
      options = input.options,
      messages = [];
    if (options.help) {
      usage();
    }
    if (!options.name) {
      messages.push("Please provide a name for the boss. It will need to be in quotes");
    }
    if (!options.alias) {
      messages.push("Please provide the alias for this boss. If it is more than one word, it will need to be in quotes");
    }

    if (messages.length > 0) {
      usage(messages);
    }

    return options;
  }

  options = getOptions(cliArgs);
  console.log("Creating " + options.alias + " alias for " + options.name);

  var aliasAdder = new AliasAdder();
  aliasAdder.run(options)
    .catch(function(err) {
      console.error("Error adding alias: " + err);
    })
    .finally(aliasAdder.done);

}());
