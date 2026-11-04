package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

type StoreData struct {
	Products          []Product          `json:"products"`
	Categories        []Category         `json:"categories"`
	Transactions      []Transaction      `json:"transactions"`
	DiscountCampaigns []DiscountCampaign `json:"discount_campaigns"`
}

type Store struct {
	mu       sync.RWMutex
	filePath string
	data     StoreData
}

func NewStore(filePath string) (*Store, error) {
	s := &Store{
		filePath: filePath,
	}

	if err := s.load(); err != nil {
		fmt.Println("No existing store file or error loading. Seeding basketball initial data...")
		s.seedInitialData()
		if err := s.save(); err != nil {
			return nil, fmt.Errorf("failed to save initial seed: %w", err)
		}
	}

	return s, nil
}

func (s *Store) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fileBytes, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}

	var data StoreData
	if err := json.Unmarshal(fileBytes, &data); err != nil {
		return err
	}

	s.data = data
	return nil
}

func (s *Store) save() error {
	bytes, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}
	if dir := filepath.Dir(s.filePath); dir != "" && dir != "." {
		_ = os.MkdirAll(dir, 0755)
	}
	return os.WriteFile(s.filePath, bytes, 0644)
}

func (s *Store) ResetSeed() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.seedInitialData()
	return s.save()
}

func (s *Store) seedInitialData() {
	s.data.Categories = []Category{
		{ID: "cat_all", Name: "Semua", Icon: "LayoutGrid"},
		{ID: "cat_shoes", Name: "Sepatu Basket", Icon: "Footprints"},
		{ID: "cat_jersey", Name: "Jersey & Apparel", Icon: "Shirt"},
		{ID: "cat_ball", Name: "Bola Basket", Icon: "CircleDot"},
		{ID: "cat_acc", Name: "Aksesori & Gear", Icon: "ShieldAlert"},
	}

	// Data dimulai dari 0 (Fresh Store)
	s.data.Products = []Product{}
	s.data.Transactions = []Transaction{}
	s.data.DiscountCampaigns = []DiscountCampaign{}
}

// Store CRUD Operations

func (s *Store) GetProducts(category string, search string) []Product {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]Product, 0)
	for _, p := range s.data.Products {
		if category != "" && category != "Semua" && p.Category != category {
			continue
		}
		if search != "" {
			if !containsIgnoreCase(p.Name, search) && !containsIgnoreCase(p.Code, search) {
				continue
			}
		}
		res = append(res, p)
	}
	return res
}

func containsIgnoreCase(s, substr string) bool {
	return len(substr) == 0 || (len(s) >= len(substr) && stringContains(toLower(s), toLower(substr)))
}

func toLower(s string) string {
	b := []byte(s)
	for i := range b {
		if b[i] >= 'A' && b[i] <= 'Z' {
			b[i] += 'a' - 'A'
		}
	}
	return string(b)
}

func stringContains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func (s *Store) SaveProduct(p Product) (Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p.ID == "" {
		p.ID = fmt.Sprintf("prod_%d", time.Now().UnixNano())
		p.CreatedAt = time.Now()
		s.data.Products = append(s.data.Products, p)
	} else {
		found := false
		for i, existing := range s.data.Products {
			if existing.ID == p.ID {
				p.CreatedAt = existing.CreatedAt
				s.data.Products[i] = p
				found = true
				break
			}
		}
		if !found {
			s.data.Products = append(s.data.Products, p)
		}
	}

	err := s.save()
	return p, err
}

func (s *Store) DeleteProduct(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	newProds := make([]Product, 0)
	for _, p := range s.data.Products {
		if p.ID != id {
			newProds = append(newProds, p)
		}
	}
	s.data.Products = newProds
	return s.save()
}

func (s *Store) CreateTransaction(tx Transaction) (Transaction, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tx.ID = fmt.Sprintf("TRX-%s-%04d", time.Now().Format("20060102"), len(s.data.Transactions)+1)
	tx.CreatedAt = time.Now()
	tx.Status = "COMPLETED"

	var subtotal float64
	var profit float64

	for i, item := range tx.Items {
		for pIdx, prod := range s.data.Products {
			if prod.ID == item.ProductID || prod.Code == item.Code {
				item.CostPrice = prod.CostPrice
				if item.Price <= 0 {
					if prod.DiscountPrice > 0 && prod.DiscountPrice < prod.Price {
						item.Price = prod.DiscountPrice
					} else {
						item.Price = prod.Price
					}
				}
				item.Subtotal = item.Price * float64(item.Qty)
				tx.Items[i] = item

				if prod.Stock >= item.Qty {
					s.data.Products[pIdx].Stock -= item.Qty
				} else {
					s.data.Products[pIdx].Stock = 0
				}
				break
			}
		}
		subtotal += item.Subtotal
		profit += (item.Price - item.CostPrice) * float64(item.Qty)
	}

	tx.Subtotal = subtotal
	if tx.Tax < 0 {
		tx.Tax = 0
	}
	tx.Total = subtotal - tx.Discount + tx.Tax
	if tx.Total < 0 {
		tx.Total = 0
	}
	tx.Profit = profit - tx.Discount

	s.data.Transactions = append(s.data.Transactions, tx)
	err := s.save()
	return tx, err
}

