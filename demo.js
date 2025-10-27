#!/usr/bin/env node

/**
 * Vend - Monetized Transaction History API Interactive Demo
 *
 * Blockchain data vending machine using x402 + Alchemy
 * Showcases payment flow, query examples, and use cases
 */

import readline from 'readline';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function print(text, color = 'white') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function printBox(title, content, color = 'cyan') {
  const width = 70;
  const border = '═'.repeat(width - 2);

  print(`\n╔${border}╗`, color);
  print(`║ ${title.padEnd(width - 3)}║`, color);
  print(`╠${border}╣`, color);

  if (Array.isArray(content)) {
    content.forEach(line => {
      print(`║ ${line.padEnd(width - 3)}║`, 'white');
    });
  } else {
    print(`║ ${content.padEnd(width - 3)}║`, 'white');
  }

  print(`╚${border}╝`, color);
}

function printStep(number, title) {
  print(`\n${'▶'.repeat(3)} Step ${number}: ${title}`, 'bright');
}

function printJson(obj, indent = 2) {
  const json = JSON.stringify(obj, null, indent);
  json.split('\n').forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      console.log(`${colors.cyan}${key}:${colors.white}${value}${colors.reset}`);
    } else {
      console.log(`${colors.dim}${line}${colors.reset}`);
    }
  });
}

async function typeWriter(text, color = 'white', delay = 30) {
  process.stdout.write(colors[color]);
  for (const char of text) {
    process.stdout.write(char);
    await sleep(delay);
  }
  process.stdout.write(colors.reset + '\n');
}

async function showHeader() {
  console.clear();
  print('═'.repeat(70), 'cyan');
  print('', 'cyan');
  print('   ██╗   ██╗███████╗███╗   ██╗██████╗ ', 'cyan');
  print('   ██║   ██║██╔════╝████╗  ██║██╔══██╗', 'cyan');
  print('   ██║   ██║█████╗  ██╔██╗ ██║██║  ██║', 'cyan');
  print('   ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║██║  ██║', 'cyan');
  print('    ╚████╔╝ ███████╗██║ ╚████║██████╔╝', 'cyan');
  print('     ╚═══╝  ╚══════╝╚═╝  ╚═══╝╚═════╝ ', 'cyan');
  print('', 'cyan');
  print('   Monetized Transaction History API using x402 & Alchemy', 'white');
  print('        🎰 Blockchain Data Vending Machine', 'bright');
  print('        Insert payment → Get data instantly', 'dim');
  print('', 'cyan');
  print('═'.repeat(70), 'cyan');
  await sleep(1000);
}

