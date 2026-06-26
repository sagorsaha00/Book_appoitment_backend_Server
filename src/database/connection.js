import { MongoClient } from "mongodb";

const uri = process.env.CONNECTION_URL;
const options = {
    maxPoolSize: 10,             // একসাথে সর্বোচ্চ ১০টি কানেকশন ওপেন হতে পারবে
    minPoolSize: 1,              // মিনিমাম ১টি কানেকশন সবসময় রেডি থাকবে
    maxIdleTimeMS: 30000,        // ৩০ সেকেন্ড অলস বসে থাকলে কানেকশনটি নিজে থেকেই ক্লোজ হবে
    connectTimeoutMS: 10000,     // ১০ সেকেন্ডের মধ্যে কানেক্ট না হলে টাইমআউট হবে
};
const client = new MongoClient(uri,options);

export async function db() {
    try {
        await client.connect();
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.log(error);
    }
}

export default client;