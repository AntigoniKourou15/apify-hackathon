import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

async function copyData() {
  const sourceFile = join(process.cwd(), 'data', 'investors.json');
  const targetDir = join(process.cwd(), 'frontend', 'public', 'data');
  const targetFile = join(targetDir, 'investors.json');

  try {
    if (!existsSync(sourceFile)) {
      console.log('No data file found at data/investors.json');
      console.log('Run the scraper first with exportToJson: true');
      process.exit(1);
    }

    // Create target directory if it doesn't exist
    await mkdir(targetDir, { recursive: true });

    // Read and write the file
    const data = await readFile(sourceFile, 'utf-8');
    await writeFile(targetFile, data, 'utf-8');

    console.log('✅ Data copied to frontend/public/data/investors.json');
  } catch (error) {
    console.error('Error copying data:', error);
    process.exit(1);
  }
}

copyData();

