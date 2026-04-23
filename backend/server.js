// ==========================
// SERVER SETUP
// ==========================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");

const fs = require("fs");

// ==========================
// MIDDLEWARE
// ==========================
app.use(express.json());

// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     process.env.FRONTEND_URL // your vercel app
//   ],
//   credentials: true
// }));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://crm-project-39me.vercel.app" // 👈 EXACT URL
  ],
  credentials: true
}));

app.use(cookieParser());

// ==========================
// ROOT ROUTE (for testing)
// ==========================
app.get("/", (req, res) => {
  res.send("CRM API Running ✅");
});

// ==========================
// UPLOAD SETUP
// ==========================
const { upload, uploadPath } = require("./services/uploadService");

// Ensure upload folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use("/uploads", express.static(uploadPath));

// ==========================
// ROUTES
// ==========================

// Core Routes
app.use("/api/leads", require("./routes/leadsRoutes"));
app.use("/api/deals", require("./routes/dealsRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/companies", require("./routes/companiesRoutes"));
app.use("/api/tickets", require("./routes/ticketsRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// Refactored Routes
app.use("/api/notes", require("./routes/notesRoutes"));
app.use("/api/emails", require("./routes/emailsRoutes"));
app.use("/api/tasks", require("./routes/tasksRoutes"));
app.use("/api/calls", require("./routes/callsRoutes"));
app.use("/api/meetings", require("./routes/meetingsRoutes"));
app.use("/api/notifications", require("./routes/notificationsRoutes"));

// Attachments
app.use("/api", require("./routes/attachmentsRoutes")(upload));

// Dashboard
app.use("/api", require("./routes/dashboardRoutes"));

// Search
app.use("/api/search", require("./routes/searchRoutes"));

// Hydration
app.use("/api/hydrate", require("./routes/hydrationRoutes"));

// Activities
app.use("/api/activities", require("./routes/activitiesRoutes"));

// ==========================
// ERROR HANDLER
// ==========================
const errorMiddleware = require("./middlewares/errorMiddleware");
app.use(errorMiddleware);

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(async () => {
    console.log("✅ Database connected successfully.");

    // 🔥 IMPORTANT FIX: Always sync tables (your main issue)
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced successfully.");

    // Seed roles
    const { Role } = require("./models");
    try {
      if (Role) {
        await Role.findOrCreate({
          where: { id: 1 },
          defaults: { name: "admin" }
        });
        await Role.findOrCreate({
          where: { id: 2 },
          defaults: { name: "user" }
        });
        console.log("✅ Default Roles verified.");
      }
    } catch (err) {
      console.error("❌ Error seeding roles:", err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 CRM running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });
