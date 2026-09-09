const express = require("express");
const { register, login, me, updatePhone } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { registerRules, loginRules, phoneRules } = require("../validators");

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", protect, me);
router.patch("/phone", protect, phoneRules, validate, updatePhone);

module.exports = router;
