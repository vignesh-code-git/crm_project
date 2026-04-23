const sequelize = require("../config/sequelize");
const Company = require("./Company");
const Lead = require("./Lead");
const Deal = require("./Deal");
const Ticket = require("./Ticket");
const User = require("./User");
const Note = require("./Note");
const Email = require("./Email");
const Call = require("./Call");
const Task = require("./Task");
const Meeting = require("./Meeting");
const Attachment = require("./Attachment");
const Notification = require("./Notification");
const Role = require("./Role");
const Activity = require("./Activity");

// ==========================
// 🔥 RELATIONSHIPS
// ==========================

// --- Notification ---
Notification.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Notification, { foreignKey: "user_id" });

// --- Lead & Company ---
// Lead.belongsTo(Company, { foreignKey: "company_id" });
// Company.hasMany(Lead, { foreignKey: "company_id" });

// --- Deal & Lead ---
// Deal.belongsTo(Lead, { foreignKey: "lead_id" });
// Lead.hasMany(Deal, { foreignKey: "lead_id" });

// --- Deal & Company ---
// Deal.belongsTo(Company, { foreignKey: "company_id" });
// Company.hasMany(Deal, { foreignKey: "company_id" });

// --- Ticket & Company ---
// Ticket.belongsTo(Company, { foreignKey: "company_id" });
// Company.hasMany(Ticket, { foreignKey: "company_id" });

// --- User Associations for Activities ---
Note.belongsTo(User, { foreignKey: "user_id" });
Email.belongsTo(User, { foreignKey: "user_id" });
Call.belongsTo(User, { foreignKey: "user_id" });
Task.belongsTo(User, { foreignKey: "user_id" });
Meeting.belongsTo(User, { foreignKey: "user_id" });
Attachment.belongsTo(User, { foreignKey: "user_id" });
Activity.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Note, { foreignKey: "user_id" });
User.hasMany(Email, { foreignKey: "user_id" });
User.hasMany(Call, { foreignKey: "user_id" });
User.hasMany(Task, { foreignKey: "user_id" });
User.hasMany(Meeting, { foreignKey: "user_id" });
User.hasMany(Attachment, { foreignKey: "user_id" });
User.hasMany(Activity, { foreignKey: "user_id" });

// --- Roles ---
User.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(User, { foreignKey: "role_id" });

module.exports = {
  sequelize, // 🔥 Added this
  Company,
  Lead,
  Deal,
  Ticket,
  User,
  Note,
  Email,
  Call,
  Task,
  Meeting,
  Attachment,
  Notification,
  Role,
  Activity,
};
