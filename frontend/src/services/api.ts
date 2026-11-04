import type { Product, Category, Transaction, OwnerSummary, DiscountCampaign } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:8080/api`
    : '/api');

export async function fetchHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== 'Semua') params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function createTransaction(txData: {
  cashier_name: string;
  items: Array<{
    product_id: string;
    code: string;
    name: string;
    size?: string;
    price: number;
    qty: number;
    notes: string;
  }>;
  discount: number;
  tax?: number;
  payment_method: string;
  cash_amount: number;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txData),
  });
  if (!res.ok) throw new Error('Failed to process transaction');
  return res.json();
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE_URL}/transactions`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchDiscounts(): Promise<DiscountCampaign[]> {
  const res = await fetch(`${API_BASE_URL}/discounts`);
  if (!res.ok) throw new Error('Failed to fetch discounts');
  return res.json();
}

export async function createDiscount(discount: Omit<DiscountCampaign, 'id' | 'created_at'>): Promise<DiscountCampaign> {
  const res = await fetch(`${API_BASE_URL}/discounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discount),
  });
  if (!res.ok) throw new Error('Failed to create discount campaign');
  return res.json();
}

export async function updateDiscount(id: string, discount: Partial<DiscountCampaign>): Promise<DiscountCampaign> {
  const res = await fetch(`${API_BASE_URL}/discounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discount),
  });
  if (!res.ok) throw new Error('Failed to update discount campaign');
  return res.json();
}

export async function deleteDiscount(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/discounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete discount campaign');
}

export async function fetchOwnerSummary(): Promise<OwnerSummary> {
  const res = await fetch(`${API_BASE_URL}/owner/summary`);
  if (!res.ok) throw new Error('Failed to fetch owner summary');
  return res.json();
}

export async function resetSeedData(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/seed/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset seed data');
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahInput(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return '';
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export function parseRupiahInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

