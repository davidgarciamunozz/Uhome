# Sprint 3 Design Spec — Freemium, Plans, Ratings & Admin

**Date:** 2026-06-04  
**Branch:** feat/admin-interaction  
**Sprint:** 3  

---

## Overview

Sprint 3 introduces the freemium monetization layer, a user-facing plans/pricing page, rating editing, and expanded admin tooling. It builds on top of the existing Clean Architecture (domain → application → infrastructure → presentation) and localStorage persistence already in place.

---

## 1. Domain Layer

### 1.1 Update `User.ts`

Add `plan` field to `BaseUser`:

```ts
plan?: 'free' | 'premium';
```

Add daily contact tracking to `Student`:

```ts
contactsToday?: number;
contactsResetDate?: string; // ISO date string (date only, e.g. "2026-06-04")
```

Default: all existing users without a `plan` field are treated as `'free'`.

### 1.2 New entity: `Plan.ts`

```ts
interface Plan {
  id: string;
  name: string;
  price: number;           // COP, 0 = free
  durationDays: number;    // subscription duration
  maxContacts: number | null;   // null = unlimited
  maxListings: number | null;   // null = unlimited
  canFeature: boolean;
  active: boolean;
  createdAt: string;
}
```

Factory: `createPlan(data: Omit<Plan, 'id' | 'createdAt'>): Plan`

### 1.3 Domain rules (no framework)

- A student on free plan may contact at most **3 unique owners per calendar day**.
- An owner on free plan may have at most **3 active (published) listings** simultaneously.
- Only owners with `plan === 'premium'` may feature a listing.
- Deleting or deactivating a listing frees a slot toward the 3-listing limit.
- Daily contact count resets at midnight (calendar date, device local time).

---

## 2. Application Layer

### 2.1 New: `freemium/CheckContactLimitUseCase.ts`

```ts
canContact(student: Student): { allowed: boolean; remaining: number }
registerContact(student: Student): Student  // returns updated student saved to repo
```

Logic:
- If `plan === 'premium'` → `{ allowed: true, remaining: Infinity }`.
- Compare `contactsResetDate` to today's date. If different, reset `contactsToday = 0`.
- If `contactsToday >= 3` → `{ allowed: false, remaining: 0 }`.
- Otherwise `{ allowed: true, remaining: 3 - contactsToday }`.

`registerContact` increments `contactsToday` and persists via `UserRepository.save`.

### 2.2 New: `freemium/CheckListingLimitUseCase.ts`

```ts
canPublish(ownerId: string): { allowed: boolean; active: number; limit: number }
```

Logic:
- Load owner from repo. If `plan === 'premium'` → `{ allowed: true }`.
- Count `ListingRepository.findByOwner(ownerId)` where `status === 'published'`.
- If count >= 3 → `{ allowed: false, active: count, limit: 3 }`.

### 2.3 Update: `listings/PublishListingUseCase.ts`

When creating a **new** listing (no `input.id`), call `canPublish` and throw `ValidationError` if not allowed.

### 2.4 Update: `listings/FeatureListingUseCase.ts`

In `featureListingFree` and `featureListingPaid`, add:

```ts
if (owner?.plan !== 'premium') throw new ValidationError('plan', 'Solo usuarios premium pueden destacar publicaciones');
```

> Note: The current codebase already has a 7-day free feature mock. With Sprint 3, featuring becomes premium-only. The free tier gets removed. Only `featureListingPaid` (rebranded as `featureListing`) remains.

### 2.5 Update: `messages/SendMessageUseCase.ts`

Before saving the first message from a student to a new owner:
1. Load sender. If `role === 'student'`, call `canContact`.
2. If not allowed → throw `ValidationError('limit', '...')`.
3. Check if this sender↔receiver pair already has messages. If **zero prior messages** → call `registerContact`.

### 2.6 Update: `social/RateUserUseCase.ts`

Add:

```ts
editRating(ratingId: string, fromUserId: string, score: number, comment: string): void
```

Validates ownership (fromUserId must match rating), score range, then updates via `RatingRepository.save`.

### 2.7 New: `admin/ManagePlansUseCase.ts`

```ts
getPlans(): Plan[]
createPlan(data): Plan
updatePlan(id, data): Plan
disablePlan(id): void   // sets active = false; does not delete
deletePlan(id): void    // throws if any user has plan === 'premium' linked to this plan id
```

> For the MVP, users have a single `plan: 'free' | 'premium'` field, not a plan reference ID. The plan entity drives the pricing page content and admin configuration, while the user's `plan` field is set independently during upgrade.

### 2.8 Update: `admin/GetDashboardMetricsUseCase.ts`

Add to `DashboardMetrics`:

```ts
totalPremiumUsers: number;
totalContacts: number;       // total unique contact events (first messages)
```

`totalContacts` = `MessageRepository.getAll()` filtered to unique `(senderId, receiverId)` pairs where sender role is student.

---

## 3. Infrastructure Layer

### 3.1 New: `PlanRepository.ts`

Standard localStorage pattern (`uhome_plans` key), CRUD methods matching other repositories:
`findAll`, `findById`, `save`, `delete`, `seed`.

