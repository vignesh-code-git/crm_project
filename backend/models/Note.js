const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Note = sequelize.define("Note", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
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
  tableName: "notes",
  timestamps: false,
});

module.exports = Note;
