import { db } from "../database/connection.js";

export async function attachDb(req, res, next) {
    try {
        req.db = await db();
        next();
    } catch (error) {
        next(error);
    }
}