# Microbusiness Marketplace — Changes & Additions

This document catalogs every change made to the codebase after analyzing the existing NestJS backend and React frontend.

---

## Summary of Existing Functionality (Before Changes)

### Backend (NestJS + MongoDB)
| Module | Purpose |
|---|---|
| `auth/` | Phone-OTP login → JWT issuance |
| `users/` | User CRUD, role management (customer/provider/admin) |
| `providers/` | Provider profiles, geo-search, verification documents |
| `categories/` | Service category listing |
| `leads/` | Customer-to-provider contact records |
| `jobs/` | Job requests with status workflow (requested → accepted/rejected → cancelled) |
| `reviews/` | Rate providers (requires prior lead) |
| `favorites/` | Bookmark providers |
| `subscriptions/` | Provider plans with lead limits |
| `admin/` | Moderation, stats, category/plan management |

### Frontend (React 18 + Vite + React Router)
| Page | Purpose |
|---|---|
| `/login` | OTP phone auth |
| `/` | Home — browse/search providers |
| `/provider/:userId` | Provider details + job request |
| `/my-jobs` | Job list (accept/reject/cancel) |
| `/dashboard` | Provider overview (jobs + leads) |

### Gaps Identified
- No in-app messaging between customers and providers
- No notification system
- No payment/invoicing flow
- No portfolio/work showcase for providers
- Jobs lacked quotes, completion tracking, final pricing
- Frontend had **no UI** for: reviews, favorites, subscriptions, admin panel, profile editing
- No role-guarded routing on the frontend

---

## Backend Additions

### 1. Notifications Module — `src/notifications/`
**New files:**
- `schemas/notification.schema.ts` — MongoDB schema with `userId`, `type`, `title`, `body`, `data`, `read` flag. Compound indexes on `(userId, read)` and `(userId, createdAt)`.
- `dto/create-notification.dto.ts`
- `notifications.service.ts` — `create`, `findForUser`, `markRead`, `markAllRead`, `countUnread`, `delete`
- `notifications.controller.ts` — REST endpoints under `/api/notifications`
- `notifications.module.ts` — Marked `@Global()` so any module can inject `NotificationsService`

**New enum:** `src/common/enums/notification-type.enum.ts`
- `JOB_REQUEST`, `JOB_STATUS`, `NEW_LEAD`, `NEW_REVIEW`, `NEW_MESSAGE`, `PAYMENT`, `SUBSCRIPTION`, `SYSTEM`

**Endpoints:**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/notifications` | List notifications (`?unreadOnly=true` filter) |
| GET | `/api/notifications/unread-count` | Badge counter |
| PATCH | `/api/notifications/:id/read` | Mark one as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

---

### 2. Messaging Module — `src/messages/`
**New files:**
- `schemas/conversation.schema.ts` — `participants[]`, `jobId` (optional link), `lastMessage`, `lastMessageAt`
- `schemas/message.schema.ts` — `conversationId`, `senderId`, `text`, `readBy[]`
- `dto/send-message.dto.ts` — Accepts either `conversationId` **or** `recipientId` (auto-creates conversation)
- `messages.service.ts` — `send`, `listConversations`, `getMessages` (paginated), `markConversationRead`, `countUnread`
- `messages.controller.ts`
- `messages.module.ts`

**Features:**
- Auto-finds or creates a conversation between any two users
- Triggers a `NEW_MESSAGE` notification to the recipient on every send
- Participant authorization checked on all reads/writes
- Unread message count aggregation across all conversations

**Endpoints:**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/messages` | Send (creates conversation if needed) |
| GET | `/api/messages/conversations` | List my conversations |
| GET | `/api/messages/conversations/:id` | Fetch messages (supports `?before=` cursor) |
| PATCH | `/api/messages/conversations/:id/read` | Mark conversation read |
| GET | `/api/messages/unread-count` | Badge counter |

---

