export type DiscoveryItem = {
  id: string;
  category: 'event' | 'circle' | 'workshop' | 'tip';
  remoteId?: string;
  hostId?: string;
  activityStatus?: 'CANCELLED' | 'COMPLETED' | 'DRAFT' | 'PUBLISHED';
  cancellationReason?: string | null;
  capacity?: number;
  membershipStatus?:
    'REQUESTED' | 'APPROVED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  startsAt?: string;
  title: string;
  location: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  time: string;
  seats?: number;
  duration?: string;
  schedule?: string;
  difficulty?: 'Easy' | 'Beginner' | 'Social' | 'Focused';
  interests: string[];
  host: string;
  summary: string;
};

export const weeklyEvents: DiscoveryItem[] = [
  {
    id: 'badminton-saturday',
    category: 'event',
    title: 'Saturday Badminton',
    location: 'Indiranagar Sports Arena',
    time: 'Sat, 8:00 AM',
    seats: 2,
    difficulty: 'Beginner',
    interests: ['Badminton', 'Fitness'],
    host: 'Hosted by Niva',
    summary: 'Small doubles rotation for women getting back into sport.',
  },
  {
    id: 'book-coffee',
    category: 'event',
    title: 'Coffee & Book Swap',
    location: 'Church Street',
    time: 'Wed, 6:30 PM',
    seats: 4,
    difficulty: 'Social',
    interests: ['Books', 'Coffee'],
    host: 'Hosted by Meera',
    summary: 'Bring one book, leave with a new reading buddy.',
  },
  {
    id: 'cubbon-yoga',
    category: 'event',
    title: 'Yoga Reset',
    location: 'Cubbon Park',
    time: 'Sun, 7:00 AM',
    seats: 3,
    difficulty: 'Easy',
    interests: ['Yoga', 'Wellness'],
    host: 'Hosted by Niva',
    summary: 'Gentle session followed by breakfast nearby.',
  },
];

export const circles: DiscoveryItem[] = [
  {
    id: 'running-six-weeks',
    category: 'circle',
    title: 'Six-week Running Crew',
    location: 'Kora Circle',
    time: 'Starts Jul 18',
    seats: 1,
    duration: '6 weeks',
    difficulty: 'Beginner',
    interests: ['Running', 'Fitness'],
    host: 'Led by Aditi',
    summary: 'Same 6 women, same route, every Saturday morning.',
  },
  {
    id: 'makers-night',
    category: 'circle',
    title: 'Makers Night',
    location: 'HSR Layout',
    time: 'Starts Jul 22',
    seats: 3,
    duration: '4 weeks',
    difficulty: 'Focused',
    interests: ['Painting', 'Crafts'],
    host: 'Led by Niva',
    summary: 'A recurring table for low-pressure creative projects.',
  },
];

export const workshops: DiscoveryItem[] = [
  {
    id: 'self-defense',
    category: 'workshop',
    title: 'Safety Basics',
    location: 'Koramangala Studio',
    time: 'Tue, 7:00 PM',
    seats: 5,
    difficulty: 'Beginner',
    interests: ['Self-defense', 'Safety'],
    host: 'Hosted by Niva',
    summary: 'Practical safety workshop with a women-led training team.',
  },
  {
    id: 'career-circle',
    category: 'workshop',
    title: 'Career Reset Table',
    location: 'MG Road',
    time: 'Thu, 6:00 PM',
    seats: 6,
    difficulty: 'Social',
    interests: ['Career', 'Networking'],
    host: 'Hosted by Kavya',
    summary: 'Structured prompts for women navigating a new work chapter.',
  },
];

export const safetyTips = [
  'Meet in public places for first sessions.',
  'Keep cohort chats focused on coordination.',
  'Tell the host early if something feels uncomfortable.',
];

export const allDiscoveryItems = [...weeklyEvents, ...circles, ...workshops];
