'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from '@/lib/router-compat';
import {
  providersApi, reviewsApi, jobsApi, leadsApi,
  type ProviderProfile as TProfile, type Review, type Job,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFavorites } from '../lib/useFavorites';
import {
  providerName, providerUserId, providerPhoto, categoryNames,
  PRICING_LABEL, relativeTime, userName,
} from '../lib/format';
import { Avatar, Stars, StarsInput, Modal, Field, PageLoader, EmptyState } from '../components/ui';
import {
  IconShieldCheck, IconStar, IconBriefcase, IconMapPin, IconDollar,
  IconPhone, IconHeart, IconHeartFill, IconUser, IconInbox,
} from '../components/icons';

interface Props {
  userId?: string;
  initialProfile?: TProfile | null;
  initialReviews?: Review[];
}

export default function ProviderProfile({ userId: userIdProp, initialProfile = null, initialReviews = [] }: Props = {}) {
  const params = useParams<{ userId: string }>();
  const userId = userIdProp ?? params.userId;
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const toast = useToast();
  const fav = useFavorites();

  const [profile, setProfile] = useState<TProfile | null>(initialProfile);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(!initialProfile);
  const [notFound, setNotFound] = useState(false);

  // modals
  const [showRequest, setShowRequest] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  // request form
  const [jobDesc, setJobDesc] = useState('');
  const [jobDate, setJobDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contacting, setContacting] = useState(false);

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewJobId, setReviewJobId] = useState('');

  // Server already provided the first render's data; only fetch on the client
  // when it wasn't (client-side navigation) or when the id changes.
  const seeded = useRef(Boolean(initialProfile));
  useEffect(() => {
    if (!userId) return;
    if (seeded.current) { seeded.current = false; return; }
    setLoading(true);
    setNotFound(false);
    providersApi.getProfile(userId)
      .then((p) => {
        setProfile(p);
        return reviewsApi.byProvider(p._id).then(setReviews).catch(() => setReviews([]));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!token || user?.role !== 'customer' || !profile) {
      setJobs([]);
      return;
    }

    jobsApi.myList()
      .then((list) => setJobs(list))
      .catch(() => setJobs([]));
  }, [token, user?.role, profile]);

  if (loading) return <div className="page"><PageLoader /></div>;
  if (notFound || !profile) {
    return (
      <div className="page">
        <div className="card card-pad">
          <EmptyState icon={<IconUser />} title="Provider not found">
            This profile may have been removed or isn’t verified yet. <Link to="/">Browse providers</Link>.
          </EmptyState>
        </div>
      </div>
    );
  }

  const name = providerName(profile);
  const cats = categoryNames(profile);
  const verified = profile.verificationStatus === 'approved';
  const isOwn = user?.id === providerUserId(profile);
  const canAct = token && user?.role === 'customer' && !isOwn;
  const reviewableJobs = jobs.filter((j) => {
    const providerRef = j.providerId;
    const providerMatches = typeof providerRef === 'string'
      ? providerRef === profile._id
      : providerRef?._id === profile._id;
    return providerMatches && j.status === 'completed' && j.paymentStatus === 'paid';
  });
  const canReview = canAct && reviewableJobs.length > 0;

  const requireCustomer = (): boolean => {
    if (!token) { toast.error('Please sign in to continue'); navigate('/login'); return false; }
    if (user?.role !== 'customer') { toast.error('Only customers can do this'); return false; }
    return true;
  };

  const handleContact = async () => {
    if (!requireCustomer()) return;
    setContacting(true);
    try {
      const res = await leadsApi.contact(profile._id);
      setRevealedPhone(res.phoneNumber);
      toast.success('Contact unlocked — you can now leave a review too');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not contact provider');
    } finally {
      setContacting(false);
    }
  };

  const openReview = () => {
    if (!canReview) {
      toast.error('Complete and pay for a job before leaving a review');
      return;
    }
    setReviewJobId(reviewableJobs[0]?._id ?? '');
    setShowReview(true);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireCustomer()) return;
    setSubmitting(true);
    try {
      await jobsApi.create({
        providerId: profile._id,
        description: jobDesc.trim() || undefined,
        scheduledDate: jobDate || undefined,
      });
      setShowRequest(false);
      setJobDesc(''); setJobDate('');
      toast.success('Job request sent!');
      navigate('/my-jobs');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireCustomer()) return;
    setSubmitting(true);
    try {
      if (!reviewJobId) throw new Error('Please choose a completed job');
      await reviewsApi.create(profile._id, { jobId: reviewJobId, rating, comment: comment.trim() || undefined });
      const fresh = await reviewsApi.byProvider(profile._id);
      setReviews(fresh);
      const updated = await providersApi.getProfile(userId!).catch(() => null);
      if (updated) setProfile(updated);
      setShowReview(false); setComment(''); setRating(5);
      toast.success('Thanks for your review!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not submit review';
      toast.error(msg.toLowerCase().includes('lead') || msg.toLowerCase().includes('forbidden')
        ? 'You can review a provider only after a completed and paid job'
        : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const favorited = fav.enabled && fav.ids.has(profile._id);

  return (
    <div className="page">
      <div className="profile-grid">
        {/* Main column */}
        <div className="stack gap-24">
          <div className="card card-pad">
            <div className="profile-hero">
              <Avatar name={name} src={providerPhoto(profile)} size="xl" />
              <div className="ph-main">
                <h1 className="profile-name">
                  {name}
                  {verified && <span className="badge badge-verified"><IconShieldCheck /> Verified</span>}
                </h1>
                <div className="pcard-rating" style={{ marginTop: 8 }}>
                  {profile.reviewCount > 0 ? (
                    <>
                      <Stars value={profile.ratingAverage} />
                      <span className="rating-num">{profile.ratingAverage.toFixed(1)}</span>
                      <span className="muted">· {profile.reviewCount} review{profile.reviewCount !== 1 ? 's' : ''}</span>
                    </>
                  ) : <span className="muted">New on Servio — no reviews yet</span>}
                </div>
                <div className="profile-metarow">
                  <span className="mItem"><IconBriefcase /> {profile.yearsOfExperience} yrs experience</span>
                  <span className="mItem"><IconMapPin /> {profile.serviceRadiusKm} km radius</span>
                  <span className="mItem"><IconDollar /> {PRICING_LABEL[profile.pricingModel]}</span>
                </div>
              </div>
            </div>

            {cats.length > 0 && (
              <>
                <hr className="divider-h" />
                <div className="row wrap gap-8">
                  {cats.map((c) => <span key={c} className="tag">{c}</span>)}
                </div>
              </>
            )}
          </div>

          <div className="card card-pad">
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>About</h2>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
              {profile.serviceDescription || 'This provider hasn’t written a description yet.'}
            </p>
          </div>

          <div className="card card-pad">
            <div className="section-head" style={{ marginBottom: 4 }}>
              <h2 style={{ fontSize: 18 }}>Reviews {profile.reviewCount > 0 && <span className="muted">({profile.reviewCount})</span>}</h2>
              {canAct && <button className="btn btn-ghost btn-sm" onClick={openReview} disabled={!canReview}><IconStar style={{ width: 15, height: 15 }} /> Write a review</button>}
            </div>
            {canAct && !canReview && (
              <div className="banner banner-info mb-12">
                <IconStar /> Complete and pay for a job first, then the review form will unlock.
              </div>
            )}
            {reviews.length === 0 ? (
              <EmptyState icon={<IconStar />} title="No reviews yet">
                Be the first to review this provider after a completed and paid job.
              </EmptyState>
            ) : (
              <div>
                {reviews.map((r) => (
                  <div key={r._id} className="review">
                    <div className="review-head">
                      <Avatar name={userName(r.customerId, 'Customer')} size="sm" />
                      <div className="grow">
                        <div className="review-author">{userName(r.customerId, 'Customer')}</div>
                        <div className="review-date">{relativeTime(r.createdAt)}</div>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="review-body">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action sidebar */}
        <aside className="profile-aside">
          <div className="card card-pad stack gap-12">
            {isOwn ? (
              <>
                <div className="banner banner-info"><IconUser /> This is your public profile.</div>
                <Link to="/dashboard/profile" className="btn btn-primary btn-block">Edit profile</Link>
              </>
            ) : !token ? (
              <>
                <h3 style={{ fontSize: 17 }}>Interested in {name.split(' ')[0]}?</h3>
                <p className="muted small" style={{ margin: 0 }}>Sign in to contact this provider or request a job.</p>
                <Link to="/login" className="btn btn-primary btn-block">Sign in to continue</Link>
              </>
            ) : user?.role !== 'customer' ? (
              <div className="banner banner-info"><IconUser /> Switch to a customer account to contact providers.</div>
            ) : (
              <>
                <h3 style={{ fontSize: 17 }}>Get this done</h3>
                {revealedPhone ? (
                  <a href={`tel:${revealedPhone}`} className="btn btn-success btn-block"><IconPhone /> {revealedPhone}</a>
                ) : (
                  <button className="btn btn-dark btn-block" onClick={handleContact} disabled={contacting}>
                    <IconPhone /> {contacting ? 'Unlocking…' : 'Reveal contact'}
                  </button>
                )}
                <button className="btn btn-primary btn-block" onClick={() => setShowRequest(true)}>
                  <IconBriefcase /> Request a job
                </button>
                <button className="btn btn-soft btn-block" onClick={() => navigate(`/messages?to=${userId}&name=${encodeURIComponent(name)}`)}>
                  <IconInbox /> Message
                </button>
                <button className={`btn btn-ghost btn-block${favorited ? ' btn-danger' : ''}`} onClick={() => fav.toggle(profile)} disabled={fav.busy === profile._id}>
                  {favorited ? <><IconHeartFill /> Saved</> : <><IconHeart /> Save provider</>}
                </button>
                <p className="tiny muted center" style={{ margin: '4px 0 0' }}>It’s free to contact. No booking fees.</p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Request job modal */}
      {showRequest && (
        <Modal title={`Request a job from ${name.split(' ')[0]}`} onClose={() => setShowRequest(false)}>
          <form onSubmit={handleRequest}>
            <Field label="What do you need?" hint="Describe the job so the provider can prepare a response.">
              <textarea className="textarea" value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="e.g. Fix a leaking kitchen tap and check the bathroom plumbing." rows={4} />
            </Field>
            <Field label="Preferred date (optional)">
              <input className="input" type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} />
            </Field>
            <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</button>
          </form>
        </Modal>
      )}

      {/* Review modal */}
      {showReview && (
        <Modal title={`Review ${name.split(' ')[0]}`} onClose={() => setShowReview(false)}>
          <form onSubmit={handleReview}>
            <Field label="Job to review" hint="Pick the completed job that this review belongs to.">
              <select className="input" value={reviewJobId} onChange={(e) => setReviewJobId(e.target.value)}>
                {reviewableJobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.description ? job.description.slice(0, 60) : 'Completed job'} · {job._id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Your rating">
              <StarsInput value={rating} onChange={setRating} />
            </Field>
            <Field label="Comment (optional)">
              <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details of your experience…" rows={4} />
            </Field>
            <div className="banner banner-info" style={{ marginBottom: 14 }}><IconStar /> You can review a provider only after the job is completed and payment is confirmed.</div>
            <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit review'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
