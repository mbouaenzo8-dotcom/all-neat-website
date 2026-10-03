/* =========================================================================
   Tests des données de lieux : cohérence et recherche.
   ========================================================================= */

import test from 'node:test'
import assert from 'node:assert/strict'

import { MARVELS, PLACES, describeForSpeech, normalizeText, placeById, randomPlace, searchPlaces } from './locations.ts'

test('les lieux sont uniques et géographiquement valides', () => {
  const ids = new Set<string>()
  for (const place of PLACES) {
    assert.ok(!ids.has(place.id), `identifiant en double : ${place.id}`)
    ids.add(place.id)
    assert.ok(place.lat >= -90 && place.lat <= 90, `${place.id} : latitude ${place.lat}`)
    assert.ok(place.lon >= -180 && place.lon <= 180, `${place.id} : longitude ${place.lon}`)
    assert.ok(place.name.length > 1 && place.country.length > 1)
    assert.ok(place.note.length > 10, `${place.id} : note trop courte`)
  }
  assert.ok(PLACES.length >= 60, `${PLACES.length} lieux seulement`)
  assert.ok(MARVELS.length >= 20, `${MARVELS.length} merveilles seulement`)
})

test('les repères des merveilles tiennent dans l’écran', () => {
  // Les merveilles sont affichées à l'arrivée : leur cadrage ne doit pas être
  // celui du globe entier, sinon les étiquettes se marchent dessus.
  for (const marvel of MARVELS) {
    assert.notEqual(marvel.view, 'globe', `${marvel.id} est cadré au globe entier`)
    assert.ok(marvel.keywords.length > 0, `${marvel.id} n’a aucun mot-clé`)
  }
})

test('la recherche ignore les accents, la casse et les espaces', () => {
  assert.equal(normalizeText('  Chichén Itzá  '), 'chichen itza')
  assert.equal(searchPlaces('petra')[0]?.id, 'petra')
  assert.equal(searchPlaces('MACHU PICCHU')[0]?.id, 'machu-picchu')
  assert.equal(searchPlaces('tour eiffel')[0]?.id, 'tour-eiffel')
  assert.equal(searchPlaces('gizeh')[0]?.id, 'gizeh')
  assert.equal(searchPlaces('everest')[0]?.id, 'everest')
  assert.ok(searchPlaces('xyzabc').length === 0)
})

test('la recherche par pays ou par mot-clé fonctionne', () => {
  const japan = searchPlaces('japon').map((place) => place.id)
  assert.ok(japan.includes('fuji'))
  const islands = searchPlaces('islande').map((place) => place.id)
  assert.ok(islands.includes('vatnajokull') || islands.includes('reykjavik'))
  assert.ok(searchPlaces('rio').some((place) => place.id === 'rio' || place.id === 'christ-redempteur'))
})

test('placeById et randomPlace restent dans les clous', () => {
  assert.equal(placeById('paris')?.name, 'Paris')
  assert.equal(placeById('inexistant'), null)

  // Générateur déterministe : on vérifie que l'exclusion est respectée.
  const first = randomPlace([], () => 0)
  const second = randomPlace([], () => 0.999999)
  assert.notEqual(first.id, second.id)

  const excluded = randomPlace([first.id], () => 0)
  assert.notEqual(excluded.id, first.id)

  // Si l'on exclut tout, on retombe sur la liste complète plutôt que rien.
  const everything = PLACES.map((place) => place.id)
  assert.ok(randomPlace(everything, () => 0))
})

test('le texte lu par la synthèse vocale cite le lieu', () => {
  const place = placeById('sydney')
  assert.ok(place)
  const speech = describeForSpeech(place)
  assert.match(speech, /Sydney/)
  assert.match(speech, /Australie/)
  assert.match(speech, /-33\.9 degrés/)
})
