/** @format */

import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import dotenv from "dotenv";
import hpp from "hpp";
import http from "http";
import { logger } from "./utils/logger";
import cookieParser from "cookie-parser";
// Load environment variables from a .env file
dotenv.config();

const app: Application = express();
const isProduction: boolean = process.env.NODE_ENV === "production";

// Custom Error class for more specific error handling
class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Create a stream object for morgan to pipe logs to winston
const stream = {
  write: (message: string) => logger.info(message.trim()),
};

// Set various security-related HTTP headers to protect the app
app.use(helmet());

// Cross-Origin
app.use(
  cors({
    origin: isProduction ? "*" : "*", // Restrict origin in production
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization",
  })
);

//  middleware
app.use(express.json({ limit: "10kb" })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // URL-encoded data parser;
app.use(morgan("combined", { stream })); // HTTP Request Logger (morgan) integrated with our Winston logger
app.use(hpp()); // Prevent HTTP Parameter Pollution attacks

// Apply a rate limiter to API routes to prevent brute-force and DDoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes.",
});
app.use("/api", apiLimiter); // Apply limiter only to API routes
app.use(cookieParser());

// Import
import vendorroute from "./routes/vendor.route";

// Mount routes
app.use("/api/v1/", vendorroute);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route Not Found - ${req.originalUrl}`, 404));
});

// Global Error Handler: Catches all errors passed to `next(error)`
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      stack: isProduction ? undefined : err.stack,
    },
  });
});

const server = http.createServer(app);
export { server };
