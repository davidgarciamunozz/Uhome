import { createReport, type ReportReason, type ReportTargetType } from '../../domain/entities/Report';
import { ValidationError } from '../../domain/services/Validators';
import { ReportRepository } from '../../infrastructure/repositories/ReportRepository';

export function reportContent(
  reporterId: string,
  targetId: string,
  targetType: ReportTargetType,
  reason: ReportReason,
  description: string,
): void {
  if (!reason) throw new ValidationError('reason', 'El motivo es obligatorio');

  const report = createReport({ reporterId, targetId, targetType, reason, description });
  ReportRepository.save(report);
}
