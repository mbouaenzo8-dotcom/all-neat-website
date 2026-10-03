/* =========================================================================
   orbitController — où l'on regarde la Terre, et comment on y arrive.

   Deux états cohabitent : la cible (ce que l'utilisateur demande) et l'état
   affiché (ce qu'on montre), reliés par un lissage exponentiel indépendant de
   la cadence d'images. Les vols « clic » sont des animations à part, avec une
   trajectoire bombée qui donne l'impression de décoller.

   Code pur hormis les horodatages : testable dans Node.
   ========================================================================= */

import { normalizeLon } from '../earth/sun.ts'
import { DEFAULT_POSE, VIEWS, type OrbitPose } from './celestial.ts'

export interface FlyOptions {
  /** Durée du vol, en millisecondes. */
  durationMs?: number
  /** Distance d'arrivée (rayons terrestres). */
  distance?: number
  /** Surélévation maximale pendant le survol (rayons terrestres). */
  boost?: number
  /** Fov d'arrivée (le cadrage change parfois en cours de route). */
  fov?: number
}

export interface OrbitControllerOptions {
  initial?: OrbitPose
  /** Durée caractéristique du lissage, en secondes. */
  followTime?: number
  minDistance?: number
  maxDistance?: number
}

/** Écart le plus court entre deux longitudes (en degrés, dans [-180, 180]). */
export function shortestDelta(from: number, to: number): number {
  return normalizeLon(to - from)
}

