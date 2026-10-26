import React, { useEffect, useState } from 'react';
import api from '../api';

interface Course {
  id: string;
  name: string;
  description?: string;
  tasks: unknown[];
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/courses')
      .then((r) => setCourses(r.data))
      .catch(() => setError('Please sign in first.'));
  }, []);

  return (
    <main className="page">
      <h1>Courses</h1>
      {error && <p>{error}</p>}
      {!error && courses.length === 0 && <p>No courses yet.</p>}
      <ul className="list">
        {courses.map((c) => (
          <li key={c.id}>
            <strong>{c.name}</strong> — {c.tasks.length} tasks
          </li>
        ))}
      </ul>
    </main>
  );
};

export default Courses;
