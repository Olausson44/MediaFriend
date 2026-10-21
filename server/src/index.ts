import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth.js";
import { matchRoutes } from "./routes/matches.js";
import { posterRoutes } from "./routes/posters.js";
import { aiRoutes } from "./routes/ai.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Better Auth endpoints
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Huvud-API rutter
app.route("/api/matches", matchRoutes);
app.route("/api/posters", posterRoutes);
app.route("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "MediaFriend API",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

const port = Number(process.env.PORT) || 3000;

console.log(`🏑 MediaFriend Hono Server startar på http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
