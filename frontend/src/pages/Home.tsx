import React, { useEffect, useState } from 'react';
import api from '../api';

const Home: React.FC = () => {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page">Loading...</main>;

  return (
    <main className="page">
      <h1>ClassTask</h1>
      {user ? (
        <>
          <p>Signed in as {user.name || user.email}</p>
          <a className="btn" href="/api/auth/logout">Sign out</a>
        </>
      ) : (
        <>
          <p>Sign in with Google to track your Classroom assignments.</p>
          <a className="btn" href="/api/auth/google">Sign in with Google</a>
        </>
      )}
    </main>
  );
};

export default Home;
