#!/usr/bin/env node
/**
 * Creates a postfix alias map, based on the contents of the DB
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        Handlebars      = require("handlebars"),
        templates       = require("./templates"),
        _               = require("lodash"),
        mongoHost       = process.env.MONGO_HOST,

        async           = require("async");
        
    if(!mongoHost) {
        console.error("No MONGO_HOST set");
        process.exit();
    }
        
        
    function createBossAliases(bosses, cbaCallback) {
        var bossMap = {};
        bosses.find({}).each( function (err, boss) {
            if(err) {
                cbaCallback(err);
            }
            else if(!boss) {
                console.log(Handlebars.templates.bossesAlias({
                    emails: _.values(bossMap)
                }));
                cbaCallback(null, bossMap);
            }
            else {
                bossMap[boss._id] = boss.email;
                console.log(Handlebars.templates.alias(boss));
            }
        });
    }
    
    function createCityAliases(cities, bossMap, ccaCallback) {
        cities.find({}).each(function (err, city) {
            var bossEmails = [];
            if(err) {
                ccaCallback(err);
            }
            else if (!city) {
                ccaCallback();
            }
            else {
                if(city.email) {
                    bossEmails = [city.email];
                } else if (city.bosses) {
                    bossEmails = _.map(city.bosses, function (bossId) {
                        return bossMap[bossId] || bossId;
                    });
                }

                if (bossEmails.length === 0) {
                    bossEmails = ["null@nerdnite.com"];
                }
                console.log(Handlebars.templates.bossAlias({
                    _id: city._id,
                    bossEmails: bossEmails
                }))
            }
        });
        
    }

    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@"+mongoHost+"/nerdnite",
        function(err, db) {
            var bosses  = !db ? null : db.collection("bosses"),
                cities  = !db ? null : db.collection("cities"),
                errorOut = function () {
                    console.error.apply(console, arguments);
                    db.close();
                    process.exit(1);
                };

            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                async.waterfall([
                    _.partial(createBossAliases, bosses),
                    _.partial(createCityAliases, cities)
                ], function(err, results) {
                    console.log("null@nerdnite.com nn.dan.rumney@gmail.com");
                    db.close();
                })
            }
        }
    );
}());
