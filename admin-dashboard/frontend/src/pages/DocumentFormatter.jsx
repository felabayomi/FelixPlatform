import { useEffect, useState } from 'react';
import API from '../services/api';

function formatDate(value) {
    if (!value) {
        return '—';
    }

    try {
        return new Date(value).toLocaleString();
    } catch (_error) {
        return value;
    }
}

function DocumentFormatter() {
    const [summary, setSummary] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [accessRequests, setAccessRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadOverview = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await API.get('/api/admin/overview');
            setSummary(res.data.summary || null);
            setRecentJobs(res.data.recentJobs || []);
            setAccessRequests(res.data.accessRequests || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || 'Unable to load Document Formatter analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    return (
        <div className="page-section">
            <div className="section-actions">
                <div>
                    <h1>Document Formatter</h1>
                    <p className="muted">
                        Monitor formatter usage, export activity, and recent access requests from the live web app.
                    </p>
                </div>
                <button type="button" className="secondary-button refresh-button" onClick={loadOverview} disabled={loading}>
                    {loading ? 'Refreshing…' : 'Refresh Data'}
                </button>
            </div>

            {error ? <p className="message-error">{error}</p> : null}

            <div className="stats-grid" style={{ marginTop: 20 }}>
                <div className="stat-card">
                    <strong>Total jobs</strong>
                    <span>{summary?.total_jobs ?? 0}</span>
                </div>
                <div className="stat-card">
                    <strong>PDF exports</strong>
                    <span>{summary?.pdf_jobs ?? 0}</span>
                </div>
                <div className="stat-card">
                    <strong>DOCX exports</strong>
                    <span>{summary?.docx_jobs ?? 0}</span>
                </div>
                <div className="stat-card">
                    <strong>TXT exports</strong>
                    <span>{summary?.txt_jobs ?? 0}</span>
                </div>
                <div className="stat-card">
                    <strong>Unique users</strong>
                    <span>{summary?.unique_users ?? 0}</span>
                </div>
                <div className="stat-card">
                    <strong>Last job</strong>
                    <span>{formatDate(summary?.last_job_at)}</span>
                </div>
            </div>

            <div className="list-card" style={{ marginTop: 20 }}>
                <h3>Recent formatter jobs</h3>
                {!recentJobs.length ? (
                    <p className="muted">No formatter activity has been logged yet.</p>
                ) : (
                    <div className="table-card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Export</th>
                                    <th>Document type</th>
                                    <th>Source</th>
                                    <th>Title / File</th>
                                    <th>When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map((job) => (
                                    <tr key={job.id}>
                                        <td>
                                            <strong>{job.user_name || 'Unknown user'}</strong>
                                            <div className="muted">{job.user_email || 'No email recorded'}</div>
                                        </td>
                                        <td>{String(job.export_format || '').toUpperCase()}</td>
                                        <td>{job.document_type || 'general'}</td>
                                        <td>{job.source_type || 'text'}</td>
                                        <td>{job.title || job.input_filename || 'Untitled document'}</td>
                                        <td>{formatDate(job.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="list-card" style={{ marginTop: 20 }}>
                <h3>Recent access requests</h3>
                {!accessRequests.length ? (
                    <p className="muted">No access requests have been submitted yet.</p>
                ) : (
                    <div className="record-list">
                        {accessRequests.map((request) => (
                            <div key={request.id} className="record-card">
                                <div className="record-header">
                                    <div>
                                        <h3>{request.name || request.email}</h3>
                                        <p className="muted">{request.email}</p>
                                    </div>
                                    <span className={`status-badge status-${String(request.status || 'pending').toLowerCase()}`}>
                                        {request.status || 'pending'}
                                    </span>
                                </div>
                                <div className="details-grid">
                                    <div>
                                        <strong>Organization</strong>
                                        <span>{request.organization || '—'}</span>
                                    </div>
                                    <div>
                                        <strong>Submitted</strong>
                                        <span>{formatDate(request.created_at)}</span>
                                    </div>
                                </div>
                                <p className="quote-text-block">{request.reason || 'No reason provided.'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentFormatter;
