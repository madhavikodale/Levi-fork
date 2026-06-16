package main

import (
	"fmt"
	"github.com/eigeninference/d-inference/coordinator/store"
)

func main() {
	s := store.NewMemory(store.Config{})
	
	// Create a dev API key
	rawKey, keyRec, err := s.CreateAPIKey("dev-account", store.APIKeyCreate{
		Name: "dev-key",
	})
	if err != nil {
		fmt.Printf("Error creating key: %v\n", err)
		return
	}
	
	fmt.Printf("API Key created:\n")
	fmt.Printf("  Raw Key: %s\n", rawKey)
	fmt.Printf("  Key ID: %s\n", keyRec.ID)
	fmt.Printf("  Account: %s\n", keyRec.OwnerAccountID)
	fmt.Printf("  Name: %s\n", keyRec.Name)
	fmt.Printf("  Created: %s\n", keyRec.CreatedAt)
}
