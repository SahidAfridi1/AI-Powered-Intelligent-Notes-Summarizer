import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function NewNote() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('short');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file && content.trim().length < 50) return setError('Paste at least 50 characters or upload a file.');
    const body = new FormData();
    body.append('title', title);
    body.append('mode', mode);
    if (file) body.append('file', file);
    else body.append('content', content);
    setLoading(true);
    try {
      const { data } = await api.post('/notes', body);
      navigate(`/notes/${data._id}?mode=${mode}`);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Add notes</h1>
      {error && <div className="alert">{error}</div>}
      <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        rows={12}
        placeholder="Paste your lecture notes, textbook chapter or article here…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!!file}
      />
      <div className="row">
        <span className="muted">or upload</span>
        <input type="file" accept=".txt,.md,.pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
      </div>
      <div className="row">
        <span className="muted">Generate</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="short">Short summary</option>
          <option value="bullets">Key points</option>
          <option value="quiz">Quiz questions</option>
        </select>
      </div>
      <button className="btn" disabled={loading}>{loading ? 'Summarizing…' : '✨ Summarize'}</button>
    </form>
  );
}
