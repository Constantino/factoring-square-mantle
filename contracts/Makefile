.PHONY: deploy deploy-mock-usdc deploy-all build test clean

include .env
export

build:
	forge build

test:
	forge test

deploy-all:
	@echo "=========================================="
	@echo "Starting Full Deployment Process"
	@echo "=========================================="
	@echo ""
	@echo "Step 1/2: Deploying Mock USDC..."
	@$(MAKE) deploy-mock-usdc
	@echo ""
	@echo "Step 2/2: Deploying VaultFactory..."
	@$(MAKE) deploy
	@echo ""
	@echo "=========================================="
	@echo "✓ Full Deployment Complete!"
	@echo "=========================================="
	@echo ""
	@echo "Deployed Contracts:"
	@echo "-------------------"
	@if [ -f ".env" ]; then \
		MOCK_USDC=$$(grep USDC_ADDRESS .env | cut -d'=' -f2); \
		VAULT_FACTORY=$$(grep VAULT_FACTORY_ADDRESS .env | cut -d'=' -f2); \
		echo ""; \
		echo "Mock USDC:"; \
		echo "  Address: $$MOCK_USDC"; \
		echo "  Explorer: https://sepolia.mantlescan.xyz/address/$$MOCK_USDC"; \
		echo ""; \
		echo "VaultFactory:"; \
		echo "  Address: $$VAULT_FACTORY"; \
		echo "  Explorer: https://sepolia.mantlescan.xyz/address/$$VAULT_FACTORY"; \
		echo ""; \
	fi

deploy:
	@echo "Deploying contracts..."
	@forge script script/DeployVaultFactory.s.sol:DeployVaultFactory \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		--legacy \
		2>&1 | tee deploy.log
	@echo ""
	@echo "Updating API .env file..."
	@FACTORY_ADDRESS=$$(grep "VaultFactory:" deploy.log | tail -1 | awk '{print $$2}'); \
	TEST_VAULT=$$(grep "Test Vault:" deploy.log | tail -1 | awk '{print $$3}'); \
	if [ -n "$$FACTORY_ADDRESS" ] && [ -f "../api/.env" ]; then \
		if grep -q "VAULT_FACTORY_ADDRESS=" ../api/.env; then \
			grep -v "VAULT_FACTORY_ADDRESS=" ../api/.env > ../api/.env.tmp && \
			echo "VAULT_FACTORY_ADDRESS=$$FACTORY_ADDRESS" >> ../api/.env.tmp && \
			mv ../api/.env.tmp ../api/.env; \
		else \
			echo "VAULT_FACTORY_ADDRESS=$$FACTORY_ADDRESS" >> ../api/.env; \
		fi; \
		echo "✓ Updated ../api/.env with factory address: $$FACTORY_ADDRESS"; \
	fi
	@echo ""
	@echo "=========================================="
	@echo "Deployed Contracts:"
	@echo "=========================================="
	@FACTORY_ADDRESS=$$(grep "VaultFactory:" deploy.log | tail -1 | awk '{print $$2}'); \
	TEST_VAULT=$$(grep "Test Vault:" deploy.log | tail -1 | awk '{print $$3}'); \
	if [ -n "$$FACTORY_ADDRESS" ]; then \
		echo ""; \
		echo "VaultFactory:"; \
		echo "  Address: $$FACTORY_ADDRESS"; \
		echo "  Explorer: https://sepolia.mantlescan.xyz/address/$$FACTORY_ADDRESS"; \
		echo ""; \
	fi; \
	if [ -n "$$TEST_VAULT" ]; then \
		echo "Test Vault:"; \
		echo "  Address: $$TEST_VAULT"; \
		echo "  Explorer: https://sepolia.mantlescan.xyz/address/$$TEST_VAULT"; \
		echo ""; \
	fi
	@rm -f deploy.log

deploy-mock-usdc:
	@echo "Deploying Mock USDC..."
	@forge script script/DeployMockUSDC.s.sol:DeployMockUSDC \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		--legacy \
		2>&1 | tee deploy-mock.log
	@echo ""
	@echo "Updating .env files with Mock USDC address..."
	@MOCK_USDC_ADDRESS=$$(grep "MockUSDC Address:" deploy-mock.log | tail -1 | awk '{print $$3}'); \
	if [ -n "$$MOCK_USDC_ADDRESS" ]; then \
		if grep -q "USDC_ADDRESS=" .env; then \
			grep -v "USDC_ADDRESS=" .env > .env.tmp && \
			echo "USDC_ADDRESS=$$MOCK_USDC_ADDRESS" >> .env.tmp && \
			mv .env.tmp .env; \
		else \
			echo "USDC_ADDRESS=$$MOCK_USDC_ADDRESS" >> .env; \
		fi; \
		echo "✓ Updated .env with Mock USDC address: $$MOCK_USDC_ADDRESS"; \
		if [ -f "../api/.env" ]; then \
			if grep -q "USDC_ADDRESS=" ../api/.env; then \
				grep -v "USDC_ADDRESS=" ../api/.env > ../api/.env.tmp && \
				echo "USDC_ADDRESS=$$MOCK_USDC_ADDRESS" >> ../api/.env.tmp && \
				mv ../api/.env.tmp ../api/.env; \
			else \
				echo "USDC_ADDRESS=$$MOCK_USDC_ADDRESS" >> ../api/.env; \
			fi; \
			echo "✓ Updated ../api/.env with Mock USDC address: $$MOCK_USDC_ADDRESS"; \
		fi; \
		echo ""; \
		echo "==========================================";\
		echo "Deployed Contract:"; \
		echo "==========================================";\
		echo ""; \
		echo "MockUSDC:"; \
		echo "  Address: $$MOCK_USDC_ADDRESS"; \
		echo "  Explorer: https://sepolia.mantlescan.xyz/address/$$MOCK_USDC_ADDRESS"; \
		echo ""; \
	fi
	@rm -f deploy-mock.log

clean:
	forge clean
