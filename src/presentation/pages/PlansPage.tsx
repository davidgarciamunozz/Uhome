import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanRepository } from '../../infrastructure/repositories/PlanRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import type { Plan } from '../../domain/entities/Plan';
import Modal from '../components/ui/Modal';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

type PayStep = 'confirm' | 'pay' | 'done';

const PLAN_BENEFITS: Record<string, string[]> = {
  'plan-free': [
    'Hasta 3 contactos por día',
    'Hasta 3 publicaciones activas',
    'Acceso a búsqueda y roomies',
  ],
  'plan-premium': [
    'Contactos ilimitados por día',
    'Publicaciones activas ilimitadas',
    'Destacar publicaciones en búsqueda',
    'Mayor visibilidad en resultados',
    'Soporte prioritario',
  ],
};

function getBenefits(plan: Plan): string[] {
  return PLAN_BENEFITS[plan.id] ?? [
    plan.maxContacts ? `Hasta ${plan.maxContacts} contactos/día` : 'Contactos ilimitados',
    plan.maxListings ? `Hasta ${plan.maxListings} publicaciones` : 'Publicaciones ilimitadas',
    plan.canFeature ? 'Destacar publicaciones' : 'Sin destacados',
  ];
}

export default function PlansPage() {
  const { user, refreshUser } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('confirm');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setPlans(PlanRepository.findActive());
  }, [user, navigate]);

  const openUpgrade = (plan: Plan) => {
    setUpgradeTarget(plan);
    setPayStep('confirm');
    setCardNum(''); setCardExp(''); setCardCvv('');
  };

  const handlePay = () => {
    if (!user || !upgradeTarget) return;
    if (!cardNum.trim() || !cardExp.trim() || !cardCvv.trim()) {
      showToast('Completa todos los datos de pago', 'error');
      return;
    }
    UserRepository.save({ ...user, plan: 'premium' });
    refreshUser();
    setPayStep('done');
  };

  const handleClose = () => setUpgradeTarget(null);

  const isPremium = user?.plan === 'premium';

  return (
    <div className="container" style={{ maxWidth: 800, padding: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">Planes Uhome</h1>
        <p className="page-subtitle">Elige el plan que mejor se adapta a ti</p>
      </div>

      {isPremium && (
        <div style={{ background: 'var(--primary-soft, #f0f4ff)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
          Ya tienes el plan Premium activo.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan) => {
          const isCurrent = plan.price === 0 ? !isPremium : isPremium;
          const isPremiumPlan = plan.price > 0;
          return (
            <div key={plan.id} className="card" style={{ padding: '1.75rem', border: isPremiumPlan ? '2px solid var(--primary)' : '1px solid var(--gray-200)', position: 'relative' }}>
              {isPremiumPlan && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.75rem', borderRadius: '999px', letterSpacing: '0.05em' }}>
                  RECOMENDADO
                </div>
              )}
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{plan.name}</h2>
                {isCurrent && (
                  <span style={{ fontSize: '0.7rem', background: 'var(--green-soft, #e6f9f0)', color: 'var(--green)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                    Plan actual
                  </span>
                )}
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                {plan.price === 0 ? (
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>Gratis</span>
                ) : (
                  <>
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>{COP.format(plan.price)}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginLeft: '0.25rem' }}>/ {plan.durationDays} días</span>
                  </>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {getBenefits(plan).map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, marginTop: '1px' }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              {isPremiumPlan && !isPremium && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => openUpgrade(plan)}>
                  Actualizar a Premium
                </button>
              )}
              {isPremiumPlan && isPremium && (
                <button className="btn btn-outline" style={{ width: '100%' }} disabled>Plan activo</button>
              )}
              {!isPremiumPlan && (
                <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                  {isCurrent ? 'Tu plan actual' : 'Plan gratuito'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {upgradeTarget && payStep !== 'done' && (
        <Modal open={true} title={`Activar plan ${upgradeTarget.name}`} onClose={handleClose}>
          {payStep === 'confirm' && (
            <div>
              <p style={{ marginBottom: '1.25rem', color: 'var(--gray-700)' }}>
                Vas a activar el plan <strong>{upgradeTarget.name}</strong> por{' '}
                <strong>{COP.format(upgradeTarget.price)}</strong> durante {upgradeTarget.durationDays} días.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setPayStep('pay')}>Continuar al pago</button>
                <button className="btn btn-outline" onClick={handleClose}>Cancelar</button>
              </div>
            </div>
          )}
          {payStep === 'pay' && (
            <div>
              <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                Total: <strong>{COP.format(upgradeTarget.price)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Número de tarjeta</label>
                <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNum} onChange={(e) => setCardNum(e.target.value)} maxLength={19} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vencimiento</label>
                  <input className="form-input" placeholder="MM/AA" value={cardExp} onChange={(e) => setCardExp(e.target.value)} maxLength={5} />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input className="form-input" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handlePay}>Pagar {COP.format(upgradeTarget.price)}</button>
                <button className="btn btn-outline" onClick={handleClose}>Cancelar</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {upgradeTarget && payStep === 'done' && (
        <Modal open={true} title="¡Bienvenido a Premium!" onClose={() => { handleClose(); navigate('/'); }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
            Tu plan <strong>Premium</strong> ha sido activado exitosamente. Ya puedes contactar propietarios sin límites y destacar tus publicaciones.
          </p>
          <button className="btn btn-primary" onClick={() => { handleClose(); navigate('/'); }}>Ir al inicio</button>
        </Modal>
      )}
    </div>
  );
}
