'use strict';
module.exports = function () {
    var date = new Date()
        , year = date.getFullYear()
        , month = date.getMonth() + 1
        , day= date.getDate();

    if(month <= 9) {
        month = '0'+month;
    }

    if(day <= 9) {
        day = '0'+day;
    }

    return year +''+ month +''+ day;
};