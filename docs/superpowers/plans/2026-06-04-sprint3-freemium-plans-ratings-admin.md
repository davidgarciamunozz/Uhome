# Sprint 3 — Freemium, Plans, Ratings & Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Sprint 3 backlog: freemium contact/listing limits, premium featuring, rating editing, a user-facing /plans page, and full admin plan management — all wired into the existing Clean Architecture (domain → application → infrastructure → presentation).

**Architecture:** Domain entities hold business rules; application use cases orchestrate them; infrastructure repositories persist to localStorage; presentation pages consume use cases directly (no extra service layer). New behaviour slots into this existing pattern without restructuring.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite — no test framework. Verification = `pnpm build` (TypeScript compile) + manual browser run via `pnpm dev`.

---

## File Map

### Created
| File | Responsibility |
|---|---|
| `src/domain/entities/Plan.ts` | Plan entity + factory |
| `src/infrastructure/repositories/PlanRepository.ts` | CRUD for plans in localStorage |
| `src/application/freemium/CheckContactLimitUseCase.ts` | Student daily contact limit logic |
| `src/application/freemium/CheckListingLimitUseCase.ts` | Owner active listing limit logic |
| `src/application/admin/ManagePlansUseCase.ts` | Admin plan CRUD use case |
| `src/presentation/components/ui/FreemiumGate.tsx` | Reusable upgrade CTA modal |
| `src/presentation/pages/PlansPage.tsx` | User-facing pricing + upgrade page |
| `src/presentation/pages/admin/AdminPlansPage.tsx` | Admin plan management CRUD page |

### Modified
| File | Change |
|---|---|
| `src/domain/entities/User.ts` | Add `plan`, `contactsToday`, `contactsResetDate` fields |
| `src/infrastructure/repositories/RatingRepository.ts` | Add `findById` and `findByFromUser` methods |
| `src/infrastructure/seed/seedData.ts` | Seed plans, assign premium to test users, bump key to v3 |
| `src/application/listings/PublishListingUseCase.ts` | Enforce free owner listing limit on create |
| `src/application/listings/FeatureListingUseCase.ts` | Require premium plan; remove free featuring |
| `src/application/messages/SendMessageUseCase.ts` | Check + register student contact limit on first message |
| `src/application/social/RateUserUseCase.ts` | Add `editRating` function |
| `src/application/admin/GetDashboardMetricsUseCase.ts` | Add `totalPremiumUsers`, `totalContacts` |
| `src/presentation/pages/DashboardPage.tsx` | Freemium gate on publish; premium-only featuring UI |
| `src/presentation/pages/ListingDetailPage.tsx` | Freemium gate on contact button |
| `src/presentation/pages/ProfilePage.tsx` | Show & edit ratings given by current user |
| `src/presentation/pages/admin/AdminDashboardPage.tsx` | Add premium users + contacts stats; date filter; 5-min refresh |
| `src/presentation/pages/admin/AdminUsersPage.tsx` | Plan column; 10-per-page pagination |
| `src/presentation/pages/admin/AdminRevenuePage.tsx` | Real premium user count in stats |
| `src/presentation/pages/admin/AdminLayout.tsx` | Add Planes nav item |
| `src/presentation/components/layout/Nav.tsx` | Add Planes link for non-admin users |
| `src/App.tsx` | Add `/plans` and `/admin/plans` routes |

---

## Task 1: Update User entity — add plan and contact tracking fields

**Files:**
- Modify: `src/domain/entities/User.ts`

- [ ] **Open `src/domain/entities/User.ts`** and add `plan` to `BaseUser`, and `contactsToday` + `contactsResetDate` to `Student`:

```ts
export type UserRole = 'student' | 'owner' | 'admin';
export type ScheduleType = 'tranquilo' | 'social';
export type PetsPreference = 'sí' | 'no' | 'indiferente';
export type OrderLevel = 'alto' | 'medio' | 'bajo';

export interface StudentPreferences {
  smoker: boolean;
  pets: boolean;
  schedule: ScheduleType;
}

export interface Budget {
  min: number;
  max: number;
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  plan?: 'free' | 'premium';
  avatar?: string;
  description?: string;
  createdAt: string;
  blocked?: boolean;
}

export interface Student extends BaseUser {
  role: 'student';
  university: string;
  career?: string;
  age?: number;
  budget: Budget;
  preferences: StudentPreferences;
  contactsToday?: number;
  contactsResetDate?: string;
}

export interface Owner extends BaseUser {
  role: 'owner';
  phone: string;
  propertyTypes: string[];
  city: string;
}

export interface Admin extends BaseUser {
  role: 'admin';
}

export type User = Student | Owner | Admin;

export function isStudent(user: User): user is Student {
  return user.role === 'student';
}

export function isOwner(user: User): user is Owner {
  return user.role === 'owner';
}

export function isAdmin(user: User): user is Admin {
  return user.role === 'admin';
}

export function createStudentId(): string {
  return `student-${crypto.randomUUID()}`;
}

export function createOwnerId(): string {
  return `owner-${crypto.randomUUID()}`;
}
```

- [ ] **Verify compilation:**

```bash
cd /Users/david/Desktop/Uhome && pnpm build 2>&1 | head -30
```

Expected: build succeeds (no TS errors from User.ts changes — all new fields are optional).

- [ ] **Commit:**

```bash
git add src/domain/entities/User.ts
git commit -m "feat(domain): add plan and contact-tracking fields to User"
```

---

## Task 2: Create Plan domain entity

**Files:**
- Create: `src/domain/entities/Plan.ts`

- [ ] **Create `src/domain/entities/Plan.ts`:**

```ts
export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  maxContacts: number | null;
  maxListings: number | null;
  canFeature: boolean;
  active: boolean;
  createdAt: string;
}

export function createPlan(data: Omit<Plan, 'id' | 'createdAt'>): Plan {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Commit:**

```bash
git add src/domain/entities/Plan.ts
git commit -m "feat(domain): add Plan entity"
```

---

## Task 3: Create PlanRepository

**Files:**
- Create: `src/infrastructure/repositories/PlanRepository.ts`

- [ ] **Create `src/infrastructure/repositories/PlanRepository.ts`:**

```ts
import type { Plan } from '../../domain/entities/Plan';

const KEY = 'uhome_plans';

