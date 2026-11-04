package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

var globalStore *Store

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func jsonResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func errorResponse(w http.ResponseWriter, statusCode int, message string) {
	jsonResponse(w, statusCode, map[string]string{"error": message})
}

// Router dispatchers

func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}
	jsonResponse(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"message": "POS Golang Backend is running smoothly",
	})
}

func handleCategories(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}
	globalStore.mu.RLock()
	defer globalStore.mu.RUnlock()
	jsonResponse(w, http.StatusOK, globalStore.data.Categories)
}

func handleProducts(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	switch r.Method {
	case http.MethodGet:
		cat := r.URL.Query().Get("category")
		search := r.URL.Query().Get("search")
		products := globalStore.GetProducts(cat, search)
		jsonResponse(w, http.StatusOK, products)

	case http.MethodPost:
		var p Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			errorResponse(w, http.StatusBadRequest, "Invalid product payload")
			return
		}
		saved, err := globalStore.SaveProduct(p)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to save product")
			return
		}
		jsonResponse(w, http.StatusCreated, saved)

	default:
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleProductDetail(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	// Path: /api/products/:id
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		errorResponse(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	id := parts[3]

	switch r.Method {
	case http.MethodPut:
		var p Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			errorResponse(w, http.StatusBadRequest, "Invalid product payload")
			return
		}
		p.ID = id
		saved, err := globalStore.SaveProduct(p)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to update product")
			return
		}
		jsonResponse(w, http.StatusOK, saved)

	case http.MethodDelete:
		if err := globalStore.DeleteProduct(id); err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to delete product")
			return
		}
		jsonResponse(w, http.StatusOK, map[string]string{"message": "Product deleted successfully"})

	default:
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleTransactions(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	switch r.Method {
	case http.MethodGet:
		txs := globalStore.GetTransactions()
		jsonResponse(w, http.StatusOK, txs)

	case http.MethodPost:
		var tx Transaction
		if err := json.NewDecoder(r.Body).Decode(&tx); err != nil {
			errorResponse(w, http.StatusBadRequest, "Invalid transaction payload")
			return
		}
		if len(tx.Items) == 0 {
			errorResponse(w, http.StatusBadRequest, "Transaction items cannot be empty")
			return
		}
		savedTx, err := globalStore.CreateTransaction(tx)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to process transaction")
			return
		}
		jsonResponse(w, http.StatusCreated, savedTx)

	default:
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleOwnerSummary(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	summary := globalStore.GetOwnerSummary()
	jsonResponse(w, http.StatusOK, summary)
}

func handleSeedReset(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if err := globalStore.ResetSeed(); err != nil {
		errorResponse(w, http.StatusInternalServerError, "Failed to reset data")
		return
	}
	jsonResponse(w, http.StatusOK, map[string]string{"message": "Data reset to initial seed successfully"})
}

func handleDiscounts(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	switch r.Method {
	case http.MethodGet:
		discounts := globalStore.GetDiscounts()
		jsonResponse(w, http.StatusOK, discounts)

	case http.MethodPost:
		var d DiscountCampaign
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
			errorResponse(w, http.StatusBadRequest, "Invalid discount payload")
			return
		}
		if d.Name == "" || d.Value <= 0 {
			errorResponse(w, http.StatusBadRequest, "Discount name and positive value are required")
			return
		}
		saved, err := globalStore.SaveDiscount(d)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to save discount")
			return
		}
		jsonResponse(w, http.StatusCreated, saved)

	default:
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleDiscountDetail(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	// Path: /api/discounts/:id
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		errorResponse(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	id := parts[3]

	switch r.Method {
	case http.MethodPut:
		var d DiscountCampaign
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
			errorResponse(w, http.StatusBadRequest, "Invalid discount payload")
			return
		}
		d.ID = id
		saved, err := globalStore.SaveDiscount(d)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to update discount")
			return
		}
		jsonResponse(w, http.StatusOK, saved)

	case http.MethodDelete:
		if err := globalStore.DeleteDiscount(id); err != nil {
			errorResponse(w, http.StatusInternalServerError, "Failed to delete discount")
			return
		}
		jsonResponse(w, http.StatusOK, map[string]string{"message": "Discount deleted successfully"})

	default:
		errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func main() {
	dbPath := os.Getenv("DATA_PATH")
	if dbPath == "" {
		dbPath = "pos_store.json"
	}

	var err error
	globalStore, err = NewStore(dbPath)
	if err != nil {
		log.Fatalf("Fatal error initializing store: %v", err)
	}

	http.HandleFunc("/api/health", handleHealth)
	http.HandleFunc("/api/categories", handleCategories)
	http.HandleFunc("/api/products", handleProducts)
	http.HandleFunc("/api/products/", handleProductDetail)
	http.HandleFunc("/api/transactions", handleTransactions)
	http.HandleFunc("/api/discounts", handleDiscounts)
	http.HandleFunc("/api/discounts/", handleDiscountDetail)
	http.HandleFunc("/api/owner/summary", handleOwnerSummary)
	http.HandleFunc("/api/seed/reset", handleSeedReset)

	portEnv := os.Getenv("PORT")
	if portEnv == "" {
		portEnv = "8080"
	}
	if !strings.HasPrefix(portEnv, ":") {
		portEnv = ":" + portEnv
	}

	fmt.Printf("🚀 Golang POS Backend Server listening on http://0.0.0.0%s\n", portEnv)
	if err := http.ListenAndServe(portEnv, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
