import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publishListing } from '../../application/listings/PublishListingUseCase';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { ValidationError } from '../../domain/services/Validators';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import type { Listing } from '../../domain/entities/Listing';

export default function PublishPage() {
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fileRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '', price: '', city: 'Cali', zone: '', address: '',
    type: 'habitación' as Listing['type'],
    rooms: '1', bathrooms: '1', description: '',
    services: { internet: false, water: false, electricity: false, gas: false },
    status: 'published' as Listing['status'],
  });

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/login'); return; }
    if (editId) {
      const l = ListingRepository.findById(editId);
      if (l && l.ownerId === user.id) {
        setForm({
          title: l.title, price: String(l.price), city: l.city,
          zone: l.zone, address: l.address, type: l.type,
          rooms: String(l.rooms), bathrooms: String(l.bathrooms),
          description: l.description,
          services: { ...l.services },
          status: l.status,
        });
        setImages(l.images);
      }
    }
  }, [user, editId, navigate]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent, status: Listing['status'] = 'published') => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    setLoading(true);
    try {
      publishListing({ ...form, id: editId || undefined, status, images }, user.id);
      showToast(status === 'draft' ? 'Borrador guardado' : '¡Publicación creada exitosamente!', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors({ [err.field]: err.message });
      } else {
        showToast('Error al publicar', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const setService = (key: keyof typeof form.services, val: boolean) => {
    setForm((f) => ({ ...f, services: { ...f.services, [key]: val } }));
  };

  return (
    <div className="container" style={{ maxWidth: 680, padding: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">{editId ? 'Editar publicación' : 'Publicar vivienda'}</h1>
        <p className="page-subtitle">Completa la información de tu propiedad</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'published')}>
        <div className="form-group">
          <label className="form-label">Título del anuncio *</label>
          <input className={`form-input ${errors.title ? 'form-input-error' : ''}`}
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej: Habitación individual en Chapinero" />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Precio mensual (COP) *</label>
            <input type="number" className={`form-input ${errors.price ? 'form-input-error' : ''}`}
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="550000" min="0" />
            {errors.price && <p className="form-error">{errors.price}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de vivienda *</label>
            <select className="form-select" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Listing['type'] })}>
              <option value="habitación">Habitación</option>
              <option value="apartamento">Apartamento</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ciudad *</label>
            <input
              className="form-input"
              value="Cali"
              readOnly
              style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Zona / Barrio</label>
            <input className="form-input" value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Chapinero" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Dirección aproximada</label>
          <input className="form-input" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Cra. 7 con Calle 60" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Habitaciones</label>
            <input type="number" className="form-input" value={form.rooms}
              onChange={(e) => setForm({ ...form, rooms: e.target.value })} min="1" max="20" />
          </div>
          <div className="form-group">
            <label className="form-label">Baños</label>
            <input type="number" className="form-input" value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} min="1" max="10" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea className="form-textarea" rows={4} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe la vivienda, ubicación, ambiente, reglas..." />
        </div>

        <div className="form-group">
          <label className="form-label">Servicios incluidos</label>
          <div className="checkbox-group">
            {([['internet', 'WiFi/Internet'], ['water', 'Agua'], ['electricity', 'Luz/Electricidad'], ['gas', 'Gas']] as const).map(([key, label]) => (
              <label key={key} className="checkbox-label">
                <input type="checkbox" checked={form.services[key]}
                  onChange={(e) => setService(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Imágenes</label>
          <div className="image-upload" onClick={() => fileRef.current?.click()}>
            <span>📷 Subir fotos</span>
            <p className="text-xs text-gray">Haz clic para seleccionar imágenes</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={handleImages} />
          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((img, i) => (
                <div key={i} className="image-preview-item">
                  <img src={img} alt="" />
                  <button type="button" className="image-remove"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-outline"
            onClick={(e) => handleSubmit(e as any, 'draft')} disabled={loading}>
            Guardar borrador
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Publicando...' : editId ? 'Guardar cambios' : 'Publicar vivienda'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
