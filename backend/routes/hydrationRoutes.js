const express = require("express");
const router = express.Router();
const controller = require("../controllers/hydrationController");
const auth = require("../middlewares/authMiddleware");

// Hydrate any entity using its type and ID
router.get("/:type/:id", auth, controller.hydrateEntity);

module.exports = router;
