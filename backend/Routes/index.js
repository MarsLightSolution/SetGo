const express = require("express");
const router = express.Router();

console.log("router loaded");

router.use('/', require('./Authroutes.js'));
router.use('/users', require('./userRouter.js'));
router.use('/redis', require('./redisRoutes.js'));
router.use('/', require('./Twillioroutes.js'));
router.use('/', require('./Profileroutes.js'));
router.use("/api/products",require('./product.route.js'));
module.exports = router;
