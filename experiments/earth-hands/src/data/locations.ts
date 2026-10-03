/* =========================================================================
   locations — lieux proposés par l'application.

   Coordonnées réelles (arrondies à ~1 km). Les « notes » sont volontairement
   factuelles et vérifiables ; l'image, elle, reste une photo satellite de la
   NASA (environ 10 km par pixel) : voir le champ affiché dans l'interface.
   ========================================================================= */

import type { ViewName } from '../orbit/celestial.ts'

export interface Place {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  /** Cadrage conseillé à l'arrivée. */
  view: ViewName
  /** Une phrase de contexte, affichée dans la fiche du lieu. */
  note: string
  /** Mots-clés pour la recherche (accents ignorés). */
  keywords: string[]
  /** Merveille mise en avant dans le carrousel. */
  marvel: boolean
}

/** [id, nom, pays, lat, lon, cadrage, note, mots-clés, merveille ?] */
type Row = [
  string,
  string,
  string,
  number,
  number,
  ViewName,
  string,
  string[],
  boolean?,
]

const MERVEILLES: Row[] = [
  ['tour-eiffel', 'Tour Eiffel', 'France', 48.86, 2.29, 'close', '330 m de haut, achevée en 1889 pour l’Exposition universelle.', ['paris', 'eiffel', 'france'], true],
  ['colisee', 'Colisée', 'Italie', 41.89, 12.49, 'close', 'Amphithéâtre romain inauguré en 80 apr. J.-C.', ['rome', 'italie'], true],
  ['muraille', 'Grande Muraille (Badaling)', 'Chine', 40.36, 116.02, 'close', 'Tronçon le plus visité, à 70 km au nord-ouest de Pékin.', ['muraille', 'chine', 'great wall'], true],
  ['machu-picchu', 'Machu Picchu', 'Pérou', -13.16, -72.55, 'close', 'Cité inca du XVe siècle, à 2 430 m d’altitude.', ['inca', 'perou', 'andes'], true],
  ['taj-mahal', 'Taj Mahal', 'Inde', 27.17, 78.04, 'close', 'Mausolée de marbre blanc achevé en 1653 à Agra.', ['inde', 'agra'], true],
  ['chichen-itza', 'Chichén Itzá', 'Mexique', 20.68, -88.57, 'close', 'Cité maya du Yucatán ; sa grande pyramide date du XIIe siècle.', ['maya', 'mexique'], true],
  ['petra', 'Pétra', 'Jordanie', 30.33, 35.44, 'close', 'Cité nabatéenne taillée à même le grès rose.', ['jordanie', 'nabateen'], true],
  ['christ-redempteur', 'Christ Rédempteur', 'Brésil', -22.95, -43.21, 'close', 'Statue de 30 m au sommet du Corcovado, à Rio.', ['rio', 'bresil'], true],
  ['alhambra', 'Alhambra', 'Espagne', 37.18, -3.59, 'close', 'Palais nasride dominant Grenade.', ['grenade', 'espagne', 'andalousie'], true],
  ['angkor', 'Angkor Wat', 'Cambodge', 13.41, 103.87, 'close', 'Immense temple khmer du XIIe siècle.', ['cambodge', 'khmer'], true],
  ['mont-saint-michel', 'Mont-Saint-Michel', 'France', 48.64, -1.51, 'close', 'Îlot fortifié de Normandie, abbaye fondée au VIIIe siècle.', ['normandie', 'bretagne', 'france'], true],
  ['stonehenge', 'Stonehenge', 'Royaume-Uni', 51.18, -1.83, 'close', 'Cercle mégalithique élevé vers 2500 av. J.-C.', ['angleterre', 'royaume-uni'], true],
  ['gizeh', 'Pyramides de Gizeh', 'Égypte', 29.98, 31.13, 'close', 'La grande pyramide, tombeau de Khéops, vers 2560 av. J.-C.', ['egypte', 'caire', 'kheops'], true],
  ['liberte', 'Statue de la Liberté', 'États-Unis', 40.69, -74.04, 'close', 'Offerte par la France, inaugurée en 1886.', ['new york', 'etats-unis'], true],
  ['sagrada-familia', 'Sagrada Família', 'Espagne', 41.40, 2.17, 'close', 'Basilique de Gaudí, en chantier depuis 1882.', ['barcelone', 'gaudi'], true],
  ['acropole', 'Acropole d’Athènes', 'Grèce', 37.97, 23.73, 'close', 'Le Parthénon y fut achevé en 438 av. J.-C.', ['grece', 'athenes', 'parthenon'], true],
  ['grande-barriere', 'Grande Barrière de corail', 'Australie', -18.29, 147.70, 'region', '2 300 km de récifs au large du Queensland.', ['recif', 'australie', 'corail'], true],
  ['grand-canyon', 'Grand Canyon', 'États-Unis', 36.10, -112.11, 'region', 'Jusqu’à 1 800 m de profondeur, creusé par le Colorado.', ['colorado', 'arizona'], true],
  ['kilimandjaro', 'Kilimandjaro', 'Tanzanie', -3.07, 37.36, 'region', '5 895 m : point culminant de l’Afrique.', ['tanzanie', 'afrique'], true],
  ['everest', 'Everest', 'Népal / Chine', 27.99, 86.93, 'region', '8 849 m : point culminant du monde.', ['himalaya', 'nepal', 'tibet'], true],
  ['niagara', 'Chutes du Niagara', 'Canada / États-Unis', 43.08, -79.07, 'close', 'Chute de 51 m à la frontière canado-américaine.', ['canada', 'ontario'], true],
  ['victoria', 'Chutes Victoria', 'Zambie / Zimbabwe', -17.92, 25.86, 'close', '« La fumée qui gronde » : 108 m de haut sur le Zambèze.', ['zambeze', 'afrique'], true],
  ['uyuni', 'Salar d’Uyuni', 'Bolivie', -20.13, -67.49, 'region', 'Le plus grand désert de sel du monde.', ['bolivie', 'sel', 'altiplano'], true],
  ['uluru', 'Uluru', 'Australie', -25.34, 131.03, 'close', 'Monolithe de grès de 348 m, au centre du pays.', ['ayers rock', 'australie'], true],
  ['baikal', 'Lac Baïkal', 'Russie', 53.50, 108.20, 'region', 'Le plus profond des lacs : 1 642 m.', ['siberie', 'russie'], true],
  ['vatnajokull', 'Vatnajökull', 'Islande', 64.41, -16.80, 'region', 'Calotte glaciaire de 8 100 km² dans le sud-est de l’Islande.', ['islande', 'glacier'], true],
  ['fuji', 'Mont Fuji', 'Japon', 35.36, 138.73, 'close', '3 776 m, volcan sacré et point culminant du Japon.', ['japon', 'volcan'], true],
  ['mer-morte', 'Mer Morte', 'Israël / Jordanie', 31.50, 35.47, 'region', 'Le point émergé le plus bas du globe : −430 m.', ['israel', 'jordanie'], true],
  ['amazonie', 'Amazonie (Manaus)', 'Brésil', -3.12, -60.02, 'region', 'Confluence du Rio Negro et du Solimões.', ['bresil', 'amazone', 'foret'], true],
  ['groenland', 'Calotte groenlandaise', 'Groenland', 72.00, -40.00, 'hemisphere', 'Près de 3 km de glace au centre de l’inlandsis.', ['groenland', 'glace', 'arctique'], true],
]

const VILLES: Row[] = [
  ['paris', 'Paris', 'France', 48.86, 2.35, 'region', 'Capitale française, sur la Seine.', ['france']],
  ['londres', 'Londres', 'Royaume-Uni', 51.51, -0.13, 'region', 'Capitale britannique, sur la Tamise.', ['royaume-uni', 'angleterre']],
  ['new-york', 'New York', 'États-Unis', 40.71, -74.01, 'region', 'À l’embouchure de l’Hudson.', ['etats-unis', 'manhattan']],
  ['tokyo', 'Tokyo', 'Japon', 35.68, 139.69, 'region', 'Capitale japonaise, baie de Tokyo.', ['japon']],
  ['sydney', 'Sydney', 'Australie', -33.87, 151.21, 'region', 'Port naturel de la côte est australienne.', ['australie']],
  ['rio', 'Rio de Janeiro', 'Brésil', -22.91, -43.17, 'region', 'Entre la baie de Guanabara et les montagnes.', ['bresil']],
  ['le-caire', 'Le Caire', 'Égypte', 30.04, 31.24, 'region', 'Capitale égyptienne, en amont du delta du Nil.', ['egypte', 'nil']],
  ['istanbul', 'Istanbul', 'Turquie', 41.01, 28.98, 'region', 'À cheval sur le Bosphore, entre Europe et Asie.', ['turquie', 'bosphore']],
  ['moscou', 'Moscou', 'Russie', 55.76, 37.62, 'region', 'Capitale russe, sur la Moskova.', ['russie']],
  ['pekin', 'Pékin', 'Chine', 39.90, 116.41, 'region', 'Capitale chinoise, au nord de la plaine du Nord.', ['chine']],
  ['delhi', 'Delhi', 'Inde', 28.61, 77.21, 'region', 'Capitale indienne, sur la Yamuna.', ['inde']],
  ['mumbai', 'Mumbai', 'Inde', 19.08, 72.88, 'region', 'Sept îles réunies face à la mer d’Arabie.', ['inde', 'bombay']],
  ['singapour', 'Singapour', 'Singapour', 1.35, 103.82, 'region', 'Cité-État à la pointe de la péninsule malaise.', ['asie']],
  ['dubai', 'Dubaï', 'Émirats arabes unis', 25.20, 55.27, 'region', 'Entre désert et golfe Persique.', ['emirats']],
  ['los-angeles', 'Los Angeles', 'États-Unis', 34.05, -118.24, 'region', 'Bassin côtier du sud de la Californie.', ['etats-unis', 'californie']],
  ['mexico', 'Mexico', 'Mexique', 19.43, -99.13, 'region', 'Vallée d’altitude, à 2 240 m.', ['mexique']],
  ['sao-paulo', 'São Paulo', 'Brésil', -23.55, -46.63, 'region', 'Plus grande agglomération du Brésil.', ['bresil']],
  ['buenos-aires', 'Buenos Aires', 'Argentine', -34.60, -58.38, 'region', 'Sur la rive sud du Río de la Plata.', ['argentine']],
  ['lagos', 'Lagos', 'Nigeria', 6.52, 3.38, 'region', 'Lagune et golfe de Guinée.', ['nigeria', 'afrique']],
  ['nairobi', 'Nairobi', 'Kenya', -1.29, 36.82, 'region', 'À 1 800 m d’altitude, près du Rift.', ['kenya', 'afrique']],
  ['le-cap', 'Le Cap', 'Afrique du Sud', -33.92, 18.42, 'region', 'Entre Table Mountain et l’Atlantique.', ['afrique du sud']],
  ['casablanca', 'Casablanca', 'Maroc', 33.57, -7.59, 'region', 'Façade atlantique du Maroc.', ['maroc']],
  ['berlin', 'Berlin', 'Allemagne', 52.52, 13.40, 'region', 'Capitale allemande, sur la Spree.', ['allemagne']],
  ['rome', 'Rome', 'Italie', 41.90, 12.50, 'close', 'Capitale italienne, sur le Tibre.', ['italie']],
  ['madrid', 'Madrid', 'Espagne', 40.42, -3.70, 'region', 'Plateau castillan, à 650 m.', ['espagne']],
  ['amsterdam', 'Amsterdam', 'Pays-Bas', 52.37, 4.90, 'close', 'Canaux et polders du Zuiderzee.', ['pays-bas', 'hollande']],
  ['athenes', 'Athènes', 'Grèce', 37.98, 23.73, 'close', 'Bassin attique, face à la mer Égée.', ['grece']],
  ['stockholm', 'Stockholm', 'Suède', 59.33, 18.07, 'region', 'Quatorze îles entre lac et Baltique.', ['suede', 'scandinavie']],
  ['reykjavik', 'Reykjavík', 'Islande', 64.15, -21.94, 'region', 'Pointe sud-ouest de l’Islande.', ['islande']],
  ['toronto', 'Toronto', 'Canada', 43.65, -79.38, 'region', 'Rive nord du lac Ontario.', ['canada']],
  ['vancouver', 'Vancouver', 'Canada', 49.28, -123.12, 'region', 'Entre détroit et montagnes côtières.', ['canada']],
  ['chicago', 'Chicago', 'États-Unis', 41.88, -87.63, 'region', 'Rive sud-ouest du lac Michigan.', ['etats-unis']],
  ['san-francisco', 'San Francisco', 'États-Unis', 37.77, -122.42, 'close', 'Presqu’île et Golden Gate.', ['etats-unis', 'californie']],
  ['miami', 'Miami', 'États-Unis', 25.76, -80.19, 'region', 'Côte atlantique de la Floride.', ['etats-unis', 'floride']],
  ['bogota', 'Bogotá', 'Colombie', 4.71, -74.07, 'region', 'Haut plateau andin, à 2 640 m.', ['colombie']],
  ['lima', 'Lima', 'Pérou', -12.05, -77.04, 'region', 'Côte aride du Pacifique.', ['perou']],
  ['santiago', 'Santiago', 'Chili', -33.45, -70.67, 'region', 'Au pied de la cordillère des Andes.', ['chili']],
  ['jakarta', 'Jakarta', 'Indonésie', -6.21, 106.85, 'region', 'Delta de la rivière Ciliwung, à Java.', ['indonesie']],
  ['bangkok', 'Bangkok', 'Thaïlande', 13.76, 100.50, 'region', 'Plaine du Chao Phraya.', ['thailande']],
  ['hanoi', 'Hanoï', 'Viêt Nam', 21.03, 105.85, 'region', 'Delta du fleuve Rouge.', ['vietnam']],
  ['seoul', 'Séoul', 'Corée du Sud', 37.57, 126.98, 'region', 'Bassin du fleuve Han.', ['coree']],
  ['hong-kong', 'Hong Kong', 'Chine', 22.32, 114.17, 'close', 'Port naturel entre île et continent.', ['chine']],
  ['taipei', 'Taipei', 'Taïwan', 25.03, 121.57, 'region', 'Cuvette entourée de montagnes.', ['taiwan']],
  ['auckland', 'Auckland', 'Nouvelle-Zélande', -36.85, 174.76, 'region', 'Isthme entre deux baies.', ['nouvelle-zelande']],
  ['honolulu', 'Honolulu', 'États-Unis', 21.31, -157.86, 'region', 'Côte sud d’Oahu, à Hawaï.', ['hawaii']],
  ['tbilissi', 'Tbilissi', 'Géorgie', 41.72, 44.78, 'region', 'Vallée de la Koura, au pied du Caucase.', ['caucase']],
  ['samarcande', 'Samarcande', 'Ouzbékistan', 39.65, 66.98, 'region', 'Oasis de la route de la soie.', ['ouzbekistan', 'route de la soie']],
  ['antananarivo', 'Antananarivo', 'Madagascar', -18.88, 47.51, 'region', 'Hautes terres malgaches.', ['madagascar']],
  ['dakar', 'Dakar', 'Sénégal', 14.72, -17.47, 'region', 'Presqu’île du Cap-Vert.', ['senegal']],
  ['iquitos', 'Iquitos', 'Pérou', -3.75, -73.25, 'close', 'Seule grande ville sans route, en Amazonie.', ['perou', 'amazone']],
]

function toPlace(row: Row): Place {
  const [id, name, country, lat, lon, view, note, keywords, marvel] = row
  return { id, name, country, lat, lon, view, note, keywords: keywords ?? [], marvel: marvel ?? false }
}

export const PLACES: Place[] = [...MERVEILLES, ...VILLES].map(toPlace)

export const MARVELS: Place[] = PLACES.filter((place) => place.marvel)

/** Normalise une chaîne : minuscules, sans accents, sans espaces superflus. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Recherche dans le nom, le pays, les mots-clés et la note. */
export function searchPlaces(query: string, limit = 6): Place[] {
  const needle = normalizeText(query)
  if (!needle) return []
  const words = needle.split(' ').filter((word) => word.length > 1)

  const scored = PLACES.map((place) => {
    const haystack = normalizeText(
      [place.name, place.country, place.note, ...place.keywords].join(' '),
    )
    let score = 0
    if (haystack.includes(needle)) score += 6
    for (const word of words) {
      if (normalizeText(place.name).includes(word)) score += 4
      else if (haystack.includes(word)) score += 1
    }
    if (place.marvel) score += 0.4
    return { place, score }
  })
    .filter((entry) => entry.score > 1)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((entry) => entry.place)
}

export function placeById(id: string): Place | null {
  return PLACES.find((place) => place.id === id) ?? null
}

/** Lieu au hasard, en évitant éventuellement certains identifiants. */
export function randomPlace(exclude: string[] = [], rnd: () => number = Math.random): Place {
  const pool = PLACES.filter((place) => !exclude.includes(place.id))
  const list = pool.length > 0 ? pool : PLACES
  return list[Math.min(list.length - 1, Math.floor(rnd() * list.length))]
}

/** Texte prêt à être lu par la synthèse vocale (repli si la recherche échoue). */
export function describeForSpeech(place: Place): string {
  return `${place.name}, ${place.country}. Latitude ${place.lat.toFixed(1)} degrés, longitude ${place.lon.toFixed(1)} degrés.`
}
