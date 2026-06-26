import "dotenv/config"
import express from "express"
import cors from "cors"
import Stripe from "stripe";
import { ImageKit } from "@imagekit/nodejs";
import { db } from "./src/database/connection.js"
import userRouter from "./src/router/userRoute.js"
import bookRouter from "./src/router/bookRouter.js"
import libarianRouter from "./src/router/libarianRouter.js"
import { toNodeHandler } from "better-auth/node";


const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT
console.log("PORT", PORT)
app.use(express.json())

app.use(cors(
    {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }
))

app.post("/api/checkout", async (req, res) => {
    try {
        const { bookTitle, price, bookId, userEmail, bookOwnerEmail } = req.body;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: bookTitle,
                        },
                        unit_amount: Math.round(price * 100),
                    },
                    quantity: 1,
                },
            ],

            metadata: {
                bookId,
                userEmail,
                librarianEmail: bookOwnerEmail
            },

            success_url: `http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}&bookId=${bookId}`,
            cancel_url: `http://localhost:3000/cancel`,
        });


        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error);
        return res.status(500).json({ error: "Checkout session creation failed" });
    }
});
app.get("/api/checkout/session/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return res.status(200).json({
            status: session.payment_status,
            transactionId: session.payment_intent,
            customerEmail: session.customer_details?.email,
        });
    } catch (error) {
        console.error("Error retrieving session:", error);
        return res.status(500).json({ error: "Failed to verify payment session" });
    }
});



app.get("/api/librarian/sales", async (req, res) => {
    try {
        // সব সেল লেটেস্ট ডেট অনুযায়ী সর্ট করে নিয়ে আসা হবে
        const allSales = await db.collection("sales").find().sort({ createdAt: -1 }).toArray();
        return res.status(200).json(allSales);
    } catch (error) {
        console.error("Librarian Fetch Error:", error);
        return res.status(500).json({ error: "Failed to fetch sales ledger" });
    }
});

app.get("/", (req, res) => {
    res.send("Hello World")
})

app.use('/users', userRouter)
app.use('/books', bookRouter)
app.use("/libarian", libarianRouter)


async function startServer() {
    await db();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();