const express = require("express");
const router = express.Router();
const Profilecontroller = require('../controller/Profilecontroller');
const verifyToken = require("../middlewares/auth.middlewares");

// SECURITY: these routes used to trust the :id in the URL / userId in the body, so any user
// (or, for the first three, anyone) could read secrets, change another user's password,
// email, phone or addresses, or delete their account. Now the :id must be the logged-in user
// (or an admin), and body ids are replaced with the logged-in user's.
const isAdmin = (req) => req.user?.role === "admin";
const selfOrAdmin = (req, res, next) =>
  String(req.params.id) === String(req.user?._id) || isAdmin(req)
    ? next()
    : res.status(403).json({ message: "You can only change your own account." });
const asSelf = (req, res, next) => {
  req.body = { ...(req.body || {}), userId: String(req.user._id) };
  next();
};

// Profile: own/admin → full profile (minus secrets); others → public fields (in the controller).
router.get('/userdata/:id', verifyToken, Profilecontroller.getUserProfile);
router.post('/emailverify', verifyToken, asSelf, Profilecontroller.verifyEmail);
router.post('/verifyphoneupdate', verifyToken, asSelf, Profilecontroller.verifyOTP);

router.patch('/nameupdate/:id/profileName',            verifyToken, selfOrAdmin, Profilecontroller.nameupdate);
router.patch('/deliveryaddress/:id/delivery-Address',  verifyToken, selfOrAdmin, Profilecontroller.updateDeliveryAddress);
router.patch('/billingaddress/:id/billingAddress',     verifyToken, selfOrAdmin, Profilecontroller.updateBillingAddress);
router.patch('/updatepassword/:id',                    verifyToken, selfOrAdmin, Profilecontroller.updatePassword);
router.delete('/deleteuser/:id',                       verifyToken, selfOrAdmin, Profilecontroller.deleteUserAccount);
router.get('/newsletter/:id',                          verifyToken, selfOrAdmin, Profilecontroller.toggleNewsletterPreference);
router.get('/messageforuser/:id',                      verifyToken, selfOrAdmin, Profilecontroller.toggleMessagePreference);

module.exports = router;
