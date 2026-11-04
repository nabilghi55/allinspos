import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CashierView } from './components/CashierView';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProductFormModal } from './components/ProductFormModal';
import { LoginScreen } from './components/LoginScreen';
import type {
  Product,
  Category,
  CartItem,
  Transaction,
  OwnerSummary,
} from './types';
import {
  fetchHealth,
  fetchCategories,
  fetchProducts,
  fetchOwnerSummary,
  createTransaction,
  createProduct,
  updateProduct,
  deleteProduct,
  resetSeedData,
} from './services/api';

const OwnerView = lazy(() =>
  import('./components/OwnerView').then((module) => ({ default: module.OwnerView }))
);

export function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    name: string;
    role: 'kasir' | 'owner';
  } | null>(() => {
    try {
      const saved = localStorage.getItem('allins_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.name && u.name.includes('Allins')) {
          u.name = u.name.replace(/Allins Basketball/i, 'MJB SPORT').replace(/Allins/i, 'MJB SPORT');
          try { localStorage.setItem('allins_user', JSON.stringify(u)); } catch {}
        }
        return u;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [currentMode, setCurrentMode] = useState<'kasir' | 'owner'>(() => {
    try {
      const saved = localStorage.getItem('allins_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role === 'owner' ? 'owner' : 'kasir';
      }
    } catch {}
    return 'kasir';
  });
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ownerSummary, setOwnerSummary] = useState<OwnerSummary | null>(null);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutTotals, setCheckoutTotals] = useState<{
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  } | null>(null);
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);
  const [productModalState, setProductModalState] = useState<{
    isOpen: boolean;
    product?: Product | null;
  }>({ isOpen: false, product: null });

  // Load initial data & check backend connection
  const loadInitialData = useCallback(async () => {
    const health = await fetchHealth();
    setIsBackendConnected(health);

    if (health) {
      try {
        const [cats, prods, summary] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
          fetchOwnerSummary(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setOwnerSummary(summary);
      } catch (err) {
        console.error('Failed loading data from Go backend', err);
      }
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadInitialData();
    }, 0);
    const interval = setInterval(async () => {
      const ok = await fetchHealth();
      setIsBackendConnected(ok);
    }, 5000);
    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadInitialData]);

  // Handle Login & Logout
  const handleLoginSuccess = (user: { username: string; name: string; role: 'kasir' | 'owner' }) => {
    setCurrentUser(user);
    setCurrentMode(user.role);
    try {
      localStorage.setItem('allins_user', JSON.stringify(user));
    } catch {}
  };

  const handleSetMode = (mode: 'kasir' | 'owner') => {
    if (currentUser?.role === 'kasir') {
      setCurrentMode('kasir'); // Force Kasir mode only!
    } else {
      setCurrentMode(mode);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentMode('kasir');
    setCart([]);
    try {
      localStorage.removeItem('allins_user');
    } catch {}
  };

  // Handle Checkout & Payment processing
  const handleConfirmPayment = async (
    paymentMethod: 'CASH' | 'QRIS',
    cashAmount: number
  ) => {
    const txItems = cart.map((item) => ({
      product_id: item.product.id,
      code: item.product.code,
      name: item.product.name,
      size: item.product.size || '',
      price: item.price || (item.product.discount_price && item.product.discount_price > 0 && item.product.discount_price < item.product.price ? item.product.discount_price : item.product.price),
      qty: item.qty,
      notes: item.notes,
    }));

    const newTx = await createTransaction({
      cashier_name: currentUser?.name || 'Budi (Kasir)',
      items: txItems,
      discount: checkoutTotals?.discount ?? 0,
      tax: checkoutTotals?.tax ?? 0,
      payment_method: paymentMethod,
      cash_amount: cashAmount,
    });

    setCart([]);
    setIsCheckoutOpen(false);
    setCheckoutTotals(null);
    setActiveReceiptTx(newTx);
    loadInitialData();
  };

  // Product management (Owner)
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (productData.id) {
      await updateProduct(productData.id, productData);
    } else {
      await createProduct(productData);
    }
    loadInitialData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      await deleteProduct(id);
      loadInitialData();
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset data akan mengembalikan semua produk & transaksi ke data awal. Lanjutkan?')) {
      await resetSeedData();
      await loadInitialData();
      setCart([]);
    }
  };

  // Render Login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      <Header
        currentMode={currentUser.role === 'kasir' ? 'kasir' : currentMode}
        setMode={handleSetMode}
        isBackendConnected={isBackendConnected}
        onResetData={handleResetData}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {currentMode === 'kasir' || currentUser.role === 'kasir' ? (
          <CashierView
            products={products}
            categories={categories}
            cart={cart}
            setCart={setCart}
            onOpenCheckout={(totals) => {
              setCheckoutTotals(totals);
              setIsCheckoutOpen(true);
            }}
            onRefreshProducts={loadInitialData}
          />
        ) : (
          <Suspense fallback={<div className="page-loading"><span className="loading-dot" /> Memuat dashboard…</div>}>
            <OwnerView
              summary={ownerSummary}
              products={products}
              categories={categories.map((c) => c.name)}
              onOpenAddProduct={() => setProductModalState({ isOpen: true, product: null })}
              onOpenEditProduct={(p) => setProductModalState({ isOpen: true, product: p })}
              onDeleteProduct={handleDeleteProduct}
              onRefreshData={loadInitialData}
              onViewReceipt={(tx) => setActiveReceiptTx(tx)}
              onQuickSaveProduct={handleSaveProduct}
            />
          </Suspense>
        )}
      </main>

      {/* Checkout Modal */}
      {isCheckoutOpen && checkoutTotals && (
        <CheckoutModal
          cart={cart}
          subtotal={checkoutTotals.subtotal}
          discount={checkoutTotals.discount}
          tax={checkoutTotals.tax}
          total={checkoutTotals.total}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutTotals(null);
          }}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* Receipt Thermal Struk Modal */}
      {activeReceiptTx && (
        <ReceiptModal
          transaction={activeReceiptTx}
          onClose={() => setActiveReceiptTx(null)}
          onNewOrder={() => setActiveReceiptTx(null)}
        />
      )}

      {/* Product Add/Edit Modal (Owner) */}
      {productModalState.isOpen && (
        <ProductFormModal
          product={productModalState.product}
          categories={categories.map((c) => c.name)}
          onClose={() => setProductModalState({ isOpen: false, product: null })}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

export default App;
