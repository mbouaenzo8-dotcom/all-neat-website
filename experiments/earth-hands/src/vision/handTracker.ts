/* =========================================================================
   handTracker — suivi des mains dans la webcam (MediaPipe Hands, 100 % local).

   Le modèle, le wasm et le graphe sont servis depuis /hands/ (copie du paquet
   npm @mediapipe/hands) : rien n'est téléchargé depuis Internet.
   ========================================================================= */

import { Hands } from '@mediapipe/hands'
import { singleFlight } from './singleFlight.ts'
import {
  handOpenness,
  handSpan,
  maxFingerExtension,
  isPointingPose,
  mirrorLandmarks,
  palmBasis,
  palmCenter,
  palmCenter3,
  pinchAmount,
  pointDirection,
  type Landmark,
  type PalmBasis,
  type Vec3,
} from './landmarks.ts'
import { FastLowPass, PointSmoother } from './oneEuro.ts'

export type TrackerStatus = 'idle' | 'loading' | 'ready' | 'error'
export type HandId = 'gauche' | 'droite'

export interface HandFrame {
  id: HandId
  /** Côté de l'image où se trouve la main (calculé, pas deviné). */
  side: 'gauche' | 'droite'
  score: number
  /** 21 points, miroir corrigé + lissés (x, y normalisés, z relatif). */
  landmarks: Landmark[]
  /** 21 points métriques (origine au centre de la main), bruts. */
  world: Landmark[]
  /** Centre de la paume, coordonnées écran normalisées. */
  center: { x: number; y: number }
  center3: Vec3
  /** 1 = pouce et index collés, 0 = écartés. */
  pinch: number
  /** Ouverture moyenne des quatre doigts : 0 = poing, 1 = main ouverte. */
  spread: number
  /** Extension du doigt le plus tendu : ~0 pour un poing, ~1 dès qu'un doigt est tendu. */
  maxExtension: number
  /** Envergure apparente (fraction de la largeur de l'image). */
  span: number
  basis: PalmBasis
  pointing: boolean
  pointDir: Vec3
  /** true = main perdue de vue à l'instant, on garde sa dernière position. */
  stale: boolean
}

export interface HandTrackerOptions {
  maxNumHands?: number
  modelComplexity?: 0 | 1
  /** Durée pendant laquelle on garde une main perdue de vue (anti-clignotement). */
  holdMs?: number
}

const HOLD_DEFAULT = 320
/** Au-delà de cette distance (normalisée), ce n'est plus la même main. */
const REID_MAX_DISTANCE = 0.45

/** Chemin des fichiers MediaPipe : /hands/ (résolu depuis l'URL du document). */
function locateFile(file: string): string {
  const base = typeof document === 'undefined' ? '/' : document.baseURI
  return new URL(`hands/${file}`, base).href
}

export class HandTracker {
  private readonly hands: Hands
  private readonly options: Required<HandTrackerOptions>
  private status: TrackerStatus = 'idle'
  private readonly initializeOnce: () => Promise<void>
  private readonly statusListeners = new Set<(s: TrackerStatus) => void>()
  private errorMessage: string | null = null

  private readonly smoothers: Record<HandId, PointSmoother> = {
    gauche: new PointSmoother(21, { minCutoff: 1.5, beta: 0.04 }),
    droite: new PointSmoother(21, { minCutoff: 1.5, beta: 0.04 }),
  }
  private readonly metrics = new FastLowPass(2, { minCutoff: 3.2, beta: 0.02 })

  private readonly frames = new Map<HandId, HandFrame>()
  private readonly seenAt = new Map<HandId, number>()
  private lastTimestamp = 0
  private busy = false
  private skipped = 0
  private analyzed = 0
  private fpsValue = 0
  private readonly fpsWindow: number[] = []

