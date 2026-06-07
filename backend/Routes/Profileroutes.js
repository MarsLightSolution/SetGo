const express = require("express");
const router = express.Router();
const Profilecontroller = require('../controller/Profilecontroller');
const verifyToken = require("../middlewares/auth.middlewares");

// Public — no token needed
router.get('/userdata/:id', Profilecontroller.getUserProfile);
router.post('/emailverify', Profilecontroller.verifyEmail);
router.post('/verifyphoneupdate', Profilecontroller.verifyOTP);

// Protected — require valid access token
router.patch('/nameupdate/:id/profileName',            verifyToken, Profilecontroller.nameupdate);
router.patch('/deliveryaddress/:id/delivery-Address',  verifyToken, Profilecontroller.updateDeliveryAddress);
router.patch('/billingaddress/:id/billingAddress',     verifyToken, Profilecontroller.updateBillingAddress);
router.patch('/updatepassword/:id',                    verifyToken, Profilecontroller.updatePassword);
router.delete('/deleteuser/:id',                       verifyToken, Profilecontroller.deleteUserAccount);
router.get('/newsletter/:id',                          verifyToken, Profilecontroller.toggleNewsletterPreference);
router.get('/messageforuser/:id',                      verifyToken, Profilecontroller.toggleMessagePreference);

module.exports = router;