import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../api/client';
import type { Favorite, ProviderProfile } from '../api/client';
import './Favorites.css';

function getProviderInfo(f: Favorite) {
  const p = f.providerId;
  if (!p || typeof p === 'string') return { name: 'Provider', desc: '', userId: null };
  const profile = p as ProviderProfile;
  const u = profile.userId;
  const name = typeof u === 'object' && u && 'name' in u && u.name ? u.name : 'Provider';
  const userId = typeof u === 'object' && u && '_id' in u ? u._id : typeof u === 'string' ? u : null;
  return { name, desc: profile.serviceDescription, userId, rating: profile.ratingAverage };
}

export default function Favorites() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    favoritesApi.list().then(setFavs).catch(() => setFavs([])).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (providerId: string, favId: string) => {
    setRemoving(favId);
    try {
      await favoritesApi.remove(providerId);
      setFavs((prev) => prev.filter((f) => f._id !== favId));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return <p className="muted">Loading favorites…</p>;

  return (
    <div className="favorites-page">
      <h1 className="page-title">Favorites</h1>
      {favs.length === 0 ? (
        <p className="muted">
          No favorites yet. <Link to="/">Browse providers</Link> and save the ones you like.
        </p>
      ) : (
        <ul className="fav-list">
          {favs.map((f) => {
            const info = getProviderInfo(f);
            const providerId = typeof f.providerId === 'string' ? f.providerId : (f.providerId as ProviderProfile)._id;
            return (
              <li key={f._id} className="fav-card card">
                <div className="fav-main">
                  <h3 className="fav-name">{info.name}</h3>
                  {info.desc && <p className="fav-desc">{info.desc}</p>}
                  {info.rating !== undefined && info.rating > 0 && (
                    <span className="fav-rating">★ {info.rating.toFixed(1)}</span>
                  )}
                </div>
                <div className="fav-actions">
                  {info.userId && (
                    <Link to={`/provider/${info.userId}`} className="btn btn-primary">
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleRemove(providerId, f._id)}
                    disabled={removing === f._id}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
