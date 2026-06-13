import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi, providersApi, type Category, type ProviderProfile } from '../api/client';
import './Home.css';

function getProviderUserId(p: ProviderProfile): string {
  const u = p.userId;
  return typeof u === 'string' ? u : (u as { _id: string })._id;
}

function getProviderName(p: ProviderProfile): string {
  const u = p.userId;
  if (typeof u === 'object' && u && 'name' in u && u.name) return u.name;
  return 'Provider';
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearchLoading(true);
    const params: Parameters<typeof providersApi.search>[0] = { limit: 24 };
    if (categoryId) params.categoryId = categoryId;
    providersApi
      .search(params)
      .then(setProviders)
      .catch(() => setProviders([]))
      .finally(() => setSearchLoading(false));
  }, [categoryId]);

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">Find local services</h1>
        <p className="hero-desc">Connect with microbusinesses and service providers near you.</p>
      </section>

      <section className="filters">
        <label htmlFor="cat" className="filter-label">Category</label>
        <select
          id="cat"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="filter-select"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </section>

      {loading ? (
        <p className="muted">Loading categories…</p>
      ) : searchLoading ? (
        <p className="muted">Searching…</p>
      ) : providers.length === 0 ? (
        <p className="muted">No providers found. Try another category.</p>
      ) : (
        <ul className="provider-grid">
          {providers.map((p) => (
            <li key={p._id} className="provider-card card">
              <Link to={`/provider/${getProviderUserId(p)}`} className="provider-card-link">
                <span className="provider-name">{getProviderName(p)}</span>
                <p className="provider-desc">{p.serviceDescription || 'No description'}</p>
                <div className="provider-meta">
                  {Array.isArray(p.serviceCategories) && p.serviceCategories.length > 0 && (
                    <span className="provider-cats">
                      {(p.serviceCategories as Category[]).map((c) => c.name).join(', ')}
                    </span>
                  )}
                  {p.ratingAverage > 0 && (
                    <span className="provider-rating">★ {p.ratingAverage.toFixed(1)}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
