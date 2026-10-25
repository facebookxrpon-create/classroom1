import express from "express";
import path from "path";
import cors from "cors";
import session from "cookie-session";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import tasksRouter from "./routes/tasks";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Render's proxy
app.set("trust proxy", 1);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    name: "classtask_sess",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/tasks", tasksRouter);

// Serve Frontend build (static files)
const staticPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(staticPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
