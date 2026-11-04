import React, { useEffect, useState } from 'react';
import { AlertCircle, Image as ImageIcon, Save, Upload, X } from 'lucide-react';
import type { Product } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../services/api';

interface ProductFormModalProps {
  product?: Product | null;
  categories: string[];
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, categories, onClose, onSave }) => {
  const [name, setName] = useState(product?.name || '');
  const [code, setCode] = useState(product?.code || '');
  const [category, setCategory] = useState(product?.category || categories.find((item) => item !== 'Semua') || 'Sepatu Basket');
  const [price, setPrice] = useState(product?.price || 20000);
  const [discountPrice, setDiscountPrice] = useState<number>(product?.discount_price || 0);
  const [costPrice, setCostPrice] = useState(product?.cost_price || 8000);
  const [stock, setStock] = useState(product?.stock || 25);
  const [size, setSize] = useState(product?.size || '');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto terlalu besar (Maksimal 5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrl(e.target.result as string);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Nama produk dan SKU wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        id: product?.id,
        name: name.trim(),
        code: code.trim(),
        category,
        size: size.trim(),
        price: Number(price),
        discount_price: Number(discountPrice) || 0,
        cost_price: Number(costPrice),
        stock: Number(stock),
        image_url: imageUrl || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80',
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Produk gagal disimpan. Coba lagi.');
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <header className="modal-header">
          <div><p className="eyebrow">Inventaris</p><h2 id="product-modal-title">{product ? 'Edit produk' : 'Tambah produk'}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup form"><X size={19} /></button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body product-form">
            {error && <div className="form-alert" role="alert"><AlertCircle size={16} /> {error}</div>}
            <div className="form-grid three-cols">
              <label className="field-group"><span>SKU / barcode</span><input className="input-field" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Contoh: SHOE-GT3-42" spellCheck={false} required /></label>
              <label className="field-group"><span>Kategori</span><select className="input-field" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.filter((item) => item !== 'Semua').map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="field-group"><span>Ukuran / Size</span><input className="input-field" value={size} onChange={(event) => setSize(event.target.value)} placeholder="Contoh: 42, XL, Size 7" /></label>
            </div>
            <label className="field-group"><span>Nama produk</span><input className="input-field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Nike GT Cut 3" required /></label>

            <div className="form-grid two-cols">
              <label className="field-group">
                <span>Harga jual normal</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  value={formatRupiahInput(price)}
                  onChange={(event) => setPrice(parseRupiahInput(event.target.value))}
                  placeholder="Rp 0"
                  required
                />
              </label>
              <label className="field-group">
                <span>Harga diskon / Promo <small>(Opsional)</small></span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  value={formatRupiahInput(discountPrice)}
                  onChange={(event) => setDiscountPrice(parseRupiahInput(event.target.value))}
                  placeholder="Rp 0 (tanpa diskon)"
                />
                {discountPrice > 0 && discountPrice < price && (
                  <small style={{ color: '#ea580c', fontWeight: 600, fontSize: '0.72rem' }}>
                    ✓ Diskon {Math.round(((price - discountPrice) / price) * 100)}% (Hemat {formatRupiah(price - discountPrice)})
                  </small>
                )}
              </label>
            </div>

            <div className="form-grid two-cols">
              <label className="field-group">
                <span>Harga modal</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  value={formatRupiahInput(costPrice)}
                  onChange={(event) => setCostPrice(parseRupiahInput(event.target.value))}
                  placeholder="Rp 0"
                  required
                />
              </label>
              <label className="field-group">
                <span>Stok</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="input-field"
                  value={stock}
                  onChange={(event) => setStock(Number(event.target.value))}
                  required
                />
              </label>
            </div>

            {/* File Upload Image Picker */}
            <div className="field-group">
              <span>Foto produk</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {imageUrl ? (
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Hapus foto"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                    <ImageIcon size={24} />
                  </div>
                )}
                <label className="btn btn-secondary" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                  <Upload size={16} />
                  <span>{imageUrl ? 'Ganti foto produk' : 'Pilih foto produk'}</span>
                  <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}><Save size={16} /> {isSaving ? 'Menyimpan…' : 'Simpan produk'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
};
