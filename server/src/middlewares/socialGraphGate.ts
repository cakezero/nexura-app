import type { NextFunction, Request, Response } from "express";
import { environment } from "@/utils/env.utils";
import { NOT_FOUND } from "@/utils/status.utils";
import { isGatedHost } from "@/middlewares/devAccess.middleware";

export const socialGraphOpen = (req: Request) => environment === "development" || isGatedHost(req);

export const socialGraphGate = (req: Request, res: Response, next: NextFunction) => {
  if (socialGraphOpen(req)) { next(); return; }
  res.status(NOT_FOUND).json({ error: "Not found" });
};
