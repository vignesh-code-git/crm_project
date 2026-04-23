const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Meeting = sequelize.define("Meeting", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
  },
  start_time: {
    type: DataTypes.TIME,
  },
  end_time: {
    type: DataTypes.TIME,
  },
  location: {
    type: DataTypes.STRING(150),
  },
  reminder: {
    type: DataTypes.STRING(100),
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
  note: {
    type: DataTypes.TEXT,
  },
  attendee_ids: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
  },
  attendees_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  attendee_names: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "meetings",
  timestamps: false,
});

module.exports = Meeting;
