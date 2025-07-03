#!/bin/bash

# Script to extract ABIs from compiled contracts
echo "Extracting ABIs for deployed contracts..."

# Create abis directory if it doesn't exist
mkdir -p abis

# Function to extract ABI from .json file using jq
extract_abi_from_json() {
    local json_file="$1"
    local output_file="$2"
    
    if [ -f "$json_file" ]; then
        echo "Extracting ABI from $json_file to $output_file"
        jq '.abi' "$json_file" > "$output_file"
        return 0
    else
        echo "File not found: $json_file"
        return 1
    fi
}

# Function to copy .abi.json file if it exists
copy_abi_json() {
    local abi_file="$1"
    local output_file="$2"
    
    if [ -f "$abi_file" ]; then
        echo "Copying $abi_file to $output_file"
        cp "$abi_file" "$output_file"
        return 0
    else
        return 1
    fi
}

# Extract ABIs for core contracts
echo "=== Core Contracts ==="

# SovaBTC - has .abi.json
copy_abi_json "out/SovaBTC.sol/SovaBTC.abi.json" "abis/SovaBTC.abi.json" || \
extract_abi_from_json "out/SovaBTC.sol/SovaBTC.json" "abis/SovaBTC.abi.json"

# SOVAToken - only has .json
extract_abi_from_json "out/SOVAToken.sol/SOVAToken.json" "abis/SOVAToken.abi.json"

# TokenWhitelist - has .abi.json
copy_abi_json "out/TokenWhitelist.sol/TokenWhitelist.abi.json" "abis/TokenWhitelist.abi.json" || \
extract_abi_from_json "out/TokenWhitelist.sol/TokenWhitelist.json" "abis/TokenWhitelist.abi.json"

# CustodyManager - check for both
copy_abi_json "out/CustodyManager.sol/CustodyManager.abi.json" "abis/CustodyManager.abi.json" || \
extract_abi_from_json "out/CustodyManager.sol/CustodyManager.json" "abis/CustodyManager.abi.json"

# SovaBTCWrapper - has .abi.json
copy_abi_json "out/SovaBTCWrapper.sol/SovaBTCWrapper.abi.json" "abis/SovaBTCWrapper.abi.json" || \
extract_abi_from_json "out/SovaBTCWrapper.sol/SovaBTCWrapper.json" "abis/SovaBTCWrapper.abi.json"

# RedemptionQueue - check for both
copy_abi_json "out/RedemptionQueue.sol/RedemptionQueue.abi.json" "abis/RedemptionQueue.abi.json" || \
extract_abi_from_json "out/RedemptionQueue.sol/RedemptionQueue.json" "abis/RedemptionQueue.abi.json"

# SovaBTCStaking - check for both
copy_abi_json "out/SovaBTCStaking.sol/SovaBTCStaking.abi.json" "abis/SovaBTCStaking.abi.json" || \
extract_abi_from_json "out/SovaBTCStaking.sol/SovaBTCStaking.json" "abis/SovaBTCStaking.abi.json"

echo ""
echo "=== Test Tokens ==="

# Extract ABI for TestToken from Deploy.s.sol
copy_abi_json "out/Deploy.s.sol/TestToken.abi.json" "abis/TestToken.abi.json" || \
extract_abi_from_json "out/Deploy.s.sol/TestToken.json" "abis/TestToken.abi.json"

echo ""
echo "=== Interface ABIs ==="

# ISovaBTC interface
copy_abi_json "out/ISovaBTC.sol/ISovaBTC.abi.json" "abis/ISovaBTC.abi.json" || \
extract_abi_from_json "out/ISovaBTC.sol/ISovaBTC.json" "abis/ISovaBTC.abi.json"

echo ""
echo "ABI extraction complete!"
echo "ABIs saved in ./abis/ directory:"
ls -la abis/

echo ""
echo "=== Contract Addresses from Last Deployment ==="
echo "Add these to your frontend .env.local file:"
echo ""
echo "# Copy the addresses from your actual deployment output"
echo "# NEXT_PUBLIC_SOVABTC_ADDRESS=0x..."
echo "# NEXT_PUBLIC_SOVA_TOKEN_ADDRESS=0x..."
echo "# NEXT_PUBLIC_TOKEN_WHITELIST_ADDRESS=0x..."
echo "# NEXT_PUBLIC_CUSTODY_MANAGER_ADDRESS=0x..."
echo "# NEXT_PUBLIC_SOVABTC_WRAPPER_ADDRESS=0x..."
echo "# NEXT_PUBLIC_REDEMPTION_QUEUE_ADDRESS=0x..."
echo "# NEXT_PUBLIC_SOVABTC_STAKING_ADDRESS=0x..." 