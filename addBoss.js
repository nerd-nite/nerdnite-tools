#!/usr/bin/env nodejs
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        _               = require("lodash"),
        getopt          = require("node-getopt"),
        options         = getopt.create([
            [ "n", "name=ARG",  "Name of the boss"],
            [ "e", "email=ARG", "External email address"],
            [ "c", "city=ARG",  "City that the boss runs"],
            [ "h", "help"]
        ])
        .bindHelp()
        .parseSystem();
}());