import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Tasks from './pages/Tasks';

const App: React.FC = () => {
  return (
    <Router>
      <nav style={navStyle}>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/tasks">Tasks</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </Router>
  );
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  padding: '1rem',
  background: 'linear-gradient(90deg, #1e3a8a, #0ea5e9)',
  color: '#fff',
};

export default App;
