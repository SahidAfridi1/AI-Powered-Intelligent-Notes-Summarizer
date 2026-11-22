import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api';

const TABS = [
  { key: 'short', label: 'Summary' },
  { key: 'bullets', label: 'Key points' },
  { key: 'quiz', label: 'Quiz' },
];

const isEmpty = (v) => !v || (Array.isArray(v) && v.length === 0);

function toText(mode, value) {
  if (mode === 'short') return value;
  if (mode === 'bullets') return value.map((b) => `• ${b}`).join('\n');
  return value.map((q, i) => `Q${i + 1}. ${q.question}\nA: ${q.answer}`).join('\n\n');
}

export default function NoteView() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [tab, setTab] = useState(params.get('mode') || 'short');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/notes/${id}`).then(({ data }) => setNote(data)).catch((err) => setError(errorMessage(err)));
  }, [id]);

  const generate = async (mode) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/notes/${id}/summarize`, { mode });
      setNote(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`);
    navigate('/');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(toText(tab, note.summaries[tab]));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (error && !note) return <div className="alert">{error}</div>;
  if (!note) return <p className="muted">Loading…</p>;

  const value = note.summaries?.[tab];

  return (
    <>
      <div className="row between">
        <h1>{note.title}</h1>
        <button className="btn btn-sm btn-danger" onClick={remove}>Delete</button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'tab active' : 'tab'} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {error && <div className="alert">{error}</div>}
        {isEmpty(value) ? (
          <div className="empty">
            <p className="muted">Not generated yet.</p>
            <button className="btn" disabled={busy} onClick={() => generate(tab)}>
              {busy ? 'Generating…' : `✨ Generate ${TABS.find((t) => t.key === tab).label.toLowerCase()}`}
            </button>
          </div>
        ) : (
          <>
            {tab === 'short' && <p className="summary">{value}</p>}
            {tab === 'bullets' && <ul className="bullets">{value.map((b, i) => <li key={i}>{b}</li>)}</ul>}
            {tab === 'quiz' && (
              <>
                <ol className="quiz">
                  {value.map((q, i) => (
                    <li key={i}>
                      <p>{q.question}</p>
                      {showAnswers && <p className="answer">✔ {q.answer}</p>}
                    </li>
                  ))}
                </ol>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowAnswers(!showAnswers)}>
                  {showAnswers ? 'Hide answers' : 'Show answers'}
                </button>
              </>
            )}
            <div className="row actions">
              <button className="btn btn-sm btn-ghost" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
              <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => generate(tab)}>
                {busy ? 'Regenerating…' : 'Regenerate'}
              </button>
            </div>
          </>
        )}
      </div>

      <button className="link" onClick={() => setShowOriginal(!showOriginal)}>
        {showOriginal ? '▾ Hide original notes' : '▸ Show original notes'}
      </button>
      {showOriginal && <pre className="card original">{note.content}</pre>}
    </>
  );
}
