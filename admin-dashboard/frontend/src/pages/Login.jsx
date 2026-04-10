import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API, { clearAuthSession, hasAdminAccess, saveAuthSession } from '../services/api';

function Login({ onAuthSuccess }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const resetToken = searchParams.get('resetToken') || searchParams.get('token') || '';
    const isResetMode = Boolean(resetToken);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getFriendlyError = (err, fallback = 'Unable to complete this request.') => {
        if (typeof err?.response?.data === 'string' && err.response.data.trim()) {
            return err.response.data;
        }

        if (!err?.response) {
            return 'Unable to reach the admin server from this deployment right now. Please try again once the backend update finishes deploying.';
        }

        return fallback;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

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
            setError(getFriendlyError(err, 'Unable to complete sign in.'));
            setMessage('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleForgotPassword = async (event) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Enter your email address first.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setError('');

        try {
            const resetBaseUrl = `${window.location.origin}/login`;
            const res = await API.post('/auth/forgot-password', {
                email,
                resetBaseUrl,
            });
            setMessage(res.data?.message || 'If that account exists, a reset link has been sent to your email.');
            setShowForgotPassword(false);
        } catch (err) {
            console.error(err);
            setError(getFriendlyError(err, 'Unable to start password reset.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();

        if (!resetPassword.trim() || !confirmPassword.trim()) {
            setError('Enter and confirm your new password.');
            setMessage('');
            return;
        }

        if (resetPassword !== confirmPassword) {
            setError('The new passwords do not match.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setError('');

        try {
            const res = await API.post('/auth/reset-password', {
                token: resetToken,
                password: resetPassword,
            });
            setMessage(res.data?.message || 'Password reset successful. You can now sign in.');
            setResetPassword('');
            setConfirmPassword('');
            setSearchParams({});
        } catch (err) {
            console.error(err);
            setError(getFriendlyError(err, 'Unable to reset password.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-section narrow-page auth-card">
            <div className="page-header">
                <h1>{isResetMode ? 'Reset Password' : 'Admin Login'}</h1>
                <p className="muted">
                    {isResetMode
                        ? 'Choose a new password for the protected admin dashboard.'
                        : 'Sign in to manage the protected admin dashboard.'}
                </p>
            </div>

            {isResetMode ? (
                <form className="login-form" onSubmit={handleResetPassword}>
                    <input
                        type="password"
                        placeholder="New password"
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save new password'}
                    </button>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setSearchParams({})}
                        disabled={submitting}
                    >
                        Back to login
                    </button>
                </form>
            ) : (
                <>
                    <form className="login-form" onSubmit={handleSubmit}>
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
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Signing in...' : 'Login'}
                        </button>
                    </form>

                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                setShowForgotPassword((current) => !current);
                                setMessage('');
                                setError('');
                            }}
                            disabled={submitting}
                        >
                            {showForgotPassword ? 'Cancel password reset' : 'Forgot password?'}
                        </button>

                        {showForgotPassword ? (
                            <form onSubmit={handleForgotPassword} className="login-form">
                                <input
                                    type="email"
                                    placeholder="Email for reset link"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                                <button type="submit" disabled={submitting}>
                                    {submitting ? 'Sending...' : 'Send reset link'}
                                </button>
                            </form>
                        ) : null}
                    </div>
                </>
            )}

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
        </div>
    );
}

export default Login;