async function demoPaymentFlow() {
  await showHeader();

  await typeWriter('\n🎭 Welcome to the Vend Interactive Demo!', 'green', 40);
  await typeWriter('This demo showcases how the blockchain data vending machine works with x402 payments.\n', 'white', 20);
  await sleep(1000);

  // Step 1: Initial Request
  printStep(1, 'Client requests transaction history (no payment)');
  await sleep(800);

  print('\n$ curl http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'yellow');
  await sleep(1200);

  print('\n⏳ Sending request...', 'dim');
  await sleep(1500);

  // Step 2: 402 Response
  printStep(2, 'Server responds with 402 Payment Required');
  await sleep(800);

  print('\n❌ HTTP 402 Payment Required', 'red');
  await sleep(500);

  printBox('Payment Instructions', [
    '',
    '💰 Payment Required to Access Data',
    '',
    '   Recipient:  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    '   Amount:     0.01 USDC',
    '   Network:    Base Sepolia',
    '   Chain ID:   84532',
    '',
    '📋 Instructions:',
    '   1. Send USDC payment to recipient address',
    '   2. Copy your transaction hash',
    '   3. Retry request with X-Payment-Hash header',
    '',
  ], 'yellow');

  await sleep(2000);

  // Step 3: Payment
  printStep(3, 'User sends payment on Base network');
  await sleep(800);

  print('\n💳 Initiating USDC transfer...', 'blue');
  await sleep(1000);

  const paymentSteps = [
    '  ⚡ Connecting to Base Sepolia...',
    '  📝 Preparing USDC transfer...',
    '  ✍️  Signing transaction...',
    '  📡 Broadcasting to network...',
    '  ⏳ Waiting for confirmation...',
    '  ✅ Transaction confirmed!',
  ];

  for (const step of paymentSteps) {
    print(step, 'dim');
    await sleep(600);
  }

  await sleep(500);
  print('\n🎉 Payment successful!', 'green');
  print('   Transaction Hash: 0xabc123...def456', 'cyan');
  await sleep(1500);

  // Step 4: Retry with Payment
  printStep(4, 'Client retries request with payment proof');
  await sleep(800);

  print('\n$ curl -H "X-Payment-Hash: 0xabc123...def456" \\', 'yellow');
  print('    http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'yellow');
  await sleep(1200);

  print('\n⏳ Sending authenticated request...', 'dim');
  await sleep(1000);
  print('🔐 Verifying payment...', 'dim');
  await sleep(1200);
  print('✅ Payment verified!', 'green');
  await sleep(800);
  print('📡 Querying Alchemy API...', 'dim');
  await sleep(1500);

  // Step 5: Success Response
  printStep(5, 'Server returns blockchain data');
  await sleep(800);

  print('\n✅ HTTP 200 OK', 'green');
  await sleep(500);

  printBox('Transaction History Data', [
    '',
    '📊 Found 3 transfers for 0xd8dA...96045',
    '',
  ], 'green');

  await sleep(500);

  const sampleData = {
    success: true,
    data: {
      transfers: [
        {
          blockNum: '0x10e1b3a',
          hash: '0x789abc...456def',
          from: '0xd8dA...96045',
          to: '0x123...789',
          value: 1.5,
          asset: 'ETH',
          category: 'external',
          timestamp: '2025-01-15T10:30:00Z'
        },
        {
          blockNum: '0x10e1a2c',
          hash: '0x456def...123abc',
          from: '0x456...123',
          to: '0xd8dA...96045',
          value: 100,
          asset: 'USDC',
          category: 'erc20',
          timestamp: '2025-01-15T09:15:00Z'
        },
        {
          blockNum: '0x10e199f',
          hash: '0x123abc...789def',
          from: '0xd8dA...96045',
          to: '0x789...456',
          value: 0,
          asset: 'CryptoPunk #1234',
          category: 'erc721',
          timestamp: '2025-01-14T18:45:00Z'
        }
      ],
      totalCount: 3
    },
    payment: {
      hash: '0xabc123...def456',
      amount: '0.01',
      verified: true,
      timestamp: '2025-01-15T12:00:00Z'
    }
  };

  printJson(sampleData);
  await sleep(2000);

  // Summary
  print('\n' + '═'.repeat(70), 'cyan');
  await typeWriter('\n✨ Demo Complete!', 'green', 40);
  print('\nKey Features Demonstrated:', 'bright');
  print('  ✓ HTTP 402 Payment Required status code', 'green');
  print('  ✓ x402 payment instructions', 'green');
  print('  ✓ On-chain USDC payment verification', 'green');
  print('  ✓ Blockchain transaction history via Alchemy', 'green');
  print('  ✓ Pay-per-query monetization model', 'green');

  print('\n💡 Why This Matters:', 'bright');
  print('  • No API keys needed for users', 'white');
  print('  • Pay only for what you use', 'white');
  print('  • Instant micropayments via stablecoins', 'white');
  print('  • Perfect for AI agents and programmatic access', 'white');

  await pressEnterToContinue();
}

async function showQueryExamples() {
  await showHeader();

  printBox('Query Examples - What You Can Do', ['Real commands you can run once configured'], 'magenta');

  await sleep(500);

  print('\n📚 Example 1: Get All Transfers for an Address', 'bright');
  await sleep(300);
  print('   Use case: See complete transaction history\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: All ETH, tokens, and NFT transfers', 'cyan');

  await sleep(1500);

  print('\n📚 Example 2: Get Only Token (ERC20) Transfers', 'bright');
  await sleep(300);
  print('   Use case: Track token movements (USDC, DAI, etc.)\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA...&category=erc20"', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Only ERC20 token transfers', 'cyan');

  await sleep(1500);

  print('\n📚 Example 3: Get Only NFT Transfers', 'bright');
  await sleep(300);
  print('   Use case: Track NFT collection activity\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA...&category=erc721,erc1155"', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Only NFT transfers (ERC721 + ERC1155)', 'cyan');

  await sleep(1500);

  print('\n📚 Example 4: Get Recent Transfers (Limited)', 'bright');
  await sleep(300);
  print('   Use case: Quick snapshot of latest activity\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA...&maxCount=10"', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Last 10 transactions', 'cyan');

  await sleep(1500);

  print('\n📚 Example 5: Filter by Specific Token', 'bright');
  await sleep(300);
  print('   Use case: Track specific token (e.g., USDC only)\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA...', 'yellow');
  print('       &contractAddresses=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Only USDC transfers', 'cyan');

  await sleep(1500);

  print('\n📚 Example 6: Get Outgoing Transfers Only', 'bright');
  await sleep(300);
  print('   Use case: See what an address has sent\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?fromAddress=0xd8dA..."', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Only transfers FROM this address', 'cyan');

  await sleep(1500);

  print('\n📚 Example 7: Get Incoming Transfers Only', 'bright');
  await sleep(300);
  print('   Use case: See what an address has received\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?toAddress=0xd8dA..."', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Only transfers TO this address', 'cyan');

  await sleep(1500);

  print('\n📚 Example 8: Block Range Query', 'bright');
  await sleep(300);
  print('   Use case: Historical data from specific time period\n', 'dim');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA...', 'yellow');
  print('       &fromBlock=0x1000000&toBlock=latest"', 'yellow');

  await sleep(1000);
  print('\n   💡 Returns: Transfers from block 0x1000000 to latest', 'cyan');

  await sleep(2000);

  print('\n' + '═'.repeat(70), 'cyan');
  print('\n🎯 Query Parameters Reference:', 'bright');
  print('   address          - Wallet to query (from OR to)', 'white');
  print('   fromAddress      - Filter by sender', 'white');
  print('   toAddress        - Filter by recipient', 'white');
  print('   category         - external,internal,erc20,erc721,erc1155', 'white');
  print('   contractAddresses- Specific token contracts (comma-separated)', 'white');
  print('   fromBlock        - Start block (hex/number)', 'white');
  print('   toBlock          - End block (hex/number/"latest")', 'white');
  print('   maxCount         - Limit results (1-1000)', 'white');
  print('   order            - asc or desc (default: desc)', 'white');

  await pressEnterToContinue();
}

async function showAIAgentScenario() {
  await showHeader();

  printBox('Use Case: AI Agent Portfolio Tracker', ['Autonomous agent monitors wallet activity'], 'blue');

  await sleep(500);

  await typeWriter('\n🤖 Scenario: AI agent monitors a DeFi whale wallet automatically\n', 'cyan', 25);

  await sleep(800);

  print('┌────────────────────────────────────────────────────────────────┐', 'blue');
  print('│  🤖 Portfolio Tracker Agent v1.0                              │', 'blue');
  print('│  Monitoring: 0xWhaleWallet...                                 │', 'blue');
  print('└────────────────────────────────────────────────────────────────┘', 'blue');

  await sleep(1000);

  const agentSteps = [
    { emoji: '🔍', text: 'Agent wakes up (every 15 minutes)', color: 'cyan' },
    { emoji: '💰', text: 'Checks USDC balance: 0.05 USDC available', color: 'green' },
    { emoji: '📡', text: 'Requests Vend: "Get latest 20 transfers"', color: 'yellow' },
    { emoji: '💸', text: 'Vend responds: 402 Payment Required', color: 'red' },
    { emoji: '⚡', text: 'Agent auto-pays: 0.01 USDC → Vend', color: 'blue' },
    { emoji: '✅', text: 'Payment confirmed in 2 seconds', color: 'green' },
    { emoji: '📊', text: 'Vend returns: 20 latest transactions', color: 'green' },
    { emoji: '🧠', text: 'Agent analyzes: Found 3 large USDC transfers', color: 'magenta' },
    { emoji: '🔔', text: 'Agent alerts user: "Whale moved $500K USDC"', color: 'yellow' },
    { emoji: '💤', text: 'Agent sleeps until next cycle...', color: 'dim' },
  ];

  for (const step of agentSteps) {
    await sleep(800);
    print(`\n${step.emoji}  ${step.text}`, step.color);
  }

  await sleep(2000);

  print('\n' + '─'.repeat(68), 'dim');
  print('\n📈 Agent Activity Summary:', 'bright');
  await sleep(500);

  const summary = {
    queriesPerDay: 96,
    costPerQuery: '$0.01',
    dailyCost: '$0.96',
    monthlyCost: '$28.80',
    valueDelivered: 'Instant whale tracking without subscriptions'
  };

  print(`   • Queries per day: ${summary.queriesPerDay} (every 15 min)`, 'white');
  print(`   • Cost per query: ${summary.costPerQuery} USDC`, 'white');
  print(`   • Daily cost: ${summary.dailyCost}`, 'white');
  print(`   • Monthly cost: ${summary.monthlyCost}`, 'white');
  print(`   • Value: ${summary.valueDelivered}`, 'green');

  await sleep(2000);

  print('\n💡 Why x402 is Perfect for AI Agents:', 'bright');
  await sleep(300);
  print('   ✓ No account setup - agent just pays and goes', 'green');
  print('   ✓ No API keys to manage or rotate', 'green');
  print('   ✓ Pay-per-use - scales with actual usage', 'green');
  print('   ✓ Instant settlement - no billing cycles', 'green');
  print('   ✓ Programmable - agent handles everything', 'green');

  await sleep(1500);

  print('\n🔧 Agent Code Example (Pseudo):', 'bright');
  await sleep(500);

  const code = `
  class WhalTrackerAgent {
    async checkWallet(address) {
      // Try to get data
      let response = await fetch('/api/transfers?address=' + address);

      if (response.status === 402) {
        // Payment required - agent pays automatically
        const payment = await this.payUSDC(0.01);

        // Retry with payment proof
        response = await fetch('/api/transfers?address=' + address, {
          headers: { 'X-Payment-Hash': payment.hash }
        });
      }

      const data = await response.json();
      return this.analyzeTransfers(data.transfers);
    }
  }`;

  print(code, 'yellow');

  await pressEnterToContinue();
}

async function showAgentCommerceScenario() {
  await showHeader();

  printBox('Use Case: Agent-to-Agent Commerce', ['Agents buying services from each other autonomously'], 'magenta');

  await sleep(500);

  await typeWriter('\n🤝 Scenario: Vend serves data to Analytics Agent autonomously\n', 'cyan', 25);

  await sleep(800);

  print('\n┌─────────────────────┐         ┌─────────────────────┐', 'magenta');
  print('│   Analytics Agent   │         │    Vend Service     │', 'magenta');
  print('│   (Buyer)           │         │    (Seller)         │', 'magenta');
  print('└─────────────────────┘         └─────────────────────┘', 'magenta');

  await sleep(1000);

  print('\n🎬 The Transaction Flow:', 'bright');
  await sleep(500);

  const commerceSteps = [
    {
      agent: 'Analytics Agent',
      action: 'Needs blockchain data for report',
      icon: '🤖',
      color: 'cyan'
    },
    {
      agent: 'Analytics Agent',
      action: 'Discovers Vend API (via on-chain registry)',
      icon: '🔍',
      color: 'cyan'
    },
    {
      agent: 'Analytics Agent',
      action: 'Requests: GET /api/transfers?address=0x...',
      icon: '📡',
      color: 'yellow'
    },
    {
      agent: 'Vend',
      action: 'Responds: 402 Payment Required (0.01 USDC)',
      icon: '💰',
      color: 'red'
    },
    {
      agent: 'Analytics Agent',
      action: 'Evaluates: "0.01 USDC < my budget (0.05 USDC)"',
      icon: '🧮',
      color: 'blue'
    },
    {
      agent: 'Analytics Agent',
      action: 'Approves transaction autonomously',
      icon: '✅',
      color: 'green'
    },
    {
      agent: 'Analytics Agent',
      action: 'Sends: 0.01 USDC on Base to Vend',
      icon: '💸',
      color: 'blue'
    },
    {
      agent: 'Vend',
      action: 'Receives payment → Verifies on-chain',
      icon: '🔐',
      color: 'green'
    },
    {
      agent: 'Vend',
      action: 'Queries Alchemy → Returns data',
      icon: '📊',
      color: 'green'
    },
    {
      agent: 'Analytics Agent',
      action: 'Receives data → Generates report',
      icon: '📈',
      color: 'cyan'
    },
    {
      agent: 'Analytics Agent',
      action: 'Logs transaction for audit trail',
      icon: '📝',
      color: 'dim'
    },
  ];

  for (const step of commerceSteps) {
    await sleep(900);
    print(`\n${step.icon}  [${step.agent}]`, 'bright');
    print(`   ${step.action}`, step.color);
  }

  await sleep(2000);

  print('\n' + '═'.repeat(68), 'magenta');
  print('\n⚡ What Just Happened:', 'bright');
  await sleep(500);

  print('\n   1. 🤖 Two agents never met before', 'white');
  print('   2. 💰 No pre-existing account or relationship', 'white');
  print('   3. 🔐 No API key sharing or authentication', 'white');
  print('   4. ⚡ Transaction completed in ~3 seconds', 'white');
  print('   5. 🎯 Both agents got exactly what they needed', 'white');
  print('   6. 📊 Analytics agent got data, TxPay got paid', 'white');
  print('   7. 🔄 Can repeat infinitely without setup', 'white');

  await sleep(2000);

  print('\n🌐 The Future: Agent Economy', 'bright');
  await sleep(500);

  print('\n   Imagine thousands of specialized agents:', 'cyan');
  await sleep(300);
  print('     • Data vending agents (like Vend)', 'white');
  print('     • Analytics agents', 'white');
  print('     • Trading agents', 'white');
  print('     • Monitoring agents', 'white');
  print('     • Alert agents', 'white');
  await sleep(800);

  print('\n   All buying/selling services from each other:', 'cyan');
  await sleep(300);
  print('     ✓ No human intervention', 'green');
  print('     ✓ Instant micropayments', 'green');
  print('     ✓ Pay-per-use pricing', 'green');
  print('     ✓ Global, permissionless', 'green');
  print('     ✓ Fully autonomous', 'green');

  await sleep(2000);

  print('\n💡 Why This is Revolutionary:', 'bright');
  await sleep(500);

  const benefits = [
    'Traditional APIs: Need accounts, keys, billing',
    'x402 APIs: Just pay and use - like vending machines',
    '',
    'Traditional: Monthly subscriptions, rate limits',
    'x402: Pay exactly for what you use',
    '',
    'Traditional: Human setup required',
    'x402: Agents handle everything autonomously',
  ];

  benefits.forEach(line => {
    if (line === '') {
      console.log();
    } else if (line.startsWith('Traditional')) {
      print(`   ❌ ${line}`, 'red');
    } else {
      print(`   ✅ ${line}`, 'green');
    }
  });

  await sleep(2000);

  print('\n🎯 Real-World Example Flow:', 'bright');
  print('\n   Trading Bot → Pays Vend → Gets wallet history →', 'yellow');
  print('   Analyzes for patterns → Pays Price Oracle →', 'yellow');
  print('   Gets current prices → Makes trade decision →', 'yellow');
  print('   Pays DEX Aggregator → Executes trade', 'yellow');
  print('\n   💰 Total cost: ~$0.05 in micropayments', 'green');
  print('   ⚡ Total time: ~10 seconds', 'green');
  print('   🤖 Human involvement: 0%', 'green');

  await pressEnterToContinue();
}

async function showSampleResponse() {
  console.clear();
  printBox('Sample API Response', ['GET /api/transfers?address=0xd8dA...'], 'cyan');

  const response = {
    success: true,
    data: {
      transfers: [
        {
          blockNum: '0x10e1b3a',
          hash: '0x789abc123def456...',
          from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          to: '0x1234567890abcdef...',
          value: 1.5,
          asset: 'ETH',
          category: 'external'
        }
      ],
      pageKey: null,
      totalCount: 1
    },
    payment: {
      hash: '0xabc123...',
      amount: '0.01',
      verified: true
    },
    pagination: {
      hasMore: false,
      count: 1
    }
  };

  printJson(response);

  print('\n💡 This response includes:', 'bright');
  print('  • Transaction details from Alchemy', 'white');
  print('  • Payment verification proof', 'white');
  print('  • Pagination info for large result sets', 'white');

  await pressEnterToContinue();
}

async function explainX402() {
  console.clear();
  printBox('Understanding x402 Protocol', ['HTTP-based micropayments for the internet'], 'magenta');

  print('\n🔍 What is x402?', 'bright');
  await typeWriter('x402 revives HTTP status code 402 (Payment Required) for modern micropayments.', 'white', 20);

  await sleep(500);

  print('\n📋 How It Works:', 'bright');
  const steps = [
    '1️⃣  Client requests protected resource',
    '2️⃣  Server returns 402 with payment instructions',
    '3️⃣  Client sends stablecoin payment on-chain',
    '4️⃣  Client retries request with payment proof',
    '5️⃣  Server verifies payment and returns data',
  ];

  for (const step of steps) {
    print('   ' + step, 'cyan');
    await sleep(400);
  }

  print('\n✨ Key Benefits:', 'bright');
  print('  • No accounts or API keys needed', 'green');
  print('  • Instant settlements (~2 seconds)', 'green');
  print('  • No protocol fees (only gas)', 'green');
  print('  • Perfect for AI agents', 'green');
  print('  • Works with any EVM chain', 'green');

  print('\n🌐 Learn More: https://x402.org', 'dim');

  await pressEnterToContinue();
}

async function showQuickStart() {
  console.clear();
  printBox('Quick Start Guide', ['Get Vend running in 3 steps'], 'green');

  print('\n📦 Step 1: Configure Environment', 'bright');
  print('   $ ./configure.sh', 'yellow');
  print('   (Helps you set up Alchemy API key)', 'dim');

  print('\n🚀 Step 2: Start Server', 'bright');
  print('   $ npm run dev', 'yellow');

  print('\n🧪 Step 3: Test It', 'bright');
  print('   $ curl http://localhost:3000/health', 'yellow');
  print('   $ curl -H "X-Payment-Hash: demo" \\', 'yellow');
  print('       "http://localhost:3000/api/transfers?address=0xd8dA..."', 'yellow');

  print('\n📚 Full Documentation:', 'bright');
  print('   • Getting Started: ./docs/getting-started.md', 'cyan');
  print('   • Query Examples: This demo (option 2)', 'cyan');
  print('   • Setup Guide: ./SETUP_GUIDE.md', 'cyan');
  print('   • Deployment: ./docs/deployment.md', 'cyan');

  await pressEnterToContinue();
}

async function showMenu() {
  await showHeader();

  print('\n📋 Demo Menu:\n', 'bright');
  print('  1. 🎬 Full Payment Flow Demo', 'cyan');
  print('  2. 📊 Query Examples - What You Can Do', 'cyan');
  print('  3. 🤖 Use Case: AI Agent Portfolio Tracker', 'cyan');
  print('  4. 🤝 Use Case: Agent-to-Agent Commerce', 'cyan');
  print('  5. 💡 Understanding x402 Protocol', 'cyan');
  print('  6. 🚀 Quick Start Guide', 'cyan');
  print('  7. 📄 View Sample API Response', 'cyan');
  print('  8. 🚪 Exit', 'cyan');
  print('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}Select an option (1-8): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function pressEnterToContinue() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    print('');
    rl.question(`${colors.dim}Press Enter to continue...${colors.reset}`, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  while (true) {
    const choice = await showMenu();

    switch (choice) {
      case '1':
        await demoPaymentFlow();
        break;
      case '2':
        await showQueryExamples();
        break;
      case '3':
        await showAIAgentScenario();
        break;
      case '4':
        await showAgentCommerceScenario();
        break;
      case '5':
        await explainX402();
        break;
      case '6':
        await showQuickStart();
        break;
      case '7':
        await showSampleResponse();
        break;
      case '8':
        console.clear();
        print('\n👋 Thanks for checking out Vend! 🎰\n', 'green');
        print('Star us on GitHub: https://github.com/yourusername/vend', 'cyan');
        print('Documentation: ./docs/\n', 'dim');
        process.exit(0);
      default:
        print('\n❌ Invalid option. Please try again.\n', 'red');
        await sleep(1000);
    }
  }
}

// Run demo
main().catch(console.error);
