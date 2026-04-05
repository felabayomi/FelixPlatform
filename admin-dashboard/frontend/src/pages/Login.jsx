import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { clearAuthSession, hasAdminAccess, saveAuthSession } from '../services/api';

function Login({ onAuthSuccess }) {
    const navigate = useNavigate();
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

        setSubmitting(true);
        setMessage('');
        setError('');

        try {
            const res = await API.post('/auth/login', { email, password });
            const { token, user, message: responseMessage } = res.data;

            if (!hasAdminAccess(user)) {
                clearAuthSession();
                setError('This account does not have admin access yet.');
                setMessage(responseMessage || 'Admin access is required to enter this dashboard.');
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
                <h1>Admin Login</h1>
                <p className="muted">Sign in to manage the protected admin dashboard.</p>
            </div>

            <div className="login-form">
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
                    {submitting ? 'Signing in...' : 'Login'}
                </button>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
        </div>
    );
}

export default Login;
