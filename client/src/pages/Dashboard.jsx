import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/notes', { params: q ? { q } : {} })
        .then(({ data }) => setNotes(data))
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="row between">
        <h1>My Notes</h1>
        <input className="search" placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="card empty">
          <p>{q ? 'No notes match your search.' : 'No notes yet. Add your first one!'}</p>
          {!q && <Link to="/new" className="btn">+ Add notes</Link>}
        </div>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <Link key={n._id} to={`/notes/${n._id}`} className="card note-card">
              <h3>{n.title}</h3>
              <p className="muted clamp">{n.summaries?.short || 'Open to view summary'}</p>
              <small className="muted">{new Date(n.createdAt).toLocaleDateString()}</small>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