### 3. Payments Module — `src/payments/`
**New files:**
- `schemas/transaction.schema.ts` — `payerId`, `payeeId`, `jobId`, `type`, `amount`, `currency`, `status`, `externalRef`, `paidAt`
- `schemas/invoice.schema.ts` — Auto-numbered invoices (`INV-YYYY-00001`), `lineItems[]`, `subtotal`, `tax`, `total`, `dueDate`, `status`
- `dto/create-invoice.dto.ts` — Nested validation for line items
- `dto/record-payment.dto.ts`
- `payments.service.ts` — Invoice CRUD, transaction recording, **earnings aggregation** for providers, **platform revenue stats** for admin
- `payments.controller.ts`
- `payments.module.ts`

**New enum:** `src/common/enums/payment-status.enum.ts`
- `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `CANCELLED`
- `PaymentType`: `JOB_PAYMENT`, `SUBSCRIPTION`, `DEPOSIT`

**Features:**
- Only the provider who owns the job can create an invoice for it
- Invoice totals auto-calculated from line items
- Recording a payment against an invoice marks it `PAID` atomically
- Customer receives `PAYMENT` notification on invoice creation; provider receives one on payment receipt

**Endpoints:**
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/payments/invoices` | provider | Create invoice for a job |
| GET | `/api/payments/invoices` | any | List my invoices (role-aware) |
| GET | `/api/payments/invoices/:id` | any | Invoice detail (owner check) |
| POST | `/api/payments/transactions` | any | Record a payment |
| GET | `/api/payments/transactions` | any | My transaction history |
| GET | `/api/payments/earnings` | provider | Earned / pending / invoice counts |

---

### 4. Portfolio Module — `src/portfolio/`
**New files:**
- `schemas/portfolio-item.schema.ts` — `providerId`, `title`, `description`, `imageUrls[]`, `categoryId`, `completedAt`, `displayOrder`
- `dto/create-portfolio-item.dto.ts` — Create + Update DTOs with URL validation
- `portfolio.service.ts` — Full CRUD scoped to the authenticated provider
- `portfolio.controller.ts`
- `portfolio.module.ts`

