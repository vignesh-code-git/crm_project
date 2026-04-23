const { User, Role } = require("../models");

// CREATE USER
async function createUser(data) {
  const user = await User.create({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    company_name: data.company_name,
    industry_type: data.industry_type,
    country: data.country,
    role_id: data.role_id || 2, // default user
  });

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
  };
}

// GET USER BY EMAIL
async function getUserByEmail(email) {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, attributes: ["name"] }],
  });

  if (!user) return null;

  const userData = user.toJSON();
  userData.role = userData.Role ? userData.Role.name : null;
  delete userData.Role;
  return userData;
}

// GET USER BY ID
async function getUserById(id) {
  const user = await User.findByPk(id, {
    attributes: ["id", "first_name", "last_name", "email", "phone", "company_name", "industry_type", "country"],
    include: [{ model: Role, attributes: ["name"] }],
  });

  if (!user) return null;

  const userData = user.toJSON();
  userData.role = userData.Role ? userData.Role.name : null;
  delete userData.Role;
  return userData;
}

// GET ALL USERS
async function getUsers() {
  const users = await User.findAll({
    attributes: ["id", "first_name", "last_name", "email", "phone", "company_name", "industry_type", "country"],
    include: [{ model: Role, attributes: ["name"] }],
    order: [["id", "DESC"]],
  });

  return users.map((u) => {
    const userData = u.toJSON();
    userData.role = userData.Role ? userData.Role.name : null;
    delete userData.Role;
    return userData;
  });
}

// UPDATE USER
async function updateUser(id, data) {
  const [updatedCount] = await User.update({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    company_name: data.company_name,
    industry_type: data.industry_type,
    country: data.country,
    password: data.password, // Passed as hashed or ignored if null
  }, {
    where: { id }
  });

  if (updatedCount === 0) return null;
  return await getUserById(id);
}

// DELETE USER
async function deleteUser(id) {
  const deletedCount = await User.destroy({
    where: { id }
  });
  return deletedCount > 0;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
};