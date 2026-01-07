.PHONY: deploy build test clean

include .env
export

build:
	forge build

test:
	forge test

deploy:
	@echo "Deploying contracts..."
	@forge script script/DeployVaultFactory.s.sol:DeployVaultFactory --rpc-url $(RPC_URL) --broadcast --verify 2>&1 | tee deploy.log
	@echo ""
	@echo "Updating API .env file..."
	@FACTORY_ADDRESS=$$(grep "VaultFactory:" deploy.log | tail -1 | awk '{print $$2}'); \
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
	@rm -f deploy.log

clean:
	forge clean
