export type ReportReason = 'spam' | 'false_info' | 'inappropriate';
export type ReportTargetType = 'listing' | 'user';

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description: string;
  createdAt: string;
}

export function createReport(data: Omit<Report, 'id' | 'createdAt'>): Report {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
