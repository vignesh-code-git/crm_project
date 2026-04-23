const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Lead = sequelize.define("Lead", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
  },
  last_name: {
    type: DataTypes.STRING(100),
  },
  email: {
    type: DataTypes.STRING(150),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  job_title: {
    type: DataTypes.STRING(100),
  },
  lead_status: {
    type: DataTypes.ENUM("New", "Open", "In Progress", "Contacted", "Qualified", "Converted", "Disqualified"),
    defaultValue: "New",
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  owner_id: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  },
  company_id: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: "leads",
  timestamps: false,
});

module.exports = Lead;
