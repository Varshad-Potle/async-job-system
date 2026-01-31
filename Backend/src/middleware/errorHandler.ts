import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { MESSAGES, HttpStatusCode } from "../constants";

const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    // Check if it's a known error type, otherwise generic 500
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.DEFAULT_ERROR;
        error = new ApiError(statusCode, message, false);
    }

    const response = {
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }), // Show stack only in dev
    };

    res.status(error.statusCode).json(response);
};

export { errorHandler };