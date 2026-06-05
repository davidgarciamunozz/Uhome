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