  constructor(options: HandTrackerOptions = {}) {
    this.options = {
      maxNumHands: options.maxNumHands ?? 2,
      modelComplexity: options.modelComplexity ?? 1,
      holdMs: options.holdMs ?? HOLD_DEFAULT,
    }

    this.hands = new Hands({ locateFile })
    this.hands.setOptions({
      selfieMode: false, // le miroir est géré par mirrorLandmarks()
      maxNumHands: this.options.maxNumHands,
      modelComplexity: this.options.modelComplexity,
      // Seuils un peu plus souples pour les webcams peu éclairées et les mains foncées.
      minDetectionConfidence: 0.45,
      minTrackingConfidence: 0.45,
    })
    this.hands.onResults((results) => {
      this.handleResults(results as MediaPipeResults)
    })
    this.initializeOnce = singleFlight(async () => {
      try {
        await this.hands.initialize()
        this.setStatus('ready')
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : String(error)
        this.setStatus('error')
        throw error
      }
    })
  }

  get currentStatus(): TrackerStatus {
    return this.status
  }

  get error(): string | null {
    return this.errorMessage
  }

  /** Images réellement analysées par seconde. */
  get fps(): number {
    return this.fpsValue
  }

  /** Total d'images analysées depuis le démarrage. */
  get analyzedCount(): number {
    return this.analyzed
  }

  /** Images ignorées faute de temps (le modèle n'est pas plus rapide que l'écran). */
  get skippedCount(): number {
    return this.skipped
  }

