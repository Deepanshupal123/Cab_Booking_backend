const express = require("express");
const { body, param } = require("express-validator");
const { stats, users, setUserStatus } = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/stats", stats);
router.get("/users", users);
router.patch(
  "/users/:id/status",
  param("id").isMongoId(),
  body("isActive").isBoolean(),
  validate,
  setUserStatus
);

module.exports = router;
