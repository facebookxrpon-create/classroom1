// backend/src/lib/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email in Google profile'), undefined);
        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, name: profile.displayName },
          });
        }
        // Upsert GoogleAccount
        const tokenExpiry = new Date(Date.now() + 3600 * 1000);
        await prisma.googleAccount.upsert({
          where: { userId: user.id },
          update: {
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
            tokenExpiry,
            googleUserId: profile.id,
          },
          create: {
            userId: user.id,
            googleUserId: profile.id,
            accessToken,
            refreshToken: refreshToken || '',
            tokenExpiry,
          },
        });
        return done(null, { id: user.id });
      } catch (err) {
        return done(err as any, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err as any, null);
  }
});

export default passport;
