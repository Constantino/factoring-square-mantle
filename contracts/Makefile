.PHONY: deploy build test clean

include .env
export

build:
	forge build

test:
	forge test

deploy:
	@echo "Deploying contracts..."
	@forge script script/DeployVaultFactory.s.sol:DeployVaultFactory --rpc-url $(RPC_URL) --broadcast | tee deploy.log
	@echo ""
	@echo "Updating API .env file..."
	@FACTORY_ADDRESS=$$(grep "VaultFactory:" deploy.log | awk '{print $$2}'); \
	if [ -f "../api/.env" ]; then \
		if grep -q "VAULT_FACTORY_ADDRESS=" ../api/.env; then \
			sed -i.bak "s|VAULT_FACTORY_ADDRESS=.*|VAULT_FACTORY_ADDRESS=$$FACTORY_ADDRESS|" ../api/.env && rm -f ../api/.env.bak; \
		else \
			echo "VAULT_FACTORY_ADDRESS=$$FACTORY_ADDRESS" >> ../api/.env; \
		fi; \
		echo "✓ Updated ../api/.env with factory address: $$FACTORY_ADDRESS"; \
	fi
	@rm -f deploy.log

clean:
	forge clean
