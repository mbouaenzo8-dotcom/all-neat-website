/* =========================================================================
   cameraView — le widget caméra : la vidéo, le squelette des mains, l'état.

   La vidéo est affichée en miroir (comme on se voit dans un miroir) ; le
   squelette est dessiné par-dessus sur un canvas léger, éclairci par le
   mélange « screen » défini dans la feuille de style.
   ========================================================================= */

import { HAND_CONNECTIONS, LM, palmCenter } from '../vision/landmarks.ts'
import type { HandFrame } from '../vision/handTracker.ts'

export interface CameraViewOptions {
  /** Couleur de la main qui agit (pincement serré). */
  activeColor?: string
  /** Couleur de la deuxième main. */
  secondaryColor?: string
  /** Couleur d'une main au repos. */
  idleColor?: string
}

export class CameraView {
  readonly element: HTMLElement
  readonly video: HTMLVideoElement

  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D | null
  private readonly statusLabel: HTMLElement
  private readonly options: Required<CameraViewOptions>
  private stream: MediaStream | null = null
  private offsetActive = false
  private hidden = false
  private lastFrame = 0

  constructor(parent: HTMLElement, options: CameraViewOptions = {}) {
    this.options = {
      activeColor: options.activeColor ?? 'rgb(79, 209, 197)',
      secondaryColor: options.secondaryColor ?? 'rgb(255, 178, 107)',
      idleColor: options.idleColor ?? 'rgb(226, 240, 255)',
    }

    this.element = document.createElement('div')
    this.element.className = 'camera-widget'
    // Le widget reste discret tant que la caméra n'est pas active.
    this.element.dataset.visible = 'false'

    const view = document.createElement('div')
    view.className = 'camera-view'

    this.video = document.createElement('video')
    this.video.playsInline = true
    this.video.muted = true
    this.video.autoplay = true
    this.video.setAttribute('aria-hidden', 'true')

    this.canvas = document.createElement('canvas')
    this.canvas.width = 320
    this.canvas.height = 240
    this.canvas.setAttribute('aria-hidden', 'true')
    this.context = this.canvas.getContext('2d')

    const off = document.createElement('div')
    off.className = 'camera-off'
    off.textContent = 'Caméra éteinte'

    view.append(this.video, this.canvas, off)
    this.offMessage = off

    const meta = document.createElement('div')
    meta.className = 'camera-meta'
    const left = document.createElement('span')
    left.textContent = 'Caméra'
    this.statusLabel = document.createElement('b')
    this.statusLabel.textContent = 'en attente'
    meta.append(left, this.statusLabel)

    this.element.append(view, meta)
    parent.append(this.element)
  }

  private readonly offMessage: HTMLElement

  /** Branche un flux vidéo (déjà autorisé) sur le widget. */
  async attach(stream: MediaStream): Promise<void> {
    this.stream = stream
    this.element.dataset.visible = 'true'
    this.video.srcObject = stream
    this.offMessage.hidden = true
    this.video.hidden = false
    await this.video.play().catch(() => undefined)
    this.canvas.hidden = false
  }

  stop(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop()
    this.stream = null
    this.video.srcObject = null
    this.video.hidden = true
    this.canvas.hidden = true
    this.offMessage.hidden = false
    this.clear()
  }

  /** État affiché sous la vidéo (ex. « suivi », « 1 main », « 24 i/s »). */
  setStatus(text: string): void {
    if (this.lastStatus === text) return
    this.lastStatus = text
    this.statusLabel.textContent = text
  }

  private lastStatus = ''

  setVisible(visible: boolean): void {
    this.hidden = !visible
    this.element.dataset.visible = String(visible)
  }

  get visible(): boolean {
    return !this.hidden
  }

  /**
   * Allège le widget quand l'utilisateur manipule le globe : la main devant
   * la caméra ne doit pas masquer la Terre.
   */
  setDimmed(dimmed: boolean): void {
    if (this.offsetActive === dimmed) return
    this.offsetActive = dimmed
    this.element.dataset.offset = String(dimmed)
  }

  clear(): void {
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /** Dessine le squelette des mains détectées. */
  draw(hands: HandFrame[], roleOf: (id: HandFrame['id']) => string | null, now: number): void {
    const context = this.context
    if (!context) return
    if (now - this.lastFrame < 12) return
    this.lastFrame = now

    const { width, height } = this.canvas
    context.clearRect(0, 0, width, height)
    this.element.dataset.mains = String(Math.min(hands.length, 2))

    for (const hand of hands) {
      const role = roleOf(hand.id)
      const engaged = role === 'grab' || role === 'zoom'
      const color = role === 'zoom' ? this.options.secondaryColor : engaged ? this.options.activeColor : this.options.idleColor
      const points = hand.landmarks.map((landmark) => ({
        x: landmark.x * width,
        y: landmark.y * height,
      }))

      context.save()
      context.globalAlpha = hand.stale ? 0.35 : 0.85
      context.strokeStyle = color
      context.lineWidth = engaged ? 2.4 : 1.6
      context.shadowColor = color
      context.shadowBlur = engaged ? 12 : 6
      context.lineCap = 'round'

      context.beginPath()
      for (const [from, to] of HAND_CONNECTIONS) {
        context.moveTo(points[from].x, points[from].y)
        context.lineTo(points[to].x, points[to].y)
      }
      context.stroke()

      // Pincement : la ligne pouce–index s'épaissit quand les doigts se touchent.
      context.globalAlpha = 0.25 + hand.pinch * 0.75
      context.lineWidth = 1 + hand.pinch * 5
      context.beginPath()
      context.moveTo(points[LM.thumb].x, points[LM.thumb].y)
      context.lineTo(points[LM.index].x, points[LM.index].y)
      context.stroke()

      // Points des articulations.
      context.globalAlpha = hand.stale ? 0.3 : 0.95
      context.shadowBlur = 0
      context.fillStyle = color
      for (const point of points) {
        context.beginPath()
        context.arc(point.x, point.y, engaged ? 2.4 : 1.8, 0, Math.PI * 2)
        context.fill()
      }

      // Centre de la paume : c'est lui qui pilote la rotation et le zoom.
      const center = palmCenter(hand.landmarks)
      context.globalAlpha = 0.9
      context.strokeStyle = color
      context.lineWidth = 1.6
      context.beginPath()
      context.arc(center.x * width, center.y * height, 6, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.arc(center.x * width, center.y * height, 1.6, 0, Math.PI * 2)
      context.fill()

      context.restore()
    }
  }
}
