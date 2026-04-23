const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Call = sequelize.define("Call", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  connected_to: {
    type: DataTypes.STRING(255),
  },
  call_outcome: {
    type: DataTypes.STRING(255),
  },
  call_date: {
    type: DataTypes.DATEONLY,
  },
  call_time: {
    type: DataTypes.TIME,
  },
  duration: {
    type: DataTypes.STRING(50),
  },
  note: {
    type: DataTypes.TEXT,
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
  },
  related_id: {
    type: DataTypes.INTEGER,
  },
  related_type: {
    type: DataTypes.ENUM('leads', 'companies', 'deals', 'tickets'),
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "calls",
  timestamps: false,
});

module.exports = Call;
