const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const auth = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

router.get("/statusbar", auth, allowRoles("admin"), controller.getStatusBar);
router.get("/deal-progress", auth, allowRoles("admin"), controller.getDealProgress);
router.get("/sales-report", auth, allowRoles("admin"), controller.getSalesReport);
router.get("/team-performance", auth, allowRoles("admin"), controller.getTeamPerformance);

module.exports = router;
