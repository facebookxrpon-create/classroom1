import React, { useEffect, useState } from 'react';
import api from '../api';

interface Task {
  id: string;
  title: string;
  status: string;
  source: string;
  dueDateClassroom?: string | null;
  dueDateDetected?: string | null;
  dueDateConfirmed?: string | null;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/api/tasks')
      .then((r) => setTasks(r.data))
      .catch(() => setError('Please sign in first.'));

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/api/tasks', { title });
    setTitle('');
    load();
  };

  const complete = async (id: string) => {
    await api.patch(`/api/tasks/${id}`, { status: 'COMPLETED' });
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/api/tasks/${id}`);
    load();
  };

  const due = (t: Task) => t.dueDateConfirmed || t.dueDateClassroom || t.dueDateDetected;

  return (
    <main className="page">
      <h1>Tasks</h1>
      {error && <p>{error}</p>}
      <form onSubmit={add} className="row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task, e.g. ส่งรายงาน 30/10/2026"
        />
        <button className="btn" type="submit">Add</button>
      </form>
      <ul className="list">
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> [{t.status}]
            {due(t) && <> — due {new Date(due(t) as string).toLocaleDateString()}</>}
            <span className="actions">
              {t.status !== 'COMPLETED' && <button onClick={() => complete(t.id)}>Done</button>}
              {t.source === 'USER' && <button onClick={() => remove(t.id)}>Delete</button>}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default Tasks;
