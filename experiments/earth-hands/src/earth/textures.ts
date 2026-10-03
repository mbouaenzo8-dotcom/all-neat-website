/* =========================================================================
   textures — chargement des cartes de la Terre (fichiers locaux).

   Images : cartes NASA (Blue Marble + « Black Marble » pour les lumières des
   villes), récupérées depuis le dépôt public three.js (mrdoob/three.js,
   examples/textures/planets) et recopiées dans public/textures/.
   Rien n'est téléchargé depuis Internet au chargement de la page.
   ========================================================================= */

import {
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'

export interface EarthTextureSet {
  day: Texture
  night: Texture
  specular: Texture
  normal: Texture
  clouds: Texture
  moon: Texture
  stars: Texture
}

export type TextureName = keyof EarthTextureSet

/** Fichiers servis depuis /textures/ (voir public/textures/). */
const FILES: Record<TextureName, string> = {
  day: 'earth_day_4096.jpg',
  night: 'earth_night_4096.jpg',
  specular: 'earth_specular_2048.jpg',
  normal: 'earth_normal_2048.jpg',
  clouds: 'earth_clouds_1024.png',
  moon: 'moon_1024.jpg',
  stars: 'night-sky.png',
}

/** Résolution d'affichage décidée par l'utilisateur (voir réglages). */
export type TextureQuality = 'haute' | 'moyenne' | 'basse'

export interface LoadOptions {
  quality?: TextureQuality
  onProgress?: (loaded: number, total: number) => void
}

/** Résolution maximale de la carte du jour selon la qualité choisie. */
function daySizeFor(quality: TextureQuality): number {
  if (quality === 'basse') return 1024
  if (quality === 'moyenne') return 2048
  return 4096
}

function resolveUrl(file: string): string {
  const base = typeof document === 'undefined' ? '/' : document.baseURI
  return new URL(`textures/${file}`, base).href
}

/**
 * Charge les sept cartes. `onProgress` permet d'afficher une barre de
 * progression réelle pendant le chargement (plusieurs mégaoctets).
 */
export async function loadEarthTextures(options: LoadOptions = {}): Promise<EarthTextureSet> {
  const { quality = 'moyenne', onProgress } = options
  const loader = new TextureLoader()
  const names = Object.keys(FILES) as TextureName[]
  let loaded = 0

  const loadOne = (name: TextureName): Promise<Texture> =>
    new Promise((resolve, reject) => {
      loader.load(
        resolveUrl(FILES[name]),
        (texture) => {
          loaded++
          onProgress?.(loaded, names.length)
          resolve(texture)
        },
        undefined,
        (error) => reject(new Error(`Carte « ${name} » introuvable (${FILES[name]}) : ${String(error)}`)),
      )
    })

  const [day, night, specular, normal, clouds, moon, stars] = await Promise.all(names.map(loadOne))

  const configure = (texture: Texture, srgb: boolean, wrap = true): Texture => {
    texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace
    if (wrap) {
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
    }
    texture.anisotropy = 4 // affiné plus tard par la scène, selon la carte graphique
    texture.minFilter = LinearMipmapLinearFilter
    // La carte « jour » est lourde : on peut la réduire pour les petites cartes graphiques.
    if (texture === day) texture.image = downscaleIfNeeded(texture, daySizeFor(quality))
    texture.needsUpdate = true
    return texture
  }

  return {
    day: configure(day, true),
    night: configure(night, true),
    specular: configure(specular, false),
    normal: configure(normal, false),
    clouds: configure(clouds, true),
    moon: configure(moon, true),
    stars: configure(stars, true, false),
  }
}

/**
 * Réduction éventuelle de la carte du jour. Le navigateur décodera de toute
 * façon l'image d'origine : on ne gagne de la mémoire vidéo qu'à partir d'ici.
 * (Volontairement simple : une passe de moitié de résolution au maximum.)
 */
function downscaleIfNeeded(texture: Texture, maxSize: number): HTMLImageElement | Texture['image'] {
  const image = texture.image as HTMLImageElement | undefined
  if (!image || typeof document === 'undefined') return texture.image as Texture['image']
  const width = image.naturalWidth || image.width
  if (!width || width <= maxSize) return image

  const factor = Math.max(1, Math.round(width / maxSize))
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width / factor)
  canvas.height = Math.ceil((image.naturalHeight || image.height) / factor)
  const context = canvas.getContext('2d')
  if (!context) return image
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}
