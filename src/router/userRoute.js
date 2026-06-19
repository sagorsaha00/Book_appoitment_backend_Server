import express from "express";
import client from "../database/connection.js"
import { UserService } from "../services/user.js"
import { UserController } from "../controller/user.js";

const router = express.Router()

const database = client.db("myDatabase");

const userService = new UserService(database);
const userController = new UserController(userService, database);


router.post("/createUser", userController.createUser.bind(userController));
router.post("/loginUser", userController.loginUser.bind(userController));
router.get("/getAllUsers", userController.getAllUsers.bind(userController));
router.delete("/deleteUser/:userId", userController.deleteUser.bind(userController));
router.put("/updateUserRole/:userId", userController.updateUserRole.bind(userController));
export default router;








