// Convierte todos los PNG de la mascota a WebP preservando transparencia
import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join, basename } from 'path'

const MASCOT_DIR = 'public/images/mascot'

const files = (await readdir(MASCOT_DIR)).filter(f => f.endsWith('.png'))

for (const file of files) {
  const src = join(MASCOT_DIR, file)
  const dest = join(MASCOT_DIR, file.replace('.png', '.webp'))

  const { width, height } = await sharp(src).metadata()
  await sharp(src)
    .webp({ quality: 90, lossless: false, alphaQuality: 100 })
    .toFile(dest)

  console.log(`✓ ${file} (${width}×${height}) → ${basename(dest)}`)
}

console.log(`\nConvertidos ${files.length} archivos.`)
