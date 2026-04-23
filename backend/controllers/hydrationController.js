const models = require("../models");

/**
 * Hydration Controller
 * Fetches real details for a specific entity type and ID to "hydrate" 
 * components that only have skeleton info (like notifications).
 */
exports.hydrateEntity = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!type || !id) {
      return res.status(400).json({ error: "Type and ID are required" });
    }

    // Mapping of entity_type to Model name
    const modelMap = {
      leads: "Lead",
      deals: "Deal",
      companies: "Company",
      tickets: "Ticket",
      emails: "Email",
      calls: "Call",
      notes: "Note",
      tasks: "Task",
      meetings: "Meeting",
    };

    const modelName = modelMap[type.toLowerCase()];
    if (!modelName || !models[modelName]) {
      return res.status(404).json({ error: `Entity type '${type}' not supported for hydration.` });
    }

    const Model = models[modelName];
    const record = await Model.findByPk(id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Return the record as a clean JSON object
    res.json(record.toJSON());

  } catch (err) {
    console.error("HYDRATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
