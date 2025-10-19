import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.resolve(__dirname, '../..');

const directory = {
    root: rootPath,
    distDir: path.join(rootPath, 'dist'),
    assetsDir: path.join(rootPath, 'public'),
};

export default directory;
