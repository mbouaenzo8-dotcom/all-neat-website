/* =========================================================================
   earthScene — la Terre en 3D (three.js).

   Choix d'architecture : la caméra ne bouge pas (elle reste sur +x, à la
   distance demandée, et regarde l'origine) ; c'est le globe qui tourne pour
   amener le lieu visé face caméra. Résultat : « pousser le globe » à la main
   est direct, et l'axe des pôles s'incline naturellement quand on regarde une
   haute latitude.

   Rendu :
     - Terre : carte du jour, reflets sur les océans (carte spéculaire), relief
       (carte de normales) et lumières des villes qui ne s'allument que du côté
       nuit (injection dans le shader de MeshPhongMaterial) ;
     - nuages, halo d'atmosphère, étoiles, Lune (position et phase réelles) ;
     - post-traitement RenderPass → UnrealBloomPass → OutputPass. L'OutputPass
       est indispensable : three.js n'applique le tone mapping que pour un
       rendu direct à l'écran, donc dans une chaîne de passes c'est lui qui
       s'en charge, une seule fois, à la fin.
   ========================================================================= */

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { latLonToVector3, sunDirection, vector3ToLatLon, type LonLat } from './sun.ts'
import { moonState, type MoonState } from './moon.ts'
import { earthOrientation, toRowMajor } from '../orbit/orientation.ts'
import type { EarthTextureSet } from './textures.ts'

export type SceneQuality = 'haute' | 'moyenne' | 'basse'

export interface EarthSceneOptions {
  quality?: SceneQuality
  /** Rayon de la Terre (unités de la scène). */
  earthRadius?: number
  /** Halo lumineux autour des lumières de villes. */
  bloom?: boolean
  /** Intensité des lumières des villes (0–3). */
  nightLights?: number
  /** Distance lunaire en rayons terrestres (exagérée : la vraie vaut 60). */
  moonDistance?: number
  /** Rayon de la Lune en rayons terrestres (exagéré : le vrai vaut 0,27). */
  moonRadius?: number
}

export interface ProjectedPoint {
  x: number
  y: number
  visible: boolean
}

export interface SceneStats {
  drawCalls: number
  triangles: number
  programs: number
}

interface MarkerEntry {
  position: Vector3
  dot: Mesh
  ring: Mesh
  /** Échelle de base de l'anneau (le repère actif est agrandi). */
  ringScale: number
}

const SUN_DISTANCE = 60

export class EarthScene {
  readonly scene = new Scene()
  readonly camera: PerspectiveCamera
  readonly renderer: WebGLRenderer

  private readonly earthGroup = new Group()
  private readonly globe: Mesh
  private readonly clouds: Mesh
  private readonly atmosphere: Mesh
  private readonly stars: Mesh
  private readonly moon: Mesh
  private readonly sunLight: DirectionalLight
  private readonly ambient: AmbientLight
  private readonly markers = new Map<string, MarkerEntry>()
  private readonly raycaster = new Raycaster()

  private composer: EffectComposer | null = null
  private bloomPass: UnrealBloomPass | null = null

  private readonly nightUniforms = {
    uNightDirection: { value: new Vector3(1, 0, 0) },
    uNightIntensity: { value: 1.1 },
  }
  private readonly atmosphereUniforms = {
    uSunDirection: { value: new Vector3(1, 0, 0) },
    uDayColor: { value: new Color('#79c8ff') },
    uNightColor: { value: new Color('#1b3a6b') },
    uIntensity: { value: 1.15 },
  }

  private readonly options: Required<EarthSceneOptions>
  private readonly baseMoonRadius: number
  private readonly dayTexture: Texture
  private readonly nightTexture: Texture
  private readonly specularTexture: Texture
  private readonly normalTexture: Texture
  private readonly disposeables: Texture[] = []

  private width = 1
  private height = 1
  private fov = 32
  private distance = 2.65
  private quality: SceneQuality
  private bloomEnabled: boolean
  private showClouds = true
  private showAtmosphere = true
  private showStars = true
  private clock = 0
  private sunDirectionLocal = new Vector3(1, 0, 0)
  private moonStateValue: MoonState | null = null

