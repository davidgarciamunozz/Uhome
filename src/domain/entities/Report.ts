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
