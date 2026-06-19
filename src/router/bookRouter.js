import express from "express";
import client from "../database/connection.js"
import { BookService } from "../services/bookService.js"
import { BookController } from "../controller/bookController.js";

const router = express.Router()

const database = client.db("myDatabase");

const bookService = new BookService(database);
const bookController = new BookController(bookService, database);


router.post('/submit', (req, res) => bookController.createPendingBook(req, res));
router.post('/approve/:pendingId', (req, res) => bookController.approveBook(req, res));

export default router;