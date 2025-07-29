# SovaBTC Makefile

# Include environment variables
-include .env

# Default values
NETWORK ?= sepolia
DEPLOYMENT_FILE = deployments/$(shell cast chain-id --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL)).json

.PHONY: help
help: ## Show this help message
	@echo "SovaBTC Development Commands"
	@echo "============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Install dependencies
.PHONY: install
install: ## Install dependencies
	forge install
	npm install

# Build
.PHONY: build
build: ## Build contracts
	forge build

.PHONY: clean
clean: ## Clean build artifacts
	forge clean

# Testing
.PHONY: test
test: ## Run all tests
	forge test -vvv

.PHONY: test-wrapper
test-wrapper: ## Run wrapper tests only
	forge test --match-contract SovaBTCWrapperTest -vvv

.PHONY: test-staking
test-staking: ## Run staking tests only
	forge test --match-contract DualTokenStakingTest -vvv

.PHONY: coverage
coverage: ## Generate test coverage report
	forge coverage --report lcov
	genhtml lcov.info -o coverage --branch-coverage

# Deployment
.PHONY: deploy
deploy: ## Deploy contracts to specified network
	@echo "Deploying to $(NETWORK)..."
	@mkdir -p deployments
	forge script script/DeploySovaBTC.s.sol --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL) --broadcast --verify

.PHONY: deploy-local
deploy-local: ## Deploy contracts to local network
	forge script script/DeploySovaBTC.s.sol --rpc-url http://localhost:8545 --broadcast

.PHONY: upgrade
upgrade: ## Upgrade contracts
	@echo "Upgrading contracts on $(NETWORK)..."
	forge script script/UpgradeSovaBTC.s.sol --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL) --broadcast --verify

# Network specific deployments
.PHONY: deploy-mainnet
deploy-mainnet: ## Deploy to Ethereum mainnet
	$(MAKE) deploy NETWORK=ethereum

.PHONY: deploy-base
deploy-base: ## Deploy to Base
	$(MAKE) deploy NETWORK=base

.PHONY: deploy-sepolia
deploy-sepolia: ## Deploy to Sepolia testnet
	$(MAKE) deploy NETWORK=sepolia

# Verification
.PHONY: verify
verify: ## Verify contracts on block explorer
	@if [ -f "$(DEPLOYMENT_FILE)" ]; then \
		SOVABTC_TOKEN=$$(cat $(DEPLOYMENT_FILE) | jq -r '.contracts.sovaBTCToken'); \
		SOVABTC_WRAPPER=$$(cat $(DEPLOYMENT_FILE) | jq -r '.contracts.sovaBTCWrapper'); \
		DUAL_TOKEN_STAKING=$$(cat $(DEPLOYMENT_FILE) | jq -r '.contracts.dualTokenStaking'); \
		echo "Verifying SovaBTC Token at $$SOVABTC_TOKEN"; \
		forge verify-contract $$SOVABTC_TOKEN src/wrapper/SovaBTCToken.sol:SovaBTCToken --chain-id $(shell cast chain-id --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL)); \
		echo "Verifying SovaBTC Wrapper at $$SOVABTC_WRAPPER"; \
		forge verify-contract $$SOVABTC_WRAPPER src/wrapper/SovaBTCWrapper.sol:SovaBTCWrapper --chain-id $(shell cast chain-id --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL)); \
		echo "Verifying Dual Token Staking at $$DUAL_TOKEN_STAKING"; \
		forge verify-contract $$DUAL_TOKEN_STAKING src/staking/DualTokenStaking.sol:DualTokenStaking --chain-id $(shell cast chain-id --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL)); \
	else \
		echo "Deployment file not found: $(DEPLOYMENT_FILE)"; \
	fi

# Local development
.PHONY: anvil
anvil: ## Start local Anvil node
	anvil --host 0.0.0.0

.PHONY: console
console: ## Open Forge console
	forge console

# Gas analysis
.PHONY: gas-report
gas-report: ## Generate gas usage report
	forge test --gas-report

# Formatting and linting
.PHONY: format
format: ## Format code
	forge fmt

.PHONY: format-check
format-check: ## Check code formatting
	forge fmt --check

# Security
.PHONY: slither
slither: ## Run Slither static analysis
	slither src/

# Documentation
.PHONY: docs
docs: ## Generate documentation
	forge doc

# Utility commands
.PHONY: addresses
addresses: ## Show deployed contract addresses
	@if [ -f "$(DEPLOYMENT_FILE)" ]; then \
		echo "Deployed contracts on $(NETWORK):"; \
		echo "==================================="; \
		echo "SovaBTC Token: $$(cat $(DEPLOYMENT_FILE) | jq -r '.contracts.sovaBTCToken')"; \
		echo "SovaBTC Wrapper: $$(cat $(DEPLOYMENT_FILE) | jq -r '.contracts.sovaBTCWrapper')"; \
		echo "Dual Token Staking: $$(cat $(DEPLOYMENT_FILE) | jq -r '.contracts.dualTokenStaking')"; \
	else \
		echo "No deployment found for $(NETWORK)"; \
	fi

.PHONY: balance
balance: ## Check deployer balance
	@cast balance $(shell cast wallet address --private-key $(PRIVATE_KEY)) --rpc-url $($(shell echo $(NETWORK) | tr '[:lower:]' '[:upper:]')_RPC_URL) | cast --to-unit ether

# Setup commands
.PHONY: setup
setup: ## Initial setup
	@echo "Setting up SovaBTC development environment..."
	@if [ ! -f ".env" ]; then cp .env.example .env; echo "Created .env file - please update with your values"; fi
	$(MAKE) install
	$(MAKE) build
	@echo "Setup complete! Run 'make help' to see available commands."