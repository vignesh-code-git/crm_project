const express = require("express");
const router = express.Router();
const controller = require("../controllers/callsController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.createCall);
router.post("/initiate", authMiddleware, controller.initiateCall);
router.post("/terminate/:sid", authMiddleware, controller.terminateCall);
router.get("/status/:sid", authMiddleware, controller.getCallStatus);
router.get("/", authMiddleware, controller.getCalls);

module.exports = router;
