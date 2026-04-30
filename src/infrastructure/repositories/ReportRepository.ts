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
