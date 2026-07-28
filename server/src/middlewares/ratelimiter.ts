// import rateLimit from "express-rate-limit";
// import type { Request, Response } from "express";

// export const rateLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   limit:(req: GlobalRequest) => {
// 		const auth = req.headers?.authorization;

// 		if (auth) return 50;

// 		return 10;
// 	}, // limit each user to 10 or 50 requests per windowMs
//   message: {
//     error: 'Too many requests from this user, please try again later.',
//     retryAfter: '10 minutes'
//   },
//   keyGenerator: (req: Request, res: Response): string => {
//     // Use auth token when present; fall back to IP so unauthenticated
//     // users don't all share one rate-limit bucket.
//     return req.headers?.authorization ?? req.ip ?? req.socket?.remoteAddress ?? "unknown";
//   },
//   standardHeaders: true, // Return rate limit info in RateLimit-* headers
//   legacyHeaders: false, // Disable X-RateLimit-* headers
// });
