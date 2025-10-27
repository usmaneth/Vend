#!/bin/bash

# TxPay Quick Start Script
# Helps you get everything configured

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                     TxPay Quick Start                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file exists"
fi

echo ""
echo "📋 Current Configuration:"
echo "────────────────────────────────────────────────────────────────────"

# Check if values are set
source .env 2>/dev/null || true

if [ -z "$ALCHEMY_API_KEY" ] || [ "$ALCHEMY_API_KEY" = "your_alchemy_api_key_here" ]; then
    echo "❌ ALCHEMY_API_KEY: Not configured"
    echo ""
    echo "   📝 To get your Alchemy API key:"
    echo "   1. Visit: https://dashboard.alchemy.com/"
    echo "   2. Sign up (free)"
    echo "   3. Create an app"
    echo "   4. Copy your API key"
    echo "   5. Add to .env file"
    echo ""
    NEEDS_CONFIG=1
else
    echo "✅ ALCHEMY_API_KEY: Configured (${ALCHEMY_API_KEY:0:10}...)"
fi

if [ -z "$PAYMENT_ADDRESS" ] || [ "$PAYMENT_ADDRESS" = "0xYourWalletAddressHere" ]; then
    echo "❌ PAYMENT_ADDRESS: Not configured"
    echo "   💡 Add any Ethereum address to .env (your wallet or test address)"
    NEEDS_CONFIG=1
else
    echo "✅ PAYMENT_ADDRESS: $PAYMENT_ADDRESS"
fi

echo "────────────────────────────────────────────────────────────────────"
echo ""

if [ ! -z "$NEEDS_CONFIG" ]; then
    echo "⚙️  Configuration needed!"
    echo ""
    echo "   Edit .env file with your values:"
    echo "   $ nano .env"
    echo ""
    echo "   Or configure now:"
    read -p "   Enter Alchemy API Key (or press Enter to skip): " API_KEY
    
    if [ ! -z "$API_KEY" ]; then
        sed -i.bak "s/ALCHEMY_API_KEY=.*/ALCHEMY_API_KEY=$API_KEY/" .env
        echo "   ✅ API key saved"
        
        read -p "   Enter Payment Address (or press Enter to use default): " PAYMENT_ADDR
        if [ ! -z "$PAYMENT_ADDR" ]; then
            sed -i.bak "s/PAYMENT_ADDRESS=.*/PAYMENT_ADDRESS=$PAYMENT_ADDR/" .env
            echo "   ✅ Payment address saved"
        fi
        
        rm -f .env.bak
        source .env
    else
        echo ""
        echo "   ⚠️  Skipping configuration. Edit .env manually before running."
        exit 1
    fi
fi

echo ""
echo "🎯 What would you like to do?"
echo ""
echo "   1. 📺 Watch Interactive Demo (no config needed)"
echo "   2. 🚀 Start Live API Server"
echo "   3. 🧪 Run Tests"
echo "   4. 📖 Read Setup Guide"
echo "   5. 🚪 Exit"
echo ""

read -p "Select option (1-5): " OPTION

case $OPTION in
    1)
        echo ""
        echo "🎬 Starting interactive demo..."
        npm run demo
        ;;
    2)
        echo ""
        echo "🚀 Starting development server..."
        echo ""
        echo "   Server will start at http://localhost:3000"
        echo ""
        echo "   Try these commands in another terminal:"
        echo "   $ curl http://localhost:3000/health"
        echo "   $ curl -H \"X-Payment-Hash: demo\" \"http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\""
        echo ""
        npm run dev
        ;;
    3)
        echo ""
        echo "🧪 Running tests..."
        npm test
        ;;
    4)
        echo ""
        cat SETUP_GUIDE.md | less
        ;;
    5)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac
