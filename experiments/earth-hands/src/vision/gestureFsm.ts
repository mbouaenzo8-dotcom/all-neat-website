/* =========================================================================
   gestureFsm — décide, image par image, quel geste est en cours.

   Code pur (aucune horloge implicite : `now` est passé en paramètre), donc
   testable dans Node (voir gestureFsm.test.ts).

   Quatre gestes, par ordre de priorité :
     1. zoom    — les deux mains serrées (pincement ou poing) ;
     2. grab    — une main serrée : la Terre suit la main (poignée virtuelle) ;
     3. point   — index tendu, autres doigts repliés : un viseur se pose sur le
                  globe et un clic (transition de pincement) y fait voler la caméra ;
     4. move    — main ouverte : rotation continue, comme un joystick ;
     sinon      — idle : on ne touche à rien.
   ========================================================================= */

import type { HandFrame, HandId } from './handTracker.ts'

export type GestureMode = 'idle' | 'grab' | 'zoom' | 'point' | 'move'

export interface GestureThresholds {
  /** Pincement qui accroche (0–1). */
  pinchEnter: number
  /** Pincement qui relâche (hystérésis, < pinchEnter). */
  pinchRelease: number
  /** Extension maximale d'un doigt en dessous de laquelle la main est un poing. */
  fistEnter: number
  /** Extension au-dessus de laquelle le poing est relâché. */
  fistRelease: number
  /** Ouverture moyenne minimale d'une main pour la rotation libre. */
  openEnter: number
  /** Délai de grâce avant d'abandonner un geste tenu (ms). */
  holdMs: number
}

export const DEFAULT_THRESHOLDS: GestureThresholds = {
  pinchEnter: 0.6,
  pinchRelease: 0.34,
  fistEnter: 0.32,
  fistRelease: 0.5,
  openEnter: 0.62,
  holdMs: 260,
}

export interface GestureState {
  mode: GestureMode
  /** Vrai pendant l'unique image où le pincement-clic vient d'être détecté. */
  click: boolean
  /** Main qui manipule (grab, point, move). */
  hand: HandFrame | null
  /** Les deux mains retenues pour le zoom, ordre écran gauche → droite. */
  zoom: { a: HandFrame; b: HandFrame } | null
  /** Instant depuis lequel ce mode est actif (ms). */
  since: number
}

type HoldKind = 'pinch' | 'fist' | 'click'

interface Hold {
  kind: HoldKind | null
  engaged: boolean
}

export class GestureFsm {
  readonly thresholds: GestureThresholds
  private mode: GestureMode = 'idle'
  private since = 0
  private hand: HandFrame | null = null
  private zoom: { a: HandFrame; b: HandFrame } | null = null
  private readonly holds = new Map<HandId, Hold>()
  private zoomLostSince: number | null = null
  /** Main qui tient le viseur : c'est elle dont le pincement fait « clic ». */
  private pointingHand: HandId | null = null
  private clickConsumed = false

  constructor(thresholds: Partial<GestureThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  }

  get current(): GestureState {
    return { mode: this.mode, click: false, hand: this.hand, zoom: this.zoom, since: this.since }
  }

  reset(): void {
    this.mode = 'idle'
    this.since = 0
    this.hand = null
    this.zoom = null
    this.holds.clear()
    this.zoomLostSince = null
    this.pointingHand = null
  }

  /** Rôle joué par une main, pour colorer le squelette dans le widget caméra. */
  roleOf(id: HandId): GestureMode | null {
    if (this.mode === 'zoom') return this.holds.get(id)?.engaged ? 'zoom' : null
    if (this.hand && this.hand.id === id && this.mode !== 'idle') return this.mode
    return null
  }

  update(now: number, hands: HandFrame[]): GestureState {
    const t = this.thresholds
    this.updateHolds(hands)

    // Seules les mains vues à l'instant peuvent démarrer un geste.
    // Les accroches « clic » ne comptent pas comme des prises : le viseur reste
    // actif pendant que le pouce vient toucher l'index.
    const engaged = hands.filter((h) => {
      const hold = this.holds.get(h.id)
      return !h.stale && hold?.engaged && hold.kind !== 'click'
    })
    const previousMode = this.mode

    let next: GestureMode = 'idle'
    let primary: HandFrame | null = null
    let zoomPair: { a: HandFrame; b: HandFrame } | null = null

    if (engaged.length >= 2) {
      // 1. Zoom à deux mains.
      const [a, b] = engaged
      zoomPair = { a, b }
      primary = a
      next = 'zoom'
      this.zoomLostSince = null
    } else if (this.mode === 'zoom' && this.zoom) {
      // Une main perdue de vue : on garde le zoom pendant la grâce (le
      // contrôleur met l'échelle en pause tant qu'une main est « figée »).
      if (this.zoomLostSince === null) this.zoomLostSince = now
      if (now - this.zoomLostSince < t.holdMs) {
        zoomPair = { a: engaged[0] ?? this.zoom.a, b: this.zoom.b }
        primary = engaged[0] ?? null
        next = 'zoom'
      } else {
        this.zoomLostSince = null
      }
    }

    if (next === 'idle') {
      if (engaged.length === 1) {
        // 2. Poignée virtuelle.
        primary = engaged[0]
        next = 'grab'
      } else {
        // 3. Viseur : index tendu, autres doigts repliés.
        const pointing = hands.find((h) => !h.stale && h.pointing)
        if (pointing) {
          primary = pointing
          next = 'point'
        } else {
          // 4. Rotation libre : main ouverte.
          const open = hands.find(
            (h) => !h.stale && h.spread >= t.openEnter && h.pinch < t.pinchEnter * 0.75,
          )
          if (open) {
            primary = open
            next = 'move'
          }
        }
      }
    }

    // Anti-scintillement : on ne lâche pas un geste tenu avant la grâce.
    if (next === 'idle' && (this.mode === 'zoom' || this.mode === 'grab')) {
      if (now - this.since < t.holdMs) {
        next = this.mode
        primary = this.hand
        zoomPair = this.zoom
      }
    }

    if (next !== previousMode) {
      this.mode = next
      this.since = now
    }

    // Impulsion de clic : pincement qui se referme pendant qu'on visait.
    let click = false
    if (this.mode === 'point') {
      const target = hands.find((h) => !h.stale && h.id === this.pointingHand)
      if (target) {
        const hold = this.holds.get(target.id)
        if (hold?.kind === 'click' && hold.engaged && !this.clickConsumed) {
          click = true
          this.clickConsumed = true
        } else if (hold?.kind !== 'click' || !hold.engaged) {
          this.clickConsumed = false
        }
      }
    } else {
      this.clickConsumed = false
    }

    // Une main « figée » (perdue de vue) ne démarre pas un geste, mais elle
    // peut poursuivre celui qui est en cours pendant la grâce.
    this.hand = primary && (!primary.stale || next === previousMode) ? primary : null
    this.zoom = next === 'zoom' ? zoomPair : null
    if (this.mode === 'point' && this.hand) this.pointingHand = this.hand.id

    return { mode: this.mode, click, hand: this.hand, zoom: this.zoom, since: this.since }
  }

  /**
   * Hystérésis par main : on accroche au-delà d'un seuil, on relâche sous un
   * seuil plus permissif. Sans ça, une main à la limite déclencherait un geste
   * une image sur deux.
   */
  private updateHolds(hands: HandFrame[]): void {
    const t = this.thresholds
    const present = new Set<HandId>()

    for (const hand of hands) {
      present.add(hand.id)
      const hold: Hold = this.holds.get(hand.id) ?? { kind: null, engaged: false }

      const isViseur = this.mode === 'point' && this.pointingHand === hand.id

      if (!hold.engaged) {
        if (hand.pinch >= t.pinchEnter) {
          hold.engaged = true
          hold.kind = isViseur ? 'click' : 'pinch'
        } else if (hand.maxExtension <= t.fistEnter) {
          hold.engaged = true
          hold.kind = 'fist'
        }
      } else if (hold.kind === 'pinch' || hold.kind === 'click') {
        if (hand.pinch <= t.pinchRelease) hold.engaged = false
      } else if (hand.maxExtension >= t.fistRelease) {
        hold.engaged = false
      }

      if (!hold.engaged) hold.kind = null
      this.holds.set(hand.id, hold)
    }

    for (const id of [...this.holds.keys()]) {
      if (!present.has(id)) this.holds.delete(id)
    }
  }
}
