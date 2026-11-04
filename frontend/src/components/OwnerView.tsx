import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertTriangle,
  Edit3,
  Eye,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  Percent,
  Plus,
  PlusCircle,
  Receipt,
  RefreshCcw,
  Search,
  TicketPercent,
  Trash2,
  Upload,
} from 'lucide-react';
import type { DiscountCampaign, OwnerSummary, Product, Transaction } from '../types';
import {
  createDiscount,
  deleteDiscount,
  fetchDiscounts,
  formatRupiah,
  formatRupiahInput,
  parseRupiahInput,
  updateDiscount,
} from '../services/api';

interface OwnerViewProps {
  summary: OwnerSummary | null;
  products: Product[];
  categories: string[];
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => Promise<void>;
  onRefreshData: () => void;
  onViewReceipt: (transaction: Transaction) => void;
  onQuickSaveProduct: (productData: Partial<Product>) => Promise<void>;
}

type OwnerTab = 'overview' | 'input' | 'products' | 'discounts' | 'transactions';

export const OwnerView: React.FC<OwnerViewProps> = ({
  summary,
  products,
  categories,
  onOpenAddProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onRefreshData,
  onViewReceipt,
  onQuickSaveProduct,
}) => {
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories.find((item) => item !== 'Semua') || 'Sepatu Basket');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState(2499000);
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState(1500000);
  const [stock, setStock] = useState(20);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Discount campaign management state
  const [discounts, setDiscounts] = useState<DiscountCampaign[]>([]);
  const [discCode, setDiscCode] = useState('');
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState<'PERCENT' | 'RP'>('PERCENT');
  const [discValue, setDiscValue] = useState<number>(10);
  const [discMinSpend, setDiscMinSpend] = useState<number>(0);
  const [isSavingDisc, setIsSavingDisc] = useState(false);
  const [discSuccess, setDiscSuccess] = useState('');
  const [discError, setDiscError] = useState('');

  // Store tax setting state
  const [storeTax, setStoreTax] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pos_tax_percent');
      return saved !== null ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [taxSaveSuccess, setTaxSaveSuccess] = useState(false);

  const handleSaveStoreTax = (val: number) => {
    setStoreTax(val);
    try {
      localStorage.setItem('pos_tax_percent', String(val));
      setTaxSaveSuccess(true);
      window.setTimeout(() => setTaxSaveSuccess(false), 2500);
    } catch {}
  };

  const loadDiscounts = async () => {
    try {
      const list = await fetchDiscounts();
      setDiscounts(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setIsSubmitting(true);
    setSubmitSuccess('');
    try {
      await onQuickSaveProduct({
        code,
        name,
        category,
        size: size.trim(),
        price: Number(price),
        discount_price: Number(discountPrice) || 0,
        cost_price: Number(costPrice),
        stock: Number(stock),
        image_url: imageUrl || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80',
      });
      setCode('');
      setName('');
      setSize('');
      setDiscountPrice(0);
      setImageUrl('');
      setSubmitSuccess('Produk berhasil ditambahkan.');
      window.setTimeout(() => setSubmitSuccess(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discCode.trim() || !discName.trim()) return;
    setIsSavingDisc(true);
    setDiscSuccess('');
    setDiscError('');
    try {
      await createDiscount({
        code: discCode.toUpperCase().trim(),
        name: discName.trim(),
        type: discType,
        value: Number(discValue),
        min_spend: Number(discMinSpend),
        is_active: true,
      });
      setDiscCode('');
      setDiscName('');
      setDiscValue(discType === 'PERCENT' ? 10 : 50000);
      setDiscMinSpend(0);
      setDiscSuccess('Promo campaign berhasil dibuat dan siap digunakan di kasir!');
      await loadDiscounts();
      window.setTimeout(() => setDiscSuccess(''), 4000);
    } catch (err) {
      setDiscError(err instanceof Error ? err.message : 'Gagal membuat promo');
    } finally {
      setIsSavingDisc(false);
    }
  };

  const handleToggleDiscount = async (campaign: DiscountCampaign) => {
    try {
      await updateDiscount(campaign.id, { is_active: !campaign.is_active });
      await loadDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus promo campaign ini?')) return;
    try {
      await deleteDiscount(id);
      await loadDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  if (!summary) {
    return <div className="page-loading"><span className="loading-dot" /> Memuat data owner…</div>;
  }

  const filteredProducts = products.filter((product) => {
    const query = productSearch.toLowerCase();
    return product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query);
  });

  const navItems: Array<{ id: OwnerTab; label: string; shortLabel: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Ringkasan', shortLabel: 'Ringkasan', icon: <LayoutDashboard size={17} /> },
    { id: 'input', label: 'Input produk', shortLabel: 'Tambah', icon: <PlusCircle size={17} /> },
    { id: 'products', label: `Inventaris · ${products.length}`, shortLabel: `Stok (${products.length})`, icon: <Package size={17} /> },
    { id: 'discounts', label: `Promo & Diskon · ${discounts.length}`, shortLabel: `Promo (${discounts.length})`, icon: <TicketPercent size={17} /> },
    { id: 'transactions', label: 'Transaksi', shortLabel: 'Transaksi', icon: <Receipt size={17} /> },
  ];

  return (
    <div className="owner-layout">
      <aside className="owner-sidebar">
        <div className="owner-sidebar-heading">
          <p className="eyebrow">Back office</p>
          <h2>Operasional toko</h2>
        </div>
        <nav className="owner-nav" aria-label="Menu owner">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? 'owner-nav-item active' : 'owner-nav-item'}
              onClick={() => setActiveTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              {item.icon}
              <span className="nav-label-desktop">{item.label}</span>
              <span className="nav-label-mobile">{item.shortLabel}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="owner-refresh" onClick={onRefreshData}>
          <RefreshCcw size={15} />
          Sinkronkan data
        </button>
      </aside>

      <section className="owner-content">
        {activeTab === 'overview' && (
          <div className="owner-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Hari ini</p>
                <h1>Ringkasan bisnis</h1>
                <p>Pantau penjualan, laba, dan stok yang perlu ditindak.</p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={onRefreshData}>
                <RefreshCcw size={15} /> Perbarui
              </button>
            </div>

            <dl className="kpi-strip">
              <div><dt>Omzet</dt><dd>{formatRupiah(summary.today_revenue)}</dd><small>Penjualan hari ini</small></div>
              <div><dt>Laba bersih</dt><dd>{formatRupiah(summary.today_profit)}</dd><small>Setelah harga modal</small></div>
              <div><dt>Transaksi</dt><dd>{summary.today_transactions_count}</dd><small>Struk selesai</small></div>
              <div><dt>Item terjual</dt><dd>{summary.top_products.reduce((total, item) => total + item.qty_sold, 0)}</dd><small>Unit keluar</small></div>
            </dl>

            <section className="report-section" aria-labelledby="sales-chart-title">
              <div className="report-heading">
                <div>
                  <p className="eyebrow">Performa 7 hari</p>
                  <h2 id="sales-chart-title">Omzet & laba</h2>
                </div>
                <div className="chart-legend"><span className="revenue" /> Omzet <span className="profit" /> Laba</div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.sales_chart} barGap={4}>
                    <CartesianGrid vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} stroke="#78716c" />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="#78716c" tickFormatter={(value) => `${Number(value) / 1000}k`} />
                    <Tooltip
                      cursor={{ fill: '#f5f5f4' }}
                      contentStyle={{ background: '#fff', border: '1px solid #d6d3d1', borderRadius: 6, boxShadow: '0 8px 24px rgba(28,25,23,.08)' }}
                      formatter={(value) => formatRupiah(Number(value))}
                    />
                    <Bar dataKey="revenue" name="Omzet" fill="#292524" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="profit" name="Laba" fill="#ea580c" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="split-reports">
              <section className="report-list" aria-labelledby="top-products-title">
                <div className="report-heading">
                  <div><p className="eyebrow">Produk</p><h2 id="top-products-title">Paling laku</h2></div>
                </div>
                <ol className="rank-list">
                  {summary.top_products.map((product, index) => (
                    <li key={product.id}>
                      <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                      <span><strong>{product.name}</strong><small>{formatRupiah(product.revenue)} omzet</small></span>
                      <b>{product.qty_sold} pcs</b>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="report-list" aria-labelledby="low-stock-title">
                <div className="report-heading">
                  <div><p className="eyebrow">Inventaris</p><h2 id="low-stock-title">Perlu restok</h2></div>
                  <AlertTriangle size={18} />
                </div>
                {summary.low_stock_products.length === 0 ? (
                  <p className="inline-empty">Semua stok masih aman.</p>
                ) : (
                  <ul className="stock-list">
                    {summary.low_stock_products.map((product) => (
                      <li key={product.id}>
                        <span><strong>{product.name}</strong><small>{product.code}</small></span>
                        <b className={product.stock <= 5 ? 'critical' : ''}>{product.stock} pcs</b>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="owner-page narrow-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Inventaris</p>
                <h1>Tambah produk</h1>
                <p>Isi data utama. Produk langsung tersedia di katalog kasir.</p>
              </div>
            </div>
            {submitSuccess && <div className="success-message" role="status">{submitSuccess}</div>}
            <form className="product-form" onSubmit={handleQuickSubmit}>
              <div className="form-grid three-cols">
                <label className="field-group"><span>SKU / barcode</span><input className="input-field" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Contoh: SHOE-GT3-42" required /></label>
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
                  <span>Stok awal</span>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={stock}
                    onChange={(event) => setStock(Number(event.target.value))}
                    required
                  />
                </label>
              </div>
              <div className="field-group">
                <span>Foto produk <small>Upload dari perangkat (Opsional)</small></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        border: '1px dashed #d6d3d1',
                        borderRadius: '8px',
                        backgroundColor: '#fafaf9',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#292524',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Upload size={16} />
                      <span>Pilih foto produk...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setImageUrl('')}
                        style={{ color: '#dc2626' }}
                      >
                        Hapus foto
                      </button>
                    )}
                  </div>
                  {imageUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #e7e5e4',
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>
                        ✓ Foto siap di-upload
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#78716c' }}>
                      <ImageIcon size={14} />
                      <span>Format PNG, JPG, WEBP (maks. 5MB)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-actions"><button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}><Plus size={17} /> {isSubmitting ? 'Menyimpan…' : 'Simpan produk'}</button></div>
            </form>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="owner-page">
            <div className="page-heading table-page-heading">
              <div><p className="eyebrow">Inventaris</p><h1>Daftar produk</h1><p>{filteredProducts.length} produk ditampilkan</p></div>
              <button type="button" className="btn btn-primary" onClick={onOpenAddProduct}><Plus size={16} /> Tambah produk</button>
            </div>
            <div className="table-toolbar">
              <div className="search-control compact"><Search size={17} /><input type="search" className="input-field" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Cari nama atau SKU" aria-label="Cari inventaris" /></div>
            </div>

            {/* Desktop Table View */}
            <div className="table-scroll desktop-table-view">
              <table className="data-table">
                <thead><tr><th>SKU</th><th>Produk</th><th>Kategori</th><th>Ukuran</th><th>Harga jual</th><th>Modal</th><th>Stok</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="mono-cell">{product.code}</td><td><strong>{product.name}</strong></td><td>{product.category}</td><td><span className="table-size-badge">{product.size || '—'}</span></td>
                      <td>
                        {product.discount_price && product.discount_price > 0 && product.discount_price < product.price ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <s style={{ color: '#a8a29e', fontSize: '0.75rem' }}>{formatRupiah(product.price)}</s>
                            <strong style={{ color: 'var(--primary)' }}>{formatRupiah(product.discount_price)}</strong>
                            <span className="sale-badge-small">SALE −{Math.round(((product.price - product.discount_price) / product.price) * 100)}%</span>
                          </div>
                        ) : (
                          <strong>{formatRupiah(product.price)}</strong>
                        )}
                      </td>
                      <td>{formatRupiah(product.cost_price)}</td><td><span className={product.stock <= 5 ? 'stock-number critical' : 'stock-number'}>{product.stock}</span></td>
                      <td><div className="row-actions"><button type="button" className="icon-button subtle" onClick={() => onOpenEditProduct(product)} aria-label={`Edit ${product.name}`}><Edit3 size={15} /></button><button type="button" className="icon-button subtle danger" onClick={() => onDeleteProduct(product.id)} aria-label={`Hapus ${product.name}`}><Trash2 size={15} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="mobile-card-list">
              {filteredProducts.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--line)' }}>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>{productSearch ? 'Tidak ada produk yang cocok.' : 'Belum ada produk. Tambah produk pertama sekarang.'}</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="mobile-product-card">
                    <div className="mobile-product-card-top">
                      <div className="mobile-product-tags">
                        <span className="mono-badge">{product.code}</span>
                        <span className="category-pill">{product.category}</span>
                        {product.size && <span className="size-badge-mobile">Size: {product.size}</span>}
                      </div>
                      <div className="mobile-card-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => onOpenEditProduct(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small danger-text"
                          onClick={() => onDeleteProduct(product.id)}
                          aria-label={`Hapus ${product.name}`}
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </div>
                    <strong className="mobile-product-title">{product.name}</strong>
                    <div className="mobile-product-stats">
                      <div>
                        <small>Harga jual</small>
                        {product.discount_price && product.discount_price > 0 && product.discount_price < product.price ? (
                          <div>
                            <s style={{ color: '#a8a29e', fontSize: '0.72rem', display: 'block' }}>{formatRupiah(product.price)}</s>
                            <b style={{ color: 'var(--primary)' }}>{formatRupiah(product.discount_price)}</b>
                            <span className="sale-badge-small" style={{ marginLeft: 4 }}>−{Math.round(((product.price - product.discount_price) / product.price) * 100)}%</span>
                          </div>
                        ) : (
                          <b>{formatRupiah(product.price)}</b>
                        )}
                      </div>
                      <div>
                        <small>Modal</small>
                        <span>{formatRupiah(product.cost_price)}</span>
                      </div>
                      <div>
                        <small>Stok</small>
                        <span className={product.stock <= 5 ? 'stock-pill critical' : 'stock-pill'}>
                          {product.stock} pcs
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="owner-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Marketing & Promosi</p>
                <h1>Promo & Diskon Campaign</h1>
                <p>Buat voucher promo dan atur tarif pajak toko yang otomatis diterapkan di kasir.</p>
              </div>
            </div>

            {/* Store Tax Setting Card */}
            <div className="store-tax-card" style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Percent size={18} color="var(--primary)" /> Tarif Pajak Toko (PPN)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    Atur tarif pajak standar kasir. Kasir juga tetap bisa mengubah atau menolkan pajak per transaksi.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[0, 10, 11, 12].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`tax-chip ${storeTax === rate ? 'active' : ''}`}
                      onClick={() => handleSaveStoreTax(rate)}
                      style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {rate}%
                    </button>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input-field"
                      style={{ width: 70, textAlign: 'center', padding: '6px 8px' }}
                      value={storeTax || ''}
                      placeholder="0"
                      onChange={(e) => handleSaveStoreTax(Math.max(0, Math.min(100, Number(e.target.value))))}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>%</span>
                  </div>
                </div>
              </div>
              {taxSaveSuccess && (
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                  ✓ Pengaturan tarif pajak berhasil disimpan ({storeTax}%).
                </p>
              )}
            </div>

            <div className="campaign-manager-layout">
              {/* Form Tambah Campaign */}
              <div className="campaign-form-card">
                <div className="card-header">
                  <TicketPercent size={18} />
                  <h3>Tambah Campaign Baru</h3>
                </div>
                {discSuccess && <div className="success-message" role="status">{discSuccess}</div>}
                {discError && <div className="form-alert" role="alert">{discError}</div>}
                <form className="campaign-form" onSubmit={handleCreateDiscount}>
                  <label className="field-group">
                    <span>Nama Promo</span>
                    <input
                      className="input-field"
                      value={discName}
                      onChange={(e) => setDiscName(e.target.value)}
                      placeholder="Contoh: Season Opening Sale / Diskon Jersey"
                      required
                    />
                  </label>

                  <div className="form-grid two-cols">
                    <label className="field-group">
                      <span>Kode Promo / Voucher</span>
                      <input
                        className="input-field uppercase-input"
                        value={discCode}
                        onChange={(e) => setDiscCode(e.target.value)}
                        placeholder="Contoh: BASKET10"
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span>Tipe Potongan</span>
                      <select
                        className="input-field"
                        value={discType}
                        onChange={(e) => {
                          const nextType = e.target.value as 'PERCENT' | 'RP';
                          setDiscType(nextType);
                          setDiscValue(nextType === 'PERCENT' ? 10 : 50000);
                        }}
                      >
                        <option value="PERCENT">Persentase (%)</option>
                        <option value="RP">Nominal Rupiah (Rp)</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-grid two-cols">
                    <label className="field-group">
                      <span>Nilai Diskon {discType === 'PERCENT' ? '(%)' : '(Rp)'}</span>
                      {discType === 'PERCENT' ? (
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="input-field"
                          value={discValue}
                          onChange={(e) => setDiscValue(Number(e.target.value))}
                          placeholder="10"
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input-field"
                          value={formatRupiahInput(discValue)}
                          onChange={(e) => setDiscValue(parseRupiahInput(e.target.value))}
                          placeholder="Rp 50.000"
                          required
                        />
                      )}
                    </label>

                    <label className="field-group">
                      <span>Minimal Belanja</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="input-field"
                        value={formatRupiahInput(discMinSpend)}
                        onChange={(e) => setDiscMinSpend(parseRupiahInput(e.target.value))}
                        placeholder="Rp 0 (tanpa syarat)"
                      />
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary btn-large full-width" disabled={isSavingDisc}>
                    <Plus size={16} /> {isSavingDisc ? 'Menyimpan...' : 'Buat Promo Campaign'}
                  </button>
                </form>
              </div>

              {/* Daftar Campaign */}
              <div className="campaign-list-section">
                <div className="section-title-row">
                  <h3>Daftar Campaign Tersedia ({discounts.length})</h3>
                  <small>Dapat digunakan di kasir</small>
                </div>

                {discounts.length === 0 ? (
                  <div className="empty-box">
                    <TicketPercent size={32} />
                    <h4>Belum ada promo campaign</h4>
                    <p>Buat campaign pertama Anda melalui formulir di samping.</p>
                  </div>
                ) : (
                  <div className="campaign-grid">
                    {discounts.map((c) => (
                      <div key={c.id} className={`campaign-card ${c.is_active ? 'active' : 'inactive'}`}>
                        <div className="campaign-card-header">
                          <span className="campaign-code-tag">{c.code}</span>
                          <span className={`status-pill ${c.is_active ? 'online' : 'offline'}`}>
                            {c.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <h4 className="campaign-title">{c.name}</h4>
                        <div className="campaign-details">
                          <div className="discount-badge-value">
                            {c.type === 'RP' ? formatRupiah(c.value) : `${c.value}% OFF`}
                          </div>
                          <span className="min-spend-tag">
                            {c.min_spend > 0 ? `Min. belanja ${formatRupiah(c.min_spend)}` : 'Tanpa min. belanja'}
                          </span>
                        </div>
                        <div className="campaign-card-footer">
                          <button
                            type="button"
                            className={`btn btn-small ${c.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleDiscount(c)}
                          >
                            {c.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            className="icon-button subtle danger"
                            onClick={() => handleDeleteDiscount(c.id)}
                            title="Hapus campaign"
                            aria-label={`Hapus ${c.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="owner-page">
            <div className="page-heading"><div><p className="eyebrow">Penjualan</p><h1>Riwayat transaksi</h1><p>{summary.recent_transactions.length} transaksi terbaru</p></div></div>

            {/* Desktop Table View */}
            <div className="table-scroll desktop-table-view">
              <table className="data-table">
                <thead><tr><th>No. struk</th><th>Waktu</th><th>Metode</th><th>Total</th><th>Laba</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {summary.recent_transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="mono-cell">{transaction.id}</td><td>{new Date(transaction.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td><td><span className="payment-label">{transaction.payment_method}</span></td><td><strong>{formatRupiah(transaction.total)}</strong></td><td className="profit-cell">+{formatRupiah(transaction.profit)}</td><td><button type="button" className="btn btn-small btn-secondary" onClick={() => onViewReceipt(transaction)}><Eye size={14} /> Lihat struk</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="mobile-card-list">
              {summary.recent_transactions.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--line)' }}>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>Belum ada transaksi yang tercatat.</p>
                </div>
              ) : (
                summary.recent_transactions.map((transaction) => (
                  <div key={transaction.id} className="mobile-tx-card">
                    <div className="mobile-tx-header">
                      <div>
                        <span className="mono-badge">{transaction.id}</span>
                        <span className="payment-label" style={{ marginLeft: 6 }}>{transaction.payment_method}</span>
                      </div>
                      <span className="mobile-tx-time">
                        {new Date(transaction.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="mobile-tx-body">
                      <div>
                        <small>Total transaksi</small>
                        <b className="mobile-tx-total">{formatRupiah(transaction.total)}</b>
                      </div>
                      <div>
                        <small>Laba bersih</small>
                        <b className="profit-cell">+{formatRupiah(transaction.profit)}</b>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small full-width"
                      onClick={() => onViewReceipt(transaction)}
                    >
                      <Eye size={14} /> Lihat struk transaksi
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
