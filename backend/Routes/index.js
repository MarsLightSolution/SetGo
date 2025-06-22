const express = require("express");
const router = express.Router();

console.log("router loaded");

route.use('/', require('./Authroutes.js'));
route.use('/users', require('./userRouter.js'));
route.use('/redis', require('./redisRoutes.js'));
route.use('/', require('./Twillioroutes.js'));
route.use('/', require('./Profileroutes.js'));
router.use("/api/products",require('./product.route.js'));
module.exports = router;
