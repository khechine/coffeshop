import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename using timestamp + random
  const extension = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
  
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {}

  const path = join(uploadDir, filename);
  await writeFile(path, buffer);
  
  return `/uploads/${filename}`;
}
