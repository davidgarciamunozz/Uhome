import { createMessage, type Message } from '../../domain/entities/Message';
import { ValidationError } from '../../domain/services/Validators';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';

export function sendMessage(senderId: string, receiverId: string, content: string): Message {
  if (!content?.trim()) {
    throw new ValidationError('content', 'El mensaje no puede estar vacío');
  }

  const message = createMessage({
    senderId,
    receiverId,
    content: content.trim(),
  });

  return MessageRepository.save(message);
}
