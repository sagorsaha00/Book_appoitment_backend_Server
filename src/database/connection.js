import { MongoClient } from "mongodb";

const uri = process.env.CONNECTION_URL;

const client = new MongoClient(uri);

export async function db() {
    try {
        await client.connect();
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.log(error);
    }
}

export default client;