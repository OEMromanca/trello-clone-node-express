const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserModel = require("../models/UserModel");
const { secretKey } = require("../config/config");
const sendEmail = require("../utils/sendEmail");

async function getUsers(_, res) {
  try {
    const users = await UserModel.find().populate("labels").populate("todos");

    res.json(users);
  } catch (error) {
    console.error(error);
    const response = {
      message: "Error while fetching users.",
    };
    res.status(500).json(response);
  }
}

async function deleteUser(req, res) {
  const userId = req.params.id;

  try {
    const user = await UserModel.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ message: `User '${user.email}' deleted successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function registerUser(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newUser = new UserModel({
      firstName,
      lastName,
      email,
      password,
    });

    await newUser.save();

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while registering user" });
  }
}

async function loginUser(req, res) {
  try {
    const user = await UserModel.findByCredentials(
      req.body.email,
      req.body.password
    );

    await user.generateAuthToken();

    res.status(200).send({ user });
  } catch (err) {
    res.status(404).send({ error: "Invalid credentials" });
  }
}

async function logoutUser(req, res) {
  try {
    console.log("> Logout attempt");

    const authorizationHeader = req.header("Authorization");
    if (!authorizationHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authorizationHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, secretKey);

    const user = await UserModel.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error("UnauthorizedUserDetected!");
    }

    console.log("User found:", user);

    req.user = user;
    req.token = token;
    await req.user.save();

    console.log("> Logout successful");
    res.send();
  } catch (err) {
    console.error("> Logout failed");
    console.error(err);
    res.status(401).send({ error: "Please authenticate" });
  }
}

async function userProfile(req, res) {
  console.log(">myProfile");
  try {
    const user = await UserModel.findOne({
      _id: req.user._id,
      "tokens.token": req.token,
    });

    if (!user) {
      return res.status(404).send();
    }

    res.status(200).send(user);
    console.log(user);
  } catch (error) {
    res.status(400).send(error);
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(400).send("User with given email doesn't exist");

    const token = crypto.randomBytes(32).toString("hex");
    //fake link will be updated /// TODO
    const link = `https://en.wikipedia.org/wiki/Opal/${user._id}/${token}`;

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    user.resetPasswordLink = link;

    await user.save();
    await sendEmail(user.email, "Password reset", link);

    res.send("Password reset link sent to your email account");
  } catch (error) {
    res.send("An error occurred");
    console.log(error);
  }
}

async function resetPassword(req, res) {
  try {
    const { userId, token } = req.params;
    const { password } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) return res.status(400).send("Invalid link or expired (user)");

    if (user.resetPasswordToken !== token)
      return res.status(400).send("Invalid link or expired (token)");

    if (Date.now() > user.resetPasswordExpires)
      return res.status(400).send("Invalid link or expired (time)");

    if (user) {
      user.password = password;
      delete user.resetPasswordToken;
      user.resetPasswordExpires = null;
    }

    await user.save();

    res.send("Password reset successfully.");
  } catch (error) {
    res.send("An error occurred");
    console.log(error);
  }
}

async function assignRoleToUser(req, res) {
  const { userId, role } = req.body;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.roles && user.roles.includes(role)) {
      return res.status(400).json({ error: "User already has this role" });
    }

    user.roles = role;

    await user.save();

    res.status(200).json({ message: `Role '${role}' assigned to user` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function editUser(req, res) {
  const userId = req.params.id;
  const { firstName, lastName, email } = req.body;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;

    await user.save();

    res
      .status(200)
      .json({ message: `User '${user.email}' updated successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getUsers,
  registerUser,
  loginUser,
  logoutUser,
  userProfile,
  requestPasswordReset,
  resetPassword,
  assignRoleToUser,
  deleteUser,
  editUser,
};
