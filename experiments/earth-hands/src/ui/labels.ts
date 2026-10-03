/* =========================================================================
   labels — étiquettes HTML posées sur les lieux du globe.

   Les étiquettes sont des éléments du DOM projetés à l'écran : le texte reste
   net à toutes les résolutions, contrairement à un texte dessiné dans la scène.
   ========================================================================= */

export interface LabelTarget {
  id: string
  name: string
  /** Position écran en pixels CSS. */
  x: number
  y: number
  /** Le point est-il de notre côté du globe ? */
  visible: boolean
  /** Le lieu est-il celui actuellement sélectionné ? */
  active: boolean
  /** Cadrage conseillé, pour le libellé secondaire. */
  kind?: string
}

export class LabelLayer {
  readonly element: HTMLElement
  private readonly nodes = new Map<string, HTMLButtonElement>()
  private readonly onClick: (id: string) => void

  constructor(parent: HTMLElement, onClick: (id: string) => void) {
    this.onClick = onClick
    this.element = document.createElement('div')
    this.element.className = 'label-layer'
    parent.append(this.element)
  }

  /** Met à jour les étiquettes visibles (les autres sont masquées). */
  update(targets: LabelTarget[]): void {
    const seen = new Set<string>()

    for (const target of targets) {
      seen.add(target.id)
      let node = this.nodes.get(target.id)
      if (!node) {
        node = document.createElement('button')
        node.type = 'button'
        node.className = 'label'
        node.dataset.id = target.id
        node.addEventListener('click', () => this.onClick(target.id))
        this.element.append(node)
        this.nodes.set(target.id, node)
      }

      node.textContent = target.name
      node.style.transform = `translate(${target.x.toFixed(1)}px, ${target.y.toFixed(1)}px)`
      const shouldShow = target.visible
      node.dataset.visible = String(shouldShow)
      node.dataset.active = String(target.active)
      node.tabIndex = shouldShow ? 0 : -1
      node.setAttribute('aria-hidden', String(!shouldShow))
    }

    for (const [id, node] of this.nodes) {
      if (!seen.has(id)) {
        node.dataset.visible = 'false'
        node.tabIndex = -1
      }
    }
  }

  /** Retire les étiquettes qui ne sont plus suivies. */
  prune(keepIds: Set<string>): void {
    for (const [id, node] of [...this.nodes]) {
      if (keepIds.has(id)) continue
      node.remove()
      this.nodes.delete(id)
    }
  }

  clear(): void {
    for (const node of this.nodes.values()) node.remove()
    this.nodes.clear()
  }
}
