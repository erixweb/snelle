import fs from 'fs';
import path from 'path';

export default function execute() {
  copyDirectories()
}

async function copyDirectories() {
  const directories = ['src', 'public', 'components'];
  // Get the path to the package directory in node_modules
  const sourceRoot = path.join(__dirname);
  const targetRoot = path.join(process.cwd(), 'new-project'); // You can modify the target directory name

  try {
    // Create target directory if it doesn't exist
    await fs.promises.mkdir(targetRoot, { recursive: true });

    // Copy each directory
    for (const dir of directories) {
      const sourcePath = path.join(sourceRoot, dir);
      const targetPath = path.join(targetRoot, dir);

      try {
        // Check if source directory exists
        await fs.promises.access(sourcePath);
        
        // Ensure the target directory structure exists
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Copy directory with all contents recursively
        async function copyRecursive(src, dest) {
          const entries = await fs.promises.readdir(src, { withFileTypes: true });
          
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
              await fs.promises.mkdir(destPath, { recursive: true });
              await copyRecursive(srcPath, destPath);
            } else {
              await fs.promises.copyFile(srcPath, destPath);
            }
          }
        }

        await copyRecursive(sourcePath, targetPath);
        console.log(`Successfully copied ${dir}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(`Directory not found: ${dir}`);
        } else {
          throw err;
        }
      }
    }

    console.log('All directories copied successfully!');
  } catch (error) {
    console.error('Error copying directories:', error);
  }
}

copyDirectories();