func (s *Store) GetTransactions() []Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]Transaction, len(s.data.Transactions))
	copy(res, s.data.Transactions)
	sort.Slice(res, func(i, j int) bool {
		return res[i].CreatedAt.After(res[j].CreatedAt)
	})
	return res
}

func (s *Store) GetOwnerSummary() OwnerSummary {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	todayYear, todayMonth, todayDay := now.Date()

	var todayRevenue float64
	var todayProfit float64
	var todayTxCount int

	productSalesMap := make(map[string]*TopProduct)

	chartMap := make(map[string]*ChartDataPoint)
	dayNames := []string{"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
	
	for i := 6; i >= 0; i-- {
		d := now.AddDate(0, 0, -i)
		dayLabel := fmt.Sprintf("%s (%d/%d)", dayNames[d.Weekday()], d.Day(), d.Month())
		chartMap[d.Format("2006-01-02")] = &ChartDataPoint{
			Label:        dayLabel,
			Revenue:      0,
			Profit:       0,
			Transactions: 0,
		}
	}

	for _, tx := range s.data.Transactions {
		txY, txM, txD := tx.CreatedAt.Date()
		if txY == todayYear && txM == todayMonth && txD == todayDay {
			todayRevenue += tx.Total
			todayProfit += tx.Profit
			todayTxCount++
		}

		dateKey := tx.CreatedAt.Format("2006-01-02")
		if cp, ok := chartMap[dateKey]; ok {
			cp.Revenue += tx.Total
			cp.Profit += tx.Profit
			cp.Transactions++
		}

		for _, item := range tx.Items {
			if tp, ok := productSalesMap[item.Name]; ok {
				tp.QtySold += item.Qty
				tp.Revenue += item.Subtotal
				tp.Profit += (item.Price - item.CostPrice) * float64(item.Qty)
			} else {
				productSalesMap[item.Name] = &TopProduct{
					ID:       item.ProductID,
					Name:     item.Name,
					QtySold:  item.Qty,
					Revenue:  item.Subtotal,
					Profit:   (item.Price - item.CostPrice) * float64(item.Qty),
				}
			}
		}
	}

	avgBasket := float64(0)
	if todayTxCount > 0 {
		avgBasket = todayRevenue / float64(todayTxCount)
	}

	lowStockProds := make([]Product, 0)
	for _, p := range s.data.Products {
		if p.Stock <= 10 {
			lowStockProds = append(lowStockProds, p)
		}
	}

	salesChart := make([]ChartDataPoint, 0)
	for i := 6; i >= 0; i-- {
		d := now.AddDate(0, 0, -i)
		dateKey := d.Format("2006-01-02")
		if cp, ok := chartMap[dateKey]; ok {
			salesChart = append(salesChart, *cp)
		}
	}

	topList := make([]TopProduct, 0, len(productSalesMap))
	for _, tp := range productSalesMap {
		topList = append(topList, *tp)
	}
	sort.Slice(topList, func(i, j int) bool {
		return topList[i].QtySold > topList[j].QtySold
	})

	if len(topList) > 5 {
		topList = topList[:5]
	}

	sortedTx := make([]Transaction, len(s.data.Transactions))
	copy(sortedTx, s.data.Transactions)
	sort.Slice(sortedTx, func(i, j int) bool {
		return sortedTx[i].CreatedAt.After(sortedTx[j].CreatedAt)
	})
	if len(sortedTx) > 10 {
		sortedTx = sortedTx[:10]
	}

	return OwnerSummary{
		TodayRevenue:           todayRevenue,
		TodayProfit:            todayProfit,
		TodayTransactionsCount: todayTxCount,
		AvgBasketSize:          avgBasket,
		LowStockCount:          len(lowStockProds),
		TotalProductsCount:     len(s.data.Products),
		SalesChart:             salesChart,
		TopProducts:            topList,
		LowStockProducts:       lowStockProds,
		RecentTransactions:     sortedTx,
	}
}

func (s *Store) GetDiscounts() []DiscountCampaign {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]DiscountCampaign, len(s.data.DiscountCampaigns))
	copy(res, s.data.DiscountCampaigns)
	sort.Slice(res, func(i, j int) bool {
		return res[i].CreatedAt.After(res[j].CreatedAt)
	})
	return res
}

func (s *Store) SaveDiscount(d DiscountCampaign) (DiscountCampaign, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if d.ID == "" {
		d.ID = fmt.Sprintf("DISC-%d", time.Now().UnixMilli())
		d.CreatedAt = time.Now()
		d.IsActive = true
		s.data.DiscountCampaigns = append(s.data.DiscountCampaigns, d)
	} else {
		found := false
		for idx, existing := range s.data.DiscountCampaigns {
			if existing.ID == d.ID {
				if d.CreatedAt.IsZero() {
					d.CreatedAt = existing.CreatedAt
				}
				s.data.DiscountCampaigns[idx] = d
				found = true
				break
			}
		}
		if !found {
			if d.CreatedAt.IsZero() {
				d.CreatedAt = time.Now()
			}
			s.data.DiscountCampaigns = append(s.data.DiscountCampaigns, d)
		}
	}

	err := s.save()
	return d, err
}

func (s *Store) DeleteDiscount(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, d := range s.data.DiscountCampaigns {
		if d.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("discount campaign not found")
	}

	s.data.DiscountCampaigns = append(s.data.DiscountCampaigns[:idx], s.data.DiscountCampaigns[idx+1:]...)
	return s.save()
}
