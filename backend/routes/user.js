import express from "express";
const router = express.Router();
import * as user from "../controllers/user.js";
import {
  authenticate,
  authorizeAdmin,
  superAdminAuth,
} from "../middlewares/middleware.js";

router.get("/", authenticate, superAdminAuth, user.getAllUsers);
router.put("/:id/as-admin", authenticate, superAdminAuth, user.makeUserAsAdmin);
router.get("/count", authenticate, authorizeAdmin, user.getUserCount);
router.post("/add-admin", authenticate, superAdminAuth, user.addAdminAccount);

router.post("/auth", user.login);
router.post("/logout", authenticate, user.logout);
router.post("/register", user.register);

router
  .route("/profile")
  .get(authenticate, user.getUserProfile)
  .put(authenticate, user.updateProfile);

router
  .route("/:id")
  .get(authenticate, authorizeAdmin, user.getUserById)
  .put(authenticate, authorizeAdmin, user.updateUserById)
  .delete(authenticate, authorizeAdmin, user.deleteUserByAdmin);

export default router;