'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { categoriesApi, providersApi, type Category, type ProviderProfile, type SearchParams } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useFavorites } from '../lib/useFavorites';
import ProviderCard from '../components/ProviderCard';
import { ProviderCardSkeleton, EmptyState, Avatar } from '../components/ui';
import { categoryEmoji, providerName, providerPhoto } from '../lib/format';
import { ETHIOPIAN_CITIES } from '../lib/ethiopianCities';
import {
  IconSearch, IconMapPin, IconShieldCheck, IconStar, IconBolt, IconUsers,
  IconSparkle, IconArrowRight, IconCheckCircle, IconPhone, IconTrending,
  IconWrench, IconZap, IconPaintbrush, IconHammer, IconTree, IconCamera,
  IconTruck, IconScissors, IconActivity, IconDroplets, IconSun, IconWifi,
} from '../components/icons';

const ProvidersMap = dynamic(() => import('../components/ProvidersMap'), {
  ssr: false,
  loading: () => <div className="card" style={{ height: 420 }} />,
});

interface Props {
  initialProviders?: ProviderProfile[];
  initialCategories?: Category[];
}

/* ── Curated featured services shown on landing ── */
const FEATURED_SERVICES = [
  { icon: <IconWrench />, label: 'Plumbing', desc: 'Leaks, pipes & installation', color: '#0ea5e9', bg: '#e0f2fe' },
  { icon: <IconZap />,    label: 'Electrical', desc: 'Wiring, panels & safety', color: '#f59e0b', bg: '#fef3c7' },
  { icon: <IconPaintbrush />, label: 'Painting', desc: 'Interior & exterior paint', color: '#8b5cf6', bg: '#ede9fe' },
  { icon: <IconDroplets />,   label: 'Cleaning', desc: 'Home & office cleaning', color: '#3b82f6', bg: '#dbeafe' },
  { icon: <IconHammer />,     label: 'Carpentry', desc: 'Custom woodwork & repairs', color: '#d97706', bg: '#fef9c3' },
  { icon: <IconTree />,       label: 'Landscaping', desc: 'Gardens & lawn care', color: '#16a34a', bg: '#dcfce7' },
  { icon: <IconTruck />,      label: 'Moving', desc: 'Local & long-distance', color: '#6366f1', bg: '#e0e7ff' },
  { icon: <IconActivity />,   label: 'Healthcare', desc: 'Nursing & home care', color: '#14b8a6', bg: '#ccfbf1' },
];

const STEPS = [
  {
    icon: <IconSearch />,
    t: 'Search',
    d: 'Tell us what you need and where. Browse verified pros by category, rating, and distance.',
    num: '01',
  },
  {
    icon: <IconPhone />,
    t: 'Connect',
    d: 'Compare profiles and real reviews, then message or call the right person — for free.',
    num: '02',
  },
  {
    icon: <IconCheckCircle />,
    t: 'Get it done',
    d: 'Agree on the details, get the job done right, then leave a review for your neighbours.',
    num: '03',
  },
];

const TRUST_STATS = [
  { value: '10k+', label: 'Verified pros', icon: <IconShieldCheck /> },
  { value: '4.9★', label: 'Average rating', icon: <IconStar style={{ color: '#f59e0b' }} /> },
  { value: '50k+', label: 'Jobs completed', icon: <IconCheckCircle /> },
  { value: '120+', label: 'Service types', icon: <IconBolt /> },
];

const TESTIMONIALS = [
  {
    q: "Found a plumber within the hour and the leak was fixed by evening. Genuinely the easiest booking I've ever done.",
    n: 'Sarah M.', r: 'Homeowner', initials: 'SM', clr: '#4f46e5',
  },
  {
    q: "As an electrician, half my new jobs now come through Servio. The verification badge builds instant trust with customers.",
    n: 'Bright Volt', r: 'Service provider', initials: 'BV', clr: '#f59e0b',
  },
  {
    q: "Loved being able to see ratings and message before committing. No spam calls, no guesswork — just great service.",
    n: 'Daniel K.', r: 'Customer', initials: 'DK', clr: '#16a34a',
  },
];

