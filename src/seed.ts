/* ==========================================================================
 * Database seed script — populates the marketplace with realistic mock data.
 *
 *   npm run seed            # build + seed (default DB from .env)
 *
 * It boots a standalone Nest application context (so every Mongoose model is
 * registered exactly as the app registers it), wipes the seeded collections,
 * and inserts a coherent graph of categories → providers → reviews → jobs.
 *
 * Safe to run repeatedly: it clears the collections it owns before inserting.
 * It never touches OTP sessions.
 * ========================================================================== */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from './app.module';

import { User } from './users/schemas/user.schema';
import { ServiceCategory } from './categories/schemas/service-category.schema';
import { ProviderProfile } from './providers/schemas/provider-profile.schema';
import { ProviderVerificationDocument } from './providers/schemas/provider-verification-document.schema';
import { Review } from './reviews/schemas/review.schema';
import { SubscriptionPlan } from './subscriptions/schemas/subscription-plan.schema';
import { ProviderSubscription } from './subscriptions/schemas/provider-subscription.schema';
import { Lead } from './leads/schemas/lead.schema';
import { JobRequest } from './jobs/schemas/job-request.schema';
import { Favorite } from './favorites/schemas/favorite.schema';
import {
  UserRole,
  PricingModel,
  VerificationStatus,
  JobStatus,
} from './common/enums';

