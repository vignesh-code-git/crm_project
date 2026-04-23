const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Activity = sequelize.define("Activity", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  action_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  related_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "activities",
  timestamps: false,
});

module.exports = Activity;
