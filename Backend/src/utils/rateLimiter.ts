import rateLimit from "express-rate-limit";

const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    message: { success: false, message: "Too many chat requests. Please wait a few minutes and try again." },
    standardHeaders: true,
    legacyHeaders: false,
});

const ingestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many ingest requests. Please wait before ingesting another repository." },
    standardHeaders: true,
    legacyHeaders: false,
});

export { chatLimiter, ingestLimiter };