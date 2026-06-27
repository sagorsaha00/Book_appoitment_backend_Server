import { MongoClient } from "mongodb";

const uri = process.env.CONNECTION_URL;
const options = {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
};
const client = new MongoClient(uri, options);

export async function db() {
    try {
        await client.connect();
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.log(error);
    }
}

export default client;