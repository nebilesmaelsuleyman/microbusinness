# Microbusiness Marketplace – Backend API

NestJS + MongoDB backend for the Local Microbusiness Services Marketplace.

## Run

```bash
cp .env.example .env   # set MONGODB_URI, JWT_SECRET, etc.
npm install
npm run start:dev
```

API base: `http://localhost:3000/api`

## Auth (Phone OTP + JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/send-otp` | Body: `{ "phoneNumber": "+1234567890" }` |
| POST | `/auth/verify-otp` | Body: `{ "phoneNumber", "otp", "name?", "role?" }` → returns `access_token` and `user` |

Use header: `Authorization: Bearer <access_token>` for protected routes.

## Modules & main endpoints

- **Users** – `GET/PATCH /users/me`, `GET /users/:id`
- **Providers** – `GET /providers/search` (public, query: categoryId, latitude, longitude, maxDistanceKm, minRating), `POST/PATCH/GET /providers/profile`, `GET /providers/:userId/profile` (public), `POST/GET /providers/verification-documents`
- **Categories** – `GET /categories`, `GET /categories/:id` (public)
- **Leads** – `POST /leads/contact` (customer, body: `{ providerId }`) → returns provider phone after recording lead; `GET /leads/my-leads` (provider)
- **Jobs** – `POST /jobs` (customer), `GET /jobs/me/list`, `GET /jobs/:id`, `PATCH /jobs/:id/status` (provider: accept/reject; customer: cancel)
- **Reviews** – `POST /reviews/provider/:providerId` (customer, requires prior lead), `GET /reviews/provider/:providerId` (public)
- **Favorites** – `POST /favorites` (body: `{ providerId }`), `DELETE /favorites/:providerId`, `GET /favorites` (customer)
- **Subscriptions** – `GET /subscriptions/plans` (public), `POST /subscriptions/subscribe` (body: `{ planId }`), `GET /subscriptions/me` (provider)
- **Admin** – All under `/admin`, role `admin` required: users, providers, verify provider/documents, categories CRUD, job stats, revenue, `POST /admin/plans` (create subscription plan)

## Security

- Only **verified** providers appear in provider search.
- Reviews allowed only if the customer has a **lead** for that provider.
- Providers can update only their own profile; admins control verification and categories.
