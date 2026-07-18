export const supportedCities = [
  {
    name: 'Bangalore',
    status: 'Available now',
  },
] as const;

export type SupportedCity = (typeof supportedCities)[number]['name'];
