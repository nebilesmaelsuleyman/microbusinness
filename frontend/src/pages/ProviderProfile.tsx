import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { providersApi, jobsApi, leadsApi, reviewsApi, favoritesApi, portfolioApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { ProviderProfile, Review, PortfolioItem } from '../api/client';
import './ProviderProfile.css';

function getProviderName(p: ProviderProfile): string {
  const u = p.userId;
  if (typeof u === 'object' && u && 'name' in u && u.name) return u.name;
  return 'Provider';
}

function getProviderUserId(p: ProviderProfile): string {
  const u = p.userId;
  return typeof u === 'string' ? u : (u as { _id: string })._id;
}

export default function ProviderProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!userId) return;
    providersApi
      .getProfile(userId)
      .then((p) => {
        setProfile(p);
        if (p?._id) {
          reviewsApi.listByProvider(p._id).then(setReviews).catch(() => setReviews([]));
          portfolioApi.listByProvider(p._id).then(setPortfolio).catch(() => setPortfolio([]));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRequestJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !userId) return;
    setRequesting(true);
    setError('');
    try {
      await jobsApi.create({
        providerId: profile._id,
        description: jobDesc.trim() || undefined,
      });
      setShowRequest(false);
      setJobDesc('');
      navigate('/my-jobs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  const handleContact = async () => {
    if (!profile) return;
    setContacting(true);
    setError('');
    try {
      await leadsApi.contact(profile._id);
      setContacting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record contact');
      setContacting(false);
    }
  };

  const handleFavorite = async () => {
    if (!profile) return;
    try {
      if (favorited) {
        await favoritesApi.remove(profile._id);
        setFavorited(false);
      } else {
        await favoritesApi.add(profile._id);
        setFavorited(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmittingReview(true);
    setError('');
    try {
      const review = await reviewsApi.create(profile._id, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviews((prev) => [review, ...prev]);
      setReviewComment('');
      setReviewRating(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (error && !profile) return <p className="error-msg">{error}</p>;
  if (!profile) return null;

  const name = getProviderName(profile);
  const isOwnProfile = user?.id === getProviderUserId(profile);

  return (
    <div className="provider-profile">
      <div className="profile-header card">
        <h1 className="profile-name">{name}</h1>
        {profile.serviceDescription && (
          <p className="profile-desc">{profile.serviceDescription}</p>
        )}
        <div className="profile-stats">
          {profile.ratingAverage > 0 && (
            <span>★ {profile.ratingAverage.toFixed(1)} ({profile.reviewCount} reviews)</span>
          )}
          <span>Experience: {profile.yearsOfExperience} years</span>
          <span>Radius: {profile.serviceRadiusKm} km</span>
          <span>Pricing: {profile.pricingModel}</span>
        </div>
        {Array.isArray(profile.serviceCategories) && profile.serviceCategories.length > 0 && (
          <div className="profile-cats">
            {(profile.serviceCategories as { name: string }[]).map((c) => (
              <span key={c.name} className="cat-tag">{c.name}</span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}

      {token && user?.role === 'customer' && !isOwnProfile && (
        <div className="profile-actions card">
          {!showRequest ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowRequest(true)}
              >
                Request job
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleContact}
                disabled={contacting}
              >
                {contacting ? 'Recording…' : 'Contact / Save lead'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleFavorite}
              >
                {favorited ? '♥ Favorited' : '♡ Favorite'}
              </button>
              <Link to={`/messages?to=${getProviderUserId(profile)}`} className="btn btn-ghost">
                Message
              </Link>
            </>
          ) : (
            <form onSubmit={handleRequestJob}>
              <div className="input-group">
                <label htmlFor="job-desc">Message (optional)</label>
                <textarea
                  id="job-desc"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Describe what you need"
                  rows={3}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={requesting}>
                {requesting ? 'Sending…' : 'Send request'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setShowRequest(false); setError(''); }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {isOwnProfile && (
        <p className="muted">
          This is your profile. <Link to="/edit-profile">Edit it →</Link>
        </p>
      )}

      {portfolio.length > 0 && (
        <section className="profile-portfolio">
          <h2>Portfolio</h2>
          <div className="portfolio-grid">
            {portfolio.map((item) => (
              <div key={item._id} className="portfolio-card card">
                {item.imageUrls[0] && (
                  <img src={item.imageUrls[0]} alt={item.title} className="portfolio-img" />
                )}
                <h4>{item.title}</h4>
                {item.description && <p className="muted">{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="profile-reviews">
        <h2>Reviews ({reviews.length})</h2>

        {token && user?.role === 'customer' && !isOwnProfile && (
          <form onSubmit={handleSubmitReview} className="review-form card">
            <div className="input-group">
              <label htmlFor="rating">Your rating</label>
              <select
                id="rating"
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="comment">Comment (optional)</label>
              <textarea
                id="comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Share your experience"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submittingReview}>
              {submittingReview ? 'Submitting…' : 'Submit review'}
            </button>
            <p className="muted review-hint">
              You must have contacted this provider to leave a review.
            </p>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="muted">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => {
              const author = typeof r.customerId === 'object' && r.customerId
                ? (r.customerId as { name?: string }).name || 'Customer'
                : 'Customer';
              return (
                <li key={r._id} className="review-item card">
                  <div className="review-head">
                    <span className="review-stars">{'★'.repeat(r.rating)}</span>
                    <span className="review-author">{author}</span>
                    <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
