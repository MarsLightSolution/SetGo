const express = require("express");
const route =express.Router();
console.log("router loaded");

route.use('/', require('./Authroutes.js'));
route.use('/users', require('./userRouter.js'));
route.use('/redis', require('./redisRoutes.js'));
route.use('/', require('./Twillioroutes.js'));
module.exports = route;