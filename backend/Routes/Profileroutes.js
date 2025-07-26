const express = require("express");
const router = express.Router();
const Profilecontroller = require('../controller/Profilecontroller')
const verifyJWT = require("../middlewares/auth.middlewares");
router.patch('/nameupdate/:id/profileName', Profilecontroller.nameupdate);
router.patch('/deliveryaddress/:id/delivery-Address', Profilecontroller.updateDeliveryAddress);
router.post('/verifyphoneupdate', Profilecontroller.verifyOTP);
router.patch('/billingaddress/:id/billingAddress',verifyJWT, Profilecontroller.updateBillingAddress);
router.delete('/deleteuser/:id',Profilecontroller.deleteUserAccount);
router.get('/newsletter/:id',Profilecontroller.toggleNewsletterPreference);
router.get('/messageforuser/:id',Profilecontroller.toggleMessagePreference);
router.get('/userdata/:id',Profilecontroller.getUserProfile);
router.patch('/updatepassword/:id',Profilecontroller.updatePassword);
router.post('/emailverify',Profilecontroller.verifyEmail);

module.exports = router