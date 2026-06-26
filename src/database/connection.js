import { MongoClient } from "mongodb";

const uri = process.env.CONNECTION_URL;
const options = {
    maxPoolSize: 10,             // একসাথে সর্বোচ্চ ১০টি কানেকশন ওপেন হতে পারবে
    minPoolSize: 1,              // মিনিমাম ১টি কানেকশন সবসময় রেডি থাকবে
    maxIdleTimeMS: 30000,        // ৩০ সেকেন্ড অলস বসে থাকলে কানেকশনটি নিজে থেকেই ক্লোজ হবে
    connectTimeoutMS: 10000,     // ১০ সেকেন্ডের মধ্যে কানেক্ট না হলে টাইমআউট হবে
};

// ১. গ্লোবাল স্কোপে ক্লায়েন্ট এবং ডাটাবেজ ক্যাশ রাখার ভ্যারিয়েবল
let client = null;
let cachedDb = null;

export async function db() {
    // ২. যদি অলরেডি ক্লায়েন্ট কানেক্টেড থাকে, তবে নতুন করে কানেক্ট না করে সরাসরি ডাটাবেজ রিটার্ন করবে
    if (client && client.topology && client.topology.isConnected()) {
        return cachedDb;
    }

    try {
        // ৩. প্রথমবার রিকোয়েস্ট এলে নতুন কানেকশন পুল তৈরি করবে
        client = new MongoClient(uri, options);
        await client.connect();

        // এখানে আপনার আসল ডাটাবেজের নাম দিন (যেমন: "myDatabase")
        cachedDb = client.db("myDatabase");

        console.log("✅ MongoDB Connected & Pool Initialized");
        return cachedDb;
    } catch (error) {
        console.error("🔴 MongoDB Connection Error:", error);
        client = null;
        cachedDb = null;
        throw error;
    }
}

export default client;