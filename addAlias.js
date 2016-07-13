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
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        templates       = require("./templates"),
        _               = require("lodash"),
        Getopt          = require("node-getopt"),
        async           = require("async"),
        fs              = require("fs"),
        createSlug      = require("./slugger"),
        timestamp       = require("./timestamp"),

        getopt          = new Getopt([
            [ "n", "name=ARG",  "Name of the boss"],
            [ "a", "alias=ARG", "New Alias"],
            [ "h", "help"]
        ]),
        cliArgs         = process.argv.slice(2),
        mongoHost       = process.env.MONGO_HOST,
        options;

    if(!mongoHost) {
        console.error("No MONGO_HOST set");
        process.exit();
    }

    function usage(messages) {
        var rc = 0;
        if(messages) {
            _.forEach(messages, function (message) {
                console.error("ERROR: " +message);
            });
            rc = 1;
        }
        getopt.showHelp();
        process.exit(rc);
    }

    function getOptions() {
        var input           = getopt.parse(cliArgs),
            options         = input.options,
            messages = [];
        if(options.help) {
            usage();
        }
        if(!options.name) {
            messages.push("Please provide a name for the boss. It will need to be in quotes");
        }
        if(!options.alias) {
            messages.push("Please provide the alias for this boss. If it is more than one word, it will need to be in quotes");
        }

        if(messages.length > 0) {
            usage(messages);
        }

        return options;
    }

    function slugInUse(slug, collection, callback) {
        return collection.find({ $or : [
            { _id: slug},
            { aliases: slug}
        ]}).toArray(function (err, items) {
                if(err) {
                    console.error("Problem searching for items: ", err);
                    callback(err);
                }
                else {
                    callback(null, items.length > 0);
                }
            }
        );
    }

    function createAlias(bosses, name, alias, callback) {
        var bossSlug     = createSlug(name),
            boss = {
                _id: bossSlug
            };


        bosses.update({ _id: boss._id }, {$addToSet: {"aliases": alias}}, function(err) {
            if(err) {
                callback(err);
            } else {
                callback(null);
            }
        });

    }

    options = getOptions(cliArgs);
    console.log("Creating " +options.alias+ " alias for "+options.name);
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@"+mongoHost+"/nerdnite",
        function(err, db) {
            var bossColl = !db ? null : db.collection("bosses"),
                cityColl = !db ? null : db.collection("cities"),
                errorOut = function () {
                    console.error.apply(console, arguments);
                    db.close();
                    process.exit(1);
                };

            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                console.info("Connected to DB");

                var slug = createSlug(options.name);
                async.parallel({
                        internalEmailInUse: function(callback) {
                            async.parallel({
                                    usedByCity: _.partial(slugInUse, slug, cityColl),
                                    usedByBoss: _.partial(slugInUse, slug, bossColl)
                                },
                                function (err, results) {
                                    callback(null, results.usedByCity || (results.usedByBoss && !options.reuseBoss));
                                }
                            );
                        }
                    },
                    function(err, results) {
                        console.log(results);
                        if(err) {
                            errorOut("Unexpected error: ", err);
                        }
                        if(results.internalEmailInUse) {
                            console.log("Creating alias");
                            createAlias(bossColl, options.name, options.alias, function (err) {
                                if (err) {
                                    errorOut("Could not create boss: ", err);
                                }
                                else {
                                    console.log("Success");
                                }
                                db.close();
                            });
                        } else {
                            errorOut("Could not find the boss: '"+slug+"'");
                            db.close();
                        }

                    });
            }
        }
    );
}());
