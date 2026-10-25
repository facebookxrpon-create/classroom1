// backend/src/routes/tasks.ts
import { Router } from "express";
import prisma from "../services/prismaClient";
import { ensureAuthenticated } from "../middlewares/auth";
import { detectDueDate } from "../services/dateDetector";

const router = Router();
router.use(ensureAuthenticated);

// Helper to get current user id
function getUserId(req: any): string {
  return (req.session as any).passport?.user;
}

// GET /api/tasks – list all tasks for user (optionally filter via query params)
router.get("/", async (req, res) => {
  const userId = getUserId(req);
  const { status, courseId, upcoming } = req.query;
  const where: any = { userId };
  if (status) where.status = status;
  if (courseId) where.courseId = courseId as string;
  if (upcoming === "true") {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);
    where.OR = [
      { dueDateClassroom: { gte: now, lte: weekLater } },
      { dueDateDetected: { gte: now, lte: weekLater } },
    ];
  }
  const tasks = await prisma.task.findMany({ where, include: { notes: true, course: true } });
  res.json(tasks);
});

// POST /api/tasks – create a new task (user‑created or from Classroom sync)
router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { title, description, courseId, source, externalLink, priority } = req.body;
  const newTask = await prisma.task.create({
    data: { title, description, courseId, userId, source, externalLink, priority },
  });
  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id – update fields (including confirming a detected date)
router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { dueDateConfirmed, status, notes, ...rest } = req.body;

  const updateData: any = { ...rest };
  if (dueDateConfirmed) updateData.dueDateConfirmed = new Date(dueDateConfirmed);
  if (status) updateData.status = status;

  const task = await prisma.task.update({
    where: { id, userId },
    data: updateData,
  });

  // optional: add note after update
  if (notes) {
    await prisma.taskNote.create({ data: { taskId: task.id, content: notes } });
  }
  res.json(task);
});

// DELETE /api/tasks/:id – only allowed for user‑created tasks (source = USER)
router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== userId) return res.status(404).json({ error: "Not found" });
  if (task.source !== "USER") return res.status(403).json({ error: "Cannot delete Classroom‑synced task" });
  await prisma.task.delete({ where: { id } });
  res.status(204).send();
});

export default router;
