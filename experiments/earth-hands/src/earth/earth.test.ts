/* =========================================================================
   Tests de l'astronomie et de l'orientation du globe (executables sans écran).
   ========================================================================= */

import test from 'node:test'
import assert from 'node:assert/strict'

import { eclipticToEarthFixed, moonState } from './moon.ts'
import {
  dayOfYear,
  isDaylight,
  latLonToVector3,
  normalizeLon,
  solarAltitude,
  solarDeclination,
  subsolarPoint,
  sunDirection,
  sunTrueLongitude,
  vector3ToLatLon,
} from './sun.ts'
import { applyMat3, determinant, earthOrientation } from '../orbit/orientation.ts'
import {
  altitudeKm,
  mapKilometersPerPixel,
  metersPerPixel,
  shotInfo,
  visibleField,
  VIEWS,
} from '../orbit/celestial.ts'

const DEG = Math.PI / 180

test('le repère terrestre suit la convention de la sphère three.js', () => {
  const greenwich = latLonToVector3(0, 0)
  assert.ok(Math.abs(greenwich.x - 1) < 1e-9)
  assert.ok(Math.abs(greenwich.y) < 1e-9)

  const east90 = latLonToVector3(0, 90)
  assert.ok(Math.abs(east90.z + 1) < 1e-9, 'lon 90° doit être sur -z')

  const pole = latLonToVector3(90, 0)
  assert.ok(Math.abs(pole.y - 1) < 1e-9)
})

test('latitude / longitude font l\'aller-retour', () => {
  for (const [lat, lon] of [[48.85, 2.35], [-33.87, 151.21], [35.68, 139.69], [-22.9, -43.2]]) {
    const back = vector3ToLatLon(latLonToVector3(lat, lon))
    assert.ok(Math.abs(back.lat - lat) < 1e-6, `lat ${lat} → ${back.lat}`)
    assert.ok(Math.abs(back.lon - lon) < 1e-6, `lon ${lon} → ${back.lon}`)
  }
})

test('normalizeLon ramène dans [-180, 180)', () => {
  assert.equal(normalizeLon(190), -170)
  assert.equal(normalizeLon(-190), 170)
  assert.equal(normalizeLon(180), -180)
  assert.ok(Math.abs(normalizeLon(539.5) - 179.5) < 1e-9)
})

test('déclinaison solaire : extrêmes aux solstices, nulle aux équinoxes', () => {
  const june = solarDeclination(new Date('2026-06-21T12:00:00Z'))
  const december = solarDeclination(new Date('2026-12-21T12:00:00Z'))
  const march = solarDeclination(new Date('2026-03-20T12:00:00Z'))
  assert.ok(june > 23 && june < 23.6, `juin = ${june}`)
  assert.ok(december < -23 && december > -23.6, `décembre = ${december}`)
  assert.ok(Math.abs(march) < 0.9, `mars = ${march}`)
})

test('point subsolaire : cohérent avec l\'heure UTC', () => {
  // À 12 h UTC, le Soleil est au zénith près du méridien de Greenwich.
  const noon = subsolarPoint(new Date('2026-03-20T12:00:00Z'))
  assert.ok(Math.abs(noon.lon) < 4, `lon = ${noon.lon}`)
  // À 0 h UTC, il est de l'autre côté du globe (~180°).
  const midnight = subsolarPoint(new Date('2026-03-20T00:00:00Z'))
  assert.ok(Math.abs(Math.abs(midnight.lon) - 180) < 4, `lon = ${midnight.lon}`)
})

test('jour / nuit : Paris à midi, Sydney la nuit', () => {
  const date = new Date('2026-06-21T12:00:00Z') // midi UTC, solstice d'été
  assert.equal(isDaylight(48.85, 2.35, date), true)
  assert.equal(isDaylight(-33.87, 151.21, date), false)

  // Au solstice de juin, le pôle Nord est éclairé 24 h/24.
  assert.ok(solarAltitude(89, 0, date) > 20)
  assert.ok(solarAltitude(-89, 0, date) < -20)
})

