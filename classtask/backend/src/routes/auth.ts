// backend/src/routes/auth.ts
import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../services/prismaClient"; // Prisma client instance

const router = Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        const existing = await prisma.user.findUnique({ where: { email: profile.emails?.[0].value } });
        let user = existing;
        if (!user) {
          user = await prisma.user.create({
            data: { email: profile.emails?.[0].value ?? "", name: profile.displayName },
          });
        }
        // Upsert Google account info
        await prisma.googleAccount.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            googleUserId: profile.id,
            accessToken,
            refreshToken: refreshToken || "",
            tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1h placeholder
          },
          update: { accessToken, refreshToken: refreshToken || undefined },
        });
        return done(null, user);
      } catch (e) {
        return done(e as any, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (e) {
    done(e as any, null);
  }
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email", "https://www.googleapis.com/auth/classroom.courses.readonly", "https://www.googleapis.com/auth/classroom.coursework.me"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (_req, res) => {
    // Successful auth – redirect to front‑end root
    res.redirect("/");
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {});
  res.redirect("/");
});

export default router;
