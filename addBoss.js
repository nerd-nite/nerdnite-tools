#!/usr/bin/env nodejs
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        Handlebars      = require("handlebars"),
        _               = require("lodash"),
        Getopt          = require("node-getopt"),
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
        var template = Handlebars.compile(
            "Please confirm that you wish to add this boss:\n" +
                "Name:  {{name}}\n" +
                "City:  {{city}}\n" +
                "Email: {{email}}");
        console.log(template(options));
    }

    options = getOptions(cliArgs);
    confirmOptions(options);


}());