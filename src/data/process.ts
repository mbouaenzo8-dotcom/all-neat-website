import type { ProcessStep, WhyPoint } from '../types';

export const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: 'Request a Free Estimate',
    description: 'Tell us about your space and what you need. Estimates are free with no obligation.',
  },
  {
    step: 2,
    title: 'Discuss Your Cleaning Needs',
    description: 'We’ll go over scope, scheduling, and any details specific to your home or business.',
  },
  {
    step: 3,
    title: 'Enjoy a Cleaner Space',
    description: 'Sit back while your home or workplace gets the attention it deserves.',
  },
];

export const whyPoints: WhyPoint[] = [
  {
    title: 'Attention to Detail',
    description: 'Customers consistently describe the team as thorough and careful with the details.',
    icon: 'target',
  },
  {
    title: 'Reliable Scheduling',
    description: 'Punctuality and dependability are recurring themes in customer feedback.',
    icon: 'calendar',
  },
  {
    title: 'Professional Service',
    description: 'A professional, friendly team that customers have relied on for repeat visits.',
    icon: 'badge',
  },
  {
    title: 'Responsive Communication',
    description: 'Customers point to clear communication and responsive follow-up throughout the process.',
    icon: 'message',
  },
  {
    title: 'Customized Solutions',
    description: 'Residential and commercial cleaning built around the specifics of your space.',
    icon: 'sliders',
  },
  {
    title: 'Customer-Focused Experience',
    description: 'A track record of customers who are happy with the result and recommend the service to others.',
    icon: 'heart',
  },
];
