import { ObjectId } from "mongodb";
import Stripe from "stripe"
// import imagekit from '../services/imagekit.js'
import dotenv from "dotenv";
import { ImageKit } from "@imagekit/nodejs"; // 👈 এখান থেকে 'toFile' বাদ দিন, এটার প্রয়োজন নেই
import multer from "multer";

dotenv.config();

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  
});

const endpoint = (process.env.IMAGE_URL).replace(/\/$/, "");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || process.env.PRIVATE_KEY,
  urlEndpoint: endpoint
});

 



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export class BookController {
    constructor(bookService, database) {
        this.bookService = bookService;
        this.database = database;
    }
async createPendingBook(req, res) {

    try {

        const {
            title,
            author,
            category,
            fee,
            librarian,
            date,
            useremail,
            image,
        } = req.body || {};

        console.log("BODY:", req.body);

        // validation
        if (
            !title ||
            !author ||
            !librarian ||
            !image
        ) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }

        // create document
        const newPendingBook = {
            title,
            author,
            category,
            fee: Number(fee) || 0,
            librarian,
            image, // Uploadcare CDN URL
            date: date
                ? new Date(date)
                : new Date(),
            librarianEmail: useremail,
            status: "pending",
            processedAt: new Date(),
        };

        console.log(
            "Saving Document:",
            newPendingBook
        );

        // save to mongodb
        const result = await this.database
            .collection("pending_books")
            .insertOne(newPendingBook);

        return res.status(201).json({
            success: true,
            message:
                "Book submitted successfully",
            pendingId: result.insertedId,
            imageUrl: image,
        });

    } catch (error) {

        console.error(
            "Create Pending Book Error:",
            error
        );

        return res.status(500).json({
            error:
                "Internal server error",
            details: error?.message,
        });
    }
}
    async getAllPendingBooks(req, res) {
        console.log("getALl book")
        try {
            const books = await this.database.collection("pending_books").find().toArray();
            return res.status(200).json(books);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to retrieve books' });
        }
    }
