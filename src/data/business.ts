export const business = {
  name: 'All Neat Cleaning Services',
  legalNames: ['All Neat Inc.', 'All Neat LLC'],
  phoneDisplay: '(202) 499-4572',
  phoneHref: 'tel:+12024994572',
  smsHref: 'sms:+12024994572',
  city: 'Silver Spring, MD',
  region: 'the greater Washington, D.C. metropolitan area',
  // NOTE: Public listings disagree on a physical address (12726 Feldon St vs.
  // 12119 Heritage Park Cir, both Silver Spring, MD 20906). Neither has been
  // verified, so no street address is displayed on this site. Confirm the
  // correct address with the business owner before adding one.
  addressVerified: false,
} as const;
