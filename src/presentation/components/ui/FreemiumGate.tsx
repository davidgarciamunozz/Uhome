import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

interface FreemiumGateProps {
  message: string;
  onClose: () => void;
}

export default function FreemiumGate({ message, onClose }: FreemiumGateProps) {
  const navigate = useNavigate();

  return (
    <Modal open={true} title="Límite del plan gratuito" onClose={onClose}>
      <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => { onClose(); navigate('/plans'); }}
        >
          Ver planes Premium
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
