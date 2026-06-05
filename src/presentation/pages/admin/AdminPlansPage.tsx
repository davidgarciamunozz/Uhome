import { useState, useEffect, useCallback } from 'react';
import { getPlans, createNewPlan, updatePlan, disablePlan, enablePlan, deletePlan } from '../../../application/admin/ManagePlansUseCase';
import { useToast } from '../../context/ToastContext';
import type { Plan } from '../../../domain/entities/Plan';
import AdminLayout from './AdminLayout';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const EMPTY_FORM = { name: '', price: '', durationDays: '', maxContacts: '', maxListings: '', canFeature: false };

export default function AdminPlansPage() {
  const showToast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(() => setPlans(getPlans()), []);
  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(EMPTY_FORM); setCreating(false); setEditingId(null); };

  const handleCreate = () => {
    try {
      createNewPlan({
        name: form.name,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        maxContacts: form.maxContacts === '' ? null : Number(form.maxContacts),
        maxListings: form.maxListings === '' ? null : Number(form.maxListings),
        canFeature: form.canFeature,
        active: true,
      });
      showToast('Plan creado', 'success');
      resetForm();
      load();
    } catch (e: any) {
      showToast(e.message || 'Error al crear el plan', 'error');
    }
  };

  const handleUpdate = (id: string) => {
    try {
      updatePlan(id, {
        name: form.name,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        maxContacts: form.maxContacts === '' ? null : Number(form.maxContacts),
        maxListings: form.maxListings === '' ? null : Number(form.maxListings),
        canFeature: form.canFeature,
      });
      showToast('Plan actualizado', 'success');
      resetForm();
      load();
    } catch (e: any) {
      showToast(e.message || 'Error al actualizar', 'error');
    }
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setCreating(false);
    setForm({
      name: plan.name,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      maxContacts: plan.maxContacts === null ? '' : String(plan.maxContacts),
      maxListings: plan.maxListings === null ? '' : String(plan.maxListings),
      canFeature: plan.canFeature,
    });
  };

  const handleToggle = (plan: Plan) => {
    if (plan.active) disablePlan(plan.id);
    else enablePlan(plan.id);
    showToast(plan.active ? 'Plan deshabilitado' : 'Plan habilitado', 'success');
    load();
  };

  const handleDelete = (plan: Plan) => {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      deletePlan(plan.id);
      showToast('Plan eliminado', 'success');
      load();
    } catch (e: any) {
      showToast(e.message || 'Error al eliminar', 'error');
    }
  };

  const PlanForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>
        {editingId ? 'Editar plan' : 'Nuevo plan'}
      </h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Premium Plus" />
        </div>
        <div className="form-group">
          <label className="form-label">Precio (COP) *</label>
          <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50000" />
        </div>
        <div className="form-group">
          <label className="form-label">Duración (días) *</label>
          <input className="form-input" type="number" min="1" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} placeholder="30" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Límite contactos/día (vacío = ilimitado)</label>
          <input className="form-input" type="number" min="1" value={form.maxContacts} onChange={(e) => setForm({ ...form, maxContacts: e.target.value })} placeholder="ilimitado" />
        </div>
        <div className="form-group">
          <label className="form-label">Límite publicaciones (vacío = ilimitado)</label>
          <input className="form-input" type="number" min="1" value={form.maxListings} onChange={(e) => setForm({ ...form, maxListings: e.target.value })} placeholder="ilimitado" />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={form.canFeature} onChange={(e) => setForm({ ...form, canFeature: e.target.checked })} />
          Permite destacar publicaciones
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary btn-sm" onClick={onSave}>Guardar</button>
        <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Planes de suscripción</h1>
            <p className="page-subtitle">{plans.length} plan{plans.length !== 1 ? 'es' : ''} configurados</p>
          </div>
          {!creating && !editingId && (
            <button className="btn btn-primary btn-sm" onClick={() => { setCreating(true); setEditingId(null); setForm(EMPTY_FORM); }}>
              + Nuevo plan
            </button>
          )}
        </div>

        {creating && <PlanForm onSave={handleCreate} onCancel={resetForm} />}
        {editingId && <PlanForm onSave={() => handleUpdate(editingId)} onCancel={resetForm} />}

        <div className="admin-table">
          <div className="admin-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
            <span>Nombre</span>
            <span>Precio</span>
            <span>Duración</span>
            <span>Beneficios</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {plans.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
              Sin datos disponibles
            </div>
          )}
          {plans.map((plan) => (
            <div key={plan.id} className="admin-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span style={{ fontWeight: 600 }}>{plan.name}</span>
              <span>{plan.price === 0 ? 'Gratis' : COP.format(plan.price)}</span>
              <span>{plan.durationDays === 0 ? '—' : `${plan.durationDays} días`}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                {plan.maxContacts === null ? '∞ contactos' : `${plan.maxContacts}/día`}
                {' · '}
                {plan.maxListings === null ? '∞ pubs.' : `${plan.maxListings} pubs.`}
                {plan.canFeature ? ' · Destacar' : ''}
              </span>
              <span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: plan.active ? 'var(--green)' : 'var(--gray-400)' }}>
                  {plan.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(plan)} style={{ fontSize: '0.75rem' }}>Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(plan)} style={{ fontSize: '0.75rem' }}>
                  {plan.active ? 'Deshabilitar' : 'Habilitar'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(plan)} style={{ fontSize: '0.75rem', color: 'var(--red)' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
