import { ObjectId } from "mongodb";
export class UserService {
    constructor(database) {
        this.database = database;
    }

    async createuser(userData) {
        // 🛠️ Fixed typo: Changed "cosnole" to "console"
        const result = await this.database
            .collection("users")
            .insertOne(userData);

        console.log("DB Insert Result:", result);

        // ⚡ Instead of returning just the insert confirmation receipt, 
        // we return the complete user object including the freshly generated mongo _id
        return {
            _id: result.insertedId,
            ...userData
        };
    }
    async loginuser(email, password) {
        const user = await this.database
            .collection("users")
            .findOne({ email, password });
        return user;
    }
    async getAllUsers() {
        const users = await this.database
            .collection("users")
            .find()
            .toArray();
        return users;
    }

    async deleteuser(userId) {
        const id = new ObjectId(userId.trim());
        const result = await this.database
            .collection("users")
            .deleteOne({ _id: id });
        return result;
    }
    async updateuserrole(userId, newRole) {
        const id = new ObjectId(userId.trim());
        const result = await this.database
            .collection("users")
            .updateOne({ _id: id }, { $set: { role: newRole } });
        return result;
    }
    async bookread(userId, bookId) {
        const id = new ObjectId(userId.trim());
        const bookObjectId = new ObjectId(bookId.trim());
        const result = await this.database
            .collection("readBook")
            .insertOne({ userId: id, bookId: bookObjectId, readAt: new Date() });
        return result;
    }
    async wishlistBook(userId, bookId) {
        const id = new ObjectId(userId.trim());
        const bookObjectId = new ObjectId(bookId.trim());
        const result = await this.database
            .collection("wishlist")
            .insertOne({ userId: id, bookId: bookObjectId, addedAt: new Date() });
        return result;
    }
    async removefromwishlist(userId, bookId) {
        const id = new ObjectId(userId.trim());
        const bookObjectId = new ObjectId(bookId.trim());
        const result = await this.database
            .collection("wishlist")
            .deleteOne({ userId: id, bookId: bookObjectId });
        return result;
    }
    async requestDelivery(userId, bookId) {
        return await this.database
            .collection("deliveryRequests")
            .create({
                userId,
                bookId,
                status: 'PENDING',
                createdAt: new Date()
            });
    }
    async approveDeliveryRequest(requestId) {
        const updatedRequest = await this.database.collection("deliveryRequests").findByIdAndUpdate(
            requestId,
            { status: 'APPROVED', approvedAt: new Date() },
            { new: true }
        );
        if (!updatedRequest) return null;
        return updatedRequest;
    }
    async getApprovedBooksForUser(userId) {
        const records = await this.database.collection("deliveryRequests")
            .find({
                userId: userId,
                status: "APPROVED"
            })
            .toArray();



        return records;
    }

}