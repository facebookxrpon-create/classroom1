import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import session from "express-session";
import passport from "./lib/passport";
import { pgStore } from "./lib/sessionStore";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import tasksRouter from "./routes/tasks";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust Render's proxy (needed for secure cookies)
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json());

app.use(
  session({
    store: pgStore,
    name: "classtask_sess",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/tasks", tasksRouter);

// Serve the built frontend (same origin as the API)
const staticPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(staticPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
