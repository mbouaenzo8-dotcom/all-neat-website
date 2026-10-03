/* =========================================================================
   hud — tout l'habillage de l'application (DOM classique, pas de framework).

   Règle de la maison : `update()` ne touche le DOM que si la valeur affichée
   change réellement. C'est ce qui permet de tourner à 60 images par seconde
   sans que la mise en page ne s'effondre.
   ========================================================================= */

import type { Place } from '../data/locations.ts'
import { MARVELS, searchPlaces } from '../data/locations.ts'
import type { GestureState } from '../vision/gestureFsm.ts'
import type { HandFrame, TrackerStatus } from '../vision/handTracker.ts'
import type { SceneQuality, SceneStats } from '../earth/earthScene.ts'

export type LayerName = 'clouds' | 'atmosphere' | 'stars' | 'moon' | 'bloom'

export interface HudHandlers {
  onStart: () => void
  onStartWithoutCamera: () => void
  onToggleHands: () => void
  onRandom: () => void
  onResetView: () => void
  onPlace: (place: Place) => void
  onSearch: (query: string) => void
  onQuality: (quality: SceneQuality) => void
  onSensitivity: (value: number) => void
  onToggleLayer: (layer: LayerName, value: boolean) => void
  onNightLights: (value: number) => void
  onCameraVisible: (value: boolean) => void
  onToggleSettings: () => void
}

export interface HudInfo {
  place: Place | null
  lat: number
  lon: number
  altitudeKm: number
  fieldWidthKm: number
  mapKmPerPixel: number
  sunAltitude: number
  isDay: boolean
  moonPhase: number
  moonPhaseName: string
  viewLabel: string
}

export interface HudUpdate {
  trackerStatus?: TrackerStatus
  fps?: number
  hands?: HandFrame[]
  gesture?: GestureState
  handsEnabled?: boolean
  cameraOn?: boolean
  info?: HudInfo
  stats?: SceneStats
  capturing?: boolean
}

const GESTURE_LABELS: Record<string, string> = {
  idle: 'repos',
  grab: 'prise',
  zoom: 'zoom',
  point: 'visée',
  move: 'rotation',
}

const STATUS_LABELS: Record<TrackerStatus, { text: string; state: string }> = {
  idle: { text: 'caméra en attente', state: 'wait' },
  loading: { text: 'chargement du modèle', state: 'wait' },
  ready: { text: 'suivi actif', state: 'live' },
  error: { text: 'erreur du suivi', state: 'off' },
}

export class Hud {
  private readonly root: HTMLElement
  private readonly handlers: HudHandlers

  private readonly chips!: {
    camera: HTMLElement
    hands: HTMLElement
    gesture: HTMLElement
    fps: HTMLElement
  }
  private readonly overlay!: HTMLElement
  private readonly statusBar!: HTMLElement
  private readonly statusText!: HTMLElement
  private readonly toasts!: HTMLElement
  private readonly settings!: HTMLElement
  private readonly crosshair!: HTMLElement
  private readonly placeCard!: HTMLElement
  private readonly statsGrid!: HTMLElement
  private readonly searchInput!: HTMLInputElement
  private readonly searchList!: HTMLDataListElement
  private readonly handsButton!: HTMLButtonElement
  private readonly cameraToggle!: HTMLInputElement

  private readonly cache = new Map<string, string>()
  private info: HudInfo | null = null

  constructor(root: HTMLElement, handlers: HudHandlers) {
    this.root = root
    this.handlers = handlers

    root.insertAdjacentHTML('beforeend', MARKUP)

    this.chips = {
      camera: must(root, '#chip-camera'),
      hands: must(root, '#chip-hands'),
      gesture: must(root, '#chip-gesture'),
      fps: must(root, '#chip-fps'),
    }
    this.overlay = must(root, '#start-overlay')
    this.statusBar = must(root, '#status-bar')
    this.statusText = must(root, '#status-text')
    this.toasts = must(root, '#toasts')
    this.settings = must(root, '#settings')
    this.crosshair = must(root, '#crosshair')
    this.placeCard = must(root, '#place-card')
    this.statsGrid = must(root, '#stats-grid')
    this.searchInput = must(root, '#place-search') as HTMLInputElement
    this.searchList = must(root, '#place-list') as HTMLDataListElement
    this.handsButton = must(root, '#btn-hands') as HTMLButtonElement
    this.cameraToggle = must(root, '#toggle-camera') as HTMLInputElement

    this.fillSearchList()
    this.bind()
  }

  /** Emplacement où loger l'aperçu caméra (créé par le gabarit). */
  get cameraSlot(): HTMLElement {
    return must(this.root, '.camera-slot')
  }

  /* ------------------------------------------------------------- structure */

  private fillSearchList(): void {
    const fragment = document.createDocumentFragment()
    for (const place of MARVELS) {
      const option = document.createElement('option')
      option.value = place.name
      option.label = place.country
      fragment.append(option)
    }
    this.searchList.append(fragment)
  }

  private bind(): void {
    must(this.root, '#btn-start').addEventListener('click', () => this.handlers.onStart())
    must(this.root, '#btn-skip').addEventListener('click', () => this.handlers.onStartWithoutCamera())
    this.handsButton.addEventListener('click', () => this.handlers.onToggleHands())
    must(this.root, '#btn-random').addEventListener('click', () => this.handlers.onRandom())
    must(this.root, '#btn-reset').addEventListener('click', () => this.handlers.onResetView())
    must(this.root, '#btn-settings').addEventListener('click', () => this.handlers.onToggleSettings())

    const search = this.searchInput
    search.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      const query = search.value.trim()
      if (!query) return
      this.handlers.onSearch(query)
      search.blur()
    })

    must(this.root, '#quality').addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value as SceneQuality | 'auto'
      this.handlers.onQuality(value === 'auto' ? 'moyenne' : value)
    })

    const sensitivity = must(this.root, '#sensitivity') as HTMLInputElement
    sensitivity.addEventListener('input', () => {
      this.handlers.onSensitivity(Number(sensitivity.value) / 100)
    })

    const lights = must(this.root, '#night-lights') as HTMLInputElement
    lights.addEventListener('input', () => {
      this.handlers.onNightLights(Number(lights.value) / 50)
    })

    for (const input of this.root.querySelectorAll<HTMLInputElement>('input[data-layer]')) {
      input.addEventListener('change', () => {
        this.handlers.onToggleLayer(input.dataset.layer as LayerName, input.checked)
      })
    }

    this.cameraToggle.addEventListener('change', () => {
      this.handlers.onCameraVisible(this.cameraToggle.checked)
    })
  }

  /* -------------------------------------------------------------- mises à jour */

  update(update: HudUpdate): void {
    if (update.trackerStatus) {
      const status = STATUS_LABELS[update.trackerStatus]
      this.chipText(this.chips.camera, status.text)
      const chip = this.chips.camera
      if (chip.dataset.state !== status.state) chip.dataset.state = status.state
    }

    if (update.hands) {
      const count = update.hands.length
      const names = update.hands.map((hand) => (hand.id === 'gauche' ? 'gauche' : 'droite')).join(' + ')
      this.chipText(this.chips.hands, count === 0 ? 'aucune main' : count === 1 ? `1 main (${names})` : '2 mains')
      const state = update.handsEnabled === false ? 'off' : count > 0 ? 'live' : 'wait'
      if (this.chips.hands.dataset.state !== state) this.chips.hands.dataset.state = state
    }

    if (update.gesture) {
      const label = GESTURE_LABELS[update.gesture.mode] ?? update.gesture.mode
      this.chipText(this.chips.gesture, label)
      const state = update.gesture.mode === 'idle' ? 'wait' : 'active'
      if (this.chips.gesture.dataset.state !== state) this.chips.gesture.dataset.state = state
      if (update.gesture.mode === 'idle' && update.gesture.click) this.chipText(this.chips.gesture, 'clic')
    }

    if (update.fps !== undefined) this.chipText(this.chips.fps, `${Math.round(update.fps)} i/s`)

    if (update.handsEnabled !== undefined && this.handsButton) {
      this.handsButton.textContent = update.handsEnabled ? 'Piloter aux mains' : 'Reprendre le pilotage'
      this.handsButton.dataset.state = update.handsEnabled ? 'on' : 'off'
    }

    if (update.handsEnabled === false && this.crosshair.dataset.visible !== 'false') {
      this.setAim(null)
    }

    if (update.info) this.renderInfo(update.info)
    if (update.stats) {
      this.chipText(
        must(this.root, '#stat-render'),
        `${update.stats.drawCalls} appels · ${(update.stats.triangles / 1000).toFixed(0)}k tris`,
      )
    }
  }

  /** Affiche (ou masque) le viseur, en coordonnées écran normalisées −1..1. */
  setAim(aim: { x: number; y: number } | null): void {
    if (!aim) {
      if (this.crosshair.dataset.visible !== 'false') this.crosshair.dataset.visible = 'false'
      return
    }
    this.crosshair.dataset.visible = 'true'
    const width = this.root.clientWidth
    const height = this.root.clientHeight
    const x = (aim.x * 0.5 + 0.5) * width
    const y = (-aim.y * 0.5 + 0.5) * height
    this.crosshair.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
  }

  setCapturing(capturing: boolean): void {
    this.overlay.classList.toggle('leaving', !capturing)
    if (capturing) this.overlay.setAttribute('hidden', '')
    else this.overlay.removeAttribute('hidden')
  }

  hideOverlay(): void {
    this.overlay.classList.add('leaving')
    window.setTimeout(() => this.overlay.setAttribute('hidden', ''), 500)
  }

  showStatus(text: string): void {
    this.statusText.textContent = text
    this.statusBar.hidden = false
  }

  hideStatus(): void {
    this.statusBar.hidden = true
  }

  toast(message: string, kind: 'info' | 'error' = 'info', duration = 6000): void {
    const node = document.createElement('div')
    node.className = `toast ${kind === 'error' ? '' : 'info'}`
    node.textContent = message
    this.toasts.append(node)
    window.setTimeout(() => {
      node.style.opacity = '0'
      window.setTimeout(() => node.remove(), 400)
    }, duration)
  }

  setSettingsVisible(visible: boolean): void {
    this.settings.classList.toggle('hidden', !visible)
    const button = must(this.root, '#btn-settings')
    button.setAttribute('aria-expanded', String(visible))
  }

  /** Recherche un lieu à partir du champ texte (voix ou clavier). */
  setSearchValue(value: string): void {
    this.searchInput.value = value
  }

  suggestPlaces(query: string): Place[] {
    return searchPlaces(query)
  }

  /* -------------------------------------------------------------- interne */

  /** Écrit dans un chip sans effacer sa pastille colorée. */
  private chipText(chip: HTMLElement, value: string): void {
    const label = chip.querySelector('.chip-label')
    if (!label) return
    this.text(label as HTMLElement, value)
  }

  /** Écrit un texte, et seulement s'il a changé (le DOM n'aime pas les répétitions). */
  private text(node: HTMLElement, value: string): void {
    const key = `${node.id || node.className}|${value.slice(0, 24)}`
    const previous = this.cache.get(key)
    if (previous === value) return
    this.cache.set(key, value)
    node.textContent = value
  }

  private renderInfo(info: HudInfo): void {
    this.info = info
    const place = info.place
    const title = place ? place.name : 'Globe libre'
    this.text(must(this.placeCard, '#place-name'), title)
    this.text(
      must(this.placeCard, '#place-country'),
      place
        ? `${place.country} — ${place.note}`
        : 'Aucun lieu sélectionné : visez un point et pincez le pouce et l’index.',
    )

    // Lignes de statistiques : reconstruites seulement si le contenu change.
    const rows: [string, string][] = [
      ['Latitude', `${formatCoord(info.lat, 'N', 'S')}`],
      ['Longitude', `${formatCoord(info.lon, 'E', 'O')}`],
      ['Altitude caméra', `${Math.round(info.altitudeKm).toLocaleString('fr-FR')} km`],
      ['Champ couvert', `${Math.round(info.fieldWidthKm).toLocaleString('fr-FR')} km`],
      ['Détail de la carte', `≈ ${info.mapKmPerPixel.toFixed(1)} km/pixel`],
      ['Soleil', info.isDay ? `jour (${info.sunAltitude.toFixed(0)}°)` : `nuit (${info.sunAltitude.toFixed(0)}°)`],
      ['Lune', `${info.moonPhaseName} (${Math.round(info.moonPhase * 100)} %)`],
      ['Cadrage', info.viewLabel],
    ]
    const signature = rows.map(([key, value]) => `${key}=${value}`).join('|')
    if (this.statsGrid.dataset.signature !== signature) {
      this.statsGrid.dataset.signature = signature
      this.statsGrid.replaceChildren(
        ...rows.flatMap(([key, value]) => {
          const dt = document.createElement('dt')
          dt.textContent = key
          const dd = document.createElement('dd')
          dd.textContent = value
          return [dt, dd]
        }),
      )
    }
  }

  /** Dernier lieu affiché (utilisé par le programme principal). */
  get currentPlace(): Place | null {
    return this.info?.place ?? null
  }
}

function formatCoord(value: number, positive: string, negative: string): string {
  const absolute = Math.abs(value)
  const suffix = value >= 0 ? positive : negative
  return `${absolute.toFixed(2)}° ${suffix}`
}

function must(root: ParentNode, selector: string): HTMLElement {
  const node = root.querySelector(selector)
  if (!node) throw new Error(`Élément d'interface introuvable : ${selector}`)
  return node as HTMLElement
}

/* ================================ gabarit ================================ */

const MARKUP = `
<div class="hud">
  <div class="hud-top">
    <div class="stack">
      <div class="panel brand">
        <span class="globe-mark" aria-hidden="true"></span>
        <div>
          <h1>Terre 3D, pilotée à la main</h1>
          <p>Pilotez le globe devant votre webcam : tout se passe dans le navigateur, aucune image ne part sur le réseau.</p>
        </div>
      </div>
      <div class="chip-row">
        <span class="chip" id="chip-camera" data-state="wait"><span class="dot"></span><span class="chip-label">caméra</span></span>
        <span class="chip" id="chip-hands" data-state="wait"><span class="dot"></span><span class="chip-label">mains</span></span>
        <span class="chip" id="chip-gesture" data-state="wait"><span class="dot"></span><span class="chip-label">geste</span></span>
        <span class="chip" id="chip-fps" data-state="wait"><span class="dot"></span><span class="chip-label">fps</span></span>
      </div>
    </div>

    <div class="stack right">
      <div class="panel settings hidden" id="settings" aria-label="Réglages">
        <div class="settings">
          <div class="field">
            <label for="place-search">Aller à un lieu</label>
            <input id="place-search" class="search-input" list="place-list" placeholder="Paris, Everest, Uyuni…" autocomplete="off" />
            <datalist id="place-list"></datalist>
          </div>
          <div class="field">
            <label for="quality">Qualité de rendu</label>
            <select id="quality" class="select">
              <option value="auto" selected>automatique</option>
              <option value="haute">haute</option>
              <option value="moyenne">moyenne</option>
              <option value="basse">basse</option>
            </select>
          </div>
          <div class="field">
            <label for="sensitivity">Sensibilité des gestes <b id="sensitivity-value">100 %</b></label>
            <input id="sensitivity" type="range" min="30" max="220" value="100" />
          </div>
          <div class="field">
            <label for="night-lights">Lumières des villes <b id="lights-value">55 %</b></label>
            <input id="night-lights" type="range" min="0" max="150" value="55" />
          </div>
          <div class="switch-row"><span>Nuages</span><label class="switch"><input type="checkbox" data-layer="clouds" checked /><span class="knob"></span></label></div>
          <div class="switch-row"><span>Halo d’atmosphère</span><label class="switch"><input type="checkbox" data-layer="atmosphere" checked /><span class="knob"></span></label></div>
          <div class="switch-row"><span>Étoiles</span><label class="switch"><input type="checkbox" data-layer="stars" checked /><span class="knob"></span></label></div>
          <div class="switch-row"><span>Lune</span><label class="switch"><input type="checkbox" data-layer="moon" checked /><span class="knob"></span></label></div>
          <div class="switch-row"><span>Halo des lumières</span><label class="switch"><input type="checkbox" data-layer="bloom" checked /><span class="knob"></span></label></div>
          <div class="switch-row"><span>Aperçu caméra</span><label class="switch"><input type="checkbox" id="toggle-camera" checked /><span class="knob"></span></label></div>
        </div>
      </div>
      <div class="chip-row">
        <button class="btn ghost" id="btn-settings" aria-expanded="false" aria-controls="settings">Réglages</button>
        <button class="btn ghost" id="btn-hands">Piloter aux mains</button>
      </div>
    </div>
  </div>

  <div class="hud-bottom">
    <div class="stack">
      <div class="camera-slot"></div>
    </div>

    <div class="stack right">
      <div class="panel place-card" id="place-card">
        <h2 id="place-name">Globe libre</h2>
        <p id="place-country">Aucun lieu sélectionné.</p>
        <dl class="stats-grid" id="stats-grid"></dl>
        <div class="chip-row">
          <button class="btn ghost" id="btn-random">Lieu au hasard</button>
          <button class="btn ghost" id="btn-reset">Recentrer</button>
          <span class="chip" id="stat-render" data-state="wait"><span class="dot"></span><span class="chip-label">stats</span></span>
        </div>
      </div>

      <div class="panel legend">
        <h2>Avec la caméra</h2>
        <div class="row"><span class="glyph">🤏</span><span><b>Pincer et déplacer</b> : faire tourner le globe.</span></div>
        <div class="row"><span class="glyph">👐</span><span><b>Deux mains pincées</b> : écarter ou rapprocher pour zoomer, tourner les deux mains pour incliner.</span></div>
        <div class="row"><span class="glyph">☝️</span><span><b>Index tendu</b> : viser un lieu, puis pincer pour y aller.</span></div>
        <div class="row"><span class="glyph">✋</span><span><b>Main ouverte</b> : joystick de rotation continue.</span></div>
        <div class="keys">
          <kbd>clic-glisser</kbd><kbd>molette</kbd><kbd>Espace</kbd><kbd>R</kbd><kbd>N</kbd><kbd>Q</kbd><kbd>E</kbd><kbd>H</kbd>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="crosshair" id="crosshair" data-visible="false" aria-hidden="true"></div>

<div class="status" id="status-bar" hidden>
  <span class="spinner" aria-hidden="true"></span>
  <span id="status-text">Préparation…</span>
</div>

<div class="toasts" id="toasts" role="status" aria-live="polite"></div>

<div class="overlay" id="start-overlay">
  <div class="start-card" role="dialog" aria-labelledby="start-title">
    <p class="eyebrow">Simulation 3D · temps réel</p>
    <h2 id="start-title">La Terre, au bout des doigts</h2>
    <p>
      Le globe tourne avec un vrai terminateur jour/nuit calculé à votre heure, les nuages et les lumières des villes
      sont ceux des cartes de la NASA, et la Lune est à sa position et à sa phase du moment.
    </p>

    <ol class="start-steps">
      <li><span class="num">1</span><span>Autorisez la caméra. <b>Les images ne quittent pas votre appareil</b> : le suivi des mains tourne en local.</span></li>
      <li><span class="num">2</span><span>Montrez une main, pincez pouce et index, et <b>déplacez-la</b> pour faire tourner la Terre.</span></li>
      <li><span class="num">3</span><span>Deux mains pincées = zoom. Index tendu = viseur : pincez pour voyager vers un lieu.</span></li>
    </ol>

    <p class="privacy">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
      <span>Vos images restent dans le navigateur : aucune vidéo, aucune image et aucune donnée ne sont envoyées à un serveur. Le modèle de détection des mains est servi depuis cette page.</span>
    </p>

    <div class="start-actions">
      <button class="btn primary" id="btn-start">Activer la caméra</button>
      <button class="btn ghost" id="btn-skip">Explorer à la souris</button>
    </div>
    <p class="start-note">
      Sur ordinateur comme sur téléphone. Si l’aperçu en ligne empêche l’accès à la caméra (cadre restreint), ouvrez
      la page dans un onglet : le bouton vous proposera le lien.
    </p>
  </div>
</div>
`
