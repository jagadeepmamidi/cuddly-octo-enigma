import "./env";
import cors from "cors";
import express from "express";
import path from "path";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth/better-auth";
import { registerApiRoutes } from "./http/routes";
import { applySecurityHeaders } from "./http/security";

const app = express();
const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.disable("x-powered-by");
app.use(
  cors({
    origin: [frontendOrigin, `http://localhost:${port}`],
    credentials: true
  })
);
app.use(applySecurityHeaders);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "rbabikerentals-backend" });
});

const authHandler = toNodeHandler(auth);
app.all("/api/auth", (req, res) => {
  void authHandler(req, res);
});
app.all("/api/auth/*", (req, res) => {
  void authHandler(req, res);
});

registerApiRoutes(app);

app.use(express.static(path.resolve(process.cwd(), "public")));

const frontendDist = path.resolve(process.cwd(), "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(frontendDist, "index.html"), (error) => {
    if (error) {
      next();
    }
  });
});

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: "not_found", message: "Route not found." }
  });
});

app.listen(port, () => {
  console.log(`RBA backend listening on http://localhost:${port}`);
});