test('midi solaire : le Soleil est au plus haut pile au bon moment', () => {
  const date = new Date('2026-09-15T00:00:00Z')
  const noon = new Date('2026-09-15T12:00:00Z') // ~midi solaire moyen à Greenwich
  const morning = new Date('2026-09-15T06:00:00Z')
  assert.ok(solarAltitude(0, 0, noon) > solarAltitude(0, 0, morning))
  assert.ok(solarAltitude(0, 0, noon) > 60)
  assert.ok(Math.abs(solarAltitude(0, 0, morning)) < 15)
  void date
})

test('dayOfYear et direction du Soleil sont bornés', () => {
  assert.equal(dayOfYear(new Date('2026-01-01T00:00:00Z')), 1)
  assert.equal(dayOfYear(new Date('2026-12-31T00:00:00Z')), 365)
  const dir = sunDirection(new Date('2026-07-04T18:30:00Z'))
  assert.ok(Math.abs(Math.hypot(dir.x, dir.y, dir.z) - 1) < 1e-9)
})

test('orientation du globe : le lieu visé passe face caméra', () => {
  const cases: [number, number][] = [
    [0, 0],
    [48.85, 2.35],
    [-33.87, 151.21],
    [64.13, -21.9],
    [-54.8, -68.3],
  ]

  for (const [lat, lon] of cases) {
    const orientation = earthOrientation(lat, lon)
    // Face caméra : la position du lieu doit se retrouver sur +x.
    const up = applyMat3(orientation, latLonToVector3(lat, lon, 1))
    assert.ok(Math.abs(up.x - 1) < 1e-9, `lat ${lat} lon ${lon} → x = ${up.x}`)
    assert.ok(Math.abs(up.y) < 1e-9 && Math.abs(up.z) < 1e-9)

    // Le nord local doit pointer vers le haut de l'écran (+y).
    const latRad = lat * DEG
    const lonRad = lon * DEG
    const north = {
      x: -Math.sin(latRad) * Math.cos(lonRad),
      y: Math.cos(latRad),
      z: Math.sin(latRad) * Math.sin(lonRad),
    }
    const northOnScreen = applyMat3(orientation, north)
    assert.ok(Math.abs(northOnScreen.y - 1) < 1e-9, `nord ${lat}/${lon} → y = ${northOnScreen.y}`)

    // Une rotation reste une rotation (pas de miroir en prime).
    assert.ok(Math.abs(determinant(orientation) - 1) < 1e-9)
  }
})

test('l\'orientation au point (0, 0) est l\'identité', () => {
  const orientation = earthOrientation(0, 0)
  assert.deepEqual(
    orientation.map((v) => Math.round(v * 1e9) / 1e9),
    [1, 0, 0, 0, 1, 0, 0, 0, 1],
  )
})

test('le roulis tourne l\'image sans déplacer le lieu visé', () => {
  const lat = 48.85
  const lon = 2.35
  const rolled = earthOrientation(lat, lon, 30)
  const facing = applyMat3(rolled, latLonToVector3(lat, lon, 1))
  assert.ok(Math.abs(facing.x - 1) < 1e-9, `x = ${facing.x}`)
  assert.ok(Math.abs(determinant(rolled) - 1) < 1e-9)
})

test('distances et résolution au sol', () => {
  assert.equal(altitudeKm(1), 0)
  assert.ok(Math.abs(altitudeKm(1.1) - 637.1) < 0.01)

  const globe = altitudeKm(VIEWS.globe.distance)
  const close = altitudeKm(VIEWS.close.distance)
  assert.ok(globe > 9000, `globe = ${globe} km`)
  assert.ok(close < 1300, `vue rapprochée = ${close} km`)

  const mpp = metersPerPixel(VIEWS.close.distance, VIEWS.close.fov, 900)
  assert.ok(mpp > 100 && mpp < 2000, `m/px = ${mpp}`)
})

test('shotInfo décrit correctement la prise de vue', () => {
  const info = shotInfo(
    { lat: 48.85, lon: 2.35, distance: VIEWS.globe.distance },
    new Date('2026-06-21T12:00:00Z'),
    32,
    900,
  )
  assert.equal(info.isDay, true)
  assert.ok(info.altitude > 9000)
  assert.ok(info.metersPerPixel > 0)
  assert.ok(info.sunAltitude > 0)
})

