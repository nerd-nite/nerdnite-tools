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
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        Handlebars      = require("handlebars"),
        templates       = require("./templates"),
        _               = require("lodash"),
        Getopt          = require("node-getopt"),
        async           = require("async"),
        Mandrill        = require('mandrill-api/mandrill').Mandrill,
        
        mandrillClient  = new Mandrill('16rUK74RBFiacFNfmu_2sA'),
        getopt          = new Getopt([
                            [ "n", "name=ARG",  "Name of the boss"],
                            [ "e", "email=ARG", "External email address"],
                            [ "c", "city=ARG",  "City that the boss runs"],
                            [ "h", "help"]
                        ]),
        cliArgs         = process.argv.slice(2),
        options;
        
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

    function getOptions(args) {
        var input           = getopt.parse(cliArgs),
            options         = input.options,
            messages = [];
        if(options.help) {
            usage();
        }
        if(!options.name) {
            messages.push("Please provide a name for the boss. It will need to be in quotes");
        }
        if(!options.city) {
            messages.push("Please provide the name of the city. If it is more than one word, it will need to be in quotes");
        }
        if(!options.email) {
            messages.push("Please provide an external email address for the boss");
        }

        if(messages.length > 0) {
            usage(messages);
        }

        return options;
    }

    function confirmOptions(options) {
        console.log(Handlebars.templates.confirm(options));
    }
    
    function createInternalEmail(email) {
        var internalEmail = email.trim().toLowerCase();
        return internalEmail.replace(/[^a-zA-Z0-9]+/g, ".") + "@nerdnite.com";
    }
    
    function internalEmailInUse(email, forwards, callback) {
        return forwards.find({"source": email}).toArray(function (err, items) {
            if(err) {
                console.error("Problem searching for items: ", err);
                callback(err);
            }
            else {
                callback(null, items.length > 0); 
            }
        });
    }
    
    function externalEmailInUse(email, forwards, callback) {
        return forwards.find({"targets": email}).toArray(function (err, items) {
            if(err) {
                console.error("Problem searching for items: ", err);
                callback(err);
            }
            else {
                callback(null, items.length > 0);
            }
        });
    }
    
    function cityExists(city, forwards, callback) {
        internalEmailInUse(createInternalEmail(city),forwards, callback);
    }
    
    function createBoss(forwards, name, email, callback) {
        var nnEmail     = createInternalEmail(name),
            bossSlug    = nnEmail.split("@")[0],
            boss = {
                _id: bossSlug,
                name: name,
                source: nnEmail,
                targets: [ email ],
                type: "boss",
            },
            message = {
                text: Handlebars.templates.newBoss(boss),
                subject: "Created Nerd Nite Boss",
                from_email: "web@nerdnite.com",
                to: _.map(boss.targets, function(target){
                    return {
                        email: target,
                        name: boss.name,
                        type: "to"
                    };
                })
            };
            
            
        forwards.insert(boss, function(err, result) {
            if(err) {
                callback(err);
            }
            else {
                mandrillClient.messages.send({ message: message, async: true});
                callback(null,result);
            }
        });
        
        return boss;
          
    }
    
    function createCity(forwards, city, boss, callback) {
        var cityEmail = createInternalEmail(city),
            citySlug  = cityEmail.split("@")[0],
            city      = {
                _id: citySlug,
                name: city,
                source: cityEmail,
                targets: boss.targets,
                bossName: boss.name,
                type: "city"
            },
            message = {
                text: Handlebars.templates.newCity(city),
                subject: "Created Nerd Nite City",
                from_email: "web@nerdnite.com",
                to: _.map(boss.targets, function(target){
                    return {
                            email: target,
                            name: boss.name,
                            type: "to"
                        };
                })
            };

        forwards.insert(city, function(err, result) {
            if(err) {
                callback(err);
            }
            else {
                console.log(Handlebars.templates.newWPCity(city));
                console.log(Handlebars.templates.newWPBoss({boss: boss, city: city}));
                mandrillClient.messages.send({ message: message, async: true});
                callback(null,result);
            }
        });
    }
    
    function addBossToCity(forwards, city, boss, callback){
        var cityEmail = createInternalEmail(city),
            citySlug  = cityEmail.split("@")[0],
            city      = {
                _id: citySlug,
                name: city,
                source: cityEmail,
                targets: boss.targets,
                bossName: boss.name
            },
            message = {
                text: Handlebars.templates.updateCity(city),
                subject: "Updated Nerd Nite City",
                from_email: "web@nerdnite.com",
                to: _.map(boss.targets, function(target){
                    return {
                        email: target,
                        name: boss.name,
                        type: "to"
                    };
                })
            };

        forwards.update(
            {_id: city._id },
            { $addToSet: { targets: { $each: city.targets }}},
            function(err, result) {
                if(err) {
                    callback(err);
                }
                else {
                    console.log(Handlebars.templates.newWPBoss({boss: boss, city: city}));
                    mandrillClient.messages.send({ message: message, async: true});
                    callback(null,result);
                }
            }
        );
    }

    options = getOptions(cliArgs);
    confirmOptions(options);
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@nerdnite2.com/nerdnite",
        function(err, db) {
            var forwards,
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
                forwards = db.collection("forwards");
                var internalEmail = createInternalEmail(options.name);
                async.parallel({
                    internalEmailInUse: function(callback) {
                        internalEmailInUse(internalEmail, forwards, callback);
                    },
                    externalEmailInUse: function(callback) {
                        externalEmailInUse(options.email, forwards, callback);
                    },
                    cityExists: function(callback) {
                        cityExists(options.city, forwards, callback);
                    }
                },
                function(err, results) {
                    var newBoss,
                        city = options.city;
                    if(results.internalEmailInUse) {
                        errorOut("'"+internalEmail+"' is already in use");
                    }
                    if(results.externalEmailInUse) {
                        errorOut("'"+options.email+"' is already a target email");
                    }
                    newBoss = createBoss(forwards, options.name, options.email, function(err, result) {
                        if(err) {
                            errorOut("Could not create boss: ", err);
                        }
                        var callback = function (err, result) {
                            if(err) {
                                errorOut("Failed to update/create city: ", err);
                            }
                            else {
                                console.log("Success");
                            }

                            db.close();
                        }
                        if(results.cityExists) {
                            addBossToCity(forwards, city, newBoss, callback);
                        }
                        else {
                            createCity(forwards, city, newBoss, callback);
                        }

                    });

                });
            }
        }
    );
}());