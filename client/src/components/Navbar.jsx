import { Link } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <Link to="/" className="brand">📝 NoteSnap</Link>
      {user && (
        <nav>
          <Link to="/new" className="btn btn-sm">+ New note</Link>
          <span className="muted hide-sm">Hi, {user.name}</span>
          <button className="btn btn-sm btn-ghost" onClick={onLogout}>Log out</button>
        </nav>
      )}
    </header>
  );
}
