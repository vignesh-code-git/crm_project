const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// PASSWORD
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role, // 🔥 IMPORTANT
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};