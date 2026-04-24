const repo = require("../repositories/usersRepository");
const notifRepo = require("../repositories/notificationsRepository");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/jwtService");

// REGISTER
async function registerUser(req, res) {
  try {
    const data = req.body;

    const hashedPassword = await hashPassword(data.password);

    const ADMIN_EMAIL = "admin@gmail.com";
    const email = data.email.trim().toLowerCase();

    let role_id = 2; // user

    if (email === ADMIN_EMAIL) {
      role_id = 1; // admin
    }

    const user = await repo.createUser({
      ...data,
      password: hashedPassword,
      role_id,
    });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user.id,
      type: "success",
      message: `Welcome to the CRM, ${user.first_name}! Your account has been created successfully.`,
      metadata: { 
        actor_name: `${user.first_name || ""} ${user.last_name || ""}`.trim()
      }
    });

    res.json(user);

  } catch (err) {
    console.error("REGISTER ERROR ❌", err);
    res.status(500).json({ error: "Register failed" });
  }
}

// LOGIN
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await repo.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   sameSite: "lax",
    // });

    res.cookie("token", token, {
  httpOnly: true,
  secure: true,       // 🔥 REQUIRED for HTTPS
  sameSite: "None",   // 🔥 REQUIRED for cross-origin
});

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user.id,
      type: "info",
      message: `Login successful. Welcome back, ${user.first_name}!`,
      metadata: { 
        actor_name: `${user.first_name || ""} ${user.last_name || ""}`.trim()
      }
    });

    res.json({
      message: "Login success",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        company_name: user.company_name,
        industry_type: user.industry_type,
        country: user.country,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR ❌", err);
    res.status(500).json({ error: "Login failed" });
  }
}

// PROFILE
async function getProfile(req, res) {
  try {
    const user = await repo.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// UPDATE PROFILE
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const data = { ...req.body };

    // 🔥 SECURITY: Check if password change is requested
    if (data.password && data.password.trim() !== "") {
      data.password = await hashPassword(data.password);
    } else {
      // Don't overwrite password with empty string
      delete data.password;
    }

    const updatedUser = await repo.updateUser(userId, data);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR ❌", err);
    res.status(500).json({ error: "Update failed" });
  }
}

// DELETE ACCOUNT
async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    const success = await repo.deleteUser(userId);
    
    if (success) {
      res.clearCookie("token");
      res.json({ message: "Account deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR ❌", err);
    res.status(500).json({ error: "Deletion failed" });
  }
}

// GET USERS
async function getUsers(req, res) {
  const users = await repo.getUsers();
  res.json(users);
}

// UPDATE USER (ADMIN)
async function updateUserAdmin(req, res) {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // 🔥 SECURITY: Check if password change is requested
    if (data.password && data.password.trim() !== "") {
      data.password = await hashPassword(data.password);
    } else {
      delete data.password;
    }

    // 🔥 Map role name to role_id
    if (data.role) {
      data.role_id = data.role.toLowerCase() === "admin" ? 1 : 2;
    }

    const updatedUser = await repo.updateUser(id, data);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("ADMIN UPDATE USER ERROR ❌", err);
    res.status(500).json({ error: "Update failed" });
  }
}

// DELETE USER (ADMIN)
async function deleteUserAdmin(req, res) {
  try {
    const { id } = req.params;
    const success = await repo.deleteUser(id);
    
    if (success) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("ADMIN DELETE USER ERROR ❌", err);
    res.status(500).json({ error: "Deletion failed" });
  }
}

// BULK CREATE USERS (ADMIN)
async function bulkCreateUsers(req, res) {
  try {
    const users = req.body;
    if (!Array.isArray(users)) return res.status(400).json({ error: "Invalid data format" });

    const results = [];
    for (const u of users) {
      try {
        const hashedPassword = await hashPassword(u.password || "User@123");
        const role_id = u.role?.toLowerCase() === "admin" ? 1 : 2;
        
        const newUser = await repo.createUser({
          ...u,
          password: hashedPassword,
          role_id
        });
        results.push(newUser);
      } catch (err) {
        console.error("Single user import failed:", err);
      }
    }
    res.json(results);
  } catch (err) {
    console.error("BULK CREATE USERS ERROR ❌", err);
    res.status(500).json({ error: "Bulk creation failed" });
  }
}

// BULK DELETE USERS (ADMIN)
async function bulkDeleteUsers(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "Invalid data format" });

    let deletedCount = 0;
    for (const id of ids) {
      try {
        const success = await repo.deleteUser(id);
        if (success) deletedCount++;
      } catch (err) {
        console.error(`Failed to delete user ${id}:`, err);
      }
    }
    res.json({ message: `${deletedCount} users deleted successfully` });
  } catch (err) {
    console.error("BULK DELETE USERS ERROR ❌", err);
    res.status(500).json({ error: "Bulk deletion failed" });
  }
}

// LOGOUT
async function logoutUser(req, res) {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  getUsers,
  logoutUser,
  updateProfile,
  deleteAccount,
  updateUserAdmin,
  deleteUserAdmin,
  bulkCreateUsers,
  bulkDeleteUsers,
};