  constructor(canvas: HTMLCanvasElement, textures: EarthTextureSet, options: EarthSceneOptions = {}) {
    this.options = {
      quality: options.quality ?? 'moyenne',
      earthRadius: options.earthRadius ?? 1,
      bloom: options.bloom ?? true,
      nightLights: options.nightLights ?? 1.1,
      moonDistance: options.moonDistance ?? 7.4,
      moonRadius: options.moonRadius ?? 0.25,
    }
    this.baseMoonRadius = this.options.moonRadius
    this.quality = this.options.quality
    this.bloomEnabled = this.options.bloom

    this.dayTexture = textures.day
    this.nightTexture = textures.night
    this.specularTexture = textures.specular
    this.normalTexture = textures.normal

    /* ------------------------------------------------------- afficheur */
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.outputColorSpace = SRGBColorSpace

    this.camera = new PerspectiveCamera(this.fov, 1, 0.005, 400)
    this.camera.position.set(this.distance, 0, 0)
    this.camera.up.set(0, 1, 0)
    this.camera.lookAt(0, 0, 0)

    /* ---------------------------------------------------------- la Terre */
    const radius = this.options.earthRadius
    const [widthSegments, heightSegments] = this.quality === 'basse' ? [64, 32] : [160, 80]

    const earthMaterial = new MeshPhongMaterial({
      map: this.dayTexture,
      specularMap: this.specularTexture,
      normalMap: this.normalTexture,
      specular: new Color(0x3d4d5e),
      shininess: 18,
      emissive: new Color(0xffffff),
      emissiveMap: this.nightTexture,
      emissiveIntensity: 1,
    })
    this.injectNightLights(earthMaterial)

    this.globe = new Mesh(new SphereGeometry(radius, widthSegments, heightSegments), earthMaterial)
    this.globe.name = 'globe'
    this.earthGroup.add(this.globe)

    /* --------------------------------------------------------- nuages */
    this.clouds = new Mesh(
      new SphereGeometry(radius * 1.006, widthSegments / 2, heightSegments / 2),
      new MeshLambertMaterial({
        map: textures.clouds,
        transparent: true,
        depthWrite: false,
        opacity: 0.88,
        alphaTest: 0.01,
      }),
    )
    this.clouds.renderOrder = 1
    this.earthGroup.add(this.clouds)

    /* ------------------------------------------------------ atmosphère */
    this.atmosphere = new Mesh(
      new SphereGeometry(radius * 1.03, 96, 48),
      new ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        uniforms: this.atmosphereUniforms,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: FrontSide,
      }),
    )
    this.atmosphere.renderOrder = 2
    this.earthGroup.add(this.atmosphere)

    /* ----------------------------------------------------------- lumière */
    this.sunLight = new DirectionalLight(0xfff4e6, 2.7)
    this.sunLight.position.set(SUN_DISTANCE, 0, 0)
    this.earthGroup.add(this.sunLight) // hérite de la rotation du globe

    this.ambient = new AmbientLight(0x2a3c5e, 0.2)
    this.scene.add(this.ambient)

    /* -------------------------------------------------------------- Lune */
    this.moon = new Mesh(
      new SphereGeometry(this.baseMoonRadius, 48, 24),
      new MeshPhongMaterial({ map: textures.moon, shininess: 2, specular: new Color(0x111111) }),
    )
    this.moon.position.set(this.options.moonDistance, 0, 0)
    this.earthGroup.add(this.moon)

    /* ----------------------------------------------------------- étoiles */
    this.stars = new Mesh(
      new SphereGeometry(120, 48, 24),
      new MeshBasicMaterial({
        map: textures.stars,
        side: BackSide,
        depthWrite: false,
        // La carte d'étoiles est très sombre : on la relève pour compenser
        // le tone mapping appliqué en fin de chaîne.
        color: new Color().setScalar(2.4),
      }),
    )
    this.scene.add(this.stars)

    this.scene.add(this.earthGroup)

    /* ---------------------------------------------------------- finitions */
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()
    const filtered = [this.dayTexture, this.nightTexture, this.specularTexture, this.normalTexture, textures.clouds, textures.moon]
    for (const texture of filtered) texture.anisotropy = Math.min(8, maxAnisotropy)
    this.disposeables = [this.dayTexture, this.nightTexture, this.specularTexture, this.normalTexture, textures.clouds, textures.moon, textures.stars]

    this.setQuality(this.quality)
    this.setNightLights(this.options.nightLights)
  }

  /* ------------------------------------------------------------ réglages */

  setQuality(quality: SceneQuality): void {
    this.quality = quality
    const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    const ratio = quality === 'haute' ? Math.min(2, devicePixelRatio) : quality === 'moyenne' ? Math.min(1.5, devicePixelRatio) : 1
    this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(this.width, this.height, false)

    const material = this.globe.material as MeshPhongMaterial
    material.normalMap = quality === 'basse' ? null : this.normalTexture
    material.specularMap = quality === 'basse' ? null : this.specularTexture
    material.needsUpdate = true

    this.clouds.visible = this.showClouds && quality !== 'basse'
    this.atmosphere.visible = this.showAtmosphere
    this.stars.visible = this.showStars
    if (this.bloomPass) this.bloomPass.enabled = this.bloomEnabled

    if (this.composer) this.composer.setSize(this.width, this.height)
  }

  setBloom(enabled: boolean): void {
    this.bloomEnabled = enabled
    if (this.bloomPass) this.bloomPass.enabled = enabled
  }

  /** Intensité des lumières des villes (0 = éteintes). */
  setNightLights(intensity: number): void {
    this.nightUniforms.uNightIntensity.value = intensity
  }

  setClouds(visible: boolean): void {
    this.showClouds = visible
    this.clouds.visible = visible && this.quality !== 'basse'
  }

  setAtmosphere(visible: boolean): void {
    this.showAtmosphere = visible
    this.atmosphere.visible = visible
  }

  setStars(visible: boolean): void {
    this.showStars = visible
    this.stars.visible = visible
  }

  setMoonVisible(visible: boolean): void {
    this.moon.visible = visible
  }

  /** Exagération de la Lune : la vraie distance (60 rayons) la rendrait minuscule. */
  setMoonScale(radius: number, distance: number): void {
    this.moon.scale.setScalar(radius / this.baseMoonRadius)
    this.moon.position.setLength(distance)
    this.moonStateValue = this.moonStateValue
  }

  /* -------------------------------------------------------- mise en scène */

  /** Oriente le globe pour amener (lat, lon) face caméra, avec un roulis. */
  setOrientation(latDeg: number, lonDeg: number, rollDeg = 0): void {
    const rows = toRowMajor(earthOrientation(latDeg, lonDeg, rollDeg))
    const matrix = new Matrix4().set(
      rows[0], rows[1], rows[2], 0,
      rows[3], rows[4], rows[5], 0,
      rows[6], rows[7], rows[8], 0,
      0, 0, 0, 1,
    )
    this.earthGroup.quaternion.setFromRotationMatrix(matrix)
  }

  setDistance(distance: number): void {
    this.distance = distance
    this.camera.position.set(distance, 0, 0)
    this.camera.lookAt(0, 0, 0)
    this.camera.near = Math.max(0.004, (distance - 1) * 0.04)
    this.camera.updateProjectionMatrix()
  }

  setFov(fov: number): void {
    this.fov = fov
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
  }

  getFov(): number {
    return this.fov
  }

  getMoon(): MoonState | null {
    return this.moonStateValue
  }

  /** Positionne le Soleil et la Lune pour un instant donné (temps réel). */
  setSun(date: Date): void {
    const direction = sunDirection(date)
    this.sunDirectionLocal.set(direction.x, direction.y, direction.z)
    this.sunLight.position.copy(this.sunDirectionLocal).multiplyScalar(SUN_DISTANCE)

    const world = this.sunDirectionLocal.clone().applyQuaternion(this.earthGroup.quaternion)
    this.atmosphereUniforms.uSunDirection.value.copy(world)

    // Le shader de la Terre travaille en espace vue (comme le varying vNormal).
    this.camera.updateMatrixWorld()
    const viewDirection = world.transformDirection(this.camera.matrixWorldInverse)
    this.nightUniforms.uNightDirection.value.copy(viewDirection)

    const moon = moonState(date)
    this.moonStateValue = moon
    this.moon.position.set(
      moon.direction.x * this.options.moonDistance,
      moon.direction.y * this.options.moonDistance,
      moon.direction.z * this.options.moonDistance,
    )
  }

  /* ------------------------------------------------------------ repérage */

  /** Projette un point de la surface en pixels CSS. */
  project(latDeg: number, lonDeg: number, radius = 1): ProjectedPoint {
    const local = latLonToVector3(latDeg, lonDeg, radius)
    const point = new Vector3(local.x, local.y, local.z)
      .applyMatrix4(this.earthGroup.matrixWorld)
      .project(this.camera)
    return {
      x: (point.x * 0.5 + 0.5) * this.width,
      y: (-point.y * 0.5 + 0.5) * this.height,
      visible: point.z > -1 && point.z < 1,
    }
  }

  /** Point de la Terre visé par un rayon écran (coordonnées normalisées −1..1). */
  pick(ndcX: number, ndcY: number): LonLat | null {
    this.raycaster.setFromCamera(new Vector2(ndcX, ndcY), this.camera)
    const hits = this.raycaster.intersectObject(this.globe, false)
    if (hits.length === 0) return null
    const local = this.earthGroup.worldToLocal(hits[0].point.clone())
    return vector3ToLatLon({ x: local.x, y: local.y, z: local.z })
  }

  /** Rayon écran : le point visé, ou à défaut le point de la surface le plus proche. */
  pickOrClosest(ndcX: number, ndcY: number): LonLat {
    const hit = this.pick(ndcX, ndcY)
    if (hit) return hit
    this.raycaster.setFromCamera(new Vector2(ndcX, ndcY), this.camera)
    const closest = this.raycaster.ray.closestPointToPoint(new Vector3(0, 0, 0), new Vector3())
    const local = this.earthGroup.worldToLocal(closest)
    if (local.lengthSq() < 1e-9) return { lat: 0, lon: 0 }
    local.setLength(1)
    return vector3ToLatLon({ x: local.x, y: local.y, z: local.z })
  }

  /* ------------------------------------------------------------- repères */

  addMarker(id: string, latDeg: number, lonDeg: number, color = 0x4fd1c5): void {
    this.removeMarker(id)
    // Au-dessus de la couche de nuages (1.006) et sous le halo (1.03).
    const local = latLonToVector3(latDeg, lonDeg, 1.012)
    const position = new Vector3(local.x, local.y, local.z)

    const dot = new Mesh(new SphereGeometry(0.0075, 12, 8), new MeshBasicMaterial({ color: new Color(color) }))
    dot.position.copy(position)

    const ring = new Mesh(
      new RingGeometry(0.017, 0.022, 32),
      new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    )
    ring.position.copy(position).multiplyScalar(1.002)
    // Anneau posé à plat sur la surface : +z local aligné sur la verticale du lieu.
    // (setFromUnitVectors plutôt que lookAt : pas de dépendance à une matrice à jour.)
    ring.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), position.clone().normalize())

    this.earthGroup.add(dot, ring)
    this.markers.set(id, { position, dot, ring, ringScale: 1 })
  }

  setMarkerActive(id: string, active: boolean): void {
    const marker = this.markers.get(id)
    if (!marker) return
    marker.ringScale = active ? 1.85 : 1
    ;(marker.ring.material as MeshBasicMaterial).opacity = active ? 1 : 0.55
    marker.dot.scale.setScalar(active ? 1.7 : 1)
  }

  /** Masque un repère (utile pour n'afficher que la face visible du globe). */
  setMarkerVisible(id: string, visible: boolean): void {
    const marker = this.markers.get(id)
    if (!marker) return
    marker.dot.visible = visible
    marker.ring.visible = visible
  }

  removeMarker(id: string): void {
    const marker = this.markers.get(id)
    if (!marker) return
    this.earthGroup.remove(marker.dot, marker.ring)
    marker.dot.geometry.dispose()
    ;(marker.dot.material as MeshBasicMaterial).dispose()
    marker.ring.geometry.dispose()
    ;(marker.ring.material as MeshBasicMaterial).dispose()
    this.markers.delete(id)
  }

  clearMarkers(): void {
    for (const id of [...this.markers.keys()]) this.removeMarker(id)
  }

  /* ---------------------------------------------------------------- rendu */

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return
    this.width = width
    this.height = height
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.composer?.setSize(width, height)
  }

  private ensureComposer(): void {
    if (this.composer) return
    const composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    const bloomPass = new UnrealBloomPass(new Vector2(this.width, this.height), 0.52, 0.42, 0.8)
    const outputPass = new OutputPass()
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    composer.addPass(outputPass)
    composer.setSize(this.width, this.height)
    this.composer = composer
    this.bloomPass = bloomPass
    bloomPass.enabled = this.bloomEnabled && this.quality !== 'basse'
  }

  /** Dessine une image. `dt` en secondes. */
  render(dt: number): void {
    this.clock += dt

    // Pulsation douce des repères, pour attirer l'œil.
    for (const marker of this.markers.values()) {
      const pulse = 1 + 0.09 * Math.sin(this.clock * 2.6)
      marker.ring.scale.setScalar(marker.ringScale * pulse)
    }

    if (this.bloomEnabled && this.quality !== 'basse') {
      this.ensureComposer()
      this.composer?.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  stats(): SceneStats {
    const info = this.renderer.info
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      programs: info.programs?.length ?? 0,
    }
  }

  dispose(): void {
    this.clearMarkers()
    this.globe.geometry.dispose()
    ;(this.globe.material as MeshPhongMaterial).dispose()
    this.clouds.geometry.dispose()
    ;(this.clouds.material as MeshLambertMaterial).dispose()
    this.atmosphere.geometry.dispose()
    ;(this.atmosphere.material as ShaderMaterial).dispose()
    this.stars.geometry.dispose()
    ;(this.stars.material as MeshBasicMaterial).dispose()
    this.moon.geometry.dispose()
    ;(this.moon.material as MeshPhongMaterial).dispose()
    for (const disposable of this.disposeables) disposable.dispose()
    this.composer?.dispose()
    this.renderer.dispose()
  }

  /**
   * Injection des lumières nocturnes dans le shader standard de three.js :
   * on ne les allume que du côté nuit (produit scalaire avec la direction du
   * Soleil), sinon elles se cumuleraient avec la carte de jour.
   */
  private injectNightLights(material: MeshPhongMaterial): void {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uNightDirection = this.nightUniforms.uNightDirection
      shader.uniforms.uNightIntensity = this.nightUniforms.uNightIntensity
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform vec3 uNightDirection;
          uniform float uNightIntensity;`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `
          #ifdef USE_EMISSIVEMAP
            vec3 cityLights = texture2D( emissiveMap, vEmissiveMapUv ).rgb;
            float sunFacing = dot( normalize( vNormal ), uNightDirection );
            float nightGate = 1.0 - smoothstep( -0.22, 0.16, sunFacing );
            totalEmissiveRadiance *= cityLights * uNightIntensity * nightGate;
          #endif
        `,
        )
    }
    material.customProgramCacheKey = () => 'earth-night-lights'
  }
}

/* ================================ shaders ================================ */

const ATMOSPHERE_VERTEX = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize( mat3( modelMatrix ) * normal );
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uSunDirection;
uniform vec3 uDayColor;
uniform vec3 uNightColor;
uniform float uIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDirection = normalize( cameraPosition - vWorldPosition );
  vec3 normal = normalize( vWorldNormal );

  // Frange lumineuse : maximale sur le limbe (vue rasante), nulle au centre.
  float rim = 1.0 - clamp( dot( viewDirection, normal ), 0.0, 1.0 );
  rim = pow( rim, 2.6 );

  float sunFacing = dot( normal, uSunDirection );
  float dayAmount = smoothstep( -0.45, 0.35, sunFacing );

  vec3 color = mix( uNightColor * 0.25, uDayColor, dayAmount );
  float strength = rim * uIntensity * ( 0.22 + 0.95 * dayAmount );

  gl_FragColor = vec4( color * strength, rim );
}
`
