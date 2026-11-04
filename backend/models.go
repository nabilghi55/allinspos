package main

import "time"

type Product struct {
	ID        string    `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Size      string    `json:"size"`
	Price     float64   `json:"price"`
	DiscountPrice float64 `json:"discount_price"`
	CostPrice float64   `json:"cost_price"`
	Stock     int       `json:"stock"`
	ImageURL  string    `json:"image_url"`
	IsFav     bool      `json:"is_fav"`
	CreatedAt time.Time `json:"created_at"`
}

type Category struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type TransactionItem struct {
	ProductID string  `json:"product_id"`
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Size      string  `json:"size"`
	Price     float64 `json:"price"`
	CostPrice float64 `json:"cost_price"`
	Qty       int     `json:"qty"`
	Notes     string  `json:"notes"`
	Subtotal  float64 `json:"subtotal"`
}

type Transaction struct {
	ID            string            `json:"id"`
	CreatedAt     time.Time         `json:"created_at"`
	CashierName   string            `json:"cashier_name"`
	Items         []TransactionItem `json:"items"`
	Subtotal      float64           `json:"subtotal"`
	Discount      float64           `json:"discount"`
	Tax           float64           `json:"tax"`
	Total         float64           `json:"total"`
	Profit        float64           `json:"profit"`
	PaymentMethod string            `json:"payment_method"` // CASH, QRIS, DEBIT, CREDIT
	CashAmount    float64           `json:"cash_amount"`
	ChangeAmount  float64           `json:"change_amount"`
	Status        string            `json:"status"` // COMPLETED, REFUNDED
}

type ChartDataPoint struct {
	Label        string  `json:"label"` // e.g. "08:00", "Senin", etc.
	Revenue      float64 `json:"revenue"`
	Profit       float64 `json:"profit"`
	Transactions int     `json:"transactions"`
}

type TopProduct struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Category  string  `json:"category"`
	QtySold   int     `json:"qty_sold"`
	Revenue   float64 `json:"revenue"`
	Profit    float64 `json:"profit"`
}

type OwnerSummary struct {
	TodayRevenue          float64          `json:"today_revenue"`
	TodayProfit           float64          `json:"today_profit"`
	TodayTransactionsCount int             `json:"today_transactions_count"`
	AvgBasketSize         float64          `json:"avg_basket_size"`
	LowStockCount         int              `json:"low_stock_count"`
	TotalProductsCount    int              `json:"total_products_count"`
	SalesChart            []ChartDataPoint `json:"sales_chart"`
	TopProducts           []TopProduct     `json:"top_products"`
	LowStockProducts      []Product        `json:"low_stock_products"`
	RecentTransactions    []Transaction    `json:"recent_transactions"`
}

type DiscountCampaign struct {
	ID        string    `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // "PERCENT" or "RP"
	Value     float64   `json:"value"`
	MinSpend  float64   `json:"min_spend"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}
