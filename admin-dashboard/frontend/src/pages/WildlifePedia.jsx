import { useEffect, useState } from 'react';
import API from '../services/api';

const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    try {
        return new Date(value).toLocaleString();
    } catch (_error) {
        return String(value);
    }
};

function WildlifePedia() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [overview, setOverview] = useState({
        species: 0,
        habitats: 0,
        projects: 0,
        posts: 0,
        sightings: 0,
        volunteers: 0,
        donors: 0,
    });
    const [species, setSpecies] = useState([]);
    const [habitats, setHabitats] = useState([]);
    const [projects, setProjects] = useState([]);
    const [sightings, setSightings] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [donors, setDonors] = useState([]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [overviewRes, speciesRes, habitatsRes, projectsRes, sightingsRes, volunteersRes, donorsRes] = await Promise.all([
                API.get('/api/wildlife-pedia/admin/overview'),
                API.get('/api/wildlife-pedia/admin/species'),
                API.get('/api/wildlife-pedia/admin/habitats'),
                API.get('/api/wildlife-pedia/admin/projects'),
                API.get('/api/wildlife-pedia/admin/sightings'),
                API.get('/api/wildlife-pedia/admin/volunteers'),
                API.get('/api/wildlife-pedia/admin/donors'),
            ]);

            setOverview(overviewRes.data?.overview || {});
            setSpecies(Array.isArray(speciesRes.data?.items) ? speciesRes.data.items : []);
            setHabitats(Array.isArray(habitatsRes.data?.items) ? habitatsRes.data.items : []);
            setProjects(Array.isArray(projectsRes.data?.items) ? projectsRes.data.items : []);
            setSightings(Array.isArray(sightingsRes.data?.items) ? sightingsRes.data.items : []);
            setVolunteers(Array.isArray(volunteersRes.data?.items) ? volunteersRes.data.items : []);
            setDonors(Array.isArray(donorsRes.data?.items) ? donorsRes.data.items : []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Wildlife-Pedia admin records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="page-section">
            <div className="section-actions">
                <div>
                    <h1>Wildlife-Pedia</h1>
                    <p className="muted">Monitor species content, habitat knowledge, conservation projects, supporter leads, and public sighting reports from the shared Felix admin dashboard.</p>
                </div>
                <div className="toolbar-actions">
                    <button type="button" className="secondary-button refresh-button" onClick={loadData} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh Wildlife-Pedia'}
                    </button>
                </div>
            </div>

            {error ? <p className="message-error">{error}</p> : null}

            <div className="stats-grid">
                <div className="stat-card"><strong>Species</strong><span>{overview.species || 0} profiles</span></div>
                <div className="stat-card"><strong>Habitats</strong><span>{overview.habitats || 0} habitat records</span></div>
                <div className="stat-card"><strong>Projects</strong><span>{overview.projects || 0} conservation initiatives</span></div>
                <div className="stat-card"><strong>Posts</strong><span>{overview.posts || 0} insight articles</span></div>
                <div className="stat-card"><strong>Sightings</strong><span>{overview.sightings || 0} submitted reports</span></div>
                <div className="stat-card"><strong>Supporters</strong><span>{(overview.volunteers || 0) + (overview.donors || 0)} volunteer and donor leads</span></div>
            </div>

            <div className="list-card" id="species">
                <div className="record-header">
                    <div>
                        <h3>Species preview</h3>
                        <p className="muted">The current public species directory for Wildlife-Pedia.</p>
                    </div>
                </div>
                <div className="record-list">
                    {species.length ? species.map((item) => (
                        <div key={item.id} className="record-card">
                            <div className="record-header">
                                <div>
                                    <h3>{item.name}</h3>
                                    <p className="muted">{item.scientificName || 'Species profile'} • {item.conservationStatus || 'Status not set'}</p>
                                </div>
                            </div>
                            <p>{item.summary}</p>
                        </div>
                    )) : <p className="muted">No Wildlife-Pedia species have been saved yet. Defaults will still show on the public site.</p>}
                </div>
            </div>

            <div className="list-card" id="habitats">
                <div className="record-header">
                    <div>
                        <h3>Habitats</h3>
                        <p className="muted">Current habitat and ecosystem cards available to the public site.</p>
                    </div>
                </div>
                <div className="record-list">
                    {habitats.length ? habitats.map((item) => (
                        <div key={item.id} className="record-card">
                            <h3>{item.title}</h3>
                            <p className="muted">{item.region || 'Region not set'}</p>
                            <p>{item.summary}</p>
                        </div>
                    )) : <p className="muted">No saved habitat records yet. The site will fall back to the starter ecosystem set.</p>}
                </div>
            </div>

            <div className="list-card" id="projects">
                <div className="record-header">
                    <div>
                        <h3>Conservation projects</h3>
                        <p className="muted">Projects and calls-to-action currently available to Wildlife-Pedia visitors.</p>
                    </div>
                </div>
                <div className="record-list">
                    {projects.length ? projects.map((item) => (
                        <div key={item.id} className="record-card">
                            <h3>{item.title}</h3>
                            <p className="muted">{item.status || 'Active'}</p>
                            <p>{item.summary}</p>
                        </div>
                    )) : <p className="muted">No saved projects yet. The starter project set will remain live on the public site.</p>}
                </div>
            </div>

            <div className="list-card" id="reports">
                <div className="record-header">
                    <div>
                        <h3>Sighting reports</h3>
                        <p className="muted">Recent community-submitted sightings from the Wildlife-Pedia report form.</p>
                    </div>
                </div>
                <div className="record-list">
                    {sightings.length ? sightings.map((item) => (
                        <div key={item.id} className="record-card">
                            <div className="record-header">
                                <div>
                                    <h3>{item.species_guess || 'Unknown species'}</h3>
                                    <p className="muted">{item.location_text} • {formatDate(item.created_at)}</p>
                                </div>
                                <span className="table-chip">{item.status || 'new'}</span>
                            </div>
                            <p>{item.notes || 'No notes were included.'}</p>
                        </div>
                    )) : <p className="muted">No sighting reports have been submitted yet.</p>}
                </div>
            </div>

            <div className="content-editor-grid">
                <div className="list-card" id="volunteers">
                    <h3>Volunteer interest</h3>
                    <div className="record-list">
                        {volunteers.length ? volunteers.map((item) => (
                            <div key={item.id} className="record-card compact-card">
                                <strong>{item.full_name}</strong>
                                <span>{item.email}</span>
                                <span className="muted">{item.interests || 'General interest'}</span>
                            </div>
                        )) : <p className="muted">No volunteer leads yet.</p>}
                    </div>
                </div>

                <div className="list-card" id="donors">
                    <h3>Donor / adoption interest</h3>
                    <div className="record-list">
                        {donors.length ? donors.map((item) => (
                            <div key={item.id} className="record-card compact-card">
                                <strong>{item.full_name}</strong>
                                <span>{item.email}</span>
                                <span className="muted">{item.support_type || 'Wildlife support'} {item.amount_text ? `• ${item.amount_text}` : ''}</span>
                            </div>
                        )) : <p className="muted">No donor leads yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WildlifePedia;
