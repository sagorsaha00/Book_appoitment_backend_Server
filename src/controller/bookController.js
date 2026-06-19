import { ObjectId } from "mongodb";
export class BookController {
    constructor(bookService, database) {
        this.bookService = bookService;
        this.database = database;
    }
    async createPendingBook(req, res) {
        try {

            const { title, author, category, fee, librarian, date } = req.body;

            const newPendingBook = {
                title,
                author,
                category,
                fee,
                librarian,
                date: date || new Date(),
                status: "pending"
            }


            const result = await this.database
                .collection("pending_books")
                .insertOne(newPendingBook);

            return res.status(201).json({
                message: 'Book submitted for admin approval',
                pendingId: result.insertedId
            });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to submit book' });
        }
    }

    async approveBook(req, res) {
        try {
            console.log("user", req.user)
            // if (req.user?.role !== "admin") {
            //     return res.status(403).json({ error: "Access denied. Admins only." });
            // }

            const { pendingId } = req.params;
            const action = req.body.status
            console.log("action", action)
            console.log("Approving book with pending ID:", pendingId);
            console.log("params", req.params)

            const result = await this.bookService.movePendingToApproved(pendingId, action);

            if (!result.success) {
                return res.status(404).json({ error: result.reason });
            }

            return res.status(200).json({ message: `Book ${action} successfully` });

        } catch (error) {
            console.error("Approval error:", error);
            return res.status(500).json({ error: "Failed to process approval" });
        }
    }
    async wishlistBook(req, res) {
        try {
            const { userId, bookId } = req.body;
            const wishlistEntry = {
                userId,
                bookId,
                addedAt: new Date()
            };
            const result = await this.database
                .collection("wishlist")
                .insertOne(wishlistEntry);
            return res.status(201).json({ message: "Book added to wishlist" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to add book to wishlist" });
        }
    }
    async bookUpdate(req, res) {
        try {
            const { bookId } = req.params;
            const { title, author, description } = req.body;
            const result = await this.database
                .collection("books")
                .updateOne(
                    { _id: new ObjectId(bookId) },
                    { $set: { title, author, description } }
                );
            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: "Book not found" });
            }
            return res.status(200).json({ message: "Book updated successfully" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to update book" });
        }
    }
    async bookDelete(req, res) {
        try {
            const { bookId } = req.params;
            const result = await this.database
                .collection("books")
                .deleteOne({ _id: new ObjectId(bookId) });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Book not found" });
            }
            return res.status(200).json({ message: "Book deleted successfully" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to delete book" });
        }
    }
    async getBookDetails(req, res) {
        try {
            const { bookId } = req.params;
            const book = await this.database
                .collection("books")
                .findOne({ _id: new ObjectId(bookId) });
            if (!book) {
                return res.status(404).json({ error: "Book not found" });
            }
            return res.status(200).json(book);
        } catch (error) {
            return res.status(500).json({ error: "Failed to retrieve book details" });
        }
    }
    
}


 
//delivary user comment
 
//pending book