async getALlAprovedBooks(req, res) {
  try {
    const {
      search = "",
      category = "",
      minFee,
      maxFee,
      sortBy = "newest",
      page = 1,
      limit = 8
    } = req.query;

    const andConditions = [];

    andConditions.push({
      $or: [
        { status: "approved" },
        { displayStatus: "approved" },
        { status: "Published" },
        { displayStatus: "publish" }
      ]
    });

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      andConditions.push({
        $or: [{ title: searchRegex }, { author: searchRegex }]
      });
    }

    if (category && category !== "All") {
      andConditions.push({
        category: { $regex: new RegExp(`^${category}$`, "i") }
      });
    }

    if (minFee || maxFee) {
      const feeCondition = {};
      if (minFee) feeCondition.$gte = Number(minFee);
      if (maxFee) feeCondition.$lte = Number(maxFee);
      andConditions.push({ fee: feeCondition });
    }

    const query = andConditions.length ? { $and: andConditions } : {};

    // ─── Sort mapping ───
    const sortMap = {
      newest: { date: -1 },
      oldest: { date: 1 },
      price_low_high: { fee: 1 },
      price_high_low: { fee: -1 },
      name_a_z: { title: 1 },
      name_z_a: { title: -1 },
    };
    const sortOption = sortMap[sortBy] || sortMap.newest;

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const totalBooks = await this.database.collection("books").countDocuments(query);
    const books = await this.database.collection("books")
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .toArray();

    return res.status(200).json({
      books,
      pagination: {
        totalItems: totalBooks,
        totalPages: Math.ceil(totalBooks / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber
      }
    });

  } catch (error) {
    console.error("Error in getALlAprovedBooks:", error);
    return res.status(500).json({ error: 'Failed to retrieve books' });
  }
}

    async approveBook(req, res) {
        try {
            console.log("user", req.user)
            // if (req.user?.role !== "admin") {
            //     return res.status(403).json({ error: "Access denied. Admins only." });
            // }

            const { pendingId } = req.params;
            console.log("pendingId", pendingId)
            const action = req.body.status
            console.log("action", action)

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
    wishlistBook = async (req, res) => {
    try {
      
        const { bookId, userEmail } = req.body;

        if (!bookId || !userEmail) {
            return res.status(400).json({ error: "Missing bookId or userEmail" });
        }

         
        const existingWish = await this.database
            .collection("wishlist")
            .findOne({ userEmail, bookId });

        if (existingWish) {
          
            await this.database
                .collection("wishlist")
                .deleteOne({ userEmail, bookId });

            return res.status(200).json({ 
                success: true, 
                message: "Removed from wishlist", 
                isWishlisted: false 
            });
        } else {
           
            const newWishlistObj = {
                userEmail,
                bookId,
                addedAt: new Date()  
            };

            await this.database
                .collection("wishlist")
                .insertOne(newWishlistObj);

            return res.status(201).json({ 
                success: true, 
                message: "Added to wishlist", 
                isWishlisted: true 
            });
        }

    } catch (error) {
        console.error("Wishlist Error:", error);
        return res.status(500).json({ error: "Failed to process wishlist request" });
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
        const { currentStatus } = req.body; // ফ্রন্টএন্ড থেকে পাঠানো স্ট্যাটাস
        const id = new ObjectId(bookId);

       
        let collectionName = "books"; // ডিফল্ট কালেকশন

        if (currentStatus === "Pending Approval") {
            collectionName = "pending_books";
        } else if (currentStatus === "Rejected") {
            collectionName = "rejected_books";
        }

        console.log(`Deleting book from collection: ${collectionName} with ID: ${bookId}`);

        // সঠিক কালেকশন থেকে ডিলিট করা হচ্ছে
        const result = await this.database
            .collection(collectionName)
            .deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Book not found in this collection" });
        }

        return res.status(200).json({ message: `Book deleted successfully from ${collectionName}` });
    } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Failed to delete book" });
    }
}
getBookDetails = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log("booksId received:", bookId);
        
        // এখন 'this.database' নিখুঁতভাবে কাজ করবে
        const book = await this.database
            .collection("books")
            .findOne({ _id: new ObjectId(bookId) });
            
        console.log("Found book:", book);
        
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }
        return res.status(200).json(book);
    } catch (error) {
        console.error("Backend Error Details:", error); // আসল এররটি কনসোলে দেখার জন্য
        return res.status(500).json({ error: "Failed to retrieve book details" });
    }
}
    async getAllAdminBooks(req, res) {
    try {
        const pendingBooks = await this.database.collection("pending_books").find({}).toArray();
        const activeBooks = await this.database.collection("books").find({}).toArray();
        const rejectedBooks = await this.database.collection("rejected_books").find({}).toArray();

        const formattedPending = pendingBooks.map(b => ({ ...b, displayStatus: "Pending Approval" }));
        const formattedActive = activeBooks.map(b => ({ ...b, displayStatus: b.status || "Published" })); 
        const formattedRejected = rejectedBooks.map(b => ({ ...b, displayStatus: "Rejected" }));
        const allBooks = [...formattedPending, ...formattedActive, ...formattedRejected];

        return res.status(200).json(allBooks);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch admin dashboard data" });
    }
}
async controlBookAction(req, res) {
    console.log("controlBookAction hit");
    try {
        const { bookId } = req.params;
        const { currentStatus, action } = req.body; 
        console.log("Processing Request:", bookId, currentStatus, action);
        
        const id = new ObjectId(bookId);

      
        if (currentStatus === "pending" || currentStatus === "Pending Approval") {
            const pendingBook = await this.database.collection("pending_books").findOne({ _id: id });
            if (!pendingBook) {
                return res.status(404).json({ error: "Book not found in pending_books collection" });
            }
            delete pendingBook._id; 

            if (action === "approved") {
                pendingBook.status = "approved";
                pendingBook.displayStatus = "approved";
                await this.database.collection("books").insertOne(pendingBook);
            } else if (action === "rejected") {
                pendingBook.status = "rejected";
                pendingBook.displayStatus = "rejected";
                // রিজেক্টেড কালেকশনে পাঠানো হচ্ছে
                await this.database.collection("rejected_books").insertOne(pendingBook);
            }

            // 🗑️ পেন্ডিং কালেকশন থেকে ডেটা ১০০০% ডিলিট করে দেওয়া হলো
            await this.database.collection("pending_books").deleteOne({ _id: id });
            return res.status(200).json({ message: `Book ${action} and removed from pending queue successfully.` });
        }

        // ========================================================
        // ২. মেইন বুকস কন্ট্রোল লজিক (approved / unpublish)
        // ========================================================
        if (
            currentStatus === "approved" || 
            currentStatus === "unpublish" || 
            currentStatus === "Published" || 
            currentStatus === "Unpublished"
        ) {
            let newStatus = "approved";
            
            if (action === "unpublish") {
                newStatus = "unpublish"; // আনপাবলিশ করলে স্ট্যাটাস 'unpublish' হবে
            } else if (action === "publish") {
                newStatus = "approved"; // পুনরায় পাবলিশ করলে 'approved' হবে
            }

            // ⚠️ এখানে ডেটা ডিলিট হবে না, শুধু মেইন 'books' কালেকশনের ভেতর স্ট্যাটাস আপডেট হবে
            const updateResult = await this.database.collection("books").updateOne(
                { _id: id },
                { $set: { status: newStatus, displayStatus: newStatus } }
            );

            if (updateResult.matchedCount === 0) {
                return res.status(404).json({ error: "Book not found in main books collection" });
            }

            return res.status(200).json({ message: `Book status successfully changed to ${newStatus}` });
        }

        return res.status(400).json({ error: `Invalid configuration for status: ${currentStatus}` });

    } catch (error) {
        console.error("Error inside controlBookAction:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
getUserWishlist = async (req, res) => {
    try {
        const { userEmail } = req.params;

        const wishlist = await this.database
            .collection("wishlist")
            .aggregate([
                {
                    $match: { userEmail }
                },
                {
                    $addFields: {
                        bookObjectId: {
                            $toObjectId: "$bookId"
                        }
                    }
                },
                {
                    $lookup: {
                        from: "books",
                        localField: "bookObjectId",
                        foreignField: "_id",
                        as: "book"
                    }
                },
                {
                    $unwind: "$book"
                },
                {
                    $project: {
                        _id: 1,
                        userEmail: 1,
                        addedAt: 1,
                        book: 1
                    }
                }
            ])
            .toArray();

        return res.status(200).json({
            wishlist,
        });

    } catch (error) {
        console.error("Get Wishlist Error:", error);
        return res.status(500).json({ error: "Failed to fetch wishlist items" });
    }
};
getLibrarianBooks = async (req, res) => {
  try {
    const { librarianEmail } = req.params;

    const approvedBooks = await this.database
      .collection("books")
      .find({ librarianEmail })
      .toArray();

    const pendingBooks = await this.database
      .collection("pending_books")
      .find({ librarian: librarianEmail })
      .toArray();

    const allBooks = [
      ...approvedBooks.map((b) => ({
        ...b,
        displayStatus: b.status || "Published",
      })),
      ...pendingBooks.map((b) => ({
        ...b,
        displayStatus: "Pending Approval",
      })),
    ];

    return res.status(200).json(allBooks);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

togglePublishStatus = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { currentStatus } = req.body; // ফ্রন্টএন্ড থেকে পাঠানো হবে

        const id = new ObjectId(bookId);
        const newStatus = currentStatus === "Published" ? "Unpublished" : "Published";

        const result = await this.database.collection("books").updateOne(
            { _id: id },
            { $set: { status: newStatus } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Active book not found to change status" });
        }

        return res.status(200).json({ message: `Book is now ${newStatus}`, newStatus });
    } catch (error) {
        return res.status(500).json({ error: "Status update failed" });
    }
}

 
deleteLibrarianBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const id = new ObjectId(bookId);
        let deleteResult = await this.database.collection("books").deleteOne({ _id: id });
        
        if (deleteResult.deletedCount === 0) {
            deleteResult = await this.database.collection("pending_books").deleteOne({ _id: id });
        }
        return res.status(200).json({ message: "Book removed from inventory successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Delete operation failed" });
    }
}
dataFromStripe = async (req, res) => {
    try {
        const { sessionId, userEmail } = req.body;
        console.log("sessionId", sessionId)

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log("session", session)

        if (session.payment_status !== "paid") {
            return res.status(400).json({ error: "Payment was not completed successfully." });
        }


        const existingSale = await this.database.collection("sales").findOne({ paymentId: session.id });
        if (existingSale) {
            return res.status(200).json({ message: "Sale already recorded", sale: existingSale });
        }

        console.log("data", session.metadata.bookId, session.metadata.userEmail, session.amount_total)

        const newSale = {
            paymentId: session.id,
            bookId: session.metadata.bookId,
            transaction_id: session.payment_intent,
            userEmail: session.metadata.userEmail,
            librarianEmail:session.metadata. librarianEmail,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: "pending",
            createdAt: new Date(),
        };

        console.log("newSale", newSale)
        const data = await  this.database.collection("sales").insertOne(newSale);
        console.log("data", data)

        return res.status(201).json({ message: "Payment verified & book checkout recorded!", sale: newSale });
    } catch (error) {
        console.error("Database Save Error:", error);
        return res.status(500).json({ error: "Failed to record book sale in database" });
    }
}
getLibrarianSales = async (req, res) => {
    try {
        const salesLedger = await this.database
            .collection("sales")
            .find()
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json(salesLedger);
    } catch (error) {
        console.error("Librarian Fetch Error:", error);
        return res.status(500).json({ error: "Failed to fetch sales ledger from database" });
    }
};

getSalesData = async (req,res) => {
    try {
        const salesLedger = await this.database
            .collection("sales")
            .find()
            .sort({ createdAt: -1 })
            .toArray();
            const totalData = salesLedger.length

        return res.status(200).json({
            salesLedger,
            totalData
        });
    } catch (error) {
        console.error("Librarian Fetch Error:", error);
        return res.status(500).json({ error: "Failed to fetch sales ledger from database" });
    }
}
async getLibrarianEmailByBookId(req, res) {
    console.log("id Get Hit")
    try {
        const { bookId } = req.params;
        const id = new ObjectId(bookId);
        console.log("id",id)
        
        const book = await this.database.collection("books").findOne({ _id: id });
     
        if (!book) {
            return res.status(404).json({ error: "Book not found in the database" });
        }

        
        const email = book.librarianEmail 

        if (!email) {
            return res.status(404).json({ error: "Librarian email not associated with this book" });
        }

        return res.status(200).json({ librarianEmail: email });

    } catch (error) {
        console.error("Error fetching librarian email:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
async getDelivaryReport(req, res) {
    try {
        const { email } = req.body;
        console.log("email", email);

        const books = await this.database.collection("sales").find({ librarianEmail: email }).toArray();
        if (!books || books.length === 0) {
            return res.status(404).json({ error: "No delivery reports found for this email" });
        }

        return res.status(200).json({
            success: true,
            salesReport: books
        });

    } catch (error) {
        console.error("Error fetching delivery report:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

postComment = async (req, res) => {
  try {
    const { bookId, userEmail, userName, text, librarianEmail } = req.body;

    if (!text || !bookId) {
      return res.status(400).json({ error: "Comment text and Book ID are required" });
    }

    const book = await this.database.collection("books").findOne({ _id: new ObjectId(bookId) });
    console.log("book", book)
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const newComment = {
      bookId,
      librarianEmail, 
      userEmail,
      userName: userName || "Anonymous",
      text,
      createdAt: new Date()
    };

    await this.database.collection("comments").insertOne(newComment);
    return res.status(201).json({ success: true, message: "Comment posted!" });
  } catch (error) {
    console.error("Error in postComment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

getBookComments = async (req, res) => {
  try {
    const { bookId } = req.params;
    const comments = await this.database
      .collection("comments")
      .find({ bookId: bookId })
      .sort({ createdAt: -1 })  
      .toArray();

    return res.status(200).json(comments);
  } catch (error) {
    console.error("Error in getBookComments:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
GetComments = async (req, res) => {
  try {
    const { useremail } = req.body;
    console.log("userEmail",useremail)

    const userComment = await this.database.collection("comments").find({ userEmail:  useremail }).toArray();
    console.log("book", userComment)

    return res.status(201).json({ success: true, message:  userComment });
  } catch (error) {
    console.error("Error in postComment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userEmail, text } = req.body; 

    if (!text) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    const result = await this.database.collection("comments").updateOne(
      { _id: new ObjectId(commentId), userEmail: userEmail },  
      { 
        $set: { 
          text: text,
          updatedAt: new Date()  
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Comment not found or unauthorized action" });
    }

    return res.status(200).json({ success: true, message: "Comment updated successfully!" });
  } catch (error) {
    console.error("Error in editComment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

 
deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userEmail } = req.body; 

    const result = await this.database.collection("comments").deleteOne({
      _id: new ObjectId(commentId),
      userEmail: userEmail
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Comment not found or unauthorized action" });
    }

    return res.status(200).json({ success: true, message: "Comment deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteComment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

getReadingList = async(req,res) => {
    const {email} = req.body
    console.log("email",email)
    const data = await this.database.collection("sales").find({ userEmail: email }).toArray();
    console.log("data",data)
    return res.status(201).json({ success: true, message: data });
}
getBookCat = async (req, res) => {
  try {
    const categories = await this.database
      .collection("books")
      .distinct("category");

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};
getBookAll = async (req, res) => {
    try {
        // Filter: Only find documents where displayStatus is "publish"
        const publishedBooks = await this.database
            .collection("books")
            .find({ displayStatus: "publish" }) 
            .toArray();

        // Check if any published books exist
        if (!publishedBooks || publishedBooks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No published books found."
            });
        }

        // Return only the published books
        return res.status(200).json({
            success: true,
            count: publishedBooks.length,
            data: publishedBooks
        });

    } catch (error) {
        console.error("Error retrieving published books:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching books."
        });
    }
}
getTransactionId = async (req,res) => {
   const transactions = await this.database.collection("sales")
    .find(
        { status: "completed" },
        {
            projection: {
                _id: 0,
                transaction_id: 1
            }
        }
    )
    .toArray();
 return res.status(200).json({
      success: true,
            data: transactions,
          
 })
console.log(transactions);
};
 salesvaryfiy= async (req, res) => {
    try {
        const { bookId, email } = req.query;
        if (!bookId || !email) return res.status(400).json({ error: "Missing parameters" });

        const purchase = await db.collection("sales").findOne({
            bookId: bookId,
            userEmail: email,
            status: "completed"
        });

        if (!purchase) {
            return res.status(404).json({ message: "No completed purchase found" });
        }

        return res.status(200).json(purchase);
    } catch (error) {
        return res.status(500).json({ error: "Verification processing failed" });
    }
};

}


 
//delivary user comment
 
//pending book