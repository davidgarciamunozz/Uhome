import type { Report } from '../../domain/entities/Report';

const KEY = 'uhome_reports';

function getAll(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export const ReportRepository = {
  save: (report: Report): Report => {
    const reports = getAll();
    reports.push(report);
    localStorage.setItem(KEY, JSON.stringify(reports));
    return report;
  },
};
