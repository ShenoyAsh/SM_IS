import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(dbFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize db file if it doesn't exist
if (!fs.existsSync(dbFilePath)) {
  const initialData = {
    users: [],
    posts: [],
    comments: []
  };
  fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
}

export const readData = () => {
  try {
    const data = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], posts: [], comments: [] };
  }
};

export const writeData = (data) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to write JSON DB', err);
    return false;
  }
};
