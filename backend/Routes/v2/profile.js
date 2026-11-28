// /api/v2/profile — like the /userdata, /nameupdate, ... routes in Profileroutes.js, but the
// :id must be the logged-in user (or an admin) and body userIds are the logged-in user.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { selfOrAdmin, asSelf, limiter, noSecrets } = require("../../middlewares/v2Guards.middleware");
const P = require("../../controller/Profilecontroller");
const { getUserProfile, changePassword } = require("../../controller/v2/account.controller");

const router = express.Router();
router.use(verifyJWT);
// The reused Profilecontroller handlers answer with the whole user document; strip secrets.
router.use(noSecrets);
const own = selfOrAdmin("id");

router.get("/userdata/:id", getUserProfile); // own/admin: private fields; others: public profile
router.post("/emailverify", asSelf("userId"), P.verifyEmail);
router.post("/verifyphoneupdate", asSelf("userId"), P.verifyOTP);
router.patch("/nameupdate/:id/profileName", own, P.nameupdate);
router.patch("/deliveryaddress/:id/delivery-Address", own, P.updateDeliveryAddress);
router.patch("/billingaddress/:id/billingAddress", own, P.updateBillingAddress);
router.patch("/updatepassword/:id", own, P.updatePassword);
// Own password only, current password required (the app's change-password screen).
router.patch("/change-password", limiter(10), changePassword);
router.delete("/deleteuser/:id", own, P.deleteUserAccount);
router.get("/newsletter/:id", own, P.toggleNewsletterPreference);
router.get("/messageforuser/:id", own, P.toggleMessagePreference);

module.exports = router;
