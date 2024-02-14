import { NextFunction } from "express";
import { firebaseAdmin } from "../config/firebase-config";

class Middleware {
    async decodeToken(req: any, res: any, next: NextFunction) {
        const accessToken = req.headers.authorization.split(' ')[1];
        try {
            const decodedValue = await firebaseAdmin.auth().verifyIdToken(accessToken);
            if (decodedValue) {
                req.user = decodedValue;
                return next();
            }

            return res.status(401).json({message: "Unauthorized"});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
}

export default new Middleware();
