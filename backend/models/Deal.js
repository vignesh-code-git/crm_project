const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Deal = sequelize.define("Deal", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  deal_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  deal_stage: {
    type: DataTypes.ENUM(
      'Presentation Scheduled',
      'Qualified to Buy',
      'Contract Sent',
      'Appointment Scheduled',
      'Decision Maker Bought-In',
      'Closed Won',
      'Closed Lost'
    ),
  },
  amount: {
    type: DataTypes.NUMERIC,
  },
  close_date: {
    type: DataTypes.DATEONLY,
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
  },
  created_at: {
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
  lead_id: {
    type: DataTypes.INTEGER,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "deals",
  timestamps: false,
});

module.exports = Deal;
