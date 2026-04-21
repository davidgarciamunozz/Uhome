import type { Message } from '../../domain/entities/Message';
import type { User } from '../../domain/entities/User';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface Conversation {
  partner: User;
  lastMessage: Message;
  unread: number;
}

export function getConversations(userId: string): Conversation[] {
  const partnerIds = MessageRepository.getPartnerIds(userId);

  return partnerIds
    .map((partnerId) => {
      const partner = UserRepository.findById(partnerId);
      if (!partner) return null;
      const messages = MessageRepository.getConversation(userId, partnerId);
      const lastMessage = messages[messages.length - 1];
      const unread = messages.filter((m) => m.receiverId === userId && !m.read).length;
      return { partner, lastMessage, unread };
    })
    .filter((c): c is Conversation => c !== null && !!c.lastMessage)
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
}