/* ── Animated counter ── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / 50;
      const id = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(id); }
        else setVal(Math.floor(start));
      }, 30);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Intersection-observer reveal wrapper ── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home({ initialProviders = [], initialCategories = [] }: Props) {
  const toast = useToast();
  const fav = useFavorites();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [providers, setProviders] = useState<ProviderProfile[]>(initialProviders);
  const [categoryId, setCategoryId] = useState('');
  const [minRating, setMinRating] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState('');
  const [locating, setLocating] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const appliedServiceRef = useRef('');
  const searchParams = useSearchParams();
  const requestedService = searchParams.get('service')?.trim() ?? '';

  useEffect(() => {
    if (initialCategories.length) return;
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, [initialCategories.length]);

  const runSearch = useCallback(() => {
    setLoading(true);
    const params: SearchParams = { limit: requestedService ? 100 : 6 };
    if (categoryId) params.categoryId = categoryId;
    if (minRating) params.minRating = Number(minRating);
    if (coords) {
      params.latitude = coords.lat;
      params.longitude = coords.lng;
      params.maxDistanceKm = 50;
    } else if (city) {
      params.cityName = city;
    }
    providersApi.search(params)
      .then(setProviders)
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [categoryId, minRating, coords, city, requestedService]);

  const seeded = useRef(initialProviders.length > 0);
  useEffect(() => {
    if (seeded.current) { seeded.current = false; return; }
    runSearch();
  }, [runSearch]);

  // The Services menu links here with a readable service name. Resolve it to a
  // real category after the categories have loaded, then retrieve every match.
  useEffect(() => {
    if (!requestedService) { appliedServiceRef.current = ''; return; }
    if (categories.length === 0) return;
    const matchingCategory = categories.find((item) => item.name.toLowerCase() === requestedService.toLowerCase());
    const nextCategoryId = matchingCategory?._id ?? '';
    if (appliedServiceRef.current !== requestedService && categoryId !== nextCategoryId) {
      appliedServiceRef.current = requestedService;
      setCategoryId(nextCategoryId);
      return;
    }
    appliedServiceRef.current = requestedService;
    runSearch();
  }, [requestedService, categories, categoryId, runSearch]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCity('');
        setLocating(false);
        toast.success('Showing providers near you');
      },
      () => { setLocating(false); toast.error('Could not get your location'); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const selectCity = (name: string) => {
    setCity(name);
    const selected = ETHIOPIAN_CITIES.find((item) => item.name === name);
    setCoords(selected ? { lat: selected.lat, lng: selected.lng } : null);
  };

  const selectCategory = (id: string) => {
    setCategoryId(id);
    setView('list');
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const { avgRating, totalReviews } = useMemo(() => {
    const rated = providers.filter((p) => p.reviewCount > 0);
    const total = providers.reduce((s, p) => s + (p.reviewCount || 0), 0);
    const avg = rated.length ? rated.reduce((s, p) => s + p.ratingAverage, 0) / rated.length : 0;
    return { avgRating: avg, totalReviews: total };
  }, [providers]);

  const proofAvatars = providers.slice(0, 4);

  return (
    <div>

      {/* ═══════════════════════════════════════════════════════ HERO */}
      <section className="hero" aria-label="Hero">
        {/* Animated background orbs */}
        <span className="hero-orb hero-orb-1" aria-hidden />
        <span className="hero-orb hero-orb-2" aria-hidden />
        <span className="hero-orb hero-orb-3" aria-hidden />
        {/* Dot grid overlay */}
        <span className="hero-dots" aria-hidden />

        <div className="hero-inner">
          {/* Eyebrow badge */}
          <div className="hero-badge">
            <IconSparkle style={{ width: 14, height: 14 }} />
            <span>Trusted by 50,000+ customers</span>
          </div>

          {/* Headline */}
          <h1 className="hero-h1">
            Find local <span className="hero-accent">experts</span><br />
            for every job
          </h1>
          <p className="hero-sub">
            Browse ID-verified service providers near you — compare ratings,
            message directly, and get the job done with confidence.
          </p>

          {/* Search bar */}
          <div className="hero-search" role="search">
            <div className="hs-field grow">
              <IconSearch className="hs-ic" />
              <select
                className="hs-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label="Service category"
              >
                <option value="">What service do you need?</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
              <div className="hs-sep" aria-hidden />
              <div className="hs-field hs-city-field">
                <IconMapPin className="hs-ic" />
                <select
                  className="hs-select"
                  value={city}
                  onChange={(e) => selectCity(e.target.value)}
                  aria-label="Choose a city"
                >
                  <option value="">Choose a city</option>
                  {ETHIOPIAN_CITIES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </div>
              <div className="hs-sep" aria-hidden />
              <button
              className={`hs-loc${coords ? ' hs-loc-active' : ''}`}
              onClick={useMyLocation}
              disabled={locating}
              aria-label="Use my location"
            >
              <IconMapPin style={{ width: 18, height: 18 }} />
              <span>{locating ? 'Locating…' : city || (coords ? 'Near you' : 'Near me')}</span>
            </button>
            <button className="hs-btn" onClick={runSearch} aria-label="Search">
              <IconSearch style={{ width: 18, height: 18 }} />
              <span>Search</span>
            </button>
          </div>

          {/* Social proof bar */}
          <div className="hero-proof">
            {proofAvatars.length > 0 && (
              <div className="avatar-stack">
                {proofAvatars.map((p) => (
                  <Avatar key={p._id} name={providerName(p)} src={providerPhoto(p)} size="sm" />
                ))}
              </div>
            )}
            <div className="hero-proof-text">
              <div className="hp-stars" aria-hidden>★★★★★</div>
              <span>
                {avgRating
                  ? <><b>{avgRating.toFixed(1)}/5</b> from {totalReviews.toLocaleString()}+ reviews</>
                  : 'Loved by customers everywhere'}
              </span>
            </div>
            <div className="hero-pill"><IconShieldCheck style={{ width: 14, height: 14 }} /> All providers verified</div>
          </div>
        </div>

        {/* Floating service chips */}
        <div className="hero-chips" aria-hidden>
          {FEATURED_SERVICES.slice(0, 6).map((s, i) => (
            <span key={s.label} className={`hero-chip hc-${i}`} style={{ '--hc-clr': s.color } as React.CSSProperties}>
              {s.icon}{s.label}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ TRUST STATS */}
      <section className="stats-bar" aria-label="Platform statistics">
        <div className="stats-inner">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-page">

        {/* ══════════════════════════════════════════ FEATURED SERVICES */}
        <Reveal className="lp-section">
          <div className="sec-head">
            <div>
              <span className="sec-eyebrow">What we offer</span>
              <h2 className="sec-title">Popular services</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => selectCategory('')}>
              All categories <IconArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>

          <div className="services-grid">
            {FEATURED_SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={i * 60}>
                <button
                  className="svc-card"
                  onClick={() => selectCategory(categories.find((c) => c.name.toLowerCase() === s.label.toLowerCase())?._id ?? '')}
                  style={{ '--svc-color': s.color, '--svc-bg': s.bg } as React.CSSProperties}
                >
                  <span className="svc-icon">{s.icon}</span>
                  <span className="svc-label">{s.label}</span>
                  <span className="svc-desc">{s.desc}</span>
                  <span className="svc-arrow"><IconArrowRight /></span>
                </button>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ═══════════════════════════════════════════════ PROVIDERS GRID */}
        <div ref={resultsRef} style={{ scrollMarginTop: 80 }}>
          <Reveal className="lp-section">
            <div className="sec-head" style={{ marginBottom: 16 }}>
              <div>
                <span className="sec-eyebrow">Top rated</span>
                <h2 className="sec-title">
                  {requestedService ? `${requestedService} professionals` : coords ? 'Providers near you' : categoryId ? 'Matching providers' : 'Featured providers'}
                </h2>
              </div>
              <div className="top-rated-controls">
                <select className="select top-category-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Top rated service category">
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {/* Rating filter */}
                <div className="input-icon" style={{ width: 160 }}>
                  <IconStar style={{ width: 16, height: 16, color: '#f59e0b' }} />
                  <select className="select" value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Minimum rating">
                    <option value="">Any rating</option>
                    <option value="4">4★ &amp; up</option>
                    <option value="4.5">4.5★ &amp; up</option>
                    <option value="5">5★ only</option>
                  </select>
                </div>
                {/* View toggle */}
                <div className="view-toggle">
                  <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')}>List</button>
                  <button className={`btn btn-sm ${view === 'map' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('map')}>
                    <IconMapPin style={{ width: 15, height: 15 }} /> Map
                  </button>
                </div>
              </div>
            </div>

            {/* Keep the landing page focused: three quick picks, with every category in the dropdown above. */}
            {categories.length > 0 && (
              <div className="cat-scroll mb-16" aria-label="Popular service categories">
                {categories.slice(0, 3).map((c) => (
                  <button key={c._id} className={`chip${categoryId === c._id ? ' active' : ''}`} onClick={() => setCategoryId(c._id)}>{c.name}</button>
                ))}
              </div>
            )}

            {requestedService && (
              <div className="service-results-intro">
                <span className="service-results-mark"><IconSparkle /></span>
                <div>
                  <strong>Explore {requestedService} services</strong>
                  <p>Browse every available professional, compare their experience and ratings, and see exactly what each provider offers.</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-providers">
                {Array.from({ length: 6 }).map((_, i) => <ProviderCardSkeleton key={i} />)}
              </div>
            ) : providers.length === 0 ? (
              <div className="card card-pad">
                <EmptyState icon={<IconSearch />} title="No providers found">
                  Try a different category or clear your filters. Verified providers appear here as they join.
                </EmptyState>
              </div>
            ) : view === 'map' ? (
              <ProvidersMap providers={providers} userCoords={coords} />
            ) : (
              <div className="grid grid-providers">
                {providers.map((p) => (
                  <ProviderCard
                    key={p._id}
                    provider={p}
                    favorited={fav.enabled ? fav.ids.has(p._id) : undefined}
                    onToggleFavorite={fav.enabled ? fav.toggle : undefined}
                    showFullDescription={Boolean(requestedService)}
                  />
                ))}
              </div>
            )}
          </Reveal>
        </div>

        {/* ════════════════════════════════════════════ HOW IT WORKS */}
        <Reveal className="lp-section">
          <div className="sec-head center-head">
            <div>
              <span className="sec-eyebrow">Process</span>
              <h2 className="sec-title">Get help in three simple steps</h2>
            </div>
          </div>
          <div className="steps-row">
            {STEPS.map((s, i) => (
              <Reveal key={s.t} delay={i * 100} className="step-wrap">
                <div className="step-card">
                  <div className="step-num-badge">{s.num}</div>
                  <div className="step-icon-wrap">{s.icon}</div>
                  <h3 className="step-title">{s.t}</h3>
                  <p className="step-desc">{s.d}</p>
                </div>
                {i < STEPS.length - 1 && <div className="step-connector" aria-hidden />}
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ══════════════════════════════════════════ WHY SERVIO */}
        <Reveal className="lp-section">
          <div className="sec-head center-head">
            <div>
              <span className="sec-eyebrow">Why us</span>
              <h2 className="sec-title">Built on trust &amp; transparency</h2>
            </div>
          </div>
          <div className="trust-grid">
            {[
              { icon: <IconShieldCheck />, t: 'ID-Verified pros', d: 'Every provider is ID-checked and document-verified before going live.', clr: '#4f46e5' },
              { icon: <IconStar style={{ color: '#f59e0b' }} />, t: 'Real reviews only', d: 'Ratings come only from customers who actually contacted the provider.', clr: '#f59e0b' },
              { icon: <IconBolt />, t: 'Instant contact', d: "Reveal a provider's number or message them directly in one click.", clr: '#0ea5e9' },
              { icon: <IconUsers />, t: 'Local-first', d: 'Search by distance to find pros who actually serve your area.', clr: '#16a34a' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 80}>
                <div className="trust-card" style={{ '--tc-clr': f.clr } as React.CSSProperties}>
                  <div className="trust-icon">{f.icon}</div>
                  <h3 className="trust-title">{f.t}</h3>
                  <p className="trust-desc">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ══════════════════════════════════════════ TESTIMONIALS */}
        <Reveal className="lp-section">
          <div className="sec-head center-head">
            <div>
              <span className="sec-eyebrow">Loved locally</span>
              <h2 className="sec-title">What people are saying</h2>
            </div>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.n} delay={i * 80}>
                <figure className="testi-card">
                  <div className="testi-stars" aria-hidden>★★★★★</div>
                  <blockquote className="testi-quote">"{t.q}"</blockquote>
                  <figcaption className="testi-author">
                    <span
                      className="testi-avatar"
                      style={{ background: `linear-gradient(135deg, ${t.clr}, ${t.clr}88)` }}
                    >
                      {t.initials}
                    </span>
                    <span className="testi-meta">
                      <b>{t.n}</b>
                      <em>{t.r}</em>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ═══════════════════════════════════════════════════ CTA */}
        <Reveal className="lp-section">
          <div className="cta-band">
            <span className="cta-orb cta-orb-1" aria-hidden />
            <span className="cta-orb cta-orb-2" aria-hidden />
            <div className="cta-content">
              <span className="cta-pill">
                <IconTrending style={{ width: 14, height: 14 }} /> Grow your business
              </span>
              <h2 className="cta-title">Are you a service provider?</h2>
              <p className="cta-sub">
                Create a profile, get verified, and start receiving job requests
                from customers near you — free to join.
              </p>
              <div className="cta-actions">
                <a href="/login" className="cta-primary-btn">
                  Join as a pro <IconArrowRight style={{ width: 18, height: 18 }} />
                </a>
                <span className="cta-note"><IconShieldCheck style={{ width: 15, height: 15 }} /> No credit card required</span>
              </div>
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
