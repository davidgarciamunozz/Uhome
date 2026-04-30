import AdminLayout from './AdminLayout';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const MONTHLY_REVENUE = [
  { month: 'Nov 24', total: 450000, featured: 120000, subscriptions: 330000 },
  { month: 'Dic 24', total: 620000, featured: 200000, subscriptions: 420000 },
  { month: 'Ene 25', total: 380000, featured: 80000, subscriptions: 300000 },
  { month: 'Feb 25', total: 870000, featured: 350000, subscriptions: 520000 },
  { month: 'Mar 25', total: 940000, featured: 390000, subscriptions: 550000 },
  { month: 'Abr 25', total: 1150000, featured: 480000, subscriptions: 670000 },
];

const BREAKDOWN = [
  { plan: 'Destaque 7 días', price: 25000, units: 12, total: 300000 },
  { plan: 'Destaque 15 días', price: 45000, units: 8, total: 360000 },
  { plan: 'Destaque 30 días', price: 80000, units: 6, total: 480000 },
  { plan: 'Suscripción Propietario Pro', price: 50000, units: 4, total: 200000 },
];

export default function AdminRevenuePage() {
  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.total, 0);
  const thisMonth = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1];
  const lastMonth = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2];
  const growth = Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100);
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.total));

  return (
    <AdminLayout>
      <div>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Ingresos</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Resumen financiero de la plataforma</p>

        <div className="admin-stats" style={{ marginBottom: '2rem' }}>
          <div className="admin-stat">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-value">{COP.format(totalRevenue)}</div>
            <div className="admin-stat-label">Ingresos totales (acumulado)</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon">📅</div>
            <div className="admin-stat-value">{COP.format(thisMonth.total)}</div>
            <div className="admin-stat-label">Este mes</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon">{growth >= 0 ? '📈' : '📉'}</div>
            <div className="admin-stat-value" style={{ color: growth >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {growth >= 0 ? '+' : ''}{growth}%
            </div>
            <div className="admin-stat-label">vs. mes anterior</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon">⭐</div>
            <div className="admin-stat-value">{COP.format(thisMonth.featured)}</div>
            <div className="admin-stat-label">Ingresos por destacados</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Ingresos mensuales</h2>
        <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="revenue-chart">
            {MONTHLY_REVENUE.map((m) => (
              <div key={m.month} className="revenue-bar-wrap">
                <div className="revenue-bar-value" style={{ fontSize: '0.65rem' }}>{COP.format(m.total)}</div>
                <div className="revenue-bar" style={{ height: `${Math.round((m.total / maxRevenue) * 130) + 4}px` }} />
                <div className="revenue-bar-label">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Desglose por plan</h2>
        <div className="admin-table">
          <div className="admin-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
            <span>Plan</span><span>Precio unit.</span><span>Unidades</span><span>Total</span>
          </div>
          {BREAKDOWN.map((b) => (
            <div key={b.plan} className="admin-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
              <span style={{ fontWeight: 500 }}>{b.plan}</span>
              <span>{COP.format(b.price)}</span>
              <span>{b.units}</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>{COP.format(b.total)}</span>
            </div>
          ))}
          <div className="admin-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--gray-50)', fontWeight: 700 }}>
            <span>Total este mes</span><span>—</span>
            <span>{BREAKDOWN.reduce((s, b) => s + b.units, 0)}</span>
            <span style={{ color: 'var(--green)' }}>{COP.format(thisMonth.total)}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '1rem' }}>
          * Los datos de ingresos son de referencia (demo). La integración de pagos se implementará en próximos sprints.
        </p>
      </div>
    </AdminLayout>
  );
}
