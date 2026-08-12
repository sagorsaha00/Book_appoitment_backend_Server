import { MongoClient } from "mongodb";

const uri = process.env.CONNECTION_URL;

if (!uri) {
  throw new Error("CONNECTION_URL is not defined");
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
};

const client = new MongoClient(uri, options);

let isConnected = false;

export async function db() {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
      console.log("✅ MongoDB Connected");
    }

    return client;
  } catch (error) {
    isConnected = false;
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
}

export default client;
