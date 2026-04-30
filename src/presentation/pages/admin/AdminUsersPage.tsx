import { useState, useEffect, useCallback } from 'react';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import type { User } from '../../../domain/entities/User';
import { useToast } from '../../context/ToastContext';
import AdminLayout from './AdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'student' | 'owner' | 'blocked'>('all');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const showToast = useToast();

  const load = useCallback(() => {
    const all = UserRepository.findAll()
      .filter((u) => u.role !== 'admin')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter === 'blocked') setUsers(all.filter((u) => u.blocked));
    else if (filter === 'all') setUsers(all);
    else setUsers(all.filter((u) => u.role === filter));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleBlock = (u: User) => {
    const action = u.blocked ? 'desbloquear' : 'bloquear';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${u.name}?`)) return;
    UserRepository.save({ ...u, blocked: !u.blocked });
    showToast(u.blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado', 'success');
    load();
  };

  const handleDelete = (u: User) => {
    if (!confirm(`¿Eliminar permanentemente la cuenta de ${u.name}? Esta acción no se puede deshacer.`)) return;
    UserRepository.delete(u.id);
    showToast('Usuario eliminado', 'success');
    load();
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    if (!editName.trim() || !editEmail.trim()) { showToast('Nombre y email son obligatorios', 'error'); return; }
    UserRepository.save({ ...editUser, name: editName.trim(), email: editEmail.trim().toLowerCase() });
    showToast('Usuario actualizado', 'success');
    setEditUser(null);
    load();
  };

  const roleLabel: Record<string, string> = { student: 'Estudiante', owner: 'Propietario' };

  return (
    <AdminLayout>
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Usuarios</h1>
            <p className="page-subtitle">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="tab-group" style={{ width: 'auto', marginBottom: 0 }}>
            {(['all', 'student', 'owner', 'blocked'] as const).map((f) => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'student' ? 'Estudiantes' : f === 'owner' ? 'Propietarios' : 'Bloqueados'}
              </button>
            ))}
          </div>
        </div>

        {editUser && (
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Editar usuario: {editUser.name}</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>Guardar cambios</button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditUser(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Sin usuarios</h3>
            <p>No hay usuarios en esta categoría.</p>
          </div>
        ) : (
          <div className="admin-table">
            {users.map((u) => (
              <div key={u.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px 160px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="avatar avatar-sm">{u.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{u.email}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="badge badge-gray">{roleLabel[u.role] || u.role}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    Desde {new Date(u.createdAt).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div>
                  {u.blocked
                    ? <span className="status-badge status-blocked">Bloqueado</span>
                    : <span className="status-badge status-published">Activo</span>
                  }
                </div>
                <div className="admin-row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Editar</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleBlock(u)}>
                    {u.blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                  <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(u)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
