#!/bin/bash

echo "🚀 TxPay Setup Script"
echo "====================="
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚙️  No .env file found. Please configure your environment:"
    echo ""
    echo "   1. Edit .env file"
    echo "   2. Add your ALCHEMY_API_KEY from https://dashboard.alchemy.com/"
    echo "   3. Add your PAYMENT_ADDRESS (wallet to receive payments)"
    echo ""
    echo "❌ Setup incomplete. Please configure .env before running."
    exit 1
fi

# Check if required env vars are set
source .env

if [ -z "$ALCHEMY_API_KEY" ]; then
    echo "❌ ALCHEMY_API_KEY is not set in .env"
    echo "   Get your API key from: https://dashboard.alchemy.com/"
    exit 1
fi

if [ -z "$PAYMENT_ADDRESS" ]; then
    echo "❌ PAYMENT_ADDRESS is not set in .env"
    echo "   Set your wallet address to receive payments"
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but setup is complete"
else
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  npm run dev    (development with auto-reload)"
echo "  npm start      (production)"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
