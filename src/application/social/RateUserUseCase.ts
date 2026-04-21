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
