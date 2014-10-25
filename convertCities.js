#!/usr/bin/env node
/**
 * Creates a postfix alias map, based on the contents of the DB
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        _               = require("lodash"),
        async           = require("async"),
        colors          = require("colors"),
        
        convertCity     = function (bosses, cities, city, cb) {
                    //console.log(city);
                    
                    if(city) {
                        console.log("Working on " + city.name);
                        var bossEmails = city.bosses;
                        if(!bossEmails || bossEmails.length === 0) {
                            console.error("No bosses in this city!".error);
                            cb();
                        }
                        else {
                            
                            async.map(bossEmails, function (bossEmail, cback) {
                                var re     = bossEmail.match(/([^@]*)@nerdnite.com/),
                                    bossId = re ? re[1] : bossEmail;
                                bosses.find({ $or: [
                                    { _id:   bossId},
                                    { email: bossId},
                                    {aliases: bossId}
                                    ]}).toArray(function(err, foundBosses) {
                                        if(err) {
                                            cback(err);
                                        }
                                        if(!foundBosses || foundBosses.length === 0) {
                                            console.error(("Could not find a boss for " + bossId + "("+city.name+")").error);
                                            cback(null,bossEmail);
                                        }
                                        else if(foundBosses.size > 1) {
                                            console.error(("Found multiple bosses for " + bossId + "("+city.name+")").error);
                                            console.error(foundBosses);
                                            cback(null,bossId);
                                        }
                                        else {
                                            //console.log("found: ", foundBosses);
                                            cback(null, foundBosses[0]._id);
                                        }
                                    });
                            }, function(err, bossList) {
                                if(err) {
                                    console.error("Error creating new boss list: ".error, err);
                                    cb(null, city);
                                }
                                else {
                                    console.log("Results for " + city.name);
                                    console.log("Old boss list: ", bossEmails);
                                    console.log("New boss list for city");
                                    console.log(bossList);
                                    cities.update({_id: city.name},{$set: {bosses: bossList}},cb);
                                }
                                
                            })
                        }
                    }
                    else {
                        cb();
                    }
                };
                
    colors.setTheme({
        error: "red",
        warn: "yellow"
    });

    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@mail.nerdnite2.com/nerdnite",
        function(err, db) {
            var bosses = !db ? null : db.collection("bosses"),
                cities = !db ? null : db.collection("cities");

            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                cities.find({}).toArray( function (err, cityList) {
                    async.each(cityList,
                               _.partial(convertCity, bosses, cities),
                               function() { db.close(); });
                });
            }
        }
    );
}());