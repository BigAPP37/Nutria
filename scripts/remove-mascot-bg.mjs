// Elimina el fondo de las imágenes de la mascota y exporta como WebP con transparencia.
// Usa flood-fill desde las esquinas (estilo "varita mágica") con comparación por pixel adyacente
// para seguir fondos con gradiente sin comerse al personaje.
//
// Uso: node scripts/remove-mascot-bg.mjs

import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join } from 'path'

const MASCOT_DIR = 'public/images/mascot'
const TOLERANCE = 45   // distancia máxima entre píxeles adyacentes para considerarlos fondo
const MAX_DRIFT  = 140 // distancia máxima acumulada desde el color original de la semilla

function colorDist(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2)
}

async function removeBg(inputFile, outputFile) {
  const { data: rawData, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const w = info.width
  const h = info.height
  const buf = new Uint8Array(rawData)

  function getPixel(x, y) {
    const i = (y * w + x) * 4
    return [buf[i], buf[i+1], buf[i+2], buf[i+3]]
  }

  function setAlpha(x, y, alpha) {
    buf[(y * w + x) * 4 + 3] = alpha
  }

  // 4 flood fills independientes — una por esquina con su propio color semilla
  // Esto maneja imágenes con fondos distintos (gris arriba + blanco abajo)
  const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]]

  const visited = new Uint8Array(w * h)
  let removed = 0

  for (const [cx, cy] of corners) {
    const seedColor = getPixel(cx, cy).slice(0, 3)
    // Cola simple: almacenar como índice plano para mejor rendimiento
    const queue = [[cx, cy, seedColor]]

    let qi = 0
    while (qi < queue.length) {
      const [x, y, parentColor] = queue[qi++]
      const idx = y * w + x
      if (visited[idx]) continue
      visited[idx] = 1

      const px = getPixel(x, y)
      const distToParent = colorDist(px, parentColor)
      const distToSeed   = colorDist(px, seedColor)

      if (distToParent <= TOLERANCE && distToSeed <= MAX_DRIFT) {
        setAlpha(x, y, 0)
        removed++

        for (const [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[ny * w + nx]) {
            queue.push([nx, ny, px.slice(0, 3)])
          }
        }
      }
    }
  }

  await sharp(Buffer.from(buf), { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(outputFile)

  return { removed, total: w * h }
}

const files = (await readdir(MASCOT_DIR)).filter(f => f.endsWith('.png'))

for (const file of files) {
  const src = join(MASCOT_DIR, file)
  const dest = join(MASCOT_DIR, file.replace('.png', '.webp'))

  const { removed, total } = await removeBg(src, dest)
  const pct = ((removed / total) * 100).toFixed(1)
  console.log(`✓ ${file} → ${file.replace('.png','.webp')}  (${removed.toLocaleString()} px eliminados, ${pct}% del total)`)
}

console.log('\n¡Listo! Verifica los resultados en el navegador.')
