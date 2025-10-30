import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Format data as JSON
 */
export function formatJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Format array data as CSV
 */
export function formatCSV(data, fields = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Auto-detect fields from first object if not provided
  const headers = fields || Object.keys(data[0]);

  // CSV header row
  const csv = [headers.join(',')];

  // CSV data rows
  data.forEach(item => {
    const row = headers.map(field => {
      const value = item[field];
      // Escape commas and quotes in values
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csv.push(row.join(','));
  });

  return csv.join('\n');
}

/**
 * Format transfers as table
 */
export function formatTransfersTable(transfers) {
  const table = new Table({
    head: [
      chalk.cyan('Type'),
      chalk.cyan('Asset'),
      chalk.cyan('Value'),
      chalk.cyan('From'),
      chalk.cyan('To'),
    ],
    colWidths: [12, 10, 15, 12, 12],
  });

  const displayTransfers = transfers.slice(0, 10);

  displayTransfers.forEach(transfer => {
    table.push([
      chalk.gray(transfer.category),
      chalk.white(transfer.asset || 'ETH'),
      chalk.green(transfer.value?.toString().substring(0, 10) || '0'),
      chalk.gray(transfer.from?.substring(0, 10) + '...'),
      chalk.gray(transfer.to?.substring(0, 10) + '...'),
    ]);
  });

  console.log(table.toString());

  if (transfers.length > 10) {
    console.log(chalk.gray(`\n... and ${transfers.length - 10} more transfers`));
  }
}

/**
 * Format NFTs as table
 */
export function formatNFTsTable(nfts) {
  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Token ID'),
      chalk.cyan('Contract'),
      chalk.cyan('Type'),
    ],
    colWidths: [25, 12, 20, 10],
  });

  const displayNFTs = nfts.slice(0, 10);

  displayNFTs.forEach(nft => {
    table.push([
      chalk.white(nft.title || nft.contract?.name || 'Unknown'),
      chalk.gray(nft.tokenId || 'N/A'),
      chalk.gray(nft.contract?.address?.substring(0, 16) + '...'),
      chalk.blue(nft.tokenType || 'ERC721'),
    ]);
  });

  console.log(table.toString());

  if (nfts.length > 10) {
    console.log(chalk.gray(`\n... and ${nfts.length - 10} more NFTs`));
  }
}

/**
 * Format token balances as table
 */
export function formatTokenBalancesTable(balances) {
  const table = new Table({
    head: [
      chalk.cyan('Symbol'),
      chalk.cyan('Name'),
      chalk.cyan('Balance'),
      chalk.cyan('Contract'),
    ],
    colWidths: [10, 20, 20, 20],
  });

  balances.forEach(balance => {
    if (balance.tokenBalance && balance.tokenBalance !== '0') {
      table.push([
        chalk.white(balance.symbol || 'N/A'),
        chalk.gray(balance.name || 'Unknown'),
        chalk.green(balance.tokenBalance),
        chalk.gray(balance.contractAddress?.substring(0, 16) + '...'),
      ]);
    }
  });

  console.log(table.toString());
}

/**
 * Output data based on format option
 */
export function outputData(data, format = 'table', type = 'transfers') {
  if (format === 'json') {
    console.log(formatJSON(data));
  } else if (format === 'csv') {
    // Extract arrays for CSV
    let arrayData = data;
    if (type === 'transfers' && data.transfers) {
      arrayData = data.transfers;
    } else if (type === 'nfts' && data.nfts) {
      arrayData = data.nfts;
    } else if (type === 'tokens' && data.balances) {
      arrayData = data.balances;
    }

    if (Array.isArray(arrayData)) {
      console.log(formatCSV(arrayData));
    } else {
      console.log('CSV format requires array data');
    }
  } else {
    // Table format (default)
    if (type === 'transfers' && data.transfers) {
      formatTransfersTable(data.transfers);
    } else if (type === 'nfts' && data.nfts) {
      formatNFTsTable(data.nfts);
    } else if (type === 'tokens' && data.balances) {
      formatTokenBalancesTable(data.balances);
    } else {
      // Fallback to JSON for unknown types
      console.log(formatJSON(data));
    }
  }
}
