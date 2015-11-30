"use strict";
var removeDiacritics = require('diacritics').remove;
function anglicizeUmlauts(s) {
    if(!anglicizeUmlauts.translate_re) anglicizeUmlauts.translate_re = /[öäüÖÄÜ]/g;
    var translate = {
        "ä": "ae", "ö": "oe", "ü": "ue",
        "Ä": "Ae", "Ö": "Oe", "Ü": "Ue"   // probably more to come
    };
    return ( s.replace(anglicizeUmlauts.translate_re, function(match) {
        return translate[match];
    }) );
}
module.exports = function (email) {
    var internalEmail = email.trim().toLowerCase();
    internalEmail = anglicizeUmlauts(internalEmail);
    internalEmail = removeDiacritics(internalEmail);
    return internalEmail.replace(/,/g, "").replace(/[^-a-zA-Z0-9]+/g, ".");
};
