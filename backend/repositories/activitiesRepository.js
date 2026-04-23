const { Activity, User } = require("../models");

async function createActivity(data) {
  return await Activity.create(data);
}

async function getActivities(relatedId, relatedType) {
  return await Activity.findAll({
    where: {
      related_id: relatedId,
      related_type: relatedType,
    },
    include: [
      {
        model: User,
        attributes: ["first_name", "last_name", "id"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

module.exports = {
  createActivity,
  getActivities,
};
