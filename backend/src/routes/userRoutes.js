const { Router } = require("express");
const {
  getUsers,
  loginUser,
  registerUser,
  logoutUser,
  userProfile,
  requestPasswordReset,
  resetPassword,
  assignRoleToUser,
  deleteUser,
  editUser,
} = require("../controllers/userController");
const authenticateUser = require("../middlewares/authenticateUser");
const authorizeUser = require("../middlewares/authorizeUser");

const userRouter = Router();

userRouter.get("/", authenticateUser, authorizeUser(["admin"]), getUsers);
userRouter.delete("/delete-user/:id", deleteUser);
userRouter.post("/assign-role", assignRoleToUser);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", authenticateUser, logoutUser);
userRouter.get(
  "/profile",
  authenticateUser,
  authorizeUser(["admin", "user"]),
  userProfile
);
userRouter.post("/reset-password-request", requestPasswordReset);
userRouter.post("/reset-password/:userId/:token", resetPassword);
userRouter.put(
  "/edit-user/:id",
  authenticateUser,
  authorizeUser(["admin"]),
  editUser
);

module.exports = { userRouter };
