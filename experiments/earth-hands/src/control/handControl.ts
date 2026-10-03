/* =========================================================================
   handControl — traduction des gestes en commandes de caméra.

   C'est ici que se joue tout le « ressenti » : on travaille par différences
   (la position de référence est prise au moment où la prise commence), donc
   aucun saut quand une main entre dans le champ ou quand le geste change.

   Code pur (testable dans Node) : aucune dépendance à three.js ni au DOM.
   ========================================================================= */

import type { GestureMode, GestureState } from '../vision/gestureFsm.ts'
import type { HandFrame, HandId } from '../vision/handTracker.ts'
import { LM } from '../vision/landmarks.ts'

export interface HandControlContext {
  /** Latitude affichée (corrige l'échelle en longitude près des pôles). */
  lat: number
  /** Distance caméra–centre de la Terre, en rayons terrestres. */
  distance: number
}

export interface HandControlOutput {
  mode: GestureMode
  /** Rotation à appliquer sur cette image (degrés). */
  rotate: { dLat: number; dLon: number } | null
  /** Facteur multiplicatif de distance (zoom à deux mains). */
  zoom: number | null
  /** Roulis à ajouter (degrés). */
  roll: number | null
  /** Position visée, en coordonnées écran normalisées (−1..1). */
  aim: { x: number; y: number } | null
  /** Pincement-clic détecté sur cette image. */
  click: boolean
}

export interface HandControlOptions {
  /** Sensibilité de rotation (1 = réglage par défaut). */
  rotationGain?: number
  /** Vitesse du « joystick » main ouverte, en degrés par seconde. */
  moveSpeed?: number
  /** Zone morte du joystick (fraction de la largeur de l'image). */
  deadZone?: number
  /** Gain du zoom à deux mains. */
  zoomGain?: number
}

/* --------------------------------------------------------------- constantes */

/** Au-delà de cette valeur, on considère que la main saute et on ignore l'écart. */
const MAX_GRAB_STEP = 0.28
/** Limite de sécurité du zoom par image (évite un saut si une main est mal suivie). */
const ZOOM_CLAMP = 0.12

export class HandControl {
  private rotationGainValue: number
  private readonly moveSpeed: number
  private readonly deadZone: number
  private readonly zoomGain: number

  private grabHand: HandId | null = null
  private grabRef: { x: number; y: number } | null = null

  private zoomRatio: number | null = null
  private zoomAngle: number | null = null
  private zoomMid: { x: number; y: number } | null = null

  constructor(options: HandControlOptions = {}) {
    this.rotationGainValue = options.rotationGain ?? 1
    this.moveSpeed = options.moveSpeed ?? 165
    this.deadZone = options.deadZone ?? 0.16
    this.zoomGain = options.zoomGain ?? 1
  }

  get rotationGain(): number {
    return this.rotationGainValue
  }

  set rotationGain(gain: number) {
    this.rotationGainValue = Math.max(0.2, Math.min(3, gain))
  }

  /** Réinitialise les références (quand on coupe le pilotage aux mains). */
  reset(): void {
    this.grabHand = null
    this.grabRef = null
    this.zoomRatio = null
    this.zoomAngle = null
    this.zoomMid = null
  }

