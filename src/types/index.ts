export interface Service {
  slug: string;
  name: string;
  category: 'residential' | 'commercial' | 'specialty';
  summary: string;
  description: string;
  bullets: string[];
  icon: 'home' | 'sparkles' | 'boxes' | 'building' | 'window' | 'spray';
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type Testimonial =
  | {
      isPlaceholder: true;
      quote: string;
      attribution: string;
    }
  | {
      isPlaceholder: false;
      quote: string;
      attribution: string;
      source: string;
      sourceUrl: string;
      stars: number;
    };

export interface ServiceAreaGroup {
  state: string;
  cities: string[];
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface WhyPoint {
  title: string;
  description: string;
  icon: 'target' | 'calendar' | 'badge' | 'message' | 'sliders' | 'heart';
}
