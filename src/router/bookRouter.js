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
router.get('/GetallPenBook', (req, res) => bookController.getAllPendingBooks(req, res));
router.get('/details/:bookId', bookController.getBookDetails.bind(bookController));
router.post('/wishlist', (req, res) => bookController.wishlistBook(req, res));
router.put('/update/:bookId', (req, res) => bookController.bookUpdate(req, res));
router.delete('/delete/:bookId', (req, res) => bookController.bookDelete(req, res));
router.get("/allBooksFAdim", (req, res) => bookController.getAllAdminBooks(req, res));
router.post("/controlBookAction/:bookId", (req, res) => bookController.controlBookAction(req, res));
router.get("/allApprovedBooks", (req, res) => bookController.getALlAprovedBooks(req, res));
router.get('/wishlist/:userEmail', (req, res) => bookController.getUserWishlist(req, res));
router.get('/librarian/books/:librarianEmail', (req, res) => bookController.getLibrarianBooks(req, res));
router.put('/librarian/books/status/:bookId', (req, res) => bookController.togglePublishStatus(req, res));
router.delete('/librarian/books/:bookId', (req, res) => bookController.deleteLibrarianBook(req, res));
router.post("/api/checkout/confirm", bookController.dataFromStripe.bind(bookController));
router.get("/allSalesData", (req, res) => bookController.getSalesData(req, res));
router.get("/bookIdgetEmail/:bookId", (req, res) => bookController.getLibrarianEmailByBookId(req, res))
router.post("/getSalesReport", (req, res) => bookController.getDelivaryReport(req, res))
router.get("/comments/:bookId", bookController.getBookComments);
router.post("/comments", bookController.postComment);
router.post("/getComments", bookController.GetComments);
router.put("/editComment/:commentId", bookController.editComment);
router.delete("/deleteComment/:commentId", bookController.deleteComment);
router.post("/getReadingList", bookController.getReadingList);
router.get("/allCategory", bookController.getBookCat)
router.get("/getAllBook", bookController.getBookAll)
export default router;