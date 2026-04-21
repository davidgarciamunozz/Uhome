import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConversations } from '../../application/messages/GetConversationsUseCase';
import { sendMessage } from '../../application/messages/SendMessageUseCase';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import type { Conversation } from '../../application/messages/GetConversationsUseCase';
import type { Message } from '../../domain/entities/Message';
import type { User } from '../../domain/entities/User';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';

export default function MessagesPage() {
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('to');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const convos = getConversations(user.id);
    setConversations(convos);

    const initialPartnerId = targetId || convos[0]?.partner.id || null;
    if (initialPartnerId) selectPartner(initialPartnerId);
  }, [user, targetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectPartner = (partnerId: string) => {
    if (!user) return;
    setActivePartnerId(partnerId);
    setActivePartner(UserRepository.findById(partnerId));
    setMessages(MessageRepository.getConversation(user.id, partnerId));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activePartnerId || !newMessage.trim()) return;
    try {
      sendMessage(user.id, activePartnerId, newMessage);
      setNewMessage('');
      setMessages(MessageRepository.getConversation(user.id, activePartnerId));
      setConversations(getConversations(user.id));
    } catch {
      showToast('No se pudo enviar el mensaje', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="messages-layout">
      {/* Sidebar: conversations */}
      <div className="conversations-sidebar">
        <div className="conversations-header">Mensajes</div>
        {conversations.length === 0 && !targetId ? (
          <div className="conversations-empty">
            <p className="text-gray text-sm" style={{ padding: '1.5rem', textAlign: 'center' }}>
              No tienes conversaciones aún
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.partner.id}
              className={`conversation-item ${activePartnerId === c.partner.id ? 'active' : ''}`}
              onClick={() => selectPartner(c.partner.id)}
            >
              <div className="avatar avatar-sm">
                {c.partner.avatar
                  ? <img src={c.partner.avatar} alt={c.partner.name} />
                  : <span>{c.partner.name.charAt(0)}</span>
                }
              </div>
              <div className="conversation-info">
                <div className="conversation-name">{c.partner.name}</div>
                <div className="conversation-preview">{c.lastMessage?.content}</div>
              </div>
              {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
            </div>
          ))
        )}
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {activePartner ? (
          <>
            <div className="chat-header">
              <div className="avatar avatar-sm">
                {activePartner.avatar
                  ? <img src={activePartner.avatar} alt={activePartner.name} />
                  : <span>{activePartner.name.charAt(0)}</span>
                }
              </div>
              <div>
                <div className="text-bold">{activePartner.name}</div>
                <div className="text-xs text-gray">{activePartner.role === 'owner' ? 'Propietario' : 'Estudiante'}</div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p className="text-gray text-sm">Inicia la conversación</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.senderId === user.id ? 'message-sent' : 'message-received'}`}
                >
                  {msg.content}
                  <div className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSend}>
              <textarea
                className="chat-textarea"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                rows={1}
              />
              <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <p className="text-gray">Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
