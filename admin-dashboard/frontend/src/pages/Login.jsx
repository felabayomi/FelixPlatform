import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { clearAuthSession, hasAdminAccess, saveAuthSession } from '../services/api';

function Login({ onAuthSuccess }) {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            setMessage('');
            return;
        }

        if (mode === 'register' && !name.trim()) {
            setError('Name is required when creating the first admin account.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setError('');

        try {
            const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
            const payload = mode === 'register'
                ? { name, email, password }
                : { email, password };

            const res = await API.post(endpoint, payload);
            const { token, user, message: responseMessage } = res.data;

            if (!hasAdminAccess(user)) {
                clearAuthSession();
                setError('This account does not have admin access yet.');
                setMessage(responseMessage || 'Account created, but admin access is still required.');
                return;
            }

            saveAuthSession(token, user);
            onAuthSuccess?.(user);
            setMessage(responseMessage || 'Signed in successfully.');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Unable to complete sign in.');
            setMessage('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-section narrow-page auth-card">
            <div className="page-header">
                <h1>{mode === 'login' ? 'Admin Login' : 'Create First Admin'}</h1>
                <p className="muted">
                    {mode === 'login'
                        ? 'Sign in to manage the protected admin dashboard.'
                        : 'Use this once to bootstrap the first admin account.'}
                </p>
            </div>

            <div className="login-form">
                {mode === 'register' ? (
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                ) : null}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={handleSubmit} disabled={submitting}>
                    {submitting
                        ? (mode === 'login' ? 'Signing in...' : 'Creating admin...')
                        : (mode === 'login' ? 'Login' : 'Create Admin')}
                </button>
                <button
                    type="button"
                    className="cancel-button secondary-button"
                    onClick={() => {
                        setMode((current) => (current === 'login' ? 'register' : 'login'));
                        setError('');
                        setMessage('');
                    }}
                >
                    {mode === 'login' ? 'Need to create the first admin?' : 'Back to login'}
                </button>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
        </div>
    );
}

export default Login;
