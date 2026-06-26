import { ObjectId } from "mongodb";
export class BookService {
    constructor(database) {
        this.database = database;
    }
    async movePendingToApproved(pendingId, action) {
        const id = new ObjectId(pendingId);
        console.log(`Processing pending book with ID: ${id}. Action: ${action}`);

        const pendingBook = await this.database
            .collection("pending_books")
            .findOne({ _id: id });

        console.log("Pending Book:", pendingBook);

        if (!pendingBook) {
            return { success: false, reason: "Pending book not found" };
        }

        delete pendingBook._id;
        pendingBook.status = action;
        pendingBook.processedAt = new Date();


        if (action === "approved") {
            await this.database
                .collection("books")
                .insertOne(pendingBook);
                console.log("Book Inserted")
        } else if (action === "rejected") {
            await this.database
                .collection("rejected_books")
                .insertOne(pendingBook);
        } else {
            return { success: false, reason: "Invalid action type" };
        }


        await this.database
            .collection("pending_books")
            .deleteOne({ _id: id });
          console.log("Pending Book Deleted")
        return { success: true };
    }
   
   
}