/** Accélère puis ralentit : utilisé pour les vols. */
export function easeInOut(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** Distance angulaire entre deux lieux (loi des cosinus sphérique), en degrés. */
export function angularDistance(a: OrbitPose, b: OrbitPose): number {
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLon = shortestDelta(a.lon, b.lon) * toRad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2
  return (2 * Math.asin(Math.min(1, Math.sqrt(h)))) / toRad
}

export class OrbitController {
  private readonly minDistance: number
  private readonly maxDistance: number
  private readonly followTime: number

  private shown: OrbitPose
  private wanted: OrbitPose
  private shownRoll = 0
  private wantedRoll = 0

  private flight: {
    from: OrbitPose
    to: OrbitPose
    fromRoll: number
    toRoll: number
    startedAt: number
    duration: number
    boost: number
  } | null = null

  private arrivalListeners = new Set<(pose: OrbitPose) => void>()
  private lastArrival: OrbitPose | null = null
  /** Dernier instant connu (mis à jour par update), pour dater les vols. */
  private now = 0

  constructor(options: OrbitControllerOptions = {}) {
    const initial = options.initial ?? DEFAULT_POSE
    this.shown = { ...initial }
    this.wanted = { ...initial }
    this.minDistance = options.minDistance ?? 1.045
    this.maxDistance = options.maxDistance ?? 9
    this.followTime = options.followTime ?? 0.16
  }

  /* ------------------------------------------------------------- lecture */

  get pose(): OrbitPose {
    return this.shown
  }

  get roll(): number {
    return this.shownRoll
  }

  get target(): OrbitPose {
    return this.wanted
  }

  get flying(): boolean {
    return this.flight !== null
  }

  get flightProgress(): number {
    return this.lastProgress
  }

  private lastProgress = 1

  onArrive(listener: (pose: OrbitPose) => void): () => void {
    this.arrivalListeners.add(listener)
    return () => {
      this.arrivalListeners.delete(listener)
    }
  }

  /* ----------------------------------------------------------- commandes */

  /** Rotation demandée (en degrés) : ajoutée à la cible. */
  rotateBy(dLat: number, dLon: number): void {
    this.cancelFlight()
    this.wanted.lat = clampLat(this.wanted.lat + dLat)
    this.wanted.lon = normalizeLon(this.wanted.lon + dLon)
  }

  /** Facteur multiplicatif de distance (0,5 = deux fois plus près). */
  zoomBy(factor: number): void {
    this.cancelFlight()
    this.wanted.distance = clamp(this.wanted.distance * factor, this.minDistance, this.maxDistance)
  }

  setDistance(distance: number): void {
    this.cancelFlight()
    this.wanted.distance = clamp(distance, this.minDistance, this.maxDistance)
  }

  rollBy(deltaDeg: number): void {
    this.cancelFlight()
    this.wantedRoll = normalizeAngle(this.wantedRoll + deltaDeg)
  }

  setRoll(rollDeg: number): void {
    this.cancelFlight()
    this.wantedRoll = normalizeAngle(rollDeg)
  }

  /** Recadre immédiatement (sans animation) : début, recentrage, etc. */
  jumpTo(pose: Partial<OrbitPose>, rollDeg = 0): void {
    this.flight = null
    if (pose.lat !== undefined) this.wanted.lat = clampLat(pose.lat)
    if (pose.lon !== undefined) this.wanted.lon = normalizeLon(pose.lon)
    if (pose.distance !== undefined) this.wanted.distance = clamp(pose.distance, this.minDistance, this.maxDistance)
    this.wantedRoll = normalizeAngle(rollDeg)
    this.shown = { ...this.wanted }
    this.shownRoll = this.wantedRoll
  }

  /** Vol animé vers un lieu (grand cercle, avec une petite surélévation). */
  flyTo(lat: number, lon: number, options: FlyOptions = {}): void {
    const from = { ...this.shown }
    const to: OrbitPose = {
      lat: clampLat(lat),
      lon: normalizeLon(lon),
      distance: clamp(options.distance ?? this.wanted.distance, this.minDistance, this.maxDistance),
    }
    const span = angularDistance(from, to)
    const duration = options.durationMs ?? clamp(900 + span * 9, 900, 2600)
    const boost = options.boost ?? clamp(span * 0.006, 0, 0.85)

    this.wanted = { ...to }
    this.flight = {
      from,
      to,
      fromRoll: this.shownRoll,
      toRoll: this.wantedRoll,
      startedAt: this.now,
      duration,
      boost,
    }
  }

  cancelFlight(): void {
    if (!this.flight) return
    this.flight = null
    this.wanted = { ...this.shown }
  }

  /** Recentre sur le globe entier. */
  reset(): void {
    this.jumpTo({ ...DEFAULT_POSE }, 0)
  }

  /* -------------------------------------------------------------- boucle */

  /** Avance d'une image. Renvoie true si l'état affiché a changé. */
  update(dt: number, now = this.now): boolean {
    this.now = now
    if (this.flight) {
      const flight = this.flight
      const raw = (now - flight.startedAt) / flight.duration
      const t = easeInOut(clamp(raw, 0, 1))
      this.lastProgress = clamp(raw, 0, 1)

      const lat = flight.from.lat + (flight.to.lat - flight.from.lat) * t
      const lon = normalizeLon(flight.from.lon + shortestDelta(flight.from.lon, flight.to.lon) * t)
      const base = flight.from.distance + (flight.to.distance - flight.from.distance) * t
      const distance = base + flight.boost * Math.sin(Math.PI * t)
      this.shown = { lat, lon, distance }
      this.shownRoll = flight.fromRoll + shortestDelta(flight.fromRoll, flight.toRoll) * t
      this.wanted = { ...this.shown }

      if (raw >= 1) {
        this.flight = null
        this.lastProgress = 1
        this.shown = { ...flight.to }
        this.shownRoll = flight.toRoll
        this.lastArrival = { ...this.shown }
        for (const listener of this.arrivalListeners) listener(this.shown)
      }
      return true
    }

    const k = 1 - Math.exp(-dt / this.followTime)
    const dLat = this.wanted.lat - this.shown.lat
    const dLon = shortestDelta(this.shown.lon, this.wanted.lon)
    const dDistance = this.wanted.distance - this.shown.distance
    const dRoll = shortestDelta(this.shownRoll, this.wantedRoll)

    const settled =
      Math.abs(dLat) < 1e-4 && Math.abs(dLon) < 1e-4 && Math.abs(dDistance) < 1e-4 && Math.abs(dRoll) < 1e-3
    if (settled) return false

    this.shown = {
      lat: this.shown.lat + dLat * k,
      lon: normalizeLon(this.shown.lon + dLon * k),
      distance: this.shown.distance + dDistance * k,
    }
    this.shownRoll = normalizeAngle(this.shownRoll + dRoll * k)
    return true
  }

  /** Dernier vol terminé (pour l'affichage des informations d'arrivée). */
  consumeArrival(): OrbitPose | null {
    const arrival = this.lastArrival
    this.lastArrival = null
    return arrival
  }

  /** Cadrages proposés (globe entier, région, vue rasante). */
  zoomToView(view: keyof typeof VIEWS): void {
    this.setDistance(VIEWS[view].distance)
  }
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

function clampLat(lat: number): number {
  return clamp(lat, -89.5, 89.5)
}

function normalizeAngle(deg: number): number {
  const wrapped = deg % 360
  return wrapped > 180 ? wrapped - 360 : wrapped < -180 ? wrapped + 360 : wrapped
}
