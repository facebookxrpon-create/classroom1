// backend/src/routes/auth.ts
import { Router } from "express";
import passport from "passport";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.me",
    ],
    accessType: "offline",
    prompt: "consent",
  } as any)
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (_req, res) => {
    res.redirect("/");
  }
);

router.get("/me", (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Unauthenticated" });
  res.json({ id: user.id, email: user.email, name: user.name });
});

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

export default router;