/* Deterministic pseudo-random so reruns produce the same believable data. */
let seedState = 0x2f6e2b1;
const rand = () => {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const round = (n: number, d = 1) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

/* All providers cluster around New York City so geo-search returns results. */
const NYC = { lat: 40.7128, lng: -74.006 };
const jitterCoord = (base: number) => round(base + (rand() - 0.5) * 0.6, 4);

/* ----------------------------------------------------------------- Catalog */

const CATEGORIES: Array<{ name: string; description: string }> = [
  { name: 'Plumbing', description: 'Leaks, installations, drains and pipe repair.' },
  { name: 'Electrical', description: 'Wiring, fixtures, panels and electrical repair.' },
  { name: 'House Cleaning', description: 'Home, deep and move-out cleaning services.' },
  { name: 'Landscaping', description: 'Lawn care, garden design and yard maintenance.' },
  { name: 'Painting', description: 'Interior and exterior residential painting.' },
  { name: 'Carpentry', description: 'Custom woodwork, framing and furniture repair.' },
  { name: 'HVAC', description: 'Heating, ventilation and air-conditioning service.' },
  { name: 'Appliance Repair', description: 'Refrigerators, washers, dryers and ovens.' },
  { name: 'Moving & Hauling', description: 'Local moving, packing and junk removal.' },
  { name: 'Pest Control', description: 'Insect, rodent and termite treatment.' },
  { name: 'Roofing', description: 'Roof repair, replacement and inspections.' },
  { name: 'Handyman', description: 'General home repairs and odd jobs.' },
  { name: 'Tutoring', description: 'Academic tutoring and test preparation.' },
  { name: 'Photography', description: 'Events, portraits and product photography.' },
  { name: 'Catering', description: 'Private chefs, events and meal catering.' },
  { name: 'Hair & Beauty', description: 'Hairstyling, makeup and beauty services.' },
  { name: 'Personal Training', description: 'Fitness coaching and personal training.' },
  { name: 'Pet Care', description: 'Dog walking, grooming and pet sitting.' },
  { name: 'Auto Repair', description: 'Mobile mechanics and vehicle maintenance.' },
  { name: 'Web & Design', description: 'Websites, branding and graphic design.' },
];

/* Provider seed records. category = name from CATEGORIES; extras optional. */
const PROVIDERS: Array<{
  name: string;
  phone: string;
  category: string;
  extra?: string;
  description: string;
  years: number;
  pricing: PricingModel;
  rating: number;
  reviews: number;
}> = [
  { name: 'Mario Rossi', phone: '+15551010001', category: 'Plumbing', description: 'Licensed master plumber. Same-day leak and water-heater repair.', years: 14, pricing: PricingModel.HOURLY, rating: 4.9, reviews: 132 },
  { name: 'Quick Flow Plumbing', phone: '+15551010002', category: 'Plumbing', extra: 'Handyman', description: 'Emergency plumbing, drain cleaning and fixture installs.', years: 8, pricing: PricingModel.QUOTE, rating: 4.6, reviews: 74 },
  { name: 'Sparky Electric Co.', phone: '+15551010003', category: 'Electrical', description: 'Residential & commercial electrical, panel upgrades, EV chargers.', years: 11, pricing: PricingModel.QUOTE, rating: 4.8, reviews: 98 },
  { name: 'Bright Volt Electricians', phone: '+15551010004', category: 'Electrical', description: 'Lighting design, smart-home wiring and safety inspections.', years: 6, pricing: PricingModel.HOURLY, rating: 4.5, reviews: 41 },
  { name: 'Sparkle Home Cleaning', phone: '+15551010005', category: 'House Cleaning', description: 'Eco-friendly deep cleaning and recurring home service.', years: 5, pricing: PricingModel.FIXED, rating: 4.7, reviews: 156 },
  { name: 'Maria Gomez', phone: '+15551010006', category: 'House Cleaning', description: 'Detail-oriented move-in / move-out and Airbnb turnovers.', years: 9, pricing: PricingModel.FIXED, rating: 4.9, reviews: 203 },
  { name: 'GreenScape Landscaping', phone: '+15551010007', category: 'Landscaping', description: 'Full-service lawn care, garden design and seasonal cleanup.', years: 12, pricing: PricingModel.QUOTE, rating: 4.6, reviews: 67 },
  { name: 'Perfect Coat Painting', phone: '+15551010008', category: 'Painting', extra: 'Carpentry', description: 'Interior & exterior painting with a 3-year workmanship warranty.', years: 10, pricing: PricingModel.QUOTE, rating: 4.8, reviews: 89 },
  { name: 'David Chen Carpentry', phone: '+15551010009', category: 'Carpentry', description: 'Custom cabinetry, built-ins and fine finish carpentry.', years: 16, pricing: PricingModel.QUOTE, rating: 5.0, reviews: 54 },
  { name: 'Cool Air HVAC', phone: '+15551010010', category: 'HVAC', description: 'AC install & repair, furnace tune-ups, 24/7 emergency service.', years: 13, pricing: PricingModel.HOURLY, rating: 4.7, reviews: 112 },
  { name: 'FixIt Appliance Repair', phone: '+15551010011', category: 'Appliance Repair', description: 'Same-day repair for all major appliance brands.', years: 7, pricing: PricingModel.HOURLY, rating: 4.4, reviews: 38 },
  { name: 'Two Guys Moving', phone: '+15551010012', category: 'Moving & Hauling', description: 'Careful local movers, packing supplies and junk hauling.', years: 6, pricing: PricingModel.HOURLY, rating: 4.5, reviews: 71 },
  { name: 'Shield Pest Control', phone: '+15551010013', category: 'Pest Control', description: 'Safe, family-friendly pest, rodent and termite treatment.', years: 9, pricing: PricingModel.FIXED, rating: 4.6, reviews: 60 },
  { name: 'Summit Roofing', phone: '+15551010014', category: 'Roofing', description: 'Roof repair, full replacement and free drone inspections.', years: 15, pricing: PricingModel.QUOTE, rating: 4.8, reviews: 47 },
  { name: 'Handy Andy', phone: '+15551010015', category: 'Handyman', extra: 'Plumbing', description: 'Your go-to for mounting, assembly and small home repairs.', years: 4, pricing: PricingModel.HOURLY, rating: 4.7, reviews: 185 },
  { name: 'BrightMind Tutoring', phone: '+15551010016', category: 'Tutoring', description: 'Math, science and SAT/ACT prep — in-home or online.', years: 8, pricing: PricingModel.HOURLY, rating: 4.9, reviews: 92 },
  { name: 'Lens & Light Photography', phone: '+15551010017', category: 'Photography', description: 'Weddings, portraits and product photography.', years: 10, pricing: PricingModel.FIXED, rating: 4.8, reviews: 64 },
  { name: 'Bella Cucina Catering', phone: '+15551010018', category: 'Catering', description: 'Private chef and event catering, Italian & Mediterranean.', years: 12, pricing: PricingModel.QUOTE, rating: 4.7, reviews: 39 },
  { name: 'Glow Hair & Beauty', phone: '+15551010019', category: 'Hair & Beauty', description: 'Mobile hairstyling, bridal makeup and beauty for any event.', years: 7, pricing: PricingModel.FIXED, rating: 4.9, reviews: 128 },
  { name: 'PeakFit Personal Training', phone: '+15551010020', category: 'Personal Training', description: 'Certified trainer — strength, weight-loss and mobility.', years: 9, pricing: PricingModel.HOURLY, rating: 5.0, reviews: 73 },
  { name: 'Happy Tails Pet Care', phone: '+15551010021', category: 'Pet Care', description: 'Insured dog walking, grooming and overnight pet sitting.', years: 5, pricing: PricingModel.FIXED, rating: 4.8, reviews: 144 },
  { name: 'Mobile Mike Auto Repair', phone: '+15551010022', category: 'Auto Repair', description: 'Mobile mechanic — brakes, batteries and diagnostics at home.', years: 11, pricing: PricingModel.QUOTE, rating: 4.6, reviews: 58 },
  { name: 'Pixel Forge Web & Design', phone: '+15551010023', category: 'Web & Design', description: 'Small-business websites, branding and logo design.', years: 6, pricing: PricingModel.QUOTE, rating: 4.7, reviews: 31 },
  { name: 'Elena Petrov', phone: '+15551010024', category: 'House Cleaning', extra: 'Pet Care', description: 'Trusted recurring cleaning with pet-friendly products.', years: 8, pricing: PricingModel.FIXED, rating: 4.5, reviews: 49 },
];

const CUSTOMERS: Array<{ name: string; phone: string }> = [
  { name: 'James Wilson', phone: '+15552020001' },
  { name: 'Sophia Martinez', phone: '+15552020002' },
  { name: 'Liam Johnson', phone: '+15552020003' },
  { name: 'Olivia Brown', phone: '+15552020004' },
  { name: 'Noah Davis', phone: '+15552020005' },
  { name: 'Emma Taylor', phone: '+15552020006' },
];

const REVIEW_COMMENTS = [
  'Fantastic work, showed up on time and very professional.',
  'Great communication and fair pricing. Highly recommend!',
  'Did exactly what was asked and cleaned up afterwards.',
  'Friendly, efficient and the result looks amazing.',
  'Saved the day — quick response and quality work.',
  'Will definitely hire again. Five stars.',
  'Good job overall, would have liked a bit faster scheduling.',
  'Knowledgeable and honest. No upselling at all.',
];

const PLANS = [
  { name: 'Starter', price: 0, leadLimit: 5, visibilityBoost: false, durationDays: 30 },
  { name: 'Professional', price: 29, leadLimit: 50, visibilityBoost: true, durationDays: 30 },
  { name: 'Premium', price: 79, leadLimit: 200, visibilityBoost: true, durationDays: 30 },
];

/* ------------------------------------------------------------------- Runner */

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const model = <T>(name: string) => app.get<Model<T>>(getModelToken(name));
  const users = model<any>(User.name);
  const categories = model<any>(ServiceCategory.name);
  const providers = model<any>(ProviderProfile.name);
  const verificationDocs = model<any>(ProviderVerificationDocument.name);
  const reviews = model<any>(Review.name);
  const plans = model<any>(SubscriptionPlan.name);
  const subscriptions = model<any>(ProviderSubscription.name);
  const leads = model<any>(Lead.name);
  const jobs = model<any>(JobRequest.name);
  const favorites = model<any>(Favorite.name);

  console.log('🧹  Clearing seeded collections…');
  await Promise.all([
    users.deleteMany({}),
    categories.deleteMany({}),
    providers.deleteMany({}),
    verificationDocs.deleteMany({}),
    reviews.deleteMany({}),
    plans.deleteMany({}),
    subscriptions.deleteMany({}),
    leads.deleteMany({}),
    jobs.deleteMany({}),
    favorites.deleteMany({}),
  ]);

  /* Categories ----------------------------------------------------------- */
  const catDocs = await categories.insertMany(CATEGORIES);
  const catByName = new Map<string, Types.ObjectId>(
    catDocs.map((c: any) => [c.name, c._id]),
  );
  console.log(`📂  Inserted ${catDocs.length} categories.`);

  /* Admin + customers ---------------------------------------------------- */
  const admin = await users.create({
    phoneNumber: '+15550000000',
    name: 'Servio Admin',
    role: UserRole.ADMIN,
  });

  const customerDocs = await users.insertMany(
    CUSTOMERS.map((c) => ({
      phoneNumber: c.phone,
      name: c.name,
      role: UserRole.CUSTOMER,
      location: { latitude: jitterCoord(NYC.lat), longitude: jitterCoord(NYC.lng) },
    })),
  );
  console.log(`👤  Inserted 1 admin and ${customerDocs.length} customers.`);

  /* Plans ---------------------------------------------------------------- */
  const planDocs = await plans.insertMany(PLANS);
  const planByName = new Map<string, any>(planDocs.map((p: any) => [p.name, p]));
  console.log(`💳  Inserted ${planDocs.length} subscription plans.`);

  /* Providers (users + profiles) ----------------------------------------- */
  const providerProfiles: any[] = [];
  for (const p of PROVIDERS) {
    const user = await users.create({
      phoneNumber: p.phone,
      name: p.name,
      role: UserRole.SERVICE_PROVIDER,
      location: { latitude: jitterCoord(NYC.lat), longitude: jitterCoord(NYC.lng) },
    });

    const cats = [catByName.get(p.category)];
    if (p.extra && catByName.get(p.extra)) cats.push(catByName.get(p.extra));

    const lng = jitterCoord(NYC.lng);
    const lat = jitterCoord(NYC.lat);

    const profile = await providers.create({
      userId: user._id,
      serviceCategories: cats,
      serviceDescription: p.description,
      yearsOfExperience: p.years,
      serviceRadiusKm: pick([10, 15, 20, 25, 30, 40]),
      pricingModel: p.pricing,
      availabilitySchedule: {
        mon: '08:00-18:00', tue: '08:00-18:00', wed: '08:00-18:00',
        thu: '08:00-18:00', fri: '08:00-17:00', sat: '09:00-14:00',
      },
      verificationStatus: VerificationStatus.APPROVED,
      ratingAverage: p.rating,
      reviewCount: p.reviews,
      coordinates: { type: 'Point', coordinates: [lng, lat] },
    });

    providerProfiles.push({ profile, user, seed: p });

    /* An approved ID document for each provider (powers the admin doc queue). */
    await verificationDocs.create({
      providerId: profile._id,
      documentType: pick(["Driver's License", 'Business License', 'Trade Certification']),
      documentUrl: `https://example.com/docs/${user._id}.pdf`,
      status: VerificationStatus.APPROVED,
    });
  }
  console.log(`🛠️   Inserted ${providerProfiles.length} providers with profiles.`);

  /* Reviews — a handful of real review docs per provider ------------------ */
  let reviewCount = 0;
  for (const { profile } of providerProfiles) {
    const n = 2 + Math.floor(rand() * 3); // 2–4 reviews
    const shuffled = [...customerDocs].sort(() => rand() - 0.5).slice(0, n);
    for (const customer of shuffled) {
      await reviews.create({
        customerId: customer._id,
        providerId: profile._id,
        rating: pick([4, 5, 5, 5, 3]),
        comment: pick(REVIEW_COMMENTS),
      });
      reviewCount++;
    }
  }
  console.log(`⭐  Inserted ${reviewCount} reviews.`);

  /* Subscriptions — give the first several providers an active plan ------- */
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let subCount = 0;
  for (let i = 0; i < providerProfiles.length; i++) {
    const planName = i % 4 === 0 ? 'Premium' : i % 2 === 0 ? 'Professional' : 'Starter';
    const plan = planByName.get(planName);
    await subscriptions.create({
      providerId: providerProfiles[i].profile._id,
      planId: plan._id,
      startDate: new Date(now - 10 * day),
      endDate: new Date(now + (plan.durationDays - 10) * day),
      leadUsed: Math.floor(rand() * Math.min(plan.leadLimit, 12)),
    });
    subCount++;
  }
  console.log(`📈  Inserted ${subCount} provider subscriptions.`);

  /* Jobs, leads and favorites between customers and providers ------------- */
  const jobDescriptions = [
    'Need a leaking kitchen faucet fixed this week.',
    'Looking for a quote to repaint two bedrooms.',
    'Recurring biweekly house cleaning for a 2-bed apartment.',
    'AC stopped cooling — need a diagnosis ASAP.',
    'Help assembling and mounting furniture in new place.',
    'Lawn mowing and hedge trimming for a small backyard.',
  ];
  const jobStatuses = [
    JobStatus.REQUESTED, JobStatus.ACCEPTED, JobStatus.COMPLETED,
    JobStatus.COMPLETED, JobStatus.REJECTED, JobStatus.CANCELLED,
  ];

  let jobCount = 0;
  let leadCount = 0;
  let favCount = 0;
  const seenLeads = new Set<string>();
  const seenFavs = new Set<string>();

  for (const customer of customerDocs) {
    const targets = [...providerProfiles].sort(() => rand() - 0.5).slice(0, 3);
    for (let t = 0; t < targets.length; t++) {
      const { profile } = targets[t];

      await jobs.create({
        customerId: customer._id,
        providerId: profile._id,
        description: pick(jobDescriptions),
        scheduledDate: rand() > 0.5 ? new Date(now + (1 + Math.floor(rand() * 14)) * day) : null,
        status: pick(jobStatuses),
      });
      jobCount++;

      const leadKey = `${customer._id}-${profile._id}`;
      if (!seenLeads.has(leadKey)) {
        await leads.create({ customerId: customer._id, providerId: profile._id });
        seenLeads.add(leadKey);
        leadCount++;
      }

      if (t < 2) {
        const favKey = `${customer._id}-${profile._id}`;
        if (!seenFavs.has(favKey)) {
          await favorites.create({ customerId: customer._id, providerId: profile._id });
          seenFavs.add(favKey);
          favCount++;
        }
      }
    }
  }
  console.log(`📋  Inserted ${jobCount} jobs, ${leadCount} leads, ${favCount} favorites.`);

  console.log('\n✅  Seed complete!');
  console.log('   Admin login phone:    +15550000000');
  console.log('   Sample customer:      +15552020001 (James Wilson)');
  console.log('   Sample provider:      +15551010001 (Mario Rossi)');
  console.log('   In dev/test mode the OTP is returned by /auth/send-otp and shown on the login screen.');

  await app.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
