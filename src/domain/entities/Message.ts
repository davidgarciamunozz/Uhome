export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export function createMessage(data: Omit<Message, 'id' | 'createdAt' | 'read'>): Message {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
}
