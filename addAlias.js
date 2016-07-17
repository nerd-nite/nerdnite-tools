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
  var pool = require("./dbPool"),
    Promise = require("bluebird"),
    Getopt = require("node-getopt"),
    createSlug = require("./slugger"),

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

  function slugInUse(slug) {
    return Promise.all([
      pool.query('SELECT COUNT(*) FROM boss WHERE _id = ?', [slug]),
      pool.query('SELECT COUNT(*) FROM boss_alias WHERE alias = ?', [slug]),
      pool.query('SELECT COUNT(*) FROM city WHERE _id = ?', [slug]),
      pool.query('SELECT COUNT(*) FROM city_alias WHERE alias = ?', [slug])
    ]).reduce(function (acc, result) {
      return acc || result[0]['COUNT(*)'] > 0;
    }, false);
  }


  function createAlias(name, alias) {
    var bossAlias = {
      alias: alias,
      boss_id: createSlug(name)
    };

    return pool.query('INSERT INTO boss_alias SET ?', bossAlias);
  }

  options = getOptions(cliArgs);
  console.log("Creating " + options.alias + " alias for " + options.name);
  function errorOut() {
    console.error.apply(console, arguments);
    process.exit(1);
  }


  console.info("Connected to DB");

  var slug = createSlug(options.name);

  Promise.all([
    slugInUse(slug),
    slugInUse(options.alias)
      ])
    .spread(function(bossSlugInUse, aliasSlugInUse) {
      if (bossSlugInUse && ! aliasSlugInUse) {
        console.log("Creating alias");
        return createAlias(options.name, options.alias)
          .then(function() {
            console.log("Success");
          })
          .catch(function (err) {
            return errorOut("Could not create boss: ", err);
          });
      } else if(!bossSlugInUse) {
        return errorOut("Could not find the boss: " + slug);
      } else {
        return errorOut("Alias already exists: " + options.alias);
      }

    })
    .catch(errorOut);
}());