function getAll(): Plan[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(plans: Plan[]): void {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export const PlanRepository = {
  findAll: (): Plan[] => getAll(),

  findById: (id: string): Plan | null =>
    getAll().find((p) => p.id === id) ?? null,

  findActive: (): Plan[] => getAll().filter((p) => p.active),

  save: (plan: Plan): Plan => {
    const plans = getAll();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) plans[idx] = plan;
    else plans.push(plan);
    saveAll(plans);
    return plan;
  },

  delete: (id: string): void => {
    saveAll(getAll().filter((p) => p.id !== id));
  },

  seed: (plans: Plan[]): void => {
    saveAll(plans);
  },
};
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/infrastructure/repositories/PlanRepository.ts
git commit -m "feat(infra): add PlanRepository"
```

---

## Task 4: Update RatingRepository — add findById and findByFromUser

**Files:**
- Modify: `src/infrastructure/repositories/RatingRepository.ts`

- [ ] **Replace `src/infrastructure/repositories/RatingRepository.ts`** with:

```ts
import type { Rating } from '../../domain/entities/Rating';

const KEY = 'uhome_ratings';

function getAll(): Rating[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(ratings: Rating[]): void {
  localStorage.setItem(KEY, JSON.stringify(ratings));
}

export const RatingRepository = {
  findAll: (): Rating[] => getAll(),

  findForUser: (userId: string): Rating[] =>
    getAll().filter((r) => r.toUserId === userId),

  findByFromUser: (userId: string): Rating[] =>
    getAll().filter((r) => r.fromUserId === userId),

  findByUsers: (fromId: string, toId: string): Rating | null =>
    getAll().find((r) => r.fromUserId === fromId && r.toUserId === toId) ?? null,

  findById: (id: string): Rating | null =>
    getAll().find((r) => r.id === id) ?? null,

  save: (rating: Rating): Rating => {
    const ratings = getAll();
    const idx = ratings.findIndex((r) => r.id === rating.id);
    if (idx >= 0) ratings[idx] = rating;
    else ratings.push(rating);
    saveAll(ratings);
    return rating;
  },
};
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/infrastructure/repositories/RatingRepository.ts
git commit -m "feat(infra): add findById and findByFromUser to RatingRepository"
```

---

## Task 5: Update seed data — add plans, assign premium users, bump key

**Files:**
- Modify: `src/infrastructure/seed/seedData.ts`

- [ ] **Open `src/infrastructure/seed/seedData.ts`**. Make the following three changes:

**Change 1:** Update the seed key constant from `'uhome_seeded_v2'` to `'uhome_seeded_v3'`:

```ts
const SEED_KEY = 'uhome_seeded_v3';
```

**Change 2:** Add `plan: 'premium'` to `student-1` and `owner-1`. Add `plan: 'free'` to all other non-admin users. Example for student-1:

```ts
  {
    id: 'student-1',
    name: 'María García',
    email: 'maria.garcia@univalle.edu.co',
    password: 'Password1',
    role: 'student',
    plan: 'premium',
    university: 'Universidad del Valle',
    // ... rest unchanged
  },
```

For owner-1:

```ts
  {
    id: 'owner-1',
    name: 'Lucía Martínez',
    email: 'lucia.m@gmail.com',
    password: 'Password1',
    role: 'owner',
    plan: 'premium',
    // ... rest unchanged
  },
```

For student-2 and owner-2, add `plan: 'free'`.

**Change 3:** Add a `PLANS` constant and seed it inside `seedIfNeeded`. Add the import and seed call:

At the top of the file, add import:
```ts
import type { Plan } from '../../domain/entities/Plan';
import { PlanRepository } from '../repositories/PlanRepository';
```

Add the PLANS array after the LISTINGS constant (before `seedIfNeeded`):

```ts
const PLANS: Plan[] = [
  {
    id: 'plan-free',
    name: 'Gratuito',
    price: 0,
    durationDays: 0,
    maxContacts: 3,
    maxListings: 3,
    canFeature: false,
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    price: 50000,
    durationDays: 30,
    maxContacts: null,
    maxListings: null,
    canFeature: true,
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];
```

Inside `seedIfNeeded`, after the existing seed calls, add:

```ts
  PlanRepository.seed(PLANS);
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Clear old seed and verify in browser:** Open DevTools → Application → localStorage → delete `uhome_seeded_v2` key. Refresh page. Check `uhome_plans` key now exists with 2 plans.

- [ ] **Commit:**

```bash
git add src/infrastructure/seed/seedData.ts
git commit -m "feat(seed): add plans, assign premium users, bump seed to v3"
```

---

## Task 6: Create CheckContactLimitUseCase

**Files:**
- Create: `src/application/freemium/CheckContactLimitUseCase.ts`

- [ ] **Create directory and file `src/application/freemium/CheckContactLimitUseCase.ts`:**

```ts
import { isStudent, type Student } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

const FREE_DAILY_LIMIT = 3;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function canContact(student: Student): { allowed: boolean; remaining: number } {
  if (student.plan === 'premium') return { allowed: true, remaining: Infinity };
  const today = todayString();
  const count = student.contactsResetDate === today ? (student.contactsToday ?? 0) : 0;
  const remaining = FREE_DAILY_LIMIT - count;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function registerContact(student: Student): Student {
  const today = todayString();
  const count = student.contactsResetDate === today ? (student.contactsToday ?? 0) : 0;
  const updated: Student = {
    ...student,
    contactsToday: count + 1,
    contactsResetDate: today,
  };
  UserRepository.save(updated);
  return updated;
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/freemium/CheckContactLimitUseCase.ts
git commit -m "feat(app): add CheckContactLimitUseCase for student freemium"
```

---

## Task 7: Create CheckListingLimitUseCase

**Files:**
- Create: `src/application/freemium/CheckListingLimitUseCase.ts`

- [ ] **Create `src/application/freemium/CheckListingLimitUseCase.ts`:**

```ts
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';

const FREE_LISTING_LIMIT = 3;

export function canPublish(ownerId: string): { allowed: boolean; active: number; limit: number } {
  const owner = UserRepository.findById(ownerId);
  if (!owner || owner.role !== 'owner') {
    return { allowed: false, active: 0, limit: FREE_LISTING_LIMIT };
  }
  if (owner.plan === 'premium') {
    return { allowed: true, active: 0, limit: Infinity };
  }
  const active = ListingRepository.findByOwner(ownerId).filter((l) => l.status === 'published').length;
  return {
    allowed: active < FREE_LISTING_LIMIT,
    active,
    limit: FREE_LISTING_LIMIT,
  };
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/freemium/CheckListingLimitUseCase.ts
git commit -m "feat(app): add CheckListingLimitUseCase for owner freemium"
```

---

## Task 8: Update PublishListingUseCase — enforce listing limit on create

**Files:**
- Modify: `src/application/listings/PublishListingUseCase.ts`

- [ ] **Add import and limit check** to `src/application/listings/PublishListingUseCase.ts`. Add the import at the top:

```ts
import { canPublish } from '../freemium/CheckListingLimitUseCase';
```

Then, inside the function, **before** the `if (input.id)` block (i.e., only when creating a new listing), add:

```ts
  if (!input.id) {
    const limitCheck = canPublish(ownerId);
    if (!limitCheck.allowed) {
      throw new ValidationError(
        'limit',
        `Has alcanzado el máximo de ${limitCheck.limit} publicaciones activas en el plan gratuito. Actualiza a Premium para publicar más.`,
      );
    }
  }
```

The final function body should look like:

```ts
export function publishListing(input: PublishListingInput, ownerId: string): Listing {
  validateRequired(input.title, 'title', 'El título');
  validateRequired(input.city, 'city', 'La ciudad');
  validateRequired(input.type, 'type', 'El tipo de vivienda');
  validatePositiveNumber(input.price, 'price', 'El precio');

  const owner = UserRepository.findById(ownerId);

  if (!input.id) {
    const limitCheck = canPublish(ownerId);
    if (!limitCheck.allowed) {
      throw new ValidationError(
        'limit',
        `Has alcanzado el máximo de ${limitCheck.limit} publicaciones activas en el plan gratuito. Actualiza a Premium para publicar más.`,
      );
    }
  }

  if (input.id) {
    const existing = ListingRepository.findById(input.id);
    if (existing && existing.ownerId === ownerId) {
      const updated: Listing = {
        ...existing,
        title: input.title,
        price: Number(input.price),
        city: input.city,
        zone: input.zone || '',
        address: input.address || '',
        type: input.type as Listing['type'],
        rooms: Number(input.rooms) || 1,
        bathrooms: Number(input.bathrooms) || 1,
        description: input.description || '',
        services: {
          internet: !!input.services?.internet,
          water: !!input.services?.water,
          electricity: !!input.services?.electricity,
          gas: !!input.services?.gas,
        },
        images: input.images || [],
        status: input.status || 'published',
      };
      return ListingRepository.save(updated);
    }
  }

  const listing = createListing({
    ownerId,
    ownerName: owner?.name || '',
    title: input.title,
    price: Number(input.price),
    city: input.city,
    zone: input.zone || '',
    address: input.address || '',
    type: input.type as Listing['type'],
    rooms: Number(input.rooms) || 1,
    bathrooms: Number(input.bathrooms) || 1,
    description: input.description || '',
    services: {
      internet: !!input.services?.internet,
      water: !!input.services?.water,
      electricity: !!input.services?.electricity,
      gas: !!input.services?.gas,
    },
    images: input.images || [],
    status: input.status || 'published',
  });

  return ListingRepository.save(listing);
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/listings/PublishListingUseCase.ts
git commit -m "feat(app): enforce listing limit for free owners in PublishListingUseCase"
```

---

## Task 9: Update FeatureListingUseCase — premium-only, remove free feature

**Files:**
- Modify: `src/application/listings/FeatureListingUseCase.ts`

- [ ] **Replace the entire file** `src/application/listings/FeatureListingUseCase.ts`:

```ts
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ValidationError } from '../../domain/services/Validators';

export function featureListing(listingId: string, ownerId: string, days: number): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) {
    throw new ValidationError('listing', 'Publicación no encontrada');
  }
  const owner = UserRepository.findById(ownerId);
  if (owner?.plan !== 'premium') {
    throw new ValidationError('plan', 'Solo usuarios premium pueden destacar publicaciones');
  }
  if (listing.status !== 'published') {
    throw new ValidationError('listing', 'Solo puedes destacar publicaciones activas');
  }
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);
  ListingRepository.save({ ...listing, featured: true, featuredUntil: featuredUntil.toISOString() });
}

export function unfeatureListing(listingId: string, ownerId: string): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) return;
  ListingRepository.save({ ...listing, featured: false, featuredUntil: undefined });
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -30
```

Expected: TS error in `DashboardPage.tsx` because it still calls `featureListingFree` and `featureListingPaid` (old names). That's OK — we fix the page in Task 17. For now the use case file compiles clean.

- [ ] **Commit:**

```bash
git add src/application/listings/FeatureListingUseCase.ts
git commit -m "feat(app): make featuring premium-only, remove featureListingFree"
```

---

## Task 10: Update SendMessageUseCase — contact limit on first message

**Files:**
- Modify: `src/application/messages/SendMessageUseCase.ts`

- [ ] **Replace the entire file** `src/application/messages/SendMessageUseCase.ts`:

```ts
import { createMessage, type Message } from '../../domain/entities/Message';
import { ValidationError } from '../../domain/services/Validators';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { isStudent } from '../../domain/entities/User';
import { canContact, registerContact } from '../freemium/CheckContactLimitUseCase';

export function sendMessage(senderId: string, receiverId: string, content: string): Message {
  if (!content?.trim()) {
    throw new ValidationError('content', 'El mensaje no puede estar vacío');
  }

  const sender = UserRepository.findById(senderId);
  if (sender && isStudent(sender)) {
    const existing = MessageRepository.getConversation(senderId, receiverId);
    if (existing.length === 0) {
      const limit = canContact(sender);
      if (!limit.allowed) {
        throw new ValidationError(
          'limit',
          'Has alcanzado el límite de contactos del plan gratuito. Actualiza a Premium para continuar.',
        );
      }
      registerContact(sender);
    }
  }

  const message = createMessage({ senderId, receiverId, content: content.trim() });
  return MessageRepository.save(message);
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/messages/SendMessageUseCase.ts
git commit -m "feat(app): enforce student contact limit in SendMessageUseCase"
```

---

## Task 11: Update RateUserUseCase — add editRating

**Files:**
- Modify: `src/application/social/RateUserUseCase.ts`

- [ ] **Add `editRating` function** at the bottom of `src/application/social/RateUserUseCase.ts`. Add import for `RatingRepository.findById` (already available after Task 4). Append to the existing file:

```ts
export function editRating(ratingId: string, fromUserId: string, score: number, comment: string): void {
  if (!score || score < 1 || score > 5) {
    throw new ValidationError('score', 'La calificación debe ser entre 1 y 5');
  }
  const existing = RatingRepository.findById(ratingId);
  if (!existing) throw new ValidationError('general', 'Calificación no encontrada');
  if (existing.fromUserId !== fromUserId) {
    throw new ValidationError('general', 'No puedes editar esta calificación');
  }
  RatingRepository.save({ ...existing, score, comment });
}
```

The full file after editing should be:

```ts
import { createRating, type RatingSummary } from '../../domain/entities/Rating';
import { ValidationError } from '../../domain/services/Validators';
import { RatingRepository } from '../../infrastructure/repositories/RatingRepository';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';

export function rateUser(fromUserId: string, toUserId: string, score: number, comment: string): void {
  if (!score || score < 1 || score > 5) {
    throw new ValidationError('score', 'La calificación debe ser entre 1 y 5');
  }

  const messages = MessageRepository.getConversation(fromUserId, toUserId);
  if (messages.length === 0) {
    throw new ValidationError('general', 'Solo puedes calificar usuarios con quienes hayas interactuado');
  }

  if (RatingRepository.findByUsers(fromUserId, toUserId)) {
    throw new ValidationError('general', 'Ya calificaste a este usuario');
  }

  const rating = createRating({ fromUserId, toUserId, score, comment });
  RatingRepository.save(rating);
}

export function getUserRatingSummary(userId: string): RatingSummary {
  const ratings = RatingRepository.findForUser(userId);
  if (ratings.length === 0) return { average: 0, count: 0, ratings: [] };

  const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
    ratings,
  };
}

export function editRating(ratingId: string, fromUserId: string, score: number, comment: string): void {
  if (!score || score < 1 || score > 5) {
    throw new ValidationError('score', 'La calificación debe ser entre 1 y 5');
  }
  const existing = RatingRepository.findById(ratingId);
  if (!existing) throw new ValidationError('general', 'Calificación no encontrada');
  if (existing.fromUserId !== fromUserId) {
    throw new ValidationError('general', 'No puedes editar esta calificación');
  }
  RatingRepository.save({ ...existing, score, comment });
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/social/RateUserUseCase.ts
git commit -m "feat(app): add editRating to RateUserUseCase"
```

---

## Task 12: Create ManagePlansUseCase

**Files:**
- Create: `src/application/admin/ManagePlansUseCase.ts`

- [ ] **Create `src/application/admin/ManagePlansUseCase.ts`:**

```ts
import { createPlan, type Plan } from '../../domain/entities/Plan';
import { PlanRepository } from '../../infrastructure/repositories/PlanRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ValidationError } from '../../domain/services/Validators';

export function getPlans(): Plan[] {
  return PlanRepository.findAll();
}

export function createNewPlan(data: Omit<Plan, 'id' | 'createdAt'>): Plan {
  if (!data.name?.trim()) throw new ValidationError('name', 'El nombre es obligatorio');
  if (data.price < 0) throw new ValidationError('price', 'El precio no puede ser negativo');
  if (!data.durationDays || data.durationDays < 1) {
    throw new ValidationError('durationDays', 'La duración debe ser al menos 1 día');
  }
  const plan = createPlan(data);
  return PlanRepository.save(plan);
}

export function updatePlan(id: string, data: Partial<Omit<Plan, 'id' | 'createdAt'>>): Plan {
  const existing = PlanRepository.findById(id);
  if (!existing) throw new ValidationError('id', 'Plan no encontrado');
  return PlanRepository.save({ ...existing, ...data });
}

export function disablePlan(id: string): void {
  const existing = PlanRepository.findById(id);
  if (!existing) return;
  PlanRepository.save({ ...existing, active: false });
}

export function enablePlan(id: string): void {
  const existing = PlanRepository.findById(id);
  if (!existing) return;
  PlanRepository.save({ ...existing, active: true });
}

export function deletePlan(id: string): void {
  const premiumUsers = UserRepository.findAll().filter((u) => u.plan === 'premium');
  if (premiumUsers.length > 0) {
    throw new ValidationError('plan', 'No se puede eliminar un plan mientras haya suscriptores activos');
  }
  PlanRepository.delete(id);
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/admin/ManagePlansUseCase.ts
git commit -m "feat(app): add ManagePlansUseCase for admin plan CRUD"
```

---

## Task 13: Update GetDashboardMetricsUseCase — add premium users + total contacts

**Files:**
- Modify: `src/application/admin/GetDashboardMetricsUseCase.ts`

- [ ] **Replace the entire file** `src/application/admin/GetDashboardMetricsUseCase.ts`:

```ts
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { ReportRepository } from '../../infrastructure/repositories/ReportRepository';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';

export interface DashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  totalOwners: number;
  blockedUsers: number;
  totalListings: number;
  publishedListings: number;
  hiddenListings: number;
  featuredListings: number;
  pendingReports: number;
  totalReports: number;
  totalPremiumUsers: number;
  totalContacts: number;
}

export function getDashboardMetrics(): DashboardMetrics {
  const users = UserRepository.findAll().filter((u) => u.role !== 'admin');
  const listings = ListingRepository.findAll();
  const reports = ReportRepository.findAll();
  const students = users.filter((u) => u.role === 'student');
  const totalContacts = students.reduce(
    (sum, s) => sum + MessageRepository.getPartnerIds(s.id).length,
    0,
  );

  return {
    totalUsers: users.length,
    totalStudents: students.length,
    totalOwners: users.filter((u) => u.role === 'owner').length,
    blockedUsers: users.filter((u) => u.blocked).length,
    totalListings: listings.length,
    publishedListings: listings.filter((l) => l.status === 'published' && !l.hidden).length,
    hiddenListings: listings.filter((l) => l.hidden).length,
    featuredListings: listings.filter((l) => l.featured).length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    totalReports: reports.length,
    totalPremiumUsers: users.filter((u) => u.plan === 'premium').length,
    totalContacts,
  };
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/application/admin/GetDashboardMetricsUseCase.ts
git commit -m "feat(app): add totalPremiumUsers and totalContacts to dashboard metrics"
```

---

## Task 14: Create FreemiumGate component

**Files:**
- Create: `src/presentation/components/ui/FreemiumGate.tsx`

- [ ] **Create `src/presentation/components/ui/FreemiumGate.tsx`:**

```tsx
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

interface FreemiumGateProps {
  message: string;
  onClose: () => void;
}

export default function FreemiumGate({ message, onClose }: FreemiumGateProps) {
  const navigate = useNavigate();

  return (
    <Modal open={true} title="Límite del plan gratuito" onClose={onClose}>
      <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => { onClose(); navigate('/plans'); }}
        >
          Ver planes Premium
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/presentation/components/ui/FreemiumGate.tsx
git commit -m "feat(ui): add FreemiumGate reusable upgrade modal component"
```

---

## Task 15: Create PlansPage — user-facing pricing and upgrade

**Files:**
- Create: `src/presentation/pages/PlansPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/presentation/components/layout/Nav.tsx`

- [ ] **Create `src/presentation/pages/PlansPage.tsx`:**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanRepository } from '../../infrastructure/repositories/PlanRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import type { Plan } from '../../domain/entities/Plan';
import Modal from '../components/ui/Modal';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

type PayStep = 'confirm' | 'pay' | 'done';

const PLAN_BENEFITS: Record<string, string[]> = {
  'plan-free': [
    'Hasta 3 contactos por día',
    'Hasta 3 publicaciones activas',
    'Acceso a búsqueda y roomies',
  ],
  'plan-premium': [
    'Contactos ilimitados por día',
    'Publicaciones activas ilimitadas',
    'Destacar publicaciones en búsqueda',
    'Mayor visibilidad en resultados',
    'Soporte prioritario',
  ],
};

function getBenefits(plan: Plan): string[] {
  return PLAN_BENEFITS[plan.id] ?? [
    plan.maxContacts ? `Hasta ${plan.maxContacts} contactos/día` : 'Contactos ilimitados',
    plan.maxListings ? `Hasta ${plan.maxListings} publicaciones` : 'Publicaciones ilimitadas',
    plan.canFeature ? 'Destacar publicaciones' : 'Sin destacados',
  ];
}

export default function PlansPage() {
  const { user, refreshUser } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('confirm');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setPlans(PlanRepository.findActive());
  }, [user, navigate]);

  const openUpgrade = (plan: Plan) => {
    setUpgradeTarget(plan);
    setPayStep('confirm');
    setCardNum(''); setCardExp(''); setCardCvv('');
  };

  const handlePay = () => {
    if (!user || !upgradeTarget) return;
    if (!cardNum.trim() || !cardExp.trim() || !cardCvv.trim()) {
      showToast('Completa todos los datos de pago', 'error');
      return;
    }
    UserRepository.save({ ...user, plan: 'premium' });
    refreshUser();
    setPayStep('done');
  };

  const handleClose = () => {
    setUpgradeTarget(null);
  };

  const isPremium = user?.plan === 'premium';

  return (
    <div className="container" style={{ maxWidth: 800, padding: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">Planes Uhome</h1>
        <p className="page-subtitle">Elige el plan que mejor se adapta a ti</p>
      </div>

      {isPremium && (
        <div
          style={{
            background: 'var(--primary-soft, #f0f4ff)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            fontSize: '0.9rem',
            color: 'var(--primary)',
            fontWeight: 600,
          }}
        >
          Ya tienes el plan Premium activo.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan) => {
          const isCurrent = plan.price === 0 ? !isPremium : isPremium;
          const isPremiumPlan = plan.price > 0;
          return (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: '1.75rem',
                border: isPremiumPlan ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                position: 'relative',
              }}
            >
              {isPremiumPlan && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.75rem',
                    borderRadius: '999px',
                    letterSpacing: '0.05em',
                  }}
                >
                  RECOMENDADO
                </div>
              )}

              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{plan.name}</h2>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'var(--green-soft, #e6f9f0)',
                      color: 'var(--green)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontWeight: 600,
                    }}
                  >
                    Plan actual
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                {plan.price === 0 ? (
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>Gratis</span>
                ) : (
                  <>
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>{COP.format(plan.price)}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginLeft: '0.25rem' }}>
                      / {plan.durationDays} días
                    </span>
                  </>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {getBenefits(plan).map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, marginTop: '1px' }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>

              {isPremiumPlan && !isPremium && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => openUpgrade(plan)}>
                  Actualizar a Premium
                </button>
              )}
              {isPremiumPlan && isPremium && (
                <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                  Plan activo
                </button>
              )}
              {!isPremiumPlan && (
                <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                  {isCurrent ? 'Tu plan actual' : 'Plan gratuito'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {upgradeTarget && payStep !== 'done' && (
        <Modal open={true} title={`Activar plan ${upgradeTarget.name}`} onClose={handleClose}>
          {payStep === 'confirm' && (
            <div>
              <p style={{ marginBottom: '1.25rem', color: 'var(--gray-700)' }}>
                Vas a activar el plan <strong>{upgradeTarget.name}</strong> por{' '}
                <strong>{COP.format(upgradeTarget.price)}</strong> durante {upgradeTarget.durationDays} días.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setPayStep('pay')}>
                  Continuar al pago
                </button>
                <button className="btn btn-outline" onClick={handleClose}>Cancelar</button>
              </div>
            </div>
          )}

          {payStep === 'pay' && (
            <div>
              <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                Total: <strong>{COP.format(upgradeTarget.price)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Número de tarjeta</label>
                <input
                  className="form-input"
                  placeholder="1234 5678 9012 3456"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  maxLength={19}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vencimiento</label>
                  <input
                    className="form-input"
                    placeholder="MM/AA"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    className="form-input"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handlePay}>
                  Pagar {COP.format(upgradeTarget.price)}
                </button>
                <button className="btn btn-outline" onClick={handleClose}>Cancelar</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {upgradeTarget && payStep === 'done' && (
        <Modal open={true} title="¡Bienvenido a Premium!" onClose={() => { handleClose(); navigate('/'); }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
            Tu plan <strong>Premium</strong> ha sido activado exitosamente. Ya puedes contactar propietarios sin límites y destacar tus publicaciones.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { handleClose(); navigate('/'); }}
          >
            Ir al inicio
          </button>
        </Modal>
      )}
    </div>
  );
}
```

- [ ] **Add `/plans` route to `src/App.tsx`**. Import the page and add the route inside the Layout routes:

```tsx
import PlansPage from './presentation/pages/PlansPage';
```

Add inside the `<Routes>` inside `<Layout>`:

```tsx
<Route path="/plans" element={<PlansPage />} />
```

- [ ] **Add "Planes" link to `src/presentation/components/layout/Nav.tsx`** for non-admin logged-in users. In both the owner nav block and the student nav block, add:

```tsx
<Link to="/plans">Planes</Link>
```

For owner nav block, add it after "Perfil". For student nav block, add it after "Perfil". The updated nav blocks:

Owner block:
```tsx
) : isOwner(user) ? (
  <>
    <Link to="/dashboard">Mis publicaciones</Link>
    <Link to="/publish">Publicar</Link>
    <Link to="/messages">Mensajes</Link>
    <Link to="/profile">Perfil</Link>
    <Link to="/plans">Planes</Link>
    <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
  </>
```

Student block:
```tsx
) : (
  <>
    <Link to="/search">Buscar vivienda</Link>
    <Link to="/roomies">Roomies</Link>
    <Link to="/messages">Mensajes</Link>
    <Link to="/profile">Perfil</Link>
    <Link to="/plans">Planes</Link>
    <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
  </>
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Manual test:** Run `pnpm dev`. Log in as a student (carlos.r@icesi.edu.co / Password1). Click "Planes" in nav. Verify both plan cards render. Click "Actualizar a Premium", complete mock payment. Verify success modal appears and plan updates to Premium.

- [ ] **Commit:**

```bash
git add src/presentation/pages/PlansPage.tsx src/App.tsx src/presentation/components/layout/Nav.tsx
git commit -m "feat(ui): add PlansPage with mock payment upgrade flow + nav link"
```

---

## Task 16: Create AdminPlansPage and update AdminLayout

**Files:**
- Create: `src/presentation/pages/admin/AdminPlansPage.tsx`
- Modify: `src/presentation/pages/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Create `src/presentation/pages/admin/AdminPlansPage.tsx`:**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { getPlans, createNewPlan, updatePlan, disablePlan, enablePlan, deletePlan } from '../../../application/admin/ManagePlansUseCase';
import { useToast } from '../../context/ToastContext';
import type { Plan } from '../../../domain/entities/Plan';
import AdminLayout from './AdminLayout';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const EMPTY_FORM = { name: '', price: '', durationDays: '', maxContacts: '', maxListings: '', canFeature: false };

export default function AdminPlansPage() {
  const showToast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(() => setPlans(getPlans()), []);
  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(EMPTY_FORM); setCreating(false); setEditingId(null); };

  const handleCreate = () => {
    try {
      createNewPlan({
        name: form.name,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        maxContacts: form.maxContacts === '' ? null : Number(form.maxContacts),
        maxListings: form.maxListings === '' ? null : Number(form.maxListings),
        canFeature: form.canFeature,
        active: true,
      });
      showToast('Plan creado', 'success');
      resetForm();
      load();
    } catch (e: any) {
      showToast(e.message || 'Error al crear el plan', 'error');
    }
  };

  const handleUpdate = (id: string) => {
    try {
      updatePlan(id, {
        name: form.name,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        maxContacts: form.maxContacts === '' ? null : Number(form.maxContacts),
        maxListings: form.maxListings === '' ? null : Number(form.maxListings),
        canFeature: form.canFeature,
      });
      showToast('Plan actualizado', 'success');
      resetForm();
      load();
    } catch (e: any) {
      showToast(e.message || 'Error al actualizar', 'error');
    }
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setCreating(false);
    setForm({
      name: plan.name,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      maxContacts: plan.maxContacts === null ? '' : String(plan.maxContacts),
      maxListings: plan.maxListings === null ? '' : String(plan.maxListings),
      canFeature: plan.canFeature,
    });
  };

  const handleToggle = (plan: Plan) => {
    if (plan.active) disablePlan(plan.id);
    else enablePlan(plan.id);
    showToast(plan.active ? 'Plan deshabilitado' : 'Plan habilitado', 'success');
    load();
  };

  const handleDelete = (plan: Plan) => {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      deletePlan(plan.id);
      showToast('Plan eliminado', 'success');
      load();
    } catch (e: any) {
      showToast(e.message || 'Error al eliminar', 'error');
    }
  };

  const PlanForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>
        {editingId ? 'Editar plan' : 'Nuevo plan'}
      </h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Premium Plus" />
        </div>
        <div className="form-group">
          <label className="form-label">Precio (COP) *</label>
          <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50000" />
        </div>
        <div className="form-group">
          <label className="form-label">Duración (días) *</label>
          <input className="form-input" type="number" min="1" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} placeholder="30" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Límite contactos/día (vacío = ilimitado)</label>
          <input className="form-input" type="number" min="1" value={form.maxContacts} onChange={(e) => setForm({ ...form, maxContacts: e.target.value })} placeholder="ilimitado" />
        </div>
        <div className="form-group">
          <label className="form-label">Límite publicaciones (vacío = ilimitado)</label>
          <input className="form-input" type="number" min="1" value={form.maxListings} onChange={(e) => setForm({ ...form, maxListings: e.target.value })} placeholder="ilimitado" />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={form.canFeature} onChange={(e) => setForm({ ...form, canFeature: e.target.checked })} />
          Permite destacar publicaciones
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary btn-sm" onClick={onSave}>Guardar</button>
        <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Planes de suscripción</h1>
            <p className="page-subtitle">{plans.length} plan{plans.length !== 1 ? 'es' : ''} configurados</p>
          </div>
          {!creating && !editingId && (
            <button className="btn btn-primary btn-sm" onClick={() => { setCreating(true); setEditingId(null); setForm(EMPTY_FORM); }}>
              + Nuevo plan
            </button>
          )}
        </div>

        {creating && <PlanForm onSave={handleCreate} onCancel={resetForm} />}
        {editingId && <PlanForm onSave={() => handleUpdate(editingId)} onCancel={resetForm} />}

        <div className="admin-table">
          <div className="admin-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
            <span>Nombre</span>
            <span>Precio</span>
            <span>Duración</span>
            <span>Beneficios</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {plans.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
              Sin datos disponibles
            </div>
          )}
          {plans.map((plan) => (
            <div key={plan.id} className="admin-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span style={{ fontWeight: 600 }}>{plan.name}</span>
              <span>{plan.price === 0 ? 'Gratis' : COP.format(plan.price)}</span>
              <span>{plan.durationDays === 0 ? '—' : `${plan.durationDays} días`}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                {plan.maxContacts === null ? '∞ contactos' : `${plan.maxContacts}/día`}
                {' · '}
                {plan.maxListings === null ? '∞ pubs.' : `${plan.maxListings} pubs.`}
                {plan.canFeature ? ' · Destacar' : ''}
              </span>
              <span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: plan.active ? 'var(--green)' : 'var(--gray-400)' }}>
                  {plan.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(plan)} style={{ fontSize: '0.75rem' }}>Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(plan)} style={{ fontSize: '0.75rem' }}>
                  {plan.active ? 'Deshabilitar' : 'Habilitar'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(plan)} style={{ fontSize: '0.75rem', color: 'var(--red)' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Add Planes nav item to `src/presentation/pages/admin/AdminLayout.tsx`**. In the `NAV_ITEMS` array, add:

```ts
{ path: '/admin/plans', label: 'Planes', icon: '💳' },
```

Place it after the Revenue item:

```ts
const NAV_ITEMS = [
  { path: '/admin', label: 'Resumen', icon: '📊', exact: true },
  { path: '/admin/reports', label: 'Reportes', icon: '🚩' },
  { path: '/admin/listings', label: 'Publicaciones', icon: '🏠' },
  { path: '/admin/users', label: 'Usuarios', icon: '👥' },
  { path: '/admin/metrics', label: 'Métricas', icon: '📈' },
  { path: '/admin/revenue', label: 'Ingresos', icon: '💰' },
  { path: '/admin/plans', label: 'Planes', icon: '💳' },
];
```

- [ ] **Add `/admin/plans` route to `src/App.tsx`**. Import and add:

```tsx
import AdminPlansPage from './presentation/pages/admin/AdminPlansPage';
```

Add inside the Layout routes:

```tsx
<Route path="/admin/plans" element={<AdminPlansPage />} />
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Manual test:** Log in as admin (admin@uhome.co / Admin2025). Click "Planes" in sidebar. Verify plan list renders. Create a new plan, edit it, disable/enable it.

- [ ] **Commit:**

```bash
git add src/presentation/pages/admin/AdminPlansPage.tsx src/presentation/pages/admin/AdminLayout.tsx src/App.tsx
git commit -m "feat(admin): add AdminPlansPage with full plan CRUD + admin nav link"
```

---

## Task 17: Update DashboardPage — freemium gate on publish + premium-only featuring

**Files:**
- Modify: `src/presentation/pages/DashboardPage.tsx`

- [ ] **Replace the entire file** `src/presentation/pages/DashboardPage.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { featureListing, unfeatureListing } from '../../application/listings/FeatureListingUseCase';
import { canPublish } from '../../application/freemium/CheckListingLimitUseCase';
import type { Listing } from '../../domain/entities/Listing';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import FreemiumGate from '../components/ui/FreemiumGate';
import Modal from '../components/ui/Modal';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const FEATURE_PLANS = [
  { days: 7, label: '7 días', price: 25000 },
  { days: 15, label: '15 días', price: 45000 },
  { days: 30, label: '30 días', price: 80000 },
];

function toggleStatus(id: string, status: Listing['status'], ownerId: string) {
  const l = ListingRepository.findById(id);
  if (!l || l.ownerId !== ownerId) return;
  ListingRepository.save({ ...l, status });
}

function removeListingById(id: string, ownerId: string) {
  const l = ListingRepository.findById(id);
  if (!l || l.ownerId !== ownerId) return;
  ListingRepository.delete(id);
}

export default function DashboardPage() {
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [featureModal, setFeatureModal] = useState<Listing | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [payStep, setPayStep] = useState<'plan' | 'pay' | 'done'>('plan');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [freemiumMsg, setFreemiumMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/login'); return; }
    setListings(ListingRepository.findByOwner(user.id));
  }, [user, navigate]);

  const reload = () => {
    if (!user) return;
    setListings(ListingRepository.findByOwner(user.id));
  };

  const handleNewListing = () => {
    if (!user) return;
    const check = canPublish(user.id);
    if (!check.allowed) {
      setFreemiumMsg(
        `Has alcanzado el máximo de ${check.limit} publicaciones activas en el plan gratuito. Actualiza a Premium para publicar más.`,
      );
      return;
    }
    navigate('/publish');
  };

  const handleToggleStatus = (l: Listing) => {
    const next = l.status === 'published' ? 'draft' : 'published';
    toggleStatus(l.id, next, user!.id);
    showToast(next === 'published' ? 'Publicación activada' : 'Publicación pausada', 'success');
    reload();
  };

  const handleDelete = (l: Listing) => {
    if (!confirm(`¿Eliminar "${l.title}"?`)) return;
    removeListingById(l.id, user!.id);
    showToast('Publicación eliminada', 'success');
    reload();
  };

  const openPayFeature = (l: Listing) => {
    setFeatureModal(l);
    setSelectedPlan(0);
    setPayStep('plan');
    setCardNum(''); setCardExp(''); setCardCvv('');
  };

  const handlePay = () => {
    if (!featureModal || !user) return;
    if (!cardNum.trim() || !cardExp.trim() || !cardCvv.trim()) {
      showToast('Completa todos los datos de pago', 'error');
      return;
    }
    try {
      featureListing(featureModal.id, user.id, FEATURE_PLANS[selectedPlan].days);
      setPayStep('done');
      reload();
    } catch (e: any) {
      showToast(e.message || 'Error al destacar', 'error');
    }
  };

  const handleUnfeature = (l: Listing) => {
    if (!confirm(`¿Quitar destaque de "${l.title}"?`)) return;
    unfeatureListing(l.id, user!.id);
    showToast('Destaque removido', 'success');
    reload();
  };

  const isPremium = user?.plan === 'premium';

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {freemiumMsg && (
        <FreemiumGate message={freemiumMsg} onClose={() => setFreemiumMsg(null)} />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Mis publicaciones</h1>
          <p className="page-subtitle">
            {listings.length} publicación{listings.length !== 1 ? 'es' : ''}
            {!isPremium && (
              <span style={{ color: 'var(--gray-400)', marginLeft: '0.5rem' }}>
                · {listings.filter((l) => l.status === 'published').length}/3 activas (plan gratuito)
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNewListing}>
          + Nueva publicación
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <p className="empty-state-title">Aún no tienes publicaciones</p>
          <button className="btn btn-primary" onClick={handleNewListing}>
            Crear primera publicación
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {listings.map((l) => {
            const isFeatured = l.featured && l.featuredUntil && new Date(l.featuredUntil) > new Date();
            return (
              <div key={l.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Link to={`/listing/${l.id}`} style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.title}</Link>
                      {isFeatured && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--yellow-soft, #fffbeb)', color: 'var(--yellow-dark, #92400e)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                          Destacada
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', background: l.status === 'published' ? 'var(--green-soft, #e6f9f0)' : 'var(--gray-100)', color: l.status === 'published' ? 'var(--green)' : 'var(--gray-500)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                        {l.status === 'published' ? 'Activa' : 'Pausada'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {COP.format(l.price)}/mes · {l.city}
                      {isFeatured && l.featuredUntil && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          · Destacada hasta {new Date(l.featuredUntil).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/publish?edit=${l.id}`} className="btn btn-outline btn-sm">Editar</Link>
                    <button className="btn btn-outline btn-sm" onClick={() => handleToggleStatus(l)}>
                      {l.status === 'published' ? 'Pausar' : 'Activar'}
                    </button>
                    {l.status === 'published' && (
                      isPremium ? (
                        isFeatured ? (
                          <button className="btn btn-outline btn-sm" onClick={() => handleUnfeature(l)}>Quitar destaque</button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => openPayFeature(l)}>Destacar</button>
                        )
                      ) : (
                        <Link to="/plans" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          Destacar (Premium)
                        </Link>
                      )
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(l)}>Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!featureModal} title="Destacar publicación" onClose={() => setFeatureModal(null)}>
        {featureModal && payStep === 'plan' && (
          <div>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Selecciona la duración del destaque para <strong>{featureModal.title}</strong>:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {FEATURE_PLANS.map((p, i) => (
                <label key={p.days} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', border: `1px solid ${selectedPlan === i ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)' }}>
                  <input type="radio" name="featurePlan" checked={selectedPlan === i} onChange={() => setSelectedPlan(i)} />
                  <span style={{ flex: 1, fontWeight: 500 }}>{p.label}</span>
                  <span style={{ fontWeight: 700 }}>{COP.format(p.price)}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => setPayStep('pay')}>Continuar</button>
              <button className="btn btn-outline" onClick={() => setFeatureModal(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {featureModal && payStep === 'pay' && (
          <div>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Total: <strong>{COP.format(FEATURE_PLANS[selectedPlan].price)}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Número de tarjeta</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNum} onChange={(e) => setCardNum(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vencimiento</label>
                <input className="form-input" placeholder="MM/AA" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input className="form-input" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handlePay}>Pagar {COP.format(FEATURE_PLANS[selectedPlan].price)}</button>
              <button className="btn btn-outline" onClick={() => setFeatureModal(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {payStep === 'done' && (
          <div>
            <p style={{ marginBottom: '1.5rem' }}>¡Publicación destacada exitosamente por {FEATURE_PLANS[selectedPlan].days} días!</p>
            <button className="btn btn-primary" onClick={() => { setFeatureModal(null); setPayStep('plan'); }}>Listo</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -30
```

- [ ] **Commit:**

```bash
git add src/presentation/pages/DashboardPage.tsx
git commit -m "feat(ui): enforce freemium limits and premium-only featuring in DashboardPage"
```

---

## Task 18: Update ListingDetailPage — freemium gate on contact

**Files:**
- Modify: `src/presentation/pages/ListingDetailPage.tsx`

- [ ] **Add imports** at the top of `src/presentation/pages/ListingDetailPage.tsx`:

```tsx
import { isStudent } from '../../domain/entities/User';
import { canContact } from '../../application/freemium/CheckContactLimitUseCase';
import FreemiumGate from '../components/ui/FreemiumGate';
```

- [ ] **Add state** for the freemium gate near the other state declarations:

```tsx
const [freemiumMsg, setFreemiumMsg] = useState<string | null>(null);
```

- [ ] **Replace the `handleContact` function** with a version that checks the limit:

```tsx
const handleContact = () => {
  if (!user) { navigate('/login'); return; }
  if (isStudent(user)) {
    const check = canContact(user);
    if (!check.allowed) {
      setFreemiumMsg(
        'Has alcanzado el límite de contactos del plan gratuito. Actualiza a Premium para continuar.',
      );
      return;
    }
  }
  navigate(`/messages?to=${listing?.ownerId}`);
};
```

- [ ] **Render the gate** inside the return JSX, right after the opening `<div className="container"`:

```tsx
{freemiumMsg && (
  <FreemiumGate message={freemiumMsg} onClose={() => setFreemiumMsg(null)} />
)}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Manual test:** Log in as a free student (carlos.r@icesi.edu.co / Password1). Open a listing. Click "Contactar". Should navigate normally. After 3 new unique contacts, clicking "Contactar" for a 4th new owner should show the FreemiumGate modal.

- [ ] **Commit:**

```bash
git add src/presentation/pages/ListingDetailPage.tsx
git commit -m "feat(ui): add freemium contact gate to ListingDetailPage"
```

---

## Task 19: Update AdminDashboardPage — premium users, contacts, date filter, auto-refresh

**Files:**
- Modify: `src/presentation/pages/admin/AdminDashboardPage.tsx`

- [ ] **Replace the entire file** `src/presentation/pages/admin/AdminDashboardPage.tsx`:

```tsx
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, type DashboardMetrics } from '../../../application/admin/GetDashboardMetricsUseCase';
import AdminLayout from './AdminLayout';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => {
    setMetrics(getDashboardMetrics());
    setLastUpdated(new Date());
  };

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!metrics) return null;

  const stats = [
    {
      icon: '👥',
      label: 'Usuarios totales',
      value: metrics.totalUsers,
      sub: `${metrics.totalStudents} estudiantes · ${metrics.totalOwners} propietarios`,
    },
    {
      icon: '⭐',
      label: 'Usuarios premium',
      value: metrics.totalPremiumUsers,
      sub: `${metrics.totalUsers - metrics.totalPremiumUsers} en plan gratuito`,
    },
    {
      icon: '🏠',
      label: 'Publicaciones activas',
      value: metrics.publishedListings,
      sub: `${metrics.featuredListings} destacadas · ${metrics.hiddenListings} ocultas`,
    },
    {
      icon: '💬',
      label: 'Contactos realizados',
      value: metrics.totalContacts,
      sub: 'Total histórico de contactos',
    },
    {
      icon: '🚩',
      label: 'Reportes pendientes',
      value: metrics.pendingReports,
      sub: `${metrics.totalReports} reportes en total`,
    },
    {
      icon: '🔒',
      label: 'Usuarios bloqueados',
      value: metrics.blockedUsers,
      sub: 'Cuentas restringidas',
    },
  ];

  const actions = [
    { to: '/admin/reports', label: 'Ver reportes', desc: 'Gestionar contenido reportado', icon: '🚩' },
    { to: '/admin/listings', label: 'Moderar publicaciones', desc: 'Ocultar o eliminar anuncios', icon: '🏠' },
    { to: '/admin/users', label: 'Gestionar usuarios', desc: 'Bloquear, editar o eliminar cuentas', icon: '👥' },
    { to: '/admin/metrics', label: 'Ver métricas', desc: 'Estadísticas detalladas del sistema', icon: '📈' },
    { to: '/admin/revenue', label: 'Ver ingresos', desc: 'Resumen financiero de la plataforma', icon: '💰' },
    { to: '/admin/plans', label: 'Gestionar planes', desc: 'Crear y editar planes de suscripción', icon: '💳' },
  ];

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Panel de Administración</h1>
            <p className="page-subtitle">Bienvenido al centro de control de Uhome</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button className="btn btn-outline btn-sm" onClick={refresh}>Actualizar</button>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
              Última actualización: {lastUpdated.toLocaleTimeString('es-CO')}
            </p>
          </div>
        </div>

        <div className="admin-stats">
          {stats.map((s) => (
            <div key={s.label} className="admin-stat">
              <div className="admin-stat-icon">{s.icon}</div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Acciones rápidas</h2>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="card card-link" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{a.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{a.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/presentation/pages/admin/AdminDashboardPage.tsx
git commit -m "feat(admin): add premium users + contacts metrics, 5-min auto-refresh"
```

---

## Task 20: Update AdminUsersPage — plan column and pagination

**Files:**
- Modify: `src/presentation/pages/admin/AdminUsersPage.tsx`

- [ ] **Read the current file** to identify where to add the plan badge and pagination. Then apply these two changes:

**Change 1** — In the user table row, after the role label cell, add a Plan cell. The grid columns need to include the plan column. Find the `admin-table-header` div and the `admin-table-row` divs; update `gridTemplateColumns` from the current value to include plan.

Current header (approximate):
```tsx
<div className="admin-table-header" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr' }}>
  <span>Nombre</span><span>Email</span><span>Rol</span><span>Estado</span><span>Acciones</span>
</div>
```

Updated header with Plan column:
```tsx
<div className="admin-table-header" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1.5fr' }}>
  <span>Nombre</span><span>Email</span><span>Rol</span><span>Plan</span><span>Estado</span><span>Acciones</span>
</div>
```

In each row, after the Rol `<span>`, add:
```tsx
<span>
  <span style={{
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    background: u.plan === 'premium' ? 'var(--primary-soft, #f0f4ff)' : 'var(--gray-100)',
    color: u.plan === 'premium' ? 'var(--primary)' : 'var(--gray-500)',
  }}>
    {u.plan === 'premium' ? 'Premium' : 'Gratuito'}
  </span>
</span>
```

**Change 2** — Add pagination. Add state and paged slice logic:

At the top of the component, add:
```tsx
const PAGE_SIZE = 10;
const [page, setPage] = useState(1);
```

Reset page when filter changes — add to the existing `load` callback or `useEffect`:
```tsx
useEffect(() => { setPage(1); }, [filter]);
```

After `setUsers` is called in `load`, apply paging in the render:
```tsx
const totalPages = Math.ceil(users.length / PAGE_SIZE);
const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
```

Replace `{users.map(...)}` with `{paged.map(...)}`.

Add pagination controls after the table:
```tsx
{totalPages > 1 && (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
    <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
      Anterior
    </button>
    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
      Página {page} de {totalPages}
    </span>
    <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
      Siguiente
    </button>
  </div>
)}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/presentation/pages/admin/AdminUsersPage.tsx
git commit -m "feat(admin): add plan column and 10-per-page pagination to AdminUsersPage"
```

---

## Task 21: Update AdminRevenuePage — real premium user count in stats

**Files:**
- Modify: `src/presentation/pages/admin/AdminRevenuePage.tsx`

- [ ] **Add imports** at the top of `src/presentation/pages/admin/AdminRevenuePage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';
```

- [ ] **Replace the static stat block** with dynamic data. Add state and useEffect:

```tsx
const [premiumCount, setPremiumCount] = useState(0);
const [premiumPrice, setPremiumPrice] = useState(50000);

useEffect(() => {
  const users = UserRepository.findAll().filter((u) => u.role !== 'admin');
  setPremiumCount(users.filter((u) => u.plan === 'premium').length);
  const premiumPlan = PlanRepository.findAll().find((p) => p.price > 0 && p.active);
  if (premiumPlan) setPremiumPrice(premiumPlan.price);
}, []);
```

- [ ] **Update the stats grid** to show the real premium count as a 5th stat. Add a new stat after the existing four:

```tsx
<div className="admin-stat">
  <div className="admin-stat-icon">👑</div>
  <div className="admin-stat-value">{premiumCount}</div>
  <div className="admin-stat-label">Suscriptores premium activos</div>
  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
    {COP.format(premiumCount * premiumPrice)}/mes estimado
  </div>
</div>
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/presentation/pages/admin/AdminRevenuePage.tsx
git commit -m "feat(admin): show real premium subscriber count in AdminRevenuePage"
```

---

## Task 22: Update ProfilePage — show and edit ratings given by current user

**Files:**
- Modify: `src/presentation/pages/ProfilePage.tsx`

- [ ] **Add imports** to `src/presentation/pages/ProfilePage.tsx`:

```tsx
import { editRating } from '../../application/social/RateUserUseCase';
import { RatingRepository } from '../../infrastructure/repositories/RatingRepository';
import type { Rating } from '../../domain/entities/Rating';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
```

- [ ] **Add state** for given ratings and inline edit:

```tsx
const [givenRatings, setGivenRatings] = useState<Rating[]>([]);
const [editingRating, setEditingRating] = useState<Rating | null>(null);
const [editScore, setEditScore] = useState(5);
const [editComment, setEditComment] = useState('');
```

- [ ] **Load given ratings** inside the component (after the existing `ratingSummary` line):

```tsx
useEffect(() => {
  setGivenRatings(RatingRepository.findByFromUser(user.id));
}, [user.id]);
```

- [ ] **Add `handleEditRating` handler:**

```tsx
const handleEditRating = () => {
  if (!editingRating) return;
  try {
    editRating(editingRating.id, user.id, editScore, editComment);
    showToast('Calificación actualizada', 'success');
    setEditingRating(null);
    setGivenRatings(RatingRepository.findByFromUser(user.id));
  } catch (e: any) {
    showToast(e.message || 'Error al editar', 'error');
  }
};
```

- [ ] **Add given ratings section** at the bottom of the return JSX (before the closing `</div>`). Place it after the existing received ratings section:

```tsx
{givenRatings.length > 0 && (
  <div className="profile-section" style={{ marginTop: '1.5rem' }}>
    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
      Calificaciones que has dado
    </h3>
    {givenRatings.map((r) => {
      const toUser = UserRepository.findById(r.toUserId);
      return (
        <div key={r.id} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          {editingRating?.id === r.id ? (
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Editando calificación a {toUser?.name ?? 'usuario'}
              </p>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditScore(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: s <= editScore ? 1 : 0.3 }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="form-textarea"
                rows={2}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleEditRating}>Guardar</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditingRating(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Para: {toUser?.name ?? 'usuario eliminado'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--yellow-dark, #92400e)' }}>
                  {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                </p>
                {r.comment && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{r.comment}</p>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => { setEditingRating(r); setEditScore(r.score); setEditComment(r.comment); }}
              >
                Editar
              </button>
            </div>
          )}
        </div>
      );
    })}
  </div>
)}
```

- [ ] **Verify compilation:**

```bash
pnpm build 2>&1 | head -20
```

- [ ] **Commit:**

```bash
git add src/presentation/pages/ProfilePage.tsx
git commit -m "feat(ui): add edit-given-ratings section to ProfilePage"
```

---

## Task 23: Final build verification and full manual smoke test

- [ ] **Full production build:**

```bash
pnpm build 2>&1
```

Expected: exit code 0, no TypeScript errors.

- [ ] **Start dev server:**

```bash
pnpm dev
```

- [ ] **Smoke test checklist (open browser at http://localhost:5173):**

| Scenario | Steps | Expected |
|---|---|---|
| Plans page | Log in as free student → click Planes | Two plan cards render; "Plan actual" badge on Gratuito |
| Upgrade to premium | Click "Actualizar a Premium" → fill mock card → pay | Success modal; badge changes to Premium; plan in nav reflected |
| Contact limit | Log in as free student (carlos.r) → contact 4 different new owners | 4th contact shows FreemiumGate modal |
| Contact allowed | Send 2nd message to same owner | No limit check triggered |
| Owner listing limit | Log in as free owner (jorge.pena) with 3 published listings → click "Nueva publicación" | FreemiumGate modal appears |
| Dashboard featuring | Log in as premium owner (lucia.m) → Dashboard → Destacar button visible on published listing | Paid feature modal opens |
| Free owner featuring | Log in as free owner (jorge.pena) | Destacar shows "Destacar (Premium)" link, not a button |
| Admin plans | Log in as admin → /admin/plans | Plan list renders; create/edit/disable/delete work |
| Admin dashboard | /admin | 6 stats including premium users and contacts; manual refresh button |
| Admin users | /admin/users | Plan column shows Free/Premium badge; pagination appears with >10 users |
| Admin revenue | /admin/revenue | Real premium subscriber stat shows |
| Edit rating | Log in as student who has rated someone → /profile | Given ratings section shows with Edit button; edit updates rating |

- [ ] **Commit final verification:**

```bash
git add -A
git status
```

If all clean, no extra commit needed. If any stray files, add and commit:

```bash
git commit -m "chore: sprint 3 implementation complete"
```

---

## Summary of All Commits

1. `feat(domain): add plan and contact-tracking fields to User`
2. `feat(domain): add Plan entity`
3. `feat(infra): add PlanRepository`
4. `feat(infra): add findById and findByFromUser to RatingRepository`
5. `feat(seed): add plans, assign premium users, bump seed to v3`
6. `feat(app): add CheckContactLimitUseCase for student freemium`
7. `feat(app): add CheckListingLimitUseCase for owner freemium`
8. `feat(app): enforce listing limit for free owners in PublishListingUseCase`
9. `feat(app): make featuring premium-only, remove featureListingFree`
10. `feat(app): enforce student contact limit in SendMessageUseCase`
11. `feat(app): add editRating to RateUserUseCase`
12. `feat(app): add ManagePlansUseCase for admin plan CRUD`
13. `feat(app): add totalPremiumUsers and totalContacts to dashboard metrics`
14. `feat(ui): add FreemiumGate reusable upgrade modal component`
15. `feat(ui): add PlansPage with mock payment upgrade flow + nav link`
16. `feat(admin): add AdminPlansPage with full plan CRUD + admin nav link`
17. `feat(ui): enforce freemium limits and premium-only featuring in DashboardPage`
18. `feat(ui): add freemium contact gate to ListingDetailPage`
19. `feat(admin): add premium users + contacts metrics, 5-min auto-refresh`
20. `feat(admin): add plan column and 10-per-page pagination to AdminUsersPage`
21. `feat(admin): show real premium subscriber count in AdminRevenuePage`
22. `feat(ui): add edit-given-ratings section to ProfilePage`
