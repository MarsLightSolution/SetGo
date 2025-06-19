const express = require("express");
const router = express.Router();
const Profilecontroller = require('../controller/Profilecontroller')
router.patch('/nameupdate/:id/profileName', Profilecontroller.nameupdate);
router.patch('/deliveryaddress/:id/delivery-Address', Profilecontroller.updateDeliveryAddress);
router.post('/verifyphoneupdate', Profilecontroller.verifyOTP);
router.patch('/billingaddress/:id/billingAddress',Profilecontroller.updateBillingAddress);
router.delete('/deleteuser/:id',Profilecontroller.deleteUserAccount);
router.get('/newsletter/:id',Profilecontroller.toggleNewsletterPreference);
router.get('/messageforuser/:id',Profilecontroller.toggleMessagePreference);

module.exports = router