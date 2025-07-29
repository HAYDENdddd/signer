#!/bin/bash

# Deployment script for smart contracts
# Usage: ./deploy.sh [network] [verify]
# Example: ./deploy.sh sepolia verify

set -e

# Default values
NETWORK=${1:-sepolia}
VERIFY=${2:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting deployment to $NETWORK network...${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file and configure your private key and other settings.${NC}"
    exit 1
fi

# Load environment variables
source .env

# Check if private key is set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not configured in .env file!${NC}"
    echo -e "${YELLOW}Please set your private key in the .env file.${NC}"
    exit 1
fi

# Build the forge command
COMMAND="forge script script/Deploy.s.sol --rpc-url $NETWORK --private-key $PRIVATE_KEY --broadcast"

# Add verification if requested
if [ "$VERIFY" = "verify" ]; then
    if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your_etherscan_api_key_here" ]; then
        echo -e "${YELLOW}⚠️  Warning: ETHERSCAN_API_KEY not configured. Skipping verification.${NC}"
    else
        COMMAND="$COMMAND --verify"
        echo -e "${GREEN}✅ Contract verification enabled${NC}"
    fi
fi

echo -e "${YELLOW}📝 Executing: $COMMAND${NC}"
echo ""

# Execute the deployment
eval $COMMAND

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${YELLOW}📋 Check the broadcast folder for deployment details.${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi