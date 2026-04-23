// ==========================
// SERVER SETUP
// ==========================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================
// MIDDLEWARE
// ==========================
app.use(express.json());

// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true
// }));

// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     "https://your-frontend.vercel.app"
//   ],
//   credentials: true
// }));

// app.use(cors({
//   origin: [
//     process.env.FRONTEND_URL
//   ],
//   credentials: true
// }));

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://crm-project-frontend.vercel.app" // ← PUT YOUR REAL URL
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use(cookieParser());

// ==========================
// UPLOAD SETUP
// ==========================
const { upload, uploadPath } = require("./services/uploadService");
app.use("/uploads", express.static(uploadPath));

// ==========================
// ROUTES
// ==========================


app.get("/", (req, res) => {
  res.send("CRM API Running ✅");
});

// Existing Routes
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

// Attachments & Upload (using the upload middleware configured here)
app.use("/api", require("./routes/attachmentsRoutes")(upload));

// Dashboard APIs
app.use("/api", require("./routes/dashboardRoutes"));

// Global Search
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
// sequelize.authenticate().then(() => {
//   console.log("✅ Database connected successfully.");
//   /* Make sure to only use sync() when initially creating tables or pass { alter: true } carefully
//    We won't auto-sync here to prevent accidental drops on existing DB, but connection is validated! */
//   sequelize.sync({ alter: true }).then(async () => {
//     console.log("✅ All exact tables and enums have been automatically created in crm_sequelize DB!");
    
//     // Seed default roles to prevent foreign key errors on user registration
//     const { Role } = require("./models");
//     try {
//       if (Role) {
//         await Role.findOrCreate({ where: { id: 1 }, defaults: { name: 'admin' } });
//         await Role.findOrCreate({ where: { id: 2 }, defaults: { name: 'user' } });
//         console.log("✅ Default Roles verified.");
//       }
//     } catch (err) {
//       console.error("❌ Error seeding roles:", err);
//     }
//   }); 

//   app.listen(process.env.PORT || 5000, () => {
//     console.log(`🚀 CRM running on port ${process.env.PORT || 5000}`);
//   });
// }).catch((err) => {
//   console.error("❌ Database connection error:", err);
// });


const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(async () => {
    console.log("✅ Database connected successfully.");

    await sequelize.sync({ alter: true });

    // Seed roles
    const { Role } = require("./models");
    try {
      if (Role) {
        await Role.findOrCreate({ where: { id: 1 }, defaults: { name: 'admin' } });
        await Role.findOrCreate({ where: { id: 2 }, defaults: { name: 'user' } });
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




