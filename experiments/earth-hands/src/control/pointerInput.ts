/* =========================================================================
   pointerInput — souris, doigt et molette.

   Sert de repli complet quand la caméra n'est pas disponible (et de
   complément toujours utile) : cliquer-glisser fait tourner le globe, la
   molette zoome, un simple clic vise un point.
   ========================================================================= */

export interface PointerCallbacks {
  /** Déplacement en pixels CSS (déjà divisé par la sensibilité). */
  onRotate: (dx: number, dy: number) => void
  /** Facteur multiplicatif de zoom (molette, pincement à deux doigts). */
  onZoom: (factor: number) => void
  /** Clic net (sans glissement) : coordonnées normalisées −1..1. */
  onTap: (ndcX: number, ndcY: number) => void
}

interface PointerState {
  id: number
  x: number
  y: number
}

export class PointerInput {
  private readonly element: HTMLElement
  private readonly callbacks: PointerCallbacks
  private readonly pointers = new Map<number, PointerState>()
  private moved = 0
  private pinchDistance = 0

  constructor(element: HTMLElement, callbacks: PointerCallbacks) {
    this.element = element
    this.callbacks = callbacks

    element.addEventListener('pointerdown', (event) => this.onDown(event))
    element.addEventListener('pointermove', (event) => this.onMove(event))
    element.addEventListener('pointerup', (event) => this.onUp(event))
    element.addEventListener('pointercancel', (event) => this.onUp(event))
    element.addEventListener('wheel', (event) => this.onWheel(event), { passive: false })
    element.addEventListener('contextmenu', (event) => event.preventDefault())
  }

  private onDown(event: PointerEvent): void {
    this.element.setPointerCapture?.(event.pointerId)
    this.pointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY })
    this.moved = 0
    if (this.pointers.size === 2) this.pinchDistance = this.currentPinchDistance()
    this.element.classList.add('is-dragging')
  }

  private onMove(event: PointerEvent): void {
    const previous = this.pointers.get(event.pointerId)
    if (!previous) return

    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    previous.x = event.clientX
    previous.y = event.clientY
    this.moved += Math.hypot(dx, dy)

    if (this.pointers.size >= 2) {
      const distance = this.currentPinchDistance()
      if (this.pinchDistance > 0 && distance > 0) {
        const factor = this.pinchDistance / distance
        this.callbacks.onZoom(Math.min(1.12, Math.max(0.89, factor)))
      }
      this.pinchDistance = distance
      return
    }

    this.callbacks.onRotate(dx, dy)
  }

  private onUp(event: PointerEvent): void {
    const state = this.pointers.get(event.pointerId)
    this.pointers.delete(event.pointerId)
    if (this.pointers.size < 2) this.pinchDistance = 0
    if (this.pointers.size === 0) this.element.classList.remove('is-dragging')

    if (!state) return
    if (this.moved > 6 || this.pointers.size > 0) return

    const rect = this.element.getBoundingClientRect()
    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    this.callbacks.onTap(ndcX, ndcY)
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault()
    const factor = Math.exp(event.deltaY * 0.0011)
    this.callbacks.onZoom(Math.min(1.25, Math.max(0.8, factor)))
  }

  private currentPinchDistance(): number {
    const [a, b] = [...this.pointers.values()]
    if (!a || !b) return 0
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
}
