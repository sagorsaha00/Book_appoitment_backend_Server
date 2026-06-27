import { ObjectId } from "mongodb";

export class LibrarianOrderController {
  constructor(database) {
    this.database = database;
  }
  approveOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      console.log("ordr", orderId)

      const result = await this.database.collection("sales").updateOne(
        { _id: new ObjectId(orderId), status: "pending" },
        { $set: { status: "approved", approvedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Order not found or already processed" });
      }

      return res.status(200).json({ success: true, message: "Order approved successfully!" });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  dispatchOrder = async (req, res) => {
    console.log("dispatchOrder")

    try {
      const { orderId } = req.params;
      console.log("orderId", orderId)
      const result = await this.database.collection("sales").updateOne(
        { _id: new ObjectId(orderId), status: "approved" },
        { $set: { status: "dispatched", dispatchedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Order must be approved before dispatch" });
      }

      return res.status(200).json({ success: true, message: "Book dispatched for delivery!" });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  completeOrder = async (req, res) => {
    try {
      const { orderId } = req.params;

      const result = await this.database.collection("sales").updateOne(
        { _id: new ObjectId(orderId), status: "dispatched" }, // শুধুমাত্র dispatched অর্ডারই complete করা যাবে
        { $set: { status: "completed", completedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Order must be dispatched before completing" });
      }

      return res.status(200).json({ success: true, message: "Order marked as completed!" });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
}

