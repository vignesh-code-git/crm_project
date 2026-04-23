module.exports = (upload) => {
  const express = require("express");
  const router = express.Router();
  const controller = require("../controllers/attachmentsController");

  // UPLOAD
  router.post("/upload", upload.single("file"), controller.uploadFile);

  // GET ATTACHMENTS
  router.get("/attachments", controller.getAttachments);

  return router;
};
