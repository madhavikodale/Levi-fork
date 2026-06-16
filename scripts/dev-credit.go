package main

import (
	"fmt"
	"github.com/eigeninference/d-inference/coordinator/store"
)

func main() {
	s := store.NewMemory(store.Config{})
	
	// Credit dev account with $10
	err := s.Credit("dev-account", 10000000, store.LedgerAdminCredit, "dev-setup")
	if err != nil {
		fmt.Printf("Error crediting: %v\n", err)
		return
	}
	
	balance, _ := s.GetBalanceWithWithdrawable("dev-account")
	fmt.Printf("Dev account balance: %d micro-USD ($%.2f)\n", balance, float64(balance)/1000000)
}
