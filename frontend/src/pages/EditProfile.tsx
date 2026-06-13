import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { providersApi, providerProfileApi, categoriesApi, portfolioApi } from '../api/client';
import type { ProviderProfile, Category, PortfolioItem } from '../api/client';
import './EditProfile.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [desc, setDesc] = useState('');
  const [years, setYears] = useState(0);
  const [radius, setRadius] = useState(10);
  const [pricing, setPricing] = useState<'fixed' | 'hourly' | 'quote'>('quote');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  useEffect(() => {
    Promise.all([
      providersApi.getMyProfile().then((p) => {
        setProfile(p);
        if (p) {
          setDesc(p.serviceDescription);
          setYears(p.yearsOfExperience);
          setRadius(p.serviceRadiusKm);
          setPricing(p.pricingModel);
          const catIds = (p.serviceCategories as Array<Category | string>).map((c) =>
            typeof c === 'string' ? c : c._id,
          );
          setSelectedCats(catIds);
        }
      }),
      categoriesApi.list().then(setCategories),
      portfolioApi.listMine().then(setPortfolio).catch(() => setPortfolio([])),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        serviceDescription: desc,
        yearsOfExperience: years,
        serviceRadiusKm: radius,
        pricingModel: pricing,
        serviceCategories: selectedCats,
      };
      const updated = profile
        ? await providerProfileApi.update(body)
        : await providerProfileApi.create(body);
      setProfile(updated);
      setSuccess('Profile saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const item = await portfolioApi.create({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        imageUrls: newImage.trim() ? [newImage.trim()] : undefined,
      });
      setPortfolio((prev) => [...prev, item]);
      setNewTitle('');
      setNewDesc('');
      setNewImage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item');
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    await portfolioApi.delete(id);
    setPortfolio((prev) => prev.filter((p) => p._id !== id));
  };

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="edit-profile">
      <h1 className="page-title">{profile ? 'Edit profile' : 'Create provider profile'}</h1>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <form className="card edit-section" onSubmit={handleSave}>
        <div className="input-group">
          <label htmlFor="desc">Service description</label>
          <textarea
            id="desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Describe the services you offer"
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label htmlFor="years">Years of experience</label>
            <input
              id="years"
              type="number"
              min="0"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="radius">Service radius (km)</label>
            <input
              id="radius"
              type="number"
              min="1"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10) || 10)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="pricing">Pricing model</label>
            <select
              id="pricing"
              value={pricing}
              onChange={(e) => setPricing(e.target.value as 'fixed' | 'hourly' | 'quote')}
            >
              <option value="quote">Quote</option>
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Service categories</label>
          <div className="cat-checks">
            {categories.map((c) => (
              <label key={c._id} className="cat-check">
                <input
                  type="checkbox"
                  checked={selectedCats.includes(c._id)}
                  onChange={() => toggleCategory(c._id)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="edit-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : profile ? 'Save changes' : 'Create profile'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </form>

      {profile && (
        <section className="card edit-section">
          <h2>Portfolio</h2>
          {portfolio.length === 0 ? (
            <p className="muted">No portfolio items yet. Add your past work to attract customers.</p>
          ) : (
            <ul className="portfolio-list">
              {portfolio.map((item) => (
                <li key={item._id} className="portfolio-item">
                  {item.imageUrls[0] && (
                    <img src={item.imageUrls[0]} alt={item.title} className="portfolio-thumb" />
                  )}
                  <div className="portfolio-info">
                    <strong>{item.title}</strong>
                    {item.description && <p className="muted">{item.description}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleDeletePortfolio(item._id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddPortfolio} className="portfolio-form">
            <h3>Add portfolio item</h3>
            <div className="input-group">
              <label htmlFor="p-title">Title</label>
              <input
                id="p-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Kitchen renovation"
              />
            </div>
            <div className="input-group">
              <label htmlFor="p-desc">Description</label>
              <textarea
                id="p-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="input-group">
              <label htmlFor="p-img">Image URL</label>
              <input
                id="p-img"
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
              Add item
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
