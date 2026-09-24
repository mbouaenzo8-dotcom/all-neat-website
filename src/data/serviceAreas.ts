import type { ServiceAreaGroup } from '../types/index.ts';

export const serviceAreas: ServiceAreaGroup[] = [
  {
    state: 'Maryland',
    cities: [
      'Silver Spring',
      'Bethesda',
      'Chevy Chase',
      'Rockville',
      'Kensington',
      'Gaithersburg',
      'North Potomac',
      'Olney',
      'Poolesville',
    ],
  },
  {
    state: 'Washington, D.C.',
    cities: ['Washington, D.C.'],
  },
  {
    state: 'Northern Virginia',
    cities: ['Arlington', 'Alexandria', 'Falls Church', 'McLean', 'Tysons Corner', 'Vienna'],
  },
];
