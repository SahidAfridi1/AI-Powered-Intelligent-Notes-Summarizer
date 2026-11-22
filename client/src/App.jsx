import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewNote from './pages/NewNote';
import NoteView from './pages/NoteView';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const onAuth = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const guard = (el) => (user ? el : <Navigate to="/login" />);

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onAuth={onAuth} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register onAuth={onAuth} />} />
          <Route path="/" element={guard(<Dashboard />)} />
          <Route path="/new" element={guard(<NewNote />)} />
          <Route path="/notes/:id" element={guard(<NoteView />)} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
