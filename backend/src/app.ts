import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import appRouter from './routes/index.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

// middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}))
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// remove in production
app.use(morgan('dev'));

app.use("/api/v1", appRouter);

export default app;