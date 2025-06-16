const express = require("express");
const route =express.Router();
console.log("router loaded");

route.use('/', require('./Authroutes.js'));
module.exports = route;