  onStatus(listener: (status: TrackerStatus) => void): () => void {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  private setStatus(status: TrackerStatus): void {
    if (this.status === status) return
    this.status = status
    for (const listener of this.statusListeners) listener(status)
  }

  /** Charge le modèle une seule fois, même si plusieurs appels arrivent ensemble. */
  initialize(): Promise<void> {
    if (this.status === 'ready') return Promise.resolve()
    if (this.status === 'idle') this.setStatus('loading')
    // MediaPipe Hands partage des fabriques WASM globales : deux initialize()
    // simultanés peuvent se marcher dessus dans Module.arguments.
    return this.initializeOnce()
  }

  /**
   * Envoie une image au modèle. Appelé à chaque frame d'affichage ;
   * un seul envoi est en vol à la fois (sinon MediaPipe s'embrouille).
   */
  send(video: HTMLVideoElement): void {
    if (this.busy || this.status === 'error') {
      if (this.busy) this.skipped++
      return
    }
    if (video.readyState < 2 || video.videoWidth === 0) return

    // Ne jamais laisser send() démarrer une seconde init pendant initialize().
    // La première image est volontairement ignorée; les frames suivantes passent.
    if (this.status === 'idle') {
      void this.initialize().catch(() => undefined)
      return
    }
    if (this.status !== 'ready') return

    this.busy = true
    const now = performance.now()
    this.hands
      .send({ image: video })
      .then(() => {
        this.analyzed++
        if (this.status === 'loading') this.setStatus('ready')
        this.fpsWindow.push(now)
        while (this.fpsWindow.length > 0 && now - this.fpsWindow[0] > 1000) this.fpsWindow.shift()
        this.fpsValue = this.fpsWindow.length
      })
      .catch((error: unknown) => {
        if (this.status === 'ready') return // incident isolé : on ne casse pas la boucle
        this.errorMessage = error instanceof Error ? error.message : String(error)
        this.setStatus('error')
      })
      .finally(() => {
        this.busy = false
      })
  }

  /** Mains visibles pour la frame en cours (tableau vide si personne). */
  getHands(now = performance.now()): HandFrame[] {
    const alive: HandFrame[] = []
    for (const [id, frame] of this.frames) {
      const seen = this.seenAt.get(id) ?? 0
      const age = now - seen
      if (age <= this.options.holdMs) {
        alive.push(age > 45 ? { ...frame, stale: true } : frame)
      } else {
        this.frames.delete(id)
        this.seenAt.delete(id)
        this.smoothers[id].reset()
      }
    }
    alive.sort((a, b) => a.center.x - b.center.x)
    return alive
  }

  close(): void {
    void this.hands.close()
    this.frames.clear()
    this.seenAt.clear()
    this.setStatus('idle')
  }

  /* ------------------------------------------------------------------ privé */

  /**
   * MediaPipe échange parfois les étiquettes gauche/droite entre deux images
   * (et les mains peuvent se croiser). On réattribue donc les identités en
   * rapprochant chaque main détectée de sa position précédente : le lissage
   * ne « saute » plus d'une main à l'autre.
   */
  private assignIdentities(
    centers: { x: number; y: number }[],
    labels: HandId[],
  ): HandId[] {
    const previous = [...this.frames.values()].map((f) => ({ id: f.id, ...f.center }))
    const result: (HandId | null)[] = centers.map(() => null)
    const taken = new Set<HandId>()

    if (previous.length > 0) {
      const candidates: { index: number; id: HandId; cost: number }[] = []
      centers.forEach((center, index) => {
        for (const prev of previous) {
          const distance = Math.hypot(center.x - prev.x, center.y - prev.y)
          const labelPenalty = labels[index] === prev.id ? 0 : 0.05
          candidates.push({ index, id: prev.id, cost: distance + labelPenalty })
        }
      })
      candidates.sort((a, b) => a.cost - b.cost)
      for (const candidate of candidates) {
        if (result[candidate.index] !== null) continue
        if (taken.has(candidate.id)) continue
        if (candidate.cost > REID_MAX_DISTANCE) continue
        result[candidate.index] = candidate.id
        taken.add(candidate.id)
      }
    }

    centers.forEach((_, index) => {
      if (result[index] !== null) return
      const wanted = labels[index]
      const id = taken.has(wanted) ? (wanted === 'gauche' ? 'droite' : 'gauche') : wanted
      result[index] = id
      taken.add(id)
    })

    return result as HandId[]
  }

  private handleResults(results: MediaPipeResults): void {
    const now = performance.now()
    const dt = this.lastTimestamp ? (now - this.lastTimestamp) / 1000 : 1 / 60
    this.lastTimestamp = now

    const lists = results.multiHandLandmarks ?? []
    // Miroir de l'image (l'affichage l'est aussi) : x = 0 à gauche de l'écran.
    const mirrored = lists.map((landmarks) => mirrorLandmarks(landmarks))
    const labels: HandId[] = lists.map((_, index) =>
      results.multiHandedness?.[index]?.label === 'Left' ? 'gauche' : 'droite',
    )
    const identities = this.assignIdentities(mirrored.map((points) => palmCenter(points)), labels)
    const seen = new Set<HandId>()

    mirrored.forEach((points, index) => {
      if (points.length < 21) return
      const id = identities[index]
      seen.add(id)

      // Lissage adaptatif des 21 points (1€ par coordonnée).
      const smoothed = this.smoothers[id].filter(points, dt)

      const center = palmCenter(smoothed)
      const [pinch, spread] = this.metrics.filter(
        [pinchAmount(smoothed), handOpenness(smoothed)],
        dt,
      )

      this.frames.set(id, {
        id,
        side: center.x < 0.5 ? 'gauche' : 'droite',
        score: results.multiHandedness?.[index]?.score ?? 1,
        landmarks: smoothed,
        world: results.multiHandWorldLandmarks?.[index] ?? [],
        center,
        center3: palmCenter3(smoothed),
        pinch,
        spread,
        maxExtension: maxFingerExtension(smoothed),
        span: handSpan(smoothed),
        basis: palmBasis(smoothed),
        pointing: isPointingPose(smoothed),
        pointDir: pointDirection(smoothed),
        stale: false,
      })
      this.seenAt.set(id, now)
    })

    // Les mains absentes de cette inférence restent affichées (holdMs) puis partent.
    for (const [id, frame] of this.frames) {
      if (seen.has(id)) continue
      const age = now - (this.seenAt.get(id) ?? 0)
      if (age > this.options.holdMs) {
        this.frames.delete(id)
        this.seenAt.delete(id)
        this.smoothers[id].reset()
      } else if (!frame.stale) {
        this.frames.set(id, { ...frame, stale: true })
      }
    }
  }
}

/** Forme minimale des résultats MediaPipe réellement utilisée ici. */
interface MediaPipeResults {
  multiHandLandmarks?: Landmark[][]
  multiHandWorldLandmarks?: Landmark[][]
  multiHandedness?: { label: string; score: number }[]
}

/** Instance prête à l'emploi (une seule par page : MediaPipe n'aime pas les doublons). */
export function createHandTracker(options?: HandTrackerOptions): HandTracker {
  return new HandTracker(options)
}
