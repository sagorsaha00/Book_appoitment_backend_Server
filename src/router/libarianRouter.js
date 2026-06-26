import express from "express";
import client from "../database/connection.js"
import { LibrarianOrderController } from "../controller/librarianOrderController.js";

const router = express.Router()

const database = client.db("myDatabase");
const libarianController = new LibrarianOrderController(database);


router.patch("/orders/:orderId/approve", libarianController.approveOrder.bind(libarianController));
router.patch("/orders/:orderId/dispatch", libarianController.dispatchOrder.bind(libarianController));
router.patch("/orders/:orderId/complete", libarianController.completeOrder.bind(libarianController));


export default router;








