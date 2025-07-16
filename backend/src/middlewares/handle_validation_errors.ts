import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ResponseApiType } from "../types/api_types";

export function handleValidationErrors(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validasi gagal",
            errors: errors.array()
        })
    }

    next()
}