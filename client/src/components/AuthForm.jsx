import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function AuthForm({ mode, onAuth }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      onAuth(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card auth" onSubmit={submit}>
      <h1>{isRegister ? 'Create account' : 'Welcome back'}</h1>
      <p className="muted">Turn long notes into quick summaries, key points and quizzes.</p>
      {error && <div className="alert">{error}</div>}
      {isRegister && <input placeholder="Name" value={form.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
      <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
      <button className="btn" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}</button>
      <p className="muted center">
        {isRegister ? <>Have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Sign up</Link></>}
      </p>
    </form>
  );
}