### 3.2 Seed data updates (`seedData.ts`)

- Add `plan: 'premium'` to `owner-1` (Lucía Martínez) and `student-1` (María García).
- All others default to `'free'`.
- Add 2 seed plans:
  - `{ id: 'plan-free', name: 'Gratuito', price: 0, ... }`
  - `{ id: 'plan-premium', name: 'Premium', price: 50000, durationDays: 30, maxContacts: null, maxListings: null, canFeature: true, active: true }`
- Bump seed key to `uhome_seeded_v3`.

---

## 4. Presentation Layer

### 4.1 New: `PlansPage.tsx` (route `/plans`)

User-facing pricing page. Accessible to all logged-in users (students + owners).

**Layout:**
- Page title: "Planes Uhome"
- Two plan cards side by side: **Gratuito** and **Premium**
- Each card shows: name, price, duration, benefit bullets (contacts limit, listings limit, featuring)
- Current plan badge ("Plan actual") on the user's active plan
- Upgrade CTA button on Premium card (disabled if already premium)
- On click → mock payment modal (same pattern as featured listing payment in `DashboardPage`):
  - Step 1: Confirm plan selection
  - Step 2: Card number, expiry, CVV fields
  - Step 3: Success — set `user.plan = 'premium'`, save via `UserRepository`, refresh session

### 4.2 New: `AdminPlansPage.tsx` (route `/admin/plans`)

Admin plan management. CRUD interface.

**Features:**
- Table listing all plans (name, price, duration, benefits, status)
- "Nuevo plan" button → inline creation form
- Edit plan inline (price, duration, benefits)
- Disable/enable toggle
- Delete button (blocked with error if users depend on it)

### 4.3 New: `FreemiumGate.tsx` (reusable component)

A modal/overlay that renders when a freemium limit is hit. Props:
```ts
{ message: string; onClose: () => void; }
```
Shows the error message + "Ver planes Premium" button linking to `/plans`.

### 4.4 Updated: `ListingDetailPage.tsx`

"Contactar" button: if user is a student on free plan, call `canContact` before navigating to `/messages`. If limit hit → show `FreemiumGate` instead of navigating.

### 4.5 Updated: `DashboardPage.tsx`

- "Publicar nueva" button: call `canPublish` before navigating to `/publish`. If limit hit → show `FreemiumGate`.
- "Destacar" button: only shown for premium owners. Free owners see a lock icon with link to `/plans`.

### 4.6 Updated: `AdminDashboardPage.tsx`

Add `totalPremiumUsers` and `totalContacts` to the stats grid.

### 4.7 Updated: `AdminUsersPage.tsx`

- Add "Plan" column to user table (badge: "Free" / "Premium").
- Basic pagination: show 10 users per page, prev/next buttons.

### 4.8 Updated: `AdminRevenuePage.tsx`

Replace hardcoded arrays with real data:
- Active subscriptions = users where `plan === 'premium'`
- Monthly revenue = `premiumUsers.length * plan.price`
- Best-selling plan derived from real user counts

### 4.9 Updated: `ProfilePage.tsx`

- Allow editing an existing rating the current user has given (call `editRating`).
- Show given ratings section with edit button per rating.

### 4.10 Nav update: `Layout.tsx` / nav component

Add "Planes" link in navigation for logged-in non-admin users.

---

## 5. Routing

Add to `App.tsx`:

```tsx
<Route path="/plans" element={<PlansPage />} />
<Route path="/admin/plans" element={<AdminPlansPage />} />
```

Add `/admin/plans` to the admin sidebar quick-actions.

---

## 6. Data Flow Summary

```
User clicks "Contactar" on listing
  → ListingDetailPage checks canContact(student)
    → if blocked → FreemiumGate modal → link to /plans
    → if allowed → navigate to /messages
      → SendMessageUseCase checks first-message → registerContact(student)

Owner clicks "Nueva publicación"
  → DashboardPage checks canPublish(owner)
    → if blocked → FreemiumGate modal → link to /plans
    → if allowed → navigate to /publish
      → PublishListingUseCase validates canPublish (double-check)

User on /plans selects Premium
  → mock payment modal
  → on success: UserRepository.save({ ...user, plan: 'premium' })
  → SessionContext.refreshUser()
  → redirect back or show success

Admin on /admin/plans
  → ManagePlansUseCase.createPlan / updatePlan / disablePlan / deletePlan
```

---

## 7. Constraints & Notes

- All persistence is `localStorage`; no backend exists.
- Payment is mocked (UI-only), following the existing pattern in `DashboardPage`.
- "Delete plan" in admin is restricted if any premium user exists (simplified constraint since we don't track which plan they subscribed to).
- The 5-minute auto-refresh for admin metrics (HU-05 spec) is implemented as a `setInterval` in `AdminDashboardPage`.
- Date filter on admin dashboard metrics is implemented as a simple from/to date input filtering `createdAt` on users/listings.
- Featuring is now premium-only; the free 7-day `featureListingFree` function is removed from the UI (function can remain in codebase for potential future use).
