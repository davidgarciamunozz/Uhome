import type { Message } from '../../domain/entities/Message';

const KEY = 'uhome_messages';

function getAll(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(messages: Message[]): void {
  localStorage.setItem(KEY, JSON.stringify(messages));
}

export const MessageRepository = {
  getConversation: (user1Id: string, user2Id: string): Message[] =>
    getAll()
      .filter(
        (m) =>
          (m.senderId === user1Id && m.receiverId === user2Id) ||
          (m.senderId === user2Id && m.receiverId === user1Id),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),

  getPartnerIds: (userId: string): string[] => {
    const messages = getAll();
    const partners = new Set<string>();
    messages.forEach((m) => {
      if (m.senderId === userId) partners.add(m.receiverId);
      if (m.receiverId === userId) partners.add(m.senderId);
    });
    return [...partners];
  },

  save: (message: Message): Message => {
    const messages = getAll();
    messages.push(message);
    saveAll(messages);
    return message;
  },

  seed: (messages: Message[]): void => {
    saveAll(messages);
  },
};
