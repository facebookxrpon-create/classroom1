import session from 'express-session';
import pgSession from 'connect-pg-simple';

export const pgStore = new (pgSession(session))({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
});
