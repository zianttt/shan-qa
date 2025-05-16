import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { COOKIE_NAME } from './constants.js';

export const createToken = (id: string, email: string, expiresIn) => {
    const payload = { id, email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: expiresIn,
    });
    return token;
}

export const verifyToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.signedCookies[`${COOKIE_NAME}`];
    if (!token || token.trim() === "") {
        res.status(401).json({
            success: false,
            message: "Token not found",
        });
        return;
    }
    return new Promise<void>((resolve, reject) => {
        return jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                res.status(401).json({
                    success: false,
                    message: "Token expired or invalid",
                });
                return reject(err);
            }
            resolve();
            res.locals.jwtData = data;
            return next(); 
        });
    });
}
