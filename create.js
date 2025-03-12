import fs from 'fs';
import path from 'path';

export default function execute() {
  createDirectoriesAndCopyFiles()
}

async function createDirectoriesAndCopyFiles() {
  const directories = ['src', 'public', 'components'];
  const targetRoot = path.join(process.cwd(), 'new-project');
  const templateRoot = path.join(process.cwd(), 'templates');

  try {
    // Create target directory if it doesn't exist
    await fs.promises.mkdir(targetRoot, { recursive: true });

    // Create each directory and copy files
    for (const dir of directories) {
      const targetPath = path.join(targetRoot, dir);
      const sourcePath = path.join(templateRoot, dir);
      console.log(sourcePath)
      
      try {
        // Create directory
        await fs.promises.mkdir(targetPath, { recursive: true });
        console.log(`Successfully created ${dir} directory`);

        // Copy files if source directory exists
        if (await fs.promises.access(sourcePath).then(() => true).catch(() => false)) {
          const files = await fs.promises.readdir(sourcePath);
          for (const file of files) {
            const sourceFile = path.join(sourcePath, file);
            const targetFile = path.join(targetPath, file);
            await fs.promises.copyFile(sourceFile, targetFile);
            console.log(`Copied ${file} to ${dir} directory`);
          }
        }
      } catch (err) {
        console.error(`Error processing directory ${dir}:`, err);
        throw err;
      }
    }

    console.log('All directories created and files copied successfully!');
  } catch (error) {
    console.error('Error creating directories or copying files:', error);
  }
}

createDirectoriesAndCopyFiles();