**Endpoints:**
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/portfolio/provider/:providerId` | public | View a provider's portfolio |
| GET | `/api/portfolio/me` | provider | My items |
| POST | `/api/portfolio` | provider | Add item |
| PATCH | `/api/portfolio/:id` | provider | Edit (ownership check) |
| DELETE | `/api/portfolio/:id` | provider | Delete (ownership check) |

---

### 5. Jobs Module Enhancements — `src/jobs/`
**Modified:** `schemas/job-request.schema.ts`
- Added fields: `quotedPrice`, `finalPrice`, `completedAt`, `completionNotes`

**New:** `dto/complete-job.dto.ts` — `CompleteJobDto` + `QuoteJobDto`

**Modified:** `jobs.service.ts`
- Injected `NotificationsService`
- `create()` → notifies provider (`JOB_REQUEST`)
- `updateStatus()` → notifies counterparty (`JOB_STATUS`)
- **New:** `setQuote(jobId, providerUserId, dto)` → provider attaches price quote, customer notified
- **New:** `complete(jobId, providerUserId, dto)` → transitions `ACCEPTED → COMPLETED`, sets `completedAt`, `finalPrice`, `completionNotes`; prompts customer to review

**Modified:** `jobs.controller.ts`
- Added `PATCH /api/jobs/:id/quote` (provider only)
- Added `PATCH /api/jobs/:id/complete` (provider only)

---

### 6. Module Registration — `src/app.module.ts`
Registered 4 new modules: `NotificationsModule`, `MessagesModule`, `PaymentsModule`, `PortfolioModule`

### 7. Enums — `src/common/enums/index.ts`
Re-exported `notification-type.enum` and `payment-status.enum`

---

## Frontend Additions

### 1. API Client — `frontend/src/api/client.ts`
**Added ~220 lines** of type-safe API wrappers:

| API Namespace | Methods |
|---|---|
| `reviewsApi` | `listByProvider`, `create` |
| `favoritesApi` | `list`, `add`, `remove` |
| `notificationsApi` | `list`, `unreadCount`, `markRead`, `markAllRead`, `delete` |
| `messagesApi` | `conversations`, `getMessages`, `send`, `markRead`, `unreadCount` |
| `paymentsApi` | `listInvoices`, `getInvoice`, `createInvoice`, `recordPayment`, `listTransactions`, `earnings` |
| `portfolioApi` | `listByProvider`, `listMine`, `create`, `update`, `delete` |
| `subscriptionsApi` | `plans`, `subscribe`, `mine` |
| `providerProfileApi` | `create`, `update` |
| `jobsExtApi` | `setQuote`, `complete` |
| `adminApi` | `users`, `providers`, `setProviderVerification`, `pendingDocs`, `setDocStatus`, `categories`, `createCategory`, `updateCategory`, `jobStats`, `revenueStats`, `createPlan` |

**New interfaces:** `Review`, `Favorite`, `Notification`, `Conversation`, `Message`, `Invoice`, `InvoiceLineItem`, `Transaction`, `PortfolioItem`, `SubscriptionPlan`, `ProviderSubscription`

---

### 2. New Pages

#### `/favorites` — `pages/Favorites.tsx` + `.css`
- Lists bookmarked providers with name, description, rating
- One-click **Remove** with optimistic update
- Links to provider profile

#### `/messages` — `pages/Messages.tsx` + `.css`
- **Two-pane layout:** conversation list (left) + active chat (right)
- Supports `?to=<userId>` query param to start a new conversation
- Auto-scrolls to latest message
- Marks conversation read on open
- Sent/received bubbles with timestamps, distinct colors
- Responsive: stacks vertically on mobile

#### `/notifications` — `pages/Notifications.tsx` + `.css`
- Chronological feed, unread items get accent border
- **Mark all read** batch action
- Click navigates to relevant page (`/my-jobs`, `/messages`, `/payments`) based on `data` payload
- Individual delete (×)

#### `/edit-profile` — `pages/EditProfile.tsx` + `.css`
Provider profile editor:
- Service description (textarea)
- Years of experience, service radius, pricing model
- Multi-select service categories (checkboxes)
- **Create mode** if no profile exists, **edit mode** otherwise
- **Portfolio manager** at bottom: list existing items, add new (title/description/image URL), delete

#### `/subscriptions` — `pages/Subscriptions.tsx` + `.css`
- Plan cards grid (name, price, lead limit, duration, visibility boost)
- Active subscription banner showing expiry + lead usage
- One-click subscribe with current-plan highlighting

#### `/payments` — `pages/Payments.tsx` + `.css`
Role-aware:
- **Providers** see: earnings stat cards (total earned / pending / invoice counts)
- **Everyone** sees: tabbed **Invoices** / **Transactions** view
- **Customers** can **Pay now** on pending invoices (records transaction, marks invoice paid)
- Status badges (paid/pending/failed) with color coding
- Invoice line-item breakdown

#### `/admin` — `pages/Admin.tsx` + `.css`
Full admin control panel with 4 tabs:
- **Providers** — table with inline Approve/Reject verification
- **Categories** — list + create form
- **Plans** — create subscription plan (name, price, lead limit, duration)
- **Stats** — job counts by status + revenue metrics

---

### 3. Enhanced Pages

#### `pages/ProviderProfile.tsx`
**Added:**
- ♡ **Favorite** toggle button
- **Message** button → `/messages?to=<userId>`
- **Portfolio grid** showing provider's past work with images
- **Reviews section**:
  - List of existing reviews (stars, author, date, comment)
  - **Review submission form** (rating dropdown + comment) — only visible to customers who aren't the profile owner
  - Hint text explaining lead requirement
- "Edit it" link for own profile → `/edit-profile`

**CSS added** to `ProviderProfile.css`: ~80 lines for portfolio grid, review cards, review form

#### `pages/MyJobs.tsx`
**Added provider actions:**
- **Quote** button (status: `requested`) — prompts for price, calls `PATCH /jobs/:id/quote`
- **Mark complete** button (status: `accepted`) — prompts for final price + notes
- **Invoice** button (status: `accepted` or `completed`) — quick-create single-line invoice

#### `pages/ProviderDashboard.tsx`
**Added:**
- **Earnings card** — total earned / pending amounts
- Verification status + rating display
- Quick links: **Edit profile**, **Subscription**, **Payments**
- **Create profile** CTA button when profile is missing (previously just static text)

**CSS added** to `ProviderDashboard.css`: `.dashboard-links`, `.earnings-row`, `.earning-value`

---

### 4. Routing & Navigation

#### `App.tsx`
- Imported 7 new page components
- Added **`RoleRoute`** guard component — extends `PrivateRoute` with role check, redirects to `/` on mismatch
- Registered 7 new routes:

| Route | Guard |
|---|---|
| `/favorites` | customer only |
| `/messages` | authenticated |
| `/notifications` | authenticated |
| `/edit-profile` | provider only |
| `/subscriptions` | provider only |
| `/payments` | authenticated |
| `/admin` | admin only |

#### `components/Layout.tsx`
**Rewritten navigation:**
- Customer nav: My jobs · Favorites · Payments
- Provider nav: Dashboard · Jobs · Payments
- Admin nav: Admin
- **Live badges** on Messages & Notifications links
  - Polls `/notifications/unread-count` and `/messages/unread-count` every 30s
  - Re-fetches on route change
- Badge CSS added to `Layout.css`

---

## Build Verification
- ✅ Backend: `tsc --noEmit -p tsconfig.build.json` — clean
- ✅ Frontend: `tsc --noEmit -p tsconfig.json` — clean

---

## File Inventory

### New Backend Files (22)
```
src/common/enums/notification-type.enum.ts
src/common/enums/payment-status.enum.ts
src/notifications/schemas/notification.schema.ts
src/notifications/dto/create-notification.dto.ts
src/notifications/notifications.service.ts
src/notifications/notifications.controller.ts
src/notifications/notifications.module.ts
src/messages/schemas/conversation.schema.ts
src/messages/schemas/message.schema.ts
src/messages/dto/send-message.dto.ts
src/messages/messages.service.ts
src/messages/messages.controller.ts
src/messages/messages.module.ts
src/payments/schemas/transaction.schema.ts
src/payments/schemas/invoice.schema.ts
src/payments/dto/create-invoice.dto.ts
src/payments/dto/record-payment.dto.ts
src/payments/payments.service.ts
src/payments/payments.controller.ts
src/payments/payments.module.ts
src/portfolio/schemas/portfolio-item.schema.ts
src/portfolio/dto/create-portfolio-item.dto.ts
src/portfolio/portfolio.service.ts
src/portfolio/portfolio.controller.ts
src/portfolio/portfolio.module.ts
src/jobs/dto/complete-job.dto.ts
```

### Modified Backend Files (5)
```
src/app.module.ts                          — registered 4 new modules
src/common/enums/index.ts                  — re-exported 2 new enum files
src/jobs/schemas/job-request.schema.ts     — +4 fields (quotedPrice, finalPrice, completedAt, completionNotes)
src/jobs/jobs.service.ts                   — notifications wired in, +setQuote, +complete
src/jobs/jobs.controller.ts                — +PATCH /:id/quote, +PATCH /:id/complete
```

### New Frontend Files (14)
```
frontend/src/pages/Favorites.tsx + .css
frontend/src/pages/Messages.tsx + .css
frontend/src/pages/Notifications.tsx + .css
frontend/src/pages/EditProfile.tsx + .css
frontend/src/pages/Subscriptions.tsx + .css
frontend/src/pages/Payments.tsx + .css
frontend/src/pages/Admin.tsx + .css
```

### Modified Frontend Files (8)
```
frontend/src/api/client.ts                 — +10 API namespaces, +11 interfaces
frontend/src/App.tsx                       — +7 routes, +RoleRoute guard
frontend/src/components/Layout.tsx         — live badge polling, expanded nav
frontend/src/components/Layout.css         — badge styles
frontend/src/pages/ProviderProfile.tsx     — reviews UI, portfolio grid, favorite/message buttons
frontend/src/pages/ProviderProfile.css     — portfolio & review styles
frontend/src/pages/MyJobs.tsx              — quote/complete/invoice actions
frontend/src/pages/ProviderDashboard.tsx   — earnings card, profile CTA, quick links
frontend/src/pages/ProviderDashboard.css   — earnings styles
```
