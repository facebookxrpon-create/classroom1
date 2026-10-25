// backend/src/routes/courses.ts
import { Router } from "express";
import prisma from "../services/prismaClient";
import { ensureAuthenticated } from "../middlewares/auth";

const router = Router();

// Middleware to ensure user is logged in
router.use(ensureAuthenticated);

// GET /api/courses -> list courses the user has linked
router.get("/", async (req, res) => {
  const userId = (req.session as any).passport?.user;
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const courses = await prisma.course.findMany({
    where: { userId },
    include: { tasks: true },
  });
  res.json(courses);
});

export default router;
