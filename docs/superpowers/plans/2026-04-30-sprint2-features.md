# Sprint 2 — Admin Module + Featured Listings + City Restriction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict app to Cali, add admin role with full moderation panel (HU20–HU26), wire up ratings display (HU11), and implement featured listings (HU14 + HU18).

**Architecture:** Extend existing DDD layers — add `admin` to UserRole union, add `featured`/`hidden` flags to Listing, add `status` to Report. Admin pages live under `src/presentation/pages/admin/` with their own sidebar layout. All data is localStorage, dummy data for revenue/charts.

**Tech Stack:** React 18, TypeScript, React Router v6, localStorage repositories, existing CSS design system (Inter, CSS variables, no chart libraries).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/domain/entities/User.ts` | Add `admin` role, `Admin` interface, `isAdmin()`, `blocked` field |
| Modify | `src/domain/entities/Listing.ts` | Add `featured?`, `featuredUntil?`, `hidden?` |
| Modify | `src/domain/entities/Report.ts` | Add `status: 'pending' \| 'resolved'` |
| Modify | `src/infrastructure/repositories/ReportRepository.ts` | Add `findAll`, `findPending`, `update`, `delete` |
| Modify | `src/infrastructure/repositories/ListingRepository.ts` | `findPublished` excludes hidden listings |
| Modify | `src/application/auth/LoginUseCase.ts` | Reject blocked users |
| Modify | `src/infrastructure/seed/seedData.ts` | Cali data, admin user, bump key to v2 |
| Modify | `src/presentation/components/layout/Nav.tsx` | Admin nav branch |
| Modify | `src/presentation/components/listing/ListingCard.tsx` | Featured badge overlay |
| Modify | `src/application/listings/SearchListingsUseCase.ts` | Sort featured first |
| Modify | `src/presentation/pages/DashboardPage.tsx` | Feature toggle + mock payment modal |
| Modify | `src/presentation/pages/ListingDetailPage.tsx` | Show owner rating |
| Modify | `src/presentation/pages/PublishPage.tsx` | City locked to Cali |
| Modify | `src/presentation/pages/RegisterPage.tsx` | City locked to Cali |
| Modify | `src/index.css` | Featured badge, admin panel styles |
| Modify | `src/App.tsx` | Admin routes |
| Create | `src/application/admin/GetDashboardMetricsUseCase.ts` | Aggregate stats |
| Create | `src/application/listings/FeatureListingUseCase.ts` | Free + mock-payment feature toggle |
| Create | `src/presentation/pages/admin/AdminDashboardPage.tsx` | Admin home with stat cards |
| Create | `src/presentation/pages/admin/AdminReportsPage.tsx` | HU20 |
| Create | `src/presentation/pages/admin/AdminListingsPage.tsx` | HU21 + HU24 |
| Create | `src/presentation/pages/admin/AdminUsersPage.tsx` | HU22 + HU23 |
| Create | `src/presentation/pages/admin/AdminMetricsPage.tsx` | HU25 |
| Create | `src/presentation/pages/admin/AdminRevenuePage.tsx` | HU26 |

---

## Task 1: Domain entity extensions

**Files:**
- Modify: `src/domain/entities/User.ts`
- Modify: `src/domain/entities/Listing.ts`
- Modify: `src/domain/entities/Report.ts`

- [ ] **Step 1: Update User.ts — add admin role, Admin interface, blocked flag**

Replace the entire file with:

```typescript
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

- [ ] **Step 2: Update Listing.ts — add featured, hidden fields**

Replace the entire file with:

```typescript
export type PropertyType = 'habitación' | 'apartamento';
export type ListingStatus = 'published' | 'draft';

export interface ListingServices {
  internet: boolean;
  water: boolean;
  electricity: boolean;
  gas: boolean;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  price: number;
  city: string;
  zone: string;
  address: string;
  type: PropertyType;
  rooms: number;
  bathrooms: number;
  description: string;
  services: ListingServices;
  images: string[];
  status: ListingStatus;
  featured?: boolean;
  featuredUntil?: string;
  hidden?: boolean;
  createdAt: string;
}

export function createListing(data: Omit<Listing, 'id' | 'createdAt'>): Listing {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 3: Update Report.ts — add status field**

Replace the entire file with:

```typescript
export type ReportReason = 'spam' | 'false_info' | 'inappropriate';
export type ReportTargetType = 'listing' | 'user';
export type ReportStatus = 'pending' | 'resolved';

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export function createReport(data: Omit<Report, 'id' | 'createdAt' | 'status'>): Report {
  return {
    ...data,
    id: crypto.randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/domain/entities/User.ts src/domain/entities/Listing.ts src/domain/entities/Report.ts
git commit -m "feat: extend domain entities for admin role, featured listings, report status"
```

---

## Task 2: Infrastructure updates

**Files:**
- Modify: `src/infrastructure/repositories/ReportRepository.ts`
- Modify: `src/infrastructure/repositories/ListingRepository.ts`
- Modify: `src/application/auth/LoginUseCase.ts`

- [ ] **Step 1: Update ReportRepository.ts with full CRUD**

Replace the entire file with:

```typescript
import type { Report, ReportStatus } from '../../domain/entities/Report';

const KEY = 'uhome_reports';

function getAll(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(reports: Report[]): void {
  localStorage.setItem(KEY, JSON.stringify(reports));
}

export const ReportRepository = {
  findAll: (): Report[] => getAll(),

  findPending: (): Report[] => getAll().filter((r) => r.status === 'pending'),

  save: (report: Report): Report => {
    const reports = getAll();
    const idx = reports.findIndex((r) => r.id === report.id);
    if (idx >= 0) reports[idx] = report;
    else reports.push(report);
    saveAll(reports);
    return report;
  },

  updateStatus: (id: string, status: ReportStatus): void => {
    const reports = getAll();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx >= 0) { reports[idx] = { ...reports[idx], status }; saveAll(reports); }
  },

  delete: (id: string): void => {
    saveAll(getAll().filter((r) => r.id !== id));
  },
};
```

- [ ] **Step 2: Update ListingRepository.ts — findPublished excludes hidden**

In `src/infrastructure/repositories/ListingRepository.ts`, update the `findPublished` method:

```typescript
findPublished: (): Listing[] =>
  getAll().filter((l) => l.status === 'published' && !l.hidden),
```

- [ ] **Step 3: Update LoginUseCase.ts — reject blocked users**

Replace `src/application/auth/LoginUseCase.ts` with:

```typescript
import type { User } from '../../domain/entities/User';
import { ValidationError } from '../../domain/services/Validators';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export function login(email: string, password: string): User {
  if (!email?.trim() || !password) {
    throw new ValidationError('email', 'Complete todos los campos');
  }

  const user = UserRepository.findByEmail(email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new ValidationError('email', 'Correo o contraseña incorrectos');
  }

  if (user.blocked) {
    throw new ValidationError('email', 'Esta cuenta ha sido bloqueada. Contacta al administrador.');
  }

  return user;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/repositories/ReportRepository.ts src/infrastructure/repositories/ListingRepository.ts src/application/auth/LoginUseCase.ts
git commit -m "feat: extend repositories with admin operations, block check on login"
```

---

## Task 3: Seed data — Cali cities + admin user

**Files:**
- Modify: `src/infrastructure/seed/seedData.ts`

- [ ] **Step 1: Replace seed data with Cali-based data and admin user**

Replace the entire file with:

```typescript
import type { User } from '../../domain/entities/User';
import type { Listing } from '../../domain/entities/Listing';
import type { RoomieProfile } from '../../domain/entities/RoomieProfile';
import type { Message } from '../../domain/entities/Message';
import { UserRepository } from '../repositories/UserRepository';
import { ListingRepository } from '../repositories/ListingRepository';
import { RoomieRepository } from '../repositories/RoomieRepository';
import { MessageRepository } from '../repositories/MessageRepository';

const SEED_KEY = 'uhome_seeded_v2';

const USERS: User[] = [
  {
    id: 'student-1',
    name: 'María García',
    email: 'maria.garcia@univalle.edu.co',
    password: 'Password1',
    role: 'student',
    university: 'Universidad del Valle',
    career: 'Ingeniería de Sistemas',
    age: 21,
    budget: { min: 300000, max: 600000 },
    preferences: { smoker: false, pets: false, schedule: 'tranquilo' },
    description: 'Estudiante de sistemas, me gusta el orden y la tranquilidad. Busco un lugar cómodo cerca de la universidad.',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'student-2',
    name: 'Carlos Rodríguez',
    email: 'carlos.r@icesi.edu.co',
    password: 'Password1',
    role: 'student',
    university: 'Universidad Icesi',
    career: 'Administración de Empresas',
    age: 22,
    budget: { min: 400000, max: 800000 },
    preferences: { smoker: false, pets: true, schedule: 'social' },
    description: 'Busco roomie sociable y responsable. Tengo un perro pequeño muy amigable.',
    createdAt: '2025-01-20T10:00:00.000Z',
  },
  {
    id: 'owner-1',
    name: 'Lucía Martínez',
    email: 'lucia.m@gmail.com',
    password: 'Password1',
    role: 'owner',
    phone: '3101234567',
    propertyTypes: ['habitación', 'apartamento'],
    city: 'Cali',
    description: 'Propietaria de inmuebles en el norte de Cali. Alquilo a estudiantes universitarios.',
    createdAt: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'owner-2',
    name: 'Jorge Peña',
    email: 'jorge.pena@hotmail.com',
    password: 'Password1',
    role: 'owner',
    phone: '3209876543',
    propertyTypes: ['apartamento'],
    city: 'Cali',
    description: 'Propietario en Ciudad Jardín, Cali. Apartamentos bien ubicados para estudiantes.',
    createdAt: '2025-01-12T10:00:00.000Z',
  },
  {
    id: 'admin-1',
    name: 'Administrador Uhome',
    email: 'admin@uhome.co',
    password: 'Admin2025',
    role: 'admin',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

const LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    ownerId: 'owner-1',
    ownerName: 'Lucía Martínez',
    title: 'Habitación individual en Granada',
    price: 550000,
    city: 'Cali',
    zone: 'Granada',
    address: 'Cra. 9 con Calle 14N',
    type: 'habitación',
    rooms: 1,
    bathrooms: 1,
    description: 'Habitación amplia y luminosa con baño compartido. A 10 min de la Universidad Icesi. Incluye servicios, WiFi de alta velocidad y acceso a cocina y sala común.',
    services: { internet: true, water: true, electricity: true, gas: false },
    images: [],
    status: 'published',
    featured: true,
    featuredUntil: '2025-06-30T00:00:00.000Z',
    createdAt: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'listing-2',
    ownerId: 'owner-1',
    ownerName: 'Lucía Martínez',
    title: 'Apartamento moderno en San Fernando',
    price: 1200000,
    city: 'Cali',
    zone: 'San Fernando',
    address: 'Calle 5 con Carrera 40',
    type: 'apartamento',
    rooms: 2,
    bathrooms: 1,
    description: 'Apartamento nuevo, bien ubicado, cerca de la Universidad del Valle. Ideal para 2 estudiantes. Piso 4 con buena vista. Parqueadero disponible.',
    services: { internet: true, water: true, electricity: true, gas: true },
    images: [],
    status: 'published',
    createdAt: '2025-02-05T10:00:00.000Z',
  },
  {
    id: 'listing-3',
    ownerId: 'owner-2',
    ownerName: 'Jorge Peña',
    title: 'Habitación en Ciudad Jardín',
    price: 480000,
    city: 'Cali',
    zone: 'Ciudad Jardín',
    address: 'Cra. 100, Ciudad Jardín',
    type: 'habitación',
    rooms: 1,
    bathrooms: 1,
    description: 'Habitación en casa compartida de 4 estudiantes. Zona muy segura y con buena vida universitaria. A 15 min de la Universidad Icesi.',
    services: { internet: true, water: true, electricity: false, gas: false },
    images: [],
    status: 'published',
    createdAt: '2025-02-10T10:00:00.000Z',
  },
  {
    id: 'listing-4',
    ownerId: 'owner-2',
    ownerName: 'Jorge Peña',
    title: 'Apartamento estudio en Santa Teresita',
    price: 900000,
    city: 'Cali',
    zone: 'Santa Teresita',
    address: 'Av. 6N con Calle 23N',
    type: 'apartamento',
    rooms: 1,
    bathrooms: 1,
    description: 'Estudio completamente amoblado, cocina integrada, buena ubicación. Ideal para estudiante independiente. Cerca de la Universidad Autónoma de Occidente.',
    services: { internet: true, water: true, electricity: true, gas: true },
    images: [],
    status: 'published',
    createdAt: '2025-02-15T10:00:00.000Z',
  },
  {
    id: 'listing-5',
    ownerId: 'owner-1',
    ownerName: 'Lucía Martínez',
    title: 'Habitación en El Peñón',
    price: 380000,
    city: 'Cali',
    zone: 'El Peñón',
    address: 'Calle 5 con Carrera 2',
    type: 'habitación',
    rooms: 1,
    bathrooms: 1,
    description: 'Habitación económica en casa colonial restaurada. Ideal para estudiantes de la Universidad del Valle o Javeriana Cali. Zona histórica y tranquila.',
    services: { internet: true, water: true, electricity: true, gas: false },
    images: [],
    status: 'published',
    createdAt: '2025-02-20T10:00:00.000Z',
  },
  {
    id: 'listing-6',
    ownerId: 'owner-2',
    ownerName: 'Jorge Peña',
    title: 'Apartamento 3 hab. en Versalles',
    price: 1500000,
    city: 'Cali',
    zone: 'Versalles',
    address: 'Av. 1N con Calle 18N',
    type: 'apartamento',
    rooms: 3,
    bathrooms: 2,
    description: 'Gran apartamento perfecto para 3 estudiantes. Zona residencial tranquila, parques cercanos, buena conexión de transporte.',
    services: { internet: true, water: true, electricity: true, gas: true },
    images: [],
    status: 'published',
    createdAt: '2025-02-25T10:00:00.000Z',
  },
];

const ROOMIE_PROFILES: RoomieProfile[] = [
  {
    id: 'roomie-1',
    userId: 'student-1',
    name: 'María García',
    age: 21,
    university: 'Universidad del Valle',
    career: 'Ingeniería de Sistemas',
    preferences: { smoker: false, pets: 'no', schedule: 'tranquilo', order: 'alto' },
    budget: 500000,
    stayDuration: 12,
    description: 'Busco roomie ordenada/o, tranquila/o. Estudio mucho en las tardes así que prefiero ambiente sin mucho ruido. Me encanta cocinar y comparto mi comida.',
    createdAt: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'roomie-2',
    userId: 'student-2',
    name: 'Carlos Rodríguez',
    age: 22,
    university: 'Universidad Icesi',
    career: 'Administración de Empresas',
    preferences: { smoker: false, pets: 'sí', schedule: 'social', order: 'medio' },
    budget: 700000,
    stayDuration: 6,
    description: 'Soy social y organizado a mi manera. Tengo un perro pequeño (muy buena gente). Me gusta cocinar los fines de semana.',
    createdAt: '2025-02-05T10:00:00.000Z',
  },
];

const MESSAGES: Message[] = [
  {
    id: 'msg-1',
    senderId: 'student-1',
    receiverId: 'owner-1',
    content: '¡Hola! Me interesa la habitación en Granada. ¿Está disponible?',
    createdAt: '2025-03-01T10:00:00.000Z',
    read: true,
  },
  {
    id: 'msg-2',
    senderId: 'owner-1',
    receiverId: 'student-1',
    content: '¡Hola María! Sí, sigue disponible. ¿Te gustaría verla este fin de semana?',
    createdAt: '2025-03-01T11:00:00.000Z',
    read: true,
  },
];

export function seedIfNeeded(): void {
  if (localStorage.getItem(SEED_KEY)) return;
  UserRepository.seed(USERS);
  ListingRepository.seed(LISTINGS);
  RoomieRepository.seed(ROOMIE_PROFILES);
  MessageRepository.seed(MESSAGES);
  localStorage.setItem(SEED_KEY, '1');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/seed/seedData.ts
git commit -m "feat: migrate seed data to Cali, add admin user, bump seed key to v2"
```

---

## Task 4: Admin use case

**Files:**
- Create: `src/application/admin/GetDashboardMetricsUseCase.ts`

- [ ] **Step 1: Create the metrics use case**

Create `src/application/admin/GetDashboardMetricsUseCase.ts`:

```typescript
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { ReportRepository } from '../../infrastructure/repositories/ReportRepository';

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
}

export function getDashboardMetrics(): DashboardMetrics {
  const users = UserRepository.findAll().filter((u) => u.role !== 'admin');
  const listings = ListingRepository.findAll();
  const reports = ReportRepository.findAll();

  return {
    totalUsers: users.length,
    totalStudents: users.filter((u) => u.role === 'student').length,
    totalOwners: users.filter((u) => u.role === 'owner').length,
    blockedUsers: users.filter((u) => u.blocked).length,
    totalListings: listings.length,
    publishedListings: listings.filter((l) => l.status === 'published' && !l.hidden).length,
    hiddenListings: listings.filter((l) => l.hidden).length,
    featuredListings: listings.filter((l) => l.featured).length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    totalReports: reports.length,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/application/admin/GetDashboardMetricsUseCase.ts
git commit -m "feat: add admin dashboard metrics use case"
```

---

## Task 5: Feature listing use case (HU14 + HU18)

**Files:**
- Create: `src/application/listings/FeatureListingUseCase.ts`

- [ ] **Step 1: Create the use case**

Create `src/application/listings/FeatureListingUseCase.ts`:

```typescript
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { ValidationError } from '../../domain/services/Validators';

export function featureListingFree(listingId: string, ownerId: string): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) {
    throw new ValidationError('listing', 'Publicación no encontrada');
  }
  if (listing.status !== 'published') {
    throw new ValidationError('listing', 'Solo puedes destacar publicaciones activas');
  }
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 7);
  ListingRepository.save({ ...listing, featured: true, featuredUntil: featuredUntil.toISOString() });
}

export function featureListingPaid(listingId: string, ownerId: string, days: number): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) {
    throw new ValidationError('listing', 'Publicación no encontrada');
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

- [ ] **Step 2: Commit**

```bash
git add src/application/listings/FeatureListingUseCase.ts
git commit -m "feat: add feature listing use case (free MVP + mock-payment)"
```

---

## Task 6: CSS additions

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Append new CSS rules to the end of `src/index.css`**

```css
/* ─── Featured badge ─────────────────────────────────────── */
.featured-badge {
  position: absolute; top: 0.75rem; right: 0.75rem;
  background: #F59E0B; color: #fff;
  padding: 0.2rem 0.625rem; border-radius: 100px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  z-index: 1;
}

/* ─── Admin panel ────────────────────────────────────────── */
.admin-layout {
  display: grid; grid-template-columns: 220px 1fr;
  min-height: calc(100vh - var(--nav-h));
  align-items: start;
}
.admin-sidebar {
  border-right: 1px solid var(--gray-200);
  padding: 1.5rem 0;
  position: sticky; top: var(--nav-h);
  height: calc(100vh - var(--nav-h));
  overflow-y: auto;
}
.admin-sidebar-title {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
  color: var(--gray-400); padding: 0 1.25rem; margin-bottom: 0.5rem;
  text-transform: uppercase;
}
.admin-nav-link {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem; font-weight: 500; color: var(--gray-600);
  cursor: pointer; border: none; background: none; width: 100%; text-align: left;
  transition: all 0.15s; text-decoration: none;
}
.admin-nav-link:hover { background: var(--gray-50); color: var(--black); }
.admin-nav-link.active { background: var(--red-light); color: var(--red); font-weight: 600; }
.admin-content { padding: 2rem; }

.admin-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
.admin-stat {
  padding: 1.25rem; border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg); background: var(--white);
}
.admin-stat-value { font-size: 1.75rem; font-weight: 800; color: var(--black); line-height: 1; }
.admin-stat-label { font-size: 0.75rem; color: var(--gray-600); margin-top: 0.25rem; }
.admin-stat-icon { font-size: 1.25rem; margin-bottom: 0.5rem; }

.admin-table { border: 1px solid var(--gray-200); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table-header {
  display: grid; padding: 0.75rem 1rem;
  background: var(--gray-50); border-bottom: 1px solid var(--gray-200);
  font-size: 0.75rem; font-weight: 700; color: var(--gray-600);
}
.admin-table-row {
  display: grid; padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--gray-200); align-items: center;
  font-size: 0.875rem; background: var(--white);
}
.admin-table-row:last-child { border-bottom: none; }
.admin-table-row:hover { background: var(--gray-50); }
.admin-row-actions { display: flex; gap: 0.5rem; }

.status-hidden { background: #FEF3C7; color: #B45309; }
.status-blocked { background: #FEE2E2; color: #B91C1C; }
.status-featured { background: #FEF3C7; color: #B45309; }

.revenue-chart { display: flex; align-items: flex-end; gap: 0.75rem; height: 180px; padding: 1rem 0; }
.revenue-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; flex: 1; }
.revenue-bar {
  width: 100%; background: var(--red); border-radius: 4px 4px 0 0;
  min-height: 4px; transition: height 0.3s;
}
.revenue-bar-label { font-size: 0.7rem; color: var(--gray-600); white-space: nowrap; }
.revenue-bar-value { font-size: 0.75rem; font-weight: 700; }

@media (max-width: 900px) {
  .admin-layout { grid-template-columns: 1fr; }
  .admin-sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--gray-200); padding: 0.75rem 0; display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .admin-stats { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add CSS for featured badge and admin panel"
```

---

## Task 7: Nav update + Admin Layout component

**Files:**
- Modify: `src/presentation/components/layout/Nav.tsx`
- Create: `src/presentation/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Update Nav.tsx — add admin branch**

Replace the entire file with:

```typescript
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { isOwner, isAdmin } from '../../../domain/entities/User';

export default function Nav() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">Uhome</Link>
        <nav className="nav-links">
          {!user ? (
            <>
              <Link to="/search">Buscar vivienda</Link>
              <Link to="/roomies">Buscar roomie</Link>
              <Link to="/login" className="btn btn-outline btn-sm">Ingresar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
            </>
          ) : isAdmin(user) ? (
            <>
              <Link to="/admin">Panel de administración</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </>
          ) : isOwner(user) ? (
            <>
              <Link to="/dashboard">Mis publicaciones</Link>
              <Link to="/publish">Publicar</Link>
              <Link to="/messages">Mensajes</Link>
              <Link to="/profile">Perfil</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/search">Buscar vivienda</Link>
              <Link to="/roomies">Roomies</Link>
              <Link to="/messages">Mensajes</Link>
              <Link to="/profile">Perfil</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create AdminLayout.tsx**

Create `src/presentation/pages/admin/AdminLayout.tsx`:

```typescript
import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { isAdmin } from '../../../domain/entities/User';

const NAV_ITEMS = [
  { path: '/admin', label: 'Resumen', icon: '📊', exact: true },
  { path: '/admin/reports', label: 'Reportes', icon: '🚩' },
  { path: '/admin/listings', label: 'Publicaciones', icon: '🏠' },
  { path: '/admin/users', label: 'Usuarios', icon: '👥' },
  { path: '/admin/metrics', label: 'Métricas', icon: '📈' },
  { path: '/admin/revenue', label: 'Ingresos', icon: '💰' },
];

interface Props { children: ReactNode }

export default function AdminLayout({ children }: Props) {
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || !isAdmin(user)) {
    navigate('/login');
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-sidebar-title">Administración</p>
        {NAV_ITEMS.map(({ path, label, icon, exact }) => {
          const active = exact ? location.pathname === path : location.pathname.startsWith(path) && path !== '/admin';
          const isExactAdmin = exact && location.pathname === '/admin';
          return (
            <Link
              key={path}
              to={path}
              className={`admin-nav-link ${active || isExactAdmin ? 'active' : ''}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/layout/Nav.tsx src/presentation/pages/admin/AdminLayout.tsx
git commit -m "feat: add admin nav branch and admin sidebar layout component"
```

---

## Task 8: Admin Dashboard page (overview + HU25 stats)

**Files:**
- Create: `src/presentation/pages/admin/AdminDashboardPage.tsx`

- [ ] **Step 1: Create AdminDashboardPage.tsx**

```typescript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, type DashboardMetrics } from '../../../application/admin/GetDashboardMetricsUseCase';
import AdminLayout from './AdminLayout';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    setMetrics(getDashboardMetrics());
  }, []);

  if (!metrics) return null;

  const stats = [
    { icon: '👥', label: 'Usuarios totales', value: metrics.totalUsers, sub: `${metrics.totalStudents} estudiantes · ${metrics.totalOwners} propietarios` },
    { icon: '🏠', label: 'Publicaciones activas', value: metrics.publishedListings, sub: `${metrics.featuredListings} destacadas · ${metrics.hiddenListings} ocultas` },
    { icon: '🚩', label: 'Reportes pendientes', value: metrics.pendingReports, sub: `${metrics.totalReports} reportes en total` },
    { icon: '🔒', label: 'Usuarios bloqueados', value: metrics.blockedUsers, sub: 'Cuentas restringidas' },
  ];

  const actions = [
    { to: '/admin/reports', label: 'Ver reportes', desc: 'Gestionar contenido reportado', icon: '🚩' },
    { to: '/admin/listings', label: 'Moderar publicaciones', desc: 'Ocultar o eliminar anuncios', icon: '🏠' },
    { to: '/admin/users', label: 'Gestionar usuarios', desc: 'Bloquear, editar o eliminar cuentas', icon: '👥' },
    { to: '/admin/metrics', label: 'Ver métricas', desc: 'Estadísticas detalladas del sistema', icon: '📈' },
    { to: '/admin/revenue', label: 'Ver ingresos', desc: 'Resumen financiero de la plataforma', icon: '💰' },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Panel de Administración</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Bienvenido al centro de control de Uhome</p>

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

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/admin/AdminDashboardPage.tsx
git commit -m "feat: add admin dashboard overview page with key metrics"
```

---

## Task 9: Admin Reports page (HU20)

**Files:**
- Create: `src/presentation/pages/admin/AdminReportsPage.tsx`

- [ ] **Step 1: Create AdminReportsPage.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { ReportRepository } from '../../../infrastructure/repositories/ReportRepository';
import { ListingRepository } from '../../../infrastructure/repositories/ListingRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import type { Report } from '../../../domain/entities/Report';
import { useToast } from '../../context/ToastContext';
import AdminLayout from './AdminLayout';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  false_info: 'Información falsa',
  inappropriate: 'Contenido inapropiado',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const showToast = useToast();

  const load = useCallback(() => {
    const all = ReportRepository.findAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setReports(filter === 'all' ? all : all.filter((r) => r.status === filter));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = (report: Report) => {
    if (!confirm('¿Marcar este reporte como resuelto?')) return;
    ReportRepository.updateStatus(report.id, 'resolved');
    showToast('Reporte marcado como resuelto', 'success');
    load();
  };

  const handleDeleteListing = (report: Report) => {
    if (!confirm('¿Eliminar la publicación reportada? Esta acción no se puede deshacer.')) return;
    ListingRepository.delete(report.targetId);
    ReportRepository.updateStatus(report.id, 'resolved');
    showToast('Publicación eliminada y reporte resuelto', 'success');
    load();
  };

  const handleBlockUser = (report: Report) => {
    const userId = report.targetType === 'user' ? report.targetId : null;
    if (!userId) return;
    if (!confirm('¿Bloquear a este usuario? No podrá iniciar sesión.')) return;
    const user = UserRepository.findById(userId);
    if (user) {
      UserRepository.save({ ...user, blocked: true });
      ReportRepository.updateStatus(report.id, 'resolved');
      showToast('Usuario bloqueado', 'success');
      load();
    }
  };

  const handleDelete = (report: Report) => {
    if (!confirm('¿Eliminar este reporte del sistema?')) return;
    ReportRepository.delete(report.id);
    showToast('Reporte eliminado', 'success');
    load();
  };

  return (
    <AdminLayout>
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Gestionar Reportes</h1>
            <p className="page-subtitle">{reports.length} reporte{reports.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="tab-group" style={{ width: 'auto', marginBottom: 0 }}>
            {(['pending', 'resolved', 'all'] as const).map((f) => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'pending' ? 'Pendientes' : f === 'resolved' ? 'Resueltos' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Sin reportes {filter === 'pending' ? 'pendientes' : ''}</h3>
            <p>No hay reportes en esta categoría.</p>
          </div>
        ) : (
          <div className="admin-table">
            {reports.map((r) => (
              <div key={r.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px 140px' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                    {r.targetType === 'listing' ? '🏠 Publicación' : '👤 Usuario'}
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: '0.375rem' }}>
                      {r.targetId.slice(0, 8)}…
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{r.description || '—'}</div>
                </div>
                <div>
                  <span className="badge badge-red">{REASON_LABELS[r.reason]}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    {new Date(r.createdAt).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div>
                  <span className={`status-badge ${r.status === 'pending' ? 'badge-red' : 'status-published'}`}>
                    {r.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                  </span>
                </div>
                <div className="admin-row-actions" style={{ flexDirection: 'column', gap: '0.375rem' }}>
                  {r.status === 'pending' && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => handleResolve(r)}>
                        Resolver
                      </button>
                      {r.targetType === 'listing' && (
                        <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDeleteListing(r)}>
                          Eliminar pub.
                        </button>
                      )}
                      {r.targetType === 'user' && (
                        <button className="btn btn-ghost btn-sm text-red" onClick={() => handleBlockUser(r)}>
                          Bloquear user
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)' }} onClick={() => handleDelete(r)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/admin/AdminReportsPage.tsx
git commit -m "feat: add admin reports page (HU20)"
```

---

## Task 10: Admin Listings page (HU21 + HU24)

**Files:**
- Create: `src/presentation/pages/admin/AdminListingsPage.tsx`

- [ ] **Step 1: Create AdminListingsPage.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { ListingRepository } from '../../../infrastructure/repositories/ListingRepository';
import type { Listing } from '../../../domain/entities/Listing';
import { useToast } from '../../context/ToastContext';
import AdminLayout from './AdminLayout';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<'all' | 'hidden' | 'featured'>('all');
  const showToast = useToast();

  const load = useCallback(() => {
    const all = ListingRepository.findAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filter === 'hidden') setListings(all.filter((l) => l.hidden));
    else if (filter === 'featured') setListings(all.filter((l) => l.featured));
    else setListings(all);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleHidden = (l: Listing) => {
    const action = l.hidden ? 'mostrar' : 'ocultar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${l.title}"?`)) return;
    ListingRepository.save({ ...l, hidden: !l.hidden });
    showToast(`Publicación ${l.hidden ? 'visible' : 'ocultada'}`, 'success');
    load();
  };

  const handleDelete = (l: Listing) => {
    if (!confirm(`¿Eliminar permanentemente "${l.title}"? Esta acción no se puede deshacer.`)) return;
    ListingRepository.delete(l.id);
    showToast('Publicación eliminada', 'success');
    load();
  };

  const handleToggleFeatured = (l: Listing) => {
    if (!confirm(`¿${l.featured ? 'Quitar destaque de' : 'Destacar'} "${l.title}"?`)) return;
    ListingRepository.save({ ...l, featured: !l.featured, featuredUntil: !l.featured ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined });
    showToast(l.featured ? 'Destaque removido' : 'Publicación destacada', 'success');
    load();
  };

  return (
    <AdminLayout>
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Publicaciones</h1>
            <p className="page-subtitle">{listings.length} publicación{listings.length !== 1 ? 'es' : ''}</p>
          </div>
          <div className="tab-group" style={{ width: 'auto', marginBottom: 0 }}>
            {(['all', 'featured', 'hidden'] as const).map((f) => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todas' : f === 'featured' ? 'Destacadas' : 'Ocultas'}
              </button>
            ))}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>Sin publicaciones</h3>
            <p>No hay publicaciones en esta categoría.</p>
          </div>
        ) : (
          <div className="listing-table">
            {listings.map((l) => (
              <div key={l.id} className="listing-row">
                <div className="listing-row-thumb">
                  <div className="listing-row-placeholder">{l.type === 'habitación' ? '🛏' : '🏢'}</div>
                </div>
                <div className="listing-row-info">
                  <div className="listing-row-title">{l.title}</div>
                  <div className="listing-row-meta">
                    {l.city} · {l.zone} · {COP.format(l.price)}/mes · {l.ownerName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span className={`status-badge ${l.status === 'published' ? 'status-published' : 'status-draft'}`}>
                    {l.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                  {l.hidden && <span className="status-badge status-hidden">Oculto</span>}
                  {l.featured && <span className="status-badge status-featured">⭐ Destacado</span>}
                </div>
                <div className="listing-row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleHidden(l)}>
                    {l.hidden ? 'Mostrar' : 'Ocultar'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleFeatured(l)}>
                    {l.featured ? 'Quitar destaque' : 'Destacar'}
                  </button>
                  <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(l)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/admin/AdminListingsPage.tsx
git commit -m "feat: add admin listings moderation page (HU21 + HU24)"
```

---

## Task 11: Admin Users page (HU22 + HU23)

**Files:**
- Create: `src/presentation/pages/admin/AdminUsersPage.tsx`

- [ ] **Step 1: Create AdminUsersPage.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import type { User } from '../../../domain/entities/User';
import { useToast } from '../../context/ToastContext';
import { useSession } from '../../context/SessionContext';
import AdminLayout from './AdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'student' | 'owner' | 'blocked'>('all');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const showToast = useToast();
  const { user: currentAdmin } = useSession();

  const load = useCallback(() => {
    const all = UserRepository.findAll()
      .filter((u) => u.role !== 'admin')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter === 'blocked') setUsers(all.filter((u) => u.blocked));
    else if (filter === 'all') setUsers(all);
    else setUsers(all.filter((u) => u.role === filter));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleBlock = (u: User) => {
    const action = u.blocked ? 'desbloquear' : 'bloquear';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${u.name}?`)) return;
    UserRepository.save({ ...u, blocked: !u.blocked });
    showToast(u.blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado', 'success');
    load();
  };

  const handleDelete = (u: User) => {
    if (!confirm(`¿Eliminar permanentemente la cuenta de ${u.name}? Esta acción no se puede deshacer.`)) return;
    UserRepository.delete(u.id);
    showToast('Usuario eliminado', 'success');
    load();
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    if (!editName.trim() || !editEmail.trim()) { showToast('Nombre y email son obligatorios', 'error'); return; }
    UserRepository.save({ ...editUser, name: editName.trim(), email: editEmail.trim().toLowerCase() });
    showToast('Usuario actualizado', 'success');
    setEditUser(null);
    load();
  };

  const roleLabel: Record<string, string> = { student: 'Estudiante', owner: 'Propietario' };

  return (
    <AdminLayout>
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Usuarios</h1>
            <p className="page-subtitle">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="tab-group" style={{ width: 'auto', marginBottom: 0 }}>
            {(['all', 'student', 'owner', 'blocked'] as const).map((f) => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'student' ? 'Estudiantes' : f === 'owner' ? 'Propietarios' : 'Bloqueados'}
              </button>
            ))}
          </div>
        </div>

        {editUser && (
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Editar usuario: {editUser.name}</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>Guardar cambios</button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditUser(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Sin usuarios</h3>
            <p>No hay usuarios en esta categoría.</p>
          </div>
        ) : (
          <div className="admin-table">
            {users.map((u) => (
              <div key={u.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px 160px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="avatar avatar-sm">{u.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{u.email}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="badge badge-gray">{roleLabel[u.role] || u.role}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    Desde {new Date(u.createdAt).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div>
                  {u.blocked
                    ? <span className="status-badge status-blocked">Bloqueado</span>
                    : <span className="status-badge status-published">Activo</span>
                  }
                </div>
                <div className="admin-row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Editar</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleBlock(u)}>
                    {u.blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                  <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(u)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/admin/AdminUsersPage.tsx
git commit -m "feat: add admin users management page (HU22 + HU23)"
```

---

## Task 12: Admin Metrics page (HU25 detailed)

**Files:**
- Create: `src/presentation/pages/admin/AdminMetricsPage.tsx`

- [ ] **Step 1: Create AdminMetricsPage.tsx**

```typescript
import { useEffect, useState } from 'react';
import { getDashboardMetrics, type DashboardMetrics } from '../../../application/admin/GetDashboardMetricsUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { ListingRepository } from '../../../infrastructure/repositories/ListingRepository';
import { ReportRepository } from '../../../infrastructure/repositories/ReportRepository';
import AdminLayout from './AdminLayout';

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [monthlyUsers, setMonthlyUsers] = useState<{ month: string; count: number }[]>([]);
  const [reportsByReason, setReportsByReason] = useState<{ reason: string; count: number }[]>([]);

  useEffect(() => {
    setMetrics(getDashboardMetrics());

    const users = UserRepository.findAll().filter((u) => u.role !== 'admin');
    const monthMap: Record<string, number> = {};
    users.forEach((u) => {
      const month = u.createdAt.slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    setMonthlyUsers(
      Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, count]) => ({ month, count }))
    );

    const reports = ReportRepository.findAll();
    const reasonMap: Record<string, number> = { spam: 0, false_info: 0, inappropriate: 0 };
    reports.forEach((r) => { reasonMap[r.reason] = (reasonMap[r.reason] || 0) + 1; });
    setReportsByReason([
      { reason: 'Spam', count: reasonMap.spam },
      { reason: 'Info falsa', count: reasonMap.false_info },
      { reason: 'Inapropiado', count: reasonMap.inappropriate },
    ]);
  }, []);

  if (!metrics) return null;

  const maxMonthly = Math.max(...monthlyUsers.map((m) => m.count), 1);

  const metricCards = [
    { label: 'Total usuarios', value: metrics.totalUsers, color: 'var(--black)' },
    { label: 'Estudiantes', value: metrics.totalStudents, color: 'var(--black)' },
    { label: 'Propietarios', value: metrics.totalOwners, color: 'var(--black)' },
    { label: 'Bloqueados', value: metrics.blockedUsers, color: 'var(--red)' },
    { label: 'Publicaciones', value: metrics.totalListings, color: 'var(--black)' },
    { label: 'Publicadas', value: metrics.publishedListings, color: 'var(--green)' },
    { label: 'Destacadas', value: metrics.featuredListings, color: '#B45309' },
    { label: 'Ocultas', value: metrics.hiddenListings, color: 'var(--gray-600)' },
    { label: 'Total reportes', value: metrics.totalReports, color: 'var(--black)' },
    { label: 'Pendientes', value: metrics.pendingReports, color: 'var(--red)' },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Métricas del sistema</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Estadísticas generales de la plataforma</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {metricCards.map((m) => (
            <div key={m.label} style={{ padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.125rem' }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className="form-row" style={{ gap: '2rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Nuevos usuarios por mes</h2>
            {monthlyUsers.length === 0 ? (
              <p className="text-gray text-sm">Sin datos disponibles</p>
            ) : (
              <div className="revenue-chart">
                {monthlyUsers.map((m) => (
                  <div key={m.month} className="revenue-bar-wrap">
                    <div className="revenue-bar-value">{m.count}</div>
                    <div className="revenue-bar" style={{ height: `${Math.round((m.count / maxMonthly) * 120) + 4}px` }} />
                    <div className="revenue-bar-label">{m.month.slice(5)}/{m.month.slice(2, 4)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Reportes por motivo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reportsByReason.map((r) => (
                <div key={r.reason} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '90px', fontSize: '0.8rem', color: 'var(--gray-600)' }}>{r.reason}</div>
                  <div style={{ flex: 1, height: '12px', background: 'var(--gray-100)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${metrics.totalReports > 0 ? Math.round((r.count / metrics.totalReports) * 100) : 0}%`, height: '100%', background: 'var(--red)', borderRadius: '100px' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, width: '24px', textAlign: 'right' }}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/admin/AdminMetricsPage.tsx
git commit -m "feat: add admin metrics page with charts (HU25)"
```

---

## Task 13: Admin Revenue page (HU26)

**Files:**
- Create: `src/presentation/pages/admin/AdminRevenuePage.tsx`

- [ ] **Step 1: Create AdminRevenuePage.tsx with dummy data**

```typescript
import AdminLayout from './AdminLayout';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const MONTHLY_REVENUE = [
  { month: 'Nov 24', total: 450000, featured: 120000, subscriptions: 330000 },
  { month: 'Dic 24', total: 620000, featured: 200000, subscriptions: 420000 },
  { month: 'Ene 25', total: 380000, featured: 80000, subscriptions: 300000 },
  { month: 'Feb 25', total: 870000, featured: 350000, subscriptions: 520000 },
  { month: 'Mar 25', total: 940000, featured: 390000, subscriptions: 550000 },
  { month: 'Abr 25', total: 1150000, featured: 480000, subscriptions: 670000 },
];

const BREAKDOWN = [
  { plan: 'Destaque 7 días', price: 25000, units: 12, total: 300000 },
  { plan: 'Destaque 15 días', price: 45000, units: 8, total: 360000 },
  { plan: 'Destaque 30 días', price: 80000, units: 6, total: 480000 },
  { plan: 'Suscripción Propietario Pro', price: 50000, units: 4, total: 200000 },
];

export default function AdminRevenuePage() {
  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.total, 0);
  const thisMonth = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1];
  const lastMonth = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2];
  const growth = Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100);
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.total));

  return (
    <AdminLayout>
      <div>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Ingresos</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Resumen financiero de la plataforma</p>

        <div className="admin-stats" style={{ marginBottom: '2rem' }}>
          <div className="admin-stat">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-value">{COP.format(totalRevenue)}</div>
            <div className="admin-stat-label">Ingresos totales (acumulado)</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon">📅</div>
            <div className="admin-stat-value">{COP.format(thisMonth.total)}</div>
            <div className="admin-stat-label">Este mes</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon">{growth >= 0 ? '📈' : '📉'}</div>
            <div className="admin-stat-value" style={{ color: growth >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {growth >= 0 ? '+' : ''}{growth}%
            </div>
            <div className="admin-stat-label">vs. mes anterior</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon">⭐</div>
            <div className="admin-stat-value">{COP.format(thisMonth.featured)}</div>
            <div className="admin-stat-label">Ingresos por destacados</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Ingresos mensuales</h2>
        <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="revenue-chart">
            {MONTHLY_REVENUE.map((m) => (
              <div key={m.month} className="revenue-bar-wrap">
                <div className="revenue-bar-value" style={{ fontSize: '0.65rem' }}>{COP.format(m.total)}</div>
                <div className="revenue-bar" style={{ height: `${Math.round((m.total / maxRevenue) * 130) + 4}px` }} />
                <div className="revenue-bar-label">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Desglose por plan</h2>
        <div className="admin-table">
          <div className="admin-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
            <span>Plan</span><span>Precio unit.</span><span>Unidades</span><span>Total</span>
          </div>
          {BREAKDOWN.map((b) => (
            <div key={b.plan} className="admin-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
              <span style={{ fontWeight: 500 }}>{b.plan}</span>
              <span>{COP.format(b.price)}</span>
              <span>{b.units}</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>{COP.format(b.total)}</span>
            </div>
          ))}
          <div className="admin-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--gray-50)', fontWeight: 700 }}>
            <span>Total este mes</span><span>—</span>
            <span>{BREAKDOWN.reduce((s, b) => s + b.units, 0)}</span>
            <span style={{ color: 'var(--green)' }}>{COP.format(thisMonth.total)}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '1rem' }}>
          * Los datos de ingresos son de referencia (demo). La integración de pagos se implementará en próximos sprints.
        </p>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/admin/AdminRevenuePage.tsx
git commit -m "feat: add admin revenue page with dummy data (HU26)"
```

---

## Task 14: Featured badge in ListingCard + search sort

**Files:**
- Modify: `src/presentation/components/listing/ListingCard.tsx`
- Modify: `src/application/listings/SearchListingsUseCase.ts`

- [ ] **Step 1: Update ListingCard.tsx — add featured badge**

Replace the entire file with:

```typescript
import { Link } from 'react-router-dom';
import type { Listing } from '../../../domain/entities/Listing';

interface Props {
  listing: Listing;
}

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function ListingCard({ listing }: Props) {
  const services = Object.entries({
    internet: 'WiFi',
    water: 'Agua',
    electricity: 'Luz',
    gas: 'Gas',
  })
    .filter(([key]) => listing.services[key as keyof typeof listing.services])
    .map(([, label]) => label);

  return (
    <Link to={`/listing/${listing.id}`} className="card card-link">
      <div className="listing-thumb">
        {listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className={`listing-thumb-placeholder listing-thumb-${listing.type === 'habitación' ? 'room' : 'apt'}`}>
            <span>{listing.type === 'habitación' ? '🛏' : '🏢'}</span>
          </div>
        )}
        <span className={`listing-type-badge badge-${listing.type === 'habitación' ? 'red' : 'dark'}`}>
          {listing.type}
        </span>
        {listing.featured && <span className="featured-badge">⭐ Destacado</span>}
      </div>
      <div className="card-body">
        <div className="listing-price">{COP.format(listing.price)}<span className="listing-price-unit">/mes</span></div>
        <h3 className="listing-title">{listing.title}</h3>
        <p className="listing-location">📍 {listing.city}{listing.zone ? ` · ${listing.zone}` : ''}</p>
        <div className="listing-meta">
          <span>🛏 {listing.rooms} hab.</span>
          <span>🚿 {listing.bathrooms} baño{listing.bathrooms !== 1 ? 's' : ''}</span>
        </div>
        {services.length > 0 && (
          <div className="chips">
            {services.map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Update SearchListingsUseCase.ts — sort featured first**

Replace the return sort at the end of `searchListings` function:

```typescript
  return listings.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/listing/ListingCard.tsx src/application/listings/SearchListingsUseCase.ts
git commit -m "feat: add featured badge to listing cards, sort featured first in search"
```

---

## Task 15: Dashboard — featured toggle (HU14 + HU18)

**Files:**
- Modify: `src/presentation/pages/DashboardPage.tsx`

- [ ] **Step 1: Replace DashboardPage.tsx with featured support**

Replace the entire file with:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { featureListingFree, featureListingPaid, unfeatureListing } from '../../application/listings/FeatureListingUseCase';
import type { Listing } from '../../domain/entities/Listing';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
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

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/login'); return; }
    setListings(ListingRepository.findByOwner(user.id));
  }, [user, navigate]);

  const reload = () => {
    if (!user) return;
    setListings(ListingRepository.findByOwner(user.id));
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

  const handleFeatureFree = (l: Listing) => {
    if (!confirm(`¿Destacar "${l.title}" gratis por 7 días?`)) return;
    try {
      featureListingFree(l.id, user!.id);
      showToast('¡Publicación destacada por 7 días!', 'success');
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
    featureListingPaid(featureModal.id, user.id, FEATURE_PLANS[selectedPlan].days);
    setPayStep('done');
    reload();
  };

  const published = listings.filter((l) => l.status === 'published');
  const drafts = listings.filter((l) => l.status === 'draft');
  const featured = listings.filter((l) => l.featured);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mis publicaciones</h1>
          <p className="page-subtitle">Gestiona tus propiedades</p>
        </div>
        <Link to="/publish" className="btn btn-primary">+ Nueva publicación</Link>
      </div>

      <div className="dashboard-stats">
        {[
          { label: 'Total', value: listings.length },
          { label: 'Publicadas', value: published.length },
          { label: 'Borradores', value: drafts.length },
          { label: 'Destacadas', value: featured.length },
        ].map((s) => (
          <div key={s.label} className="dashboard-stat">
            <div className="dashboard-stat-value">{s.value}</div>
            <div className="dashboard-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No tienes publicaciones</h3>
          <p>Crea tu primera publicación para que los estudiantes puedan encontrarte.</p>
          <Link to="/publish" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Crear primera publicación
          </Link>
        </div>
      ) : (
        <div className="listing-table">
          {listings.map((l) => (
            <div key={l.id} className="listing-row">
              <div className="listing-row-thumb">
                {l.images[0]
                  ? <img src={l.images[0]} alt="" />
                  : <div className="listing-row-placeholder">{l.type === 'habitación' ? '🛏' : '🏢'}</div>
                }
              </div>
              <div className="listing-row-info">
                <div className="listing-row-title">{l.title}</div>
                <div className="listing-row-meta">
                  {l.city}{l.zone ? ` · ${l.zone}` : ''} · {COP.format(l.price)}/mes
                </div>
                {l.featured && l.featuredUntil && (
                  <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.125rem' }}>
                    ⭐ Destacado hasta {new Date(l.featuredUntil).toLocaleDateString('es-CO')}
                  </div>
                )}
              </div>
              <div className="listing-row-status">
                <span className={`status-badge ${l.status === 'published' ? 'status-published' : 'status-draft'}`}>
                  {l.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="listing-row-actions" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/publish?edit=${l.id}`)}>Editar</button>
                <button className="btn btn-outline btn-sm" onClick={() => handleToggleStatus(l)}>
                  {l.status === 'published' ? 'Pausar' : 'Activar'}
                </button>
                {l.status === 'published' && !l.featured && (
                  <button className="btn btn-outline btn-sm" style={{ color: '#B45309', borderColor: '#F59E0B' }}
                    onClick={() => handleFeatureFree(l)}>
                    ⭐ Destacar gratis
                  </button>
                )}
                {l.status === 'published' && !l.featured && (
                  <button className="btn btn-outline btn-sm" onClick={() => openPayFeature(l)}>
                    💳 Destacar con pago
                  </button>
                )}
                {l.featured && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleUnfeature(l)}>
                    Quitar destaque
                  </button>
                )}
                <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(l)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!featureModal} onClose={() => setFeatureModal(null)} title="Destacar publicación">
        {payStep === 'plan' && (
          <>
            <p className="text-gray text-sm" style={{ marginBottom: '1.25rem' }}>
              Selecciona el plan de destaque para <strong>{featureModal?.title}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {FEATURE_PLANS.map((p, i) => (
                <label key={p.days} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', border: `1.5px solid ${selectedPlan === i ? 'var(--red)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                  <input type="radio" name="plan" checked={selectedPlan === i} onChange={() => setSelectedPlan(i)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Tu anuncio aparece primero en los resultados</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--red)' }}>{COP.format(p.price)}</div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setFeatureModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setPayStep('pay')}>Continuar al pago</button>
            </div>
          </>
        )}

        {payStep === 'pay' && (
          <>
            <p className="text-gray text-sm" style={{ marginBottom: '1.25rem' }}>
              Plan: <strong>{FEATURE_PLANS[selectedPlan].label}</strong> — {COP.format(FEATURE_PLANS[selectedPlan].price)}
            </p>
            <div className="form-group">
              <label className="form-label">Número de tarjeta *</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" maxLength={19}
                value={cardNum} onChange={(e) => setCardNum(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vencimiento *</label>
                <input className="form-input" placeholder="MM/AA" maxLength={5}
                  value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CVV *</label>
                <input className="form-input" placeholder="123" maxLength={4} type="password"
                  value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
              🔒 Pago de demostración — no se realizarán cargos reales.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setPayStep('plan')}>Atrás</button>
              <button className="btn btn-primary" onClick={handlePay}>Pagar {COP.format(FEATURE_PLANS[selectedPlan].price)}</button>
            </div>
          </>
        )}

        {payStep === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>¡Pago procesado!</h3>
            <p className="text-gray" style={{ marginBottom: '1.25rem' }}>
              Tu publicación aparecerá destacada durante {FEATURE_PLANS[selectedPlan].label}.
            </p>
            <button className="btn btn-primary" onClick={() => setFeatureModal(null)}>Entendido</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/DashboardPage.tsx
git commit -m "feat: add featured listing toggle (free MVP + mock payment) to dashboard (HU14 + HU18)"
```

---

## Task 16: Show owner rating in ListingDetailPage (HU11 completion)

**Files:**
- Modify: `src/presentation/pages/ListingDetailPage.tsx`

- [ ] **Step 1: Add owner rating display to ListingDetailPage.tsx**

After the import for `Modal`, add these imports:

```typescript
import { getUserRatingSummary } from '../../application/social/RateUserUseCase';
import Stars from '../components/ui/Stars';
```

After the `const [owner, setOwner]` useState declaration, add:

```typescript
const [ratingSummary, setRatingSummary] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
```

In the `useEffect`, after `setOwner(UserRepository.findById(l.ownerId));`, add:

```typescript
const summary = getUserRatingSummary(l.ownerId);
setRatingSummary({ average: summary.average, count: summary.count });
```

In the JSX, replace the owner card block (the `{owner && (...)}` div) with:

```typescript
{owner && (
  <div>
    <div className="owner-card">
      <div className="avatar avatar-sm">
        {owner.avatar ? <img src={owner.avatar} alt={owner.name} /> : owner.name.charAt(0)}
      </div>
      <div>
        <p className="text-sm text-bold">{owner.name}</p>
        <p className="text-xs text-gray">Propietario</p>
      </div>
    </div>
    {ratingSummary.count > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Stars value={Math.round(ratingSummary.average)} size="sm" />
        <span className="text-sm text-bold">{ratingSummary.average}</span>
        <span className="text-xs text-gray">({ratingSummary.count} reseñas)</span>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/presentation/pages/ListingDetailPage.tsx
git commit -m "feat: show owner rating on listing detail page (HU11)"
```

---

## Task 17: City locked to Cali in Register + Publish

**Files:**
- Modify: `src/presentation/pages/RegisterPage.tsx`
- Modify: `src/presentation/pages/PublishPage.tsx`

- [ ] **Step 1: Update RegisterPage — lock city to Cali for owners**

In `RegisterPage.tsx`, replace the owner city input (`<input className=...  placeholder="Bogotá" />`) with:

```typescript
<input
  className="form-input"
  value="Cali"
  readOnly
  style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
/>
```

Also, in the `o` state initializer, set `city: 'Cali'`:

```typescript
const [o, setO] = useState({
  name: '', email: '', password: '', confirmPassword: '',
  phone: '', city: 'Cali',
  propertyTypes: [] as string[],
});
```

- [ ] **Step 2: Update PublishPage — lock city to Cali**

In `PublishPage.tsx`, change the initial `form` state to set `city: 'Cali'`:

```typescript
const [form, setForm] = useState({
  title: '', price: '', city: 'Cali', zone: '', address: '',
  ...
```

Replace the city input field in the form with:

```typescript
<div className="form-group">
  <label className="form-label">Ciudad *</label>
  <input
    className="form-input"
    value="Cali"
    readOnly
    style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
  />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/pages/RegisterPage.tsx src/presentation/pages/PublishPage.tsx
git commit -m "feat: restrict city to Cali in register and publish forms"
```

---

## Task 18: Wire admin routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx with admin routes**

Replace the entire file with:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './presentation/context/SessionContext';
import { ToastProvider } from './presentation/context/ToastContext';
import { seedIfNeeded } from './infrastructure/seed/seedData';
import Layout from './presentation/components/layout/Layout';
import HomePage from './presentation/pages/HomePage';
import LoginPage from './presentation/pages/LoginPage';
import RegisterPage from './presentation/pages/RegisterPage';
import SearchPage from './presentation/pages/SearchPage';
import ListingDetailPage from './presentation/pages/ListingDetailPage';
import PublishPage from './presentation/pages/PublishPage';
import DashboardPage from './presentation/pages/DashboardPage';
import ProfilePage from './presentation/pages/ProfilePage';
import RoomiesPage from './presentation/pages/RoomiesPage';
import RoomieProfilePage from './presentation/pages/RoomieProfilePage';
import RoomieProfileEditPage from './presentation/pages/RoomieProfileEditPage';
import MessagesPage from './presentation/pages/MessagesPage';
import AdminDashboardPage from './presentation/pages/admin/AdminDashboardPage';
import AdminReportsPage from './presentation/pages/admin/AdminReportsPage';
import AdminListingsPage from './presentation/pages/admin/AdminListingsPage';
import AdminUsersPage from './presentation/pages/admin/AdminUsersPage';
import AdminMetricsPage from './presentation/pages/admin/AdminMetricsPage';
import AdminRevenuePage from './presentation/pages/admin/AdminRevenuePage';

seedIfNeeded();

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/listing/:id" element={<ListingDetailPage />} />
                    <Route path="/publish" element={<PublishPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/roomies" element={<RoomiesPage />} />
                    <Route path="/roomie/:id" element={<RoomieProfilePage />} />
                    <Route path="/roomie-profile/edit" element={<RoomieProfileEditPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/reports" element={<AdminReportsPage />} />
                    <Route path="/admin/listings" element={<AdminListingsPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/metrics" element={<AdminMetricsPage />} />
                    <Route path="/admin/revenue" element={<AdminRevenuePage />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add admin routes to App.tsx"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered by |
|-------------|-----------|
| Solo Cali | Task 3 (seed), Task 17 (forms) |
| HU20 — Gestionar reportes | Task 9 (AdminReportsPage) |
| HU21 — Moderar publicaciones | Task 10 (AdminListingsPage) |
| HU22 — Moderar usuarios | Task 11 (AdminUsersPage) |
| HU23 — Gestionar usuarios | Task 11 (AdminUsersPage) |
| HU24 — Gestionar publicaciones | Task 10 (AdminListingsPage) |
| HU25 — Visualizar métricas | Task 8 + Task 12 |
| HU26 — Visualizar ingresos | Task 13 (AdminRevenuePage) |
| HU11 — Calificar experiencia | Already in RoomieProfilePage; Task 16 adds rating display to listing detail |
| HU12 — Reportar publicación o perfil | Already implemented; Task 2 adds status to Report, Task 9 admin sees reports |
| HU14 — Activar destaque (MVP) | Task 5 (use case) + Task 15 (dashboard free button) |
| HU18 — Destacar con pago | Task 5 (use case) + Task 15 (mock payment modal) |
| Admin solo puede acceder | AdminLayout guard in all admin pages |
| Confirmación antes de acciones | All destructive actions use `confirm()` |
| Usuarios bloqueados no pueden entrar | Task 2 LoginUseCase |
| Featured aparece primero | Task 14 (SearchListingsUseCase sort) |
| Badge visual Destacado | Task 14 (ListingCard) |

**Placeholder scan:** No TBD, TODO, or incomplete steps found.

**Type consistency:**
- `featureListingFree`, `featureListingPaid`, `unfeatureListing` used consistently in Task 5 and Task 15.
- `AdminLayout` imported identically in all admin pages.
- `getDashboardMetrics` returns `DashboardMetrics` used in Tasks 8 and 12.
- `ReportRepository.updateStatus`, `.delete`, `.findAll` defined in Task 2 and used in Tasks 9, 10, 11.