/* --------------------------------------------------------------- la Lune */

test('la direction du Soleil calculée par les deux chemins coïncide', () => {
  // Chemin 1 : point subsolaire → vecteur.  Chemin 2 : écliptique → équatorial
  // → repère terrestre tournant.  Les deux doivent donner le même résultat :
  // c'est un contrôle croisé du repère et de l'heure sidérale.
  const dates = [
    new Date('2026-01-15T07:20:00Z'),
    new Date('2026-04-01T18:45:00Z'),
    new Date('2026-07-21T03:10:00Z'),
    new Date('2026-10-05T22:05:00Z'),
  ]
  for (const date of dates) {
    const subsolar = subsolarPoint(date)
    const fromSubsolar = latLonToVector3(subsolar.lat, subsolar.lon, 1)
    const fromEcliptic = eclipticToEarthFixed(sunTrueLongitude(date), 0, date)
    const dot =
      fromSubsolar.x * fromEcliptic.x + fromSubsolar.y * fromEcliptic.y + fromSubsolar.z * fromEcliptic.z
    const angle = Math.acos(Math.max(-1, Math.min(1, dot))) / DEG
    assert.ok(angle < 0.6, `écart de ${angle.toFixed(3)}° le ${date.toISOString()}`)
  }
})

test('la Lune tourne autour de la Terre en ~27 jours et change de phase', () => {
  const start = new Date('2026-03-01T00:00:00Z')
  const a = moonState(start)
  const week = moonState(new Date('2026-03-08T00:00:00Z'))
  const angle =
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          a.direction.x * week.direction.x + a.direction.y * week.direction.y + a.direction.z * week.direction.z,
        ),
      ),
    ) / DEG
  assert.ok(angle > 60 && angle < 130, `rotation de ${angle.toFixed(1)}° en une semaine`)

  // Sur un mois lunaire complet, la phase parcourt tout le cycle.
  const phases: number[] = []
  for (let i = 0; i < 30; i++) {
    phases.push(moonState(new Date(start.getTime() + i * 86_400_000)).phase)
  }
  assert.ok(Math.min(...phases) < 0.08, 'une nouvelle Lune doit apparaître')
  assert.ok(Math.max(...phases) > 0.92, 'une pleine Lune doit apparaître')
})

test('la phase de la Lune correspond à son élongation', () => {
  // Pleine Lune ≈ opposition au Soleil : les deux directions sont opposées.
  let best: { date: Date; phase: number; dot: number } | null = null
  for (let day = 0; day < 30; day++) {
    const date = new Date(Date.UTC(2026, 5, 1 + day, 12))
    const moon = moonState(date)
    const sun = sunDirection(date)
    const dot = moon.direction.x * sun.x + moon.direction.y * sun.y + moon.direction.z * sun.z
    if (!best || moon.phase > best.phase) best = { date, phase: moon.phase, dot }
  }
  assert.ok(best && best.dot < -0.85, `pleine Lune non opposée au Soleil (dot = ${best?.dot})`)
})

test('le champ visible et le détail de la carte sont cohérents', () => {
  const wide = visibleField(VIEWS.globe.distance, VIEWS.globe.fov, 16 / 9)
  const near = visibleField(VIEWS.close.distance, VIEWS.close.fov, 16 / 9)
  assert.ok(wide.widthKm > 12000, `globe : ${Math.round(wide.widthKm)} km de large`)
  assert.ok(near.widthKm < 8000, `rapproché : ${Math.round(near.widthKm)} km de large`)
  assert.ok(near.widthKm < wide.widthKm)

  // La carte NASA donne ~10 km par pixel : on ne le cache pas à l'utilisateur.
  const detail = mapKilometersPerPixel(0)
  assert.ok(detail > 8 && detail < 12, `${detail.toFixed(1)} km/pixel`)
  // Loin de l'équateur, les pixels s'affinent en longitude mais pas en latitude :
  // c'est la latitude qui fixe le détail réel.
  assert.ok(mapKilometersPerPixel(70) >= detail - 1e-9)
})
