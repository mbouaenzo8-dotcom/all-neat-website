/* =========================================================================
   Filtres de lissage — code pur, sans DOM.

   Le « 1€ filter » (Casiez & Roussel) donne un lissage fort à l'arrêt et
   faible en mouvement : c'est exactement ce qu'il faut pour un suivi de main,
   qui est bruité quand la main est immobile et qu'il ne faut surtout pas
   retarder quand elle bouge vite.
   ========================================================================= */

import { clamp } from './landmarks.ts'

/** Lissage exponentiel simple (EMA). */
export class LowPass {
  private value: number | null = null
  private readonly alpha: number

  constructor(alpha = 0.5) {
    this.alpha = clamp(alpha, 0, 1)
  }

  /** `alpha` peut être forcé ponctuellement ; sinon on garde celui du constructeur. */
  filter(x: number, alpha = this.alpha): number {
    const weight = clamp(alpha, 0, 1)
    this.value = this.value === null ? x : weight * x + (1 - weight) * this.value
    return this.value
  }

  get current(): number | null {
    return this.value
  }

  reset(value: number | null = null): void {
    this.value = value
  }
}

export interface OneEuroOptions {
  /** fréquence de coupure à l'arrêt (Hz) — plus bas = plus lisse mais plus lent */
  minCutoff?: number
  /** sensibilité au mouvement */
  beta?: number
  /** fréquence de coupure du filtre de vitesse */
  derivateCutoff?: number
}

/**
 * Filtre 1€ scalaire. `filter(x, dt)` attend un pas de temps en secondes.
 */
export class OneEuro {
  private readonly minCutoff: number
  private readonly beta: number
  private readonly derivateCutoff: number

  private xPrev: number | null = null
  private dxPrev = 0
  private started = false

  constructor({ minCutoff = 1.2, beta = 0.03, derivateCutoff = 1 }: OneEuroOptions = {}) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.derivateCutoff = derivateCutoff
  }

  private static alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }

  filter(x: number, dt: number): number {
    if (!this.started || this.xPrev === null) {
      this.started = true
      this.xPrev = x
      this.dxPrev = 0
      return x
    }
    const safeDt = clamp(dt, 1 / 240, 0.5)
    const dx = (x - this.xPrev) / safeDt
    const aD = OneEuro.alpha(this.derivateCutoff, safeDt)
    const dxHat = aD * dx + (1 - aD) * this.dxPrev
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat)
    const a = OneEuro.alpha(cutoff, safeDt)
    const xHat = a * x + (1 - a) * this.xPrev
    this.xPrev = xHat
    this.dxPrev = dxHat
    return xHat
  }

  get current(): number | null {
    return this.xPrev
  }

  reset(): void {
    this.started = false
    this.xPrev = null
    this.dxPrev = 0
  }
}

/** Vecteur de filtres 1€ (un par composante), pour des points (x, y, z). */
export class OneEuroVector {
  private readonly filters: OneEuro[]

  constructor(size: number, options?: OneEuroOptions) {
    this.filters = Array.from({ length: size }, () => new OneEuro(options))
  }

  filter(values: readonly number[], dt: number): number[] {
    return values.map((v, i) => this.filters[i].filter(v, dt))
  }

  reset(): void {
    for (const f of this.filters) f.reset()
  }
}

/**
 * Filtre d'un tableau de points 3D (un vecteur 1€ par point).
 * `dt` doit être fourni par l'appelant (le suivi ne tourne pas à pas constant).
 */
export class PointSmoother {
  private readonly filters: OneEuroVector

  constructor(points: number, options?: OneEuroOptions) {
    this.filters = new OneEuroVector(points * 3, options)
  }

  filter(points: readonly { x: number; y: number; z: number }[], dt: number) {
    const flat: number[] = []
    for (const p of points) flat.push(p.x, p.y, p.z)
    const out = this.filters.filter(flat, dt)
    const result: { x: number; y: number; z: number }[] = []
    for (let i = 0; i < points.length; i++) {
      result.push({ x: out[i * 3], y: out[i * 3 + 1], z: out[i * 3 + 2] })
    }
    return result
  }

  reset(): void {
    this.filters.reset()
  }
}

/**
 * Passe-bas à réponse rapide pour les valeurs « continues » (pincement, ouverture).
 * On privilégie la réactivité : un geste doit répondre tout de suite.
 */
export class FastLowPass {
  private readonly filters: OneEuro[]

  constructor(size: number, options: OneEuroOptions = { minCutoff: 3.4, beta: 0.02 }) {
    this.filters = Array.from({ length: size }, () => new OneEuro(options))
  }

  filter(values: readonly number[], dt: number): number[] {
    return values.map((v, i) => this.filters[i].filter(v, dt))
  }

  reset(): void {
    for (const f of this.filters) f.reset()
  }
}
