import fs from 'fs';
import path from 'path';
import os from 'os';

const SAVED_QUERIES_DIR = path.join(os.homedir(), '.vend');
const SAVED_QUERIES_FILE = path.join(SAVED_QUERIES_DIR, 'saved-queries.json');

/**
 * Ensure the saved queries directory exists
 */
function ensureDirectory() {
  if (!fs.existsSync(SAVED_QUERIES_DIR)) {
    fs.mkdirSync(SAVED_QUERIES_DIR, { recursive: true });
  }
}

/**
 * Load all saved queries
 */
export function loadSavedQueries() {
  ensureDirectory();

  if (!fs.existsSync(SAVED_QUERIES_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(SAVED_QUERIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading saved queries:', error.message);
    return {};
  }
}

/**
 * Save queries to file
 */
function saveSavedQueries(queries) {
  ensureDirectory();

  try {
    fs.writeFileSync(SAVED_QUERIES_FILE, JSON.stringify(queries, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving queries:', error.message);
    return false;
  }
}

/**
 * Create or update a saved query
 */
export function saveQuery(name, queryConfig) {
  const queries = loadSavedQueries();
  queries[name] = {
    ...queryConfig,
    created: queries[name]?.created || new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  return saveSavedQueries(queries);
}

/**
 * Get a specific saved query
 */
export function getQuery(name) {
  const queries = loadSavedQueries();
  return queries[name] || null;
}

/**
 * Delete a saved query
 */
export function deleteQuery(name) {
  const queries = loadSavedQueries();

  if (!queries[name]) {
    return false;
  }

  delete queries[name];
  return saveSavedQueries(queries);
}

/**
 * List all saved query names
 */
export function listQueries() {
  const queries = loadSavedQueries();
  return Object.keys(queries);
}

/**
 * Get all saved queries
 */
export function getAllQueries() {
  return loadSavedQueries();
}
