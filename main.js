import "dotenv/config"
import express from "express"
import cors from "cors"
import { db } from "./src/database/connection.js"
import userRouter from "./src/router/userRoute.js"
import bookRouter from "./src/router/bookRouter.js"
const app = express()

const PORT = process.env.PORT
app.use(express.json())
app.use(cors())



app.get("/", (req, res) => {
    res.send("Hello World")
})

app.use('/users', userRouter)
app.use('/books', bookRouter)


async function startServer() {
    await db();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();