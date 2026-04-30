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
