const repo = require("../repositories/searchRepository");

/**
 * Handle Global Search Request
 */
exports.search = async (req, res) => {
  const { q } = req.query;
  const userId = req.user.id;
  const role = req.user.role;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const results = await repo.globalSearch(q, userId, role);
  res.json(results);
};
