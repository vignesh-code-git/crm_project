const repo = require("../repositories/activitiesRepository");

exports.getActivities = async (req, res) => {
  try {
    const { related_id, related_type } = req.query;
    if (!related_id || !related_type) {
      return res.status(400).json({ error: "related_id and related_type are required" });
    }

    const activities = await repo.getActivities(Number(related_id), related_type);
    res.json(activities);
  } catch (err) {
    console.error("FETCH ACTIVITIES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const activity = await repo.createActivity({
        ...req.body,
        user_id: req.user.id
    });
    res.status(201).json(activity);
  } catch (err) {
    console.error("CREATE ACTIVITY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
