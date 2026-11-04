export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  size?: string;
  price: number;
  discount_price?: number;
  cost_price: number;
  stock: number;
  image_url: string;
  is_fav?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  price: number;
  qty: number;
  notes: string;
  subtotal: number;
}

export interface TransactionItem {
  product_id: string;
  code: string;
  name: string;
  size?: string;
  price: number;
  cost_price: number;
  qty: number;
  notes: string;
  subtotal: number;
}

export interface Transaction {
  id: string;
  created_at: string;
  cashier_name: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  payment_method: 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT';
  cash_amount: number;
  change_amount: number;
  status: string;
}

export interface ChartDataPoint {
  label: string;
  revenue: number;
  profit: number;
  transactions: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  qty_sold: number;
  revenue: number;
  profit: number;
}

export interface OwnerSummary {
  today_revenue: number;
  today_profit: number;
  today_transactions_count: number;
  avg_basket_size: number;
  low_stock_count: number;
  total_products_count: number;
  sales_chart: ChartDataPoint[];
  top_products: TopProduct[];
  low_stock_products: Product[];
  recent_transactions: Transaction[];
}

export interface DiscountCampaign {
  id: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'RP';
  value: number;
  min_spend: number;
  is_active: boolean;
  created_at: string;
}
