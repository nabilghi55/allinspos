import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CircleDot,
  Footprints,
  LayoutGrid,
  Minus,
  NotebookPen,
  Package,
  Percent,
  Plus,
  Search,
  Shirt,
  ShoppingCart,
  TicketPercent,
  Trash2,
  X,
} from 'lucide-react';
import type { CartItem, Category, Product, DiscountCampaign } from '../types';
import { formatRupiah, fetchDiscounts } from '../services/api';

interface CheckoutTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface CashierViewProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpenCheckout: (totals: CheckoutTotals) => void;
  onRefreshProducts: () => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  categories,
  cart,
  setCart,
  onOpenCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'RP' | 'PERCENT'>('RP');
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [taxPercent, setTaxPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pos_tax_percent');
      return saved !== null ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [showNotesForId, setShowNotesForId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDiscounts()
      .then((data) => setCampaigns(data.filter((c) => c.is_active)))
      .catch(() => {});
  }, []);

  const handleSelectCampaign = (cId: string) => {
    setSelectedCampaignId(cId);
    if (!cId) {
      setDiscountAmount(0);
      return;
    }
    const camp = campaigns.find((c) => c.id === cId);
    if (camp) {
      setDiscountType(camp.type);
      setDiscountAmount(camp.value);
    }
  };

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesCategory && (product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query));
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const effectivePrice = (product.discount_price && product.discount_price > 0 && product.discount_price < product.price)
      ? product.discount_price
      : product.price;

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, qty: 1, notes: '', price: effectivePrice, subtotal: effectivePrice }];
      if (existing.qty >= product.stock) return current;
      return current.map((item) => item.product.id === product.id
        ? { ...item, qty: item.qty + 1, price: effectivePrice, subtotal: (item.qty + 1) * effectivePrice }
        : item);
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((current) => current
      .map((item) => {
        if (item.product.id !== productId) return item;
        const nextQty = item.qty + delta;
        if (nextQty <= 0) return null;
        if (nextQty > item.product.stock) return item;
        const unitPrice = item.price || ((item.product.discount_price && item.product.discount_price > 0 && item.product.discount_price < item.product.price) ? item.product.discount_price : item.product.price);
        return { ...item, qty: nextQty, price: unitPrice, subtotal: nextQty * unitPrice };
      })
      .filter(Boolean) as CartItem[]);
  };

  const updateCartNotes = (productId: string, notes: string) => {
    setCart((current) => current.map((item) => item.product.id === productId ? { ...item, notes } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setSelectedCampaignId('');
  };

  const totalCartCount = cart.reduce((total, item) => total + item.qty, 0);
  const subtotal = cart.reduce((total, item) => total + item.subtotal, 0);

  // Check if min_spend of campaign is fulfilled
  const isCampaignEligible = !activeCampaign || subtotal >= activeCampaign.min_spend;
  const effectiveDiscountAmount = isCampaignEligible ? discountAmount : 0;
  const rawDiscount = discountType === 'RP' ? effectiveDiscountAmount : (subtotal * effectiveDiscountAmount) / 100;
  const discount = Math.min(subtotal, Math.max(0, rawDiscount));
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round((taxableAmount * taxPercent) / 100);
  const total = Math.max(0, taxableAmount + tax);

  const openCheckout = () => onOpenCheckout({ subtotal, discount, tax, total });

  const categoryIcon = (name: string) => {
    switch (name) {
      case 'Sepatu Basket': return <Footprints size={15} />;
      case 'Jersey & Apparel': return <Shirt size={15} />;
      case 'Bola Basket': return <CircleDot size={15} />;
      case 'Aksesori & Gear': return <Package size={15} />;
      default: return <LayoutGrid size={15} />;
    }
  };

  return (
    <div className="cashier-layout">
      {/* Mobile top segmented control */}
      <div className="mobile-view-toggle">
        <button
          type="button"
          className={mobileTab === 'catalog' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setMobileTab('catalog')}
        >
          <LayoutGrid size={15} />
          <span>Katalog Produk</span>
        </button>
        <button
          type="button"
          className={mobileTab === 'cart' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setMobileTab('cart')}
        >
          <ShoppingCart size={15} />
          <span>Keranjang</span>
          {totalCartCount > 0 && <span className="toggle-badge">{totalCartCount}</span>}
        </button>
      </div>

      <section className={`catalog ${mobileTab === 'cart' ? 'mobile-hidden' : ''}`} aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">Katalog toko</p>
            <h1 id="catalog-title">Pilih produk</h1>
          </div>
          <p>{filteredProducts.length} dari {products.length} produk</p>
        </div>

        <div className="search-control">
          <Search size={19} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            className="input-field"
            placeholder="Cari nama atau SKU"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            spellCheck={false}
            aria-label="Cari produk"
          />
          <kbd>/</kbd>
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="Hapus pencarian">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="category-tabs" role="tablist" aria-label="Kategori produk">
          {categories.map((category) => {
            const selected = selectedCategory === category.name;
            const count = category.name === 'Semua'
              ? products.length
              : products.filter((product) => product.category === category.name).length;
            return (
              <button
                key={category.id}
                type="button"
                className={selected ? 'category-tab active' : 'category-tab'}
                onClick={() => setSelectedCategory(category.name)}
                role="tab"
                aria-selected={selected}
              >
                {categoryIcon(category.name)}
                <span>{category.name}</span>
                <small>{count}</small>
              </button>
            );
          })}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id);
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock > 0 && product.stock <= 5;
              const hasDiscount = Boolean(product.discount_price && product.discount_price > 0 && product.discount_price < product.price);
              const discountPercent = hasDiscount ? Math.round(((product.price - (product.discount_price || 0)) / product.price) * 100) : 0;
              const effectivePrice = hasDiscount ? product.discount_price! : product.price;

              return (
                <button
                  key={product.id}
                  type="button"
                  className={`product-tile${inCart ? ' selected' : ''}${hasDiscount ? ' on-sale' : ''}`}
                  onClick={() => addToCart(product)}
                  disabled={outOfStock}
                  aria-label={`${product.name}, ${formatRupiah(effectivePrice)}${hasDiscount ? ` (diskon dari ${formatRupiah(product.price)})` : ''}${inCart ? `, ${inCart.qty} di keranjang` : ''}`}
                >
                  <span className="product-media">
                    <span className="product-media-fallback">{product.name.slice(0, 1)}</span>
                    <img
                      src={product.image_url}
                      alt=""
                      width="320"
                      height="220"
                      loading="lazy"
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    />
                    {hasDiscount && (
                      <span className="product-sale-badge">
                        SALE -{discountPercent}%
                      </span>
                    )}
                    {inCart && <span className="cart-count">{inCart.qty}</span>}
                  </span>
                  <span className="product-body">
                    <span className="product-meta">
                      <span>{product.code}</span>
                      {product.size && <span className="product-size-badge">Size: {product.size}</span>}
                      <span className={outOfStock ? 'stock-state empty' : lowStock ? 'stock-state low' : 'stock-state'}>
                        {outOfStock ? 'Habis' : lowStock ? `Sisa ${product.stock}` : `Stok ${product.stock}`}
                      </span>
                    </span>
                    <strong>{product.name}</strong>
                    <span className="product-price-row">
                      {hasDiscount ? (
                        <div className="product-price-stack">
                          <s className="price-strike">{formatRupiah(product.price)}</s>
                          <b className="discount-price">{formatRupiah(product.discount_price!)}</b>
                        </div>
                      ) : (
                        <b>{formatRupiah(product.price)}</b>
                      )}
                      <span className="add-cue"><Plus size={14} /> Tambah</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <AlertTriangle size={24} />
            <h2>Produk tidak ditemukan</h2>
            <p>Ubah kata kunci atau pilih kategori lain.</p>
          </div>
        )}
      </section>

      <aside className={`cart-panel ${mobileTab === 'catalog' ? 'mobile-hidden' : ''}`} aria-labelledby="cart-title">
        <div className="cart-header">
          <div>
            <p className="eyebrow">Pesanan aktif</p>
            <h2 id="cart-title">Keranjang <span>{totalCartCount}</span></h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-small mobile-back-to-catalog"
              onClick={() => setMobileTab('catalog')}
            >
              + Tambah Produk
            </button>
            {cart.length > 0 && (
              <button type="button" className="text-button danger" onClick={clearCart}>
                <Trash2 size={14} /> Kosongkan
              </button>
            )}
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={28} />
              <h3>Belum ada produk</h3>
              <p>Pilih produk dari katalog untuk memulai transaksi.</p>
            </div>
          ) : cart.map((item) => (
            <article className="cart-line" key={item.product.id}>
              <div className="cart-line-top">
                <div>
                  <h3>{item.product.name}</h3>
                  <p>
                    {item.product.discount_price && item.product.discount_price > 0 && item.product.discount_price < item.product.price ? (
                      <>
                        <s className="cart-price-strike">{formatRupiah(item.product.price)}</s>{' '}
                        <b className="cart-discount-price">{formatRupiah(item.price)}</b> / pcs
                      </>
                    ) : (
                      <>{formatRupiah(item.price || item.product.price)} / pcs</>
                    )}
                    {item.product.size && <span className="cart-item-size-tag"> · Size: {item.product.size}</span>}
                  </p>
                </div>
                <strong>{formatRupiah(item.subtotal)}</strong>
              </div>

              {showNotesForId === item.product.id ? (
                <input
                  type="text"
                  className="input-field note-input"
                  placeholder="Contoh: ukuran 42, warna hitam"
                  value={item.notes}
                  onChange={(event) => updateCartNotes(item.product.id, event.target.value)}
                  onBlur={() => setShowNotesForId(null)}
                  aria-label={`Catatan untuk ${item.product.name}`}
                />
              ) : (
                <button type="button" className="note-button" onClick={() => setShowNotesForId(item.product.id)}>
                  <NotebookPen size={13} />
                  {item.notes || 'Tambah catatan'}
                </button>
              )}

              <div className="cart-line-actions">
                <button type="button" className="icon-button subtle" onClick={() => removeFromCart(item.product.id)} aria-label={`Hapus ${item.product.name}`}>
                  <Trash2 size={15} />
                </button>
                <div className="quantity-control" aria-label={`Jumlah ${item.product.name}`}>
                  <button type="button" onClick={() => updateCartQty(item.product.id, -1)} aria-label="Kurangi jumlah"><Minus size={15} /></button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateCartQty(item.product.id, 1)} aria-label="Tambah jumlah"><Plus size={15} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            {campaigns.length > 0 && (
              <div className="cart-campaign-box">
                <div className="campaign-box-header">
                  <TicketPercent size={14} />
                  <span>Promo & Diskon Campaign</span>
                </div>
                <select
                  className="input-field campaign-select"
                  value={selectedCampaignId}
                  onChange={(e) => handleSelectCampaign(e.target.value)}
                  aria-label="Pilih promo campaign"
                >
                  <option value="">-- Tanpa Campaign (Manual) --</option>
                  {campaigns.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name} ({c.type === 'RP' ? formatRupiah(c.value) : `${c.value}%`})
                      {c.min_spend > 0 ? ` [Min. ${formatRupiah(c.min_spend)}]` : ''}
                    </option>
                  ))}
                </select>
                {activeCampaign && !isCampaignEligible && (
                  <p className="campaign-notice warning">
                    ⚠️ Belum memenuhi minimal belanja {formatRupiah(activeCampaign.min_spend)}
                  </p>
                )}
                {activeCampaign && isCampaignEligible && (
                  <p className="campaign-notice success">
                    ✓ Promo aktif: Hemat {formatRupiah(discount)}
                  </p>
                )}
              </div>
            )}

            <div className="discount-control">
              <TicketPercent size={17} />
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="Diskon manual"
                value={discountAmount || ''}
                onChange={(event) => {
                  setSelectedCampaignId('');
                  setDiscountAmount(Number(event.target.value));
                }}
                aria-label="Nilai diskon manual"
              />
              <button
                type="button"
                className="discount-type"
                onClick={() => setDiscountType(discountType === 'RP' ? 'PERCENT' : 'RP')}
                aria-label="Ubah jenis diskon"
              >
                {discountType === 'RP' ? 'Rp' : '%'}
              </button>
            </div>

            <div className="tax-control">
              <div className="tax-control-header">
                <span className="tax-title">
                  <Percent size={14} /> Pajak (PPN)
                </span>
                <div className="tax-chips">
                  {[0, 10, 11, 12].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`tax-chip ${taxPercent === rate ? 'active' : ''}`}
                      onClick={() => {
                        setTaxPercent(rate);
                        try { localStorage.setItem('pos_tax_percent', String(rate)); } catch {}
                      }}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="tax-input-row">
                <div className="tax-field-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field tax-input"
                    placeholder="0"
                    value={taxPercent || ''}
                    onChange={(event) => {
                      const val = Math.max(0, Math.min(100, Number(event.target.value)));
                      setTaxPercent(val);
                      try { localStorage.setItem('pos_tax_percent', String(val)); } catch {}
                    }}
                    aria-label="Tarif pajak persen"
                  />
                  <span className="tax-suffix">%</span>
                </div>
                <span className="tax-nominal-preview">
                  = {formatRupiah(tax)}
                </span>
              </div>
            </div>

            <dl className="cart-summary">
              <div><dt>Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
              {discount > 0 && <div className="discount-row"><dt>Diskon</dt><dd>−{formatRupiah(discount)}</dd></div>}
              {taxPercent > 0 && <div><dt>Pajak ({taxPercent}%)</dt><dd>{formatRupiah(tax)}</dd></div>}
              <div className="cart-total"><dt>Total</dt><dd>{formatRupiah(total)}</dd></div>
            </dl>

            <button type="button" className="btn btn-primary btn-checkout" onClick={openCheckout}>
              Bayar sekarang
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* Floating cart bar for mobile when in catalog view */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="mobile-floating-cart-bar">
          <div className="floating-cart-info">
            <span className="floating-cart-count">{totalCartCount} item di keranjang</span>
            <strong className="floating-cart-total">{formatRupiah(total)}</strong>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => setMobileTab('cart')}
          >
            Lihat Pesanan <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
