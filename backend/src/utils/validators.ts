import { Request, Response, NextFunction } from "express";
import { body, ValidationChain, validationResult } from "express-validator";

export const validate = async (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        for (let validation of validations) {
            const result = await validation.run(req);
            if (!result.isEmpty()) {
                break;
            }
        }
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            next();
            return;
        }

        res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
}

export const loginValidator = [
    body("email").trim().isEmail().withMessage("Invalid email format"),
    body("password")
        .trim()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
]

export const signupValidator = [
    body("name").notEmpty().withMessage("Name is required"),
    ...loginValidator
]