  update(
    state: GestureState,
    _hands: HandFrame[],
    dt: number,
    context: HandControlContext,
  ): HandControlOutput {
    const output: HandControlOutput = {
      mode: state.mode,
      rotate: null,
      zoom: null,
      roll: null,
      aim: null,
      click: state.click,
    }
    const gain = this.rotationGainValue

    /* ------------------------------------------------- zoom à deux mains */
    if (state.mode === 'zoom' && state.zoom) {
      const { a, b } = state.zoom
      const span = Math.hypot(b.center.x - a.center.x, b.center.y - a.center.y)
      const angle = (Math.atan2(b.center.y - a.center.y, b.center.x - a.center.x) * 180) / Math.PI
      // On normalise par la taille des mains : le geste marche près comme loin.
      const handScale = Math.max((a.span + b.span) / 2, 1e-3)
      const ratio = span / handScale

      if (this.zoomRatio !== null && this.zoomAngle !== null && !a.stale && !b.stale && span > 0.04) {
        const factor = clamp(this.zoomRatio / ratio, 1 - ZOOM_CLAMP, 1 + ZOOM_CLAMP)
        output.zoom = Math.pow(factor, this.zoomGain)

        let deltaAngle = angle - this.zoomAngle
        while (deltaAngle > 180) deltaAngle -= 360
        while (deltaAngle < -180) deltaAngle += 360
        if (Math.abs(deltaAngle) > 0.4) output.roll = -deltaAngle
      }

      // Déplacer les deux mains ensemble fait aussi tourner le globe.
      const mid = { x: (a.center.x + b.center.x) / 2, y: (a.center.y + b.center.y) / 2 }
      if (this.zoomMid) {
        let dx = mid.x - this.zoomMid.x
        let dy = mid.y - this.zoomMid.y
        if (Math.hypot(dx, dy) > MAX_GRAB_STEP) {
          dx = 0
          dy = 0
        }
        if (dx !== 0 || dy !== 0) {
          const span = visibleSpanDegrees(context.distance)
          output.rotate = {
            dLat: dy * span * gain,
            dLon: (-dx * span * gain * 0.9) / Math.max(Math.cos((context.lat * Math.PI) / 180), 0.25),
          }
        }
      }
      this.zoomMid = mid
      this.zoomRatio = ratio
      this.zoomAngle = angle
      this.grabHand = null
      this.grabRef = null
      return output
    }

    this.zoomRatio = null
    this.zoomAngle = null
    this.zoomMid = null

    /* ------------------------------------------------------ poignée main */
    if (state.mode === 'grab' && state.hand) {
      const hand = state.hand
      if (this.grabHand !== hand.id || !this.grabRef) {
        // Nouvelle prise : on note la référence sans bouger la vue.
        this.grabHand = hand.id
        this.grabRef = { ...hand.center }
        return output
      }

      let dx = hand.center.x - this.grabRef.x
      let dy = hand.center.y - this.grabRef.y
      this.grabRef = { ...hand.center }

      // Un saut vient d'une main mal suivie : on le laisse passer sans tourner.
      if (Math.hypot(dx, dy) > MAX_GRAB_STEP) {
        dx = 0
        dy = 0
      }

      if (dx !== 0 || dy !== 0) {
        const span = visibleSpanDegrees(context.distance)
        output.rotate = {
          dLat: dy * span * gain,
          dLon: (-dx * span * gain * 0.9) / Math.max(Math.cos((context.lat * Math.PI) / 180), 0.25),
        }
      }
      return output
    }

    this.grabHand = null
    this.grabRef = null

    /* ------------------------------------------------------------- viseur */
    if (state.mode === 'point' && state.hand) {
      const tip = state.hand.landmarks[LM.index]
      output.aim = {
        x: clamp(tip.x * 2 - 1, -1, 1),
        y: clamp(-(tip.y * 2 - 1), -1, 1),
      }
      return output
    }

    /* ----------------------------------------------- rotation main ouverte */
    if (state.mode === 'move' && state.hand) {
      const dx = state.hand.center.x - 0.5
      const dy = state.hand.center.y - 0.46
      const magnitude = Math.hypot(dx, dy)
      if (magnitude > this.deadZone) {
        const ramp = Math.min(1, (magnitude - this.deadZone) / 0.18)
        const speed = this.moveSpeed * gain * ramp * dt
        output.rotate = {
          dLat: dy * speed,
          dLon: (-dx * speed) / Math.max(Math.cos((context.lat * Math.PI) / 180), 0.25),
        }
      }
      return output
    }

    return output
  }
}

/** Amplitude angulaire visible à l'écran pour une distance donnée, en degrés. */
export function visibleSpanDegrees(distance: number): number {
  const clamped = Math.max(1.001, distance)
  return (2 * Math.acos(1 / clamped) * 180) / Math.PI
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}
