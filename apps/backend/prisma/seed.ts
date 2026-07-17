import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function futureDate(daysFromNow: number, utcHour: number, utcMinute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(utcHour, utcMinute, 0, 0);
  return date;
}

async function main() {
  await prisma.event.upsert({
    where: { id: 'seed-badminton-saturday' },
    create: {
      id: 'seed-badminton-saturday',
      title: 'Saturday Badminton',
      description: 'Small doubles rotation for women getting back into sport.',
      city: 'Bangalore',
      locationName: 'Indiranagar Sports Arena',
      startsAt: futureDate(7, 2, 30),
      capacity: 8,
      difficulty: 'BEGINNER',
      interests: ['Badminton', 'Fitness'],
      chatThread: { create: { type: 'EVENT' } },
    },
    update: {
      description: 'Small doubles rotation for women getting back into sport.',
      city: 'Bangalore',
      locationName: 'Indiranagar Sports Arena',
      startsAt: futureDate(7, 2, 30),
      capacity: 8,
      difficulty: 'BEGINNER',
      interests: ['Badminton', 'Fitness'],
    },
  });

  await prisma.event.upsert({
    where: { id: 'seed-book-coffee' },
    create: {
      id: 'seed-book-coffee',
      title: 'Coffee & Book Swap',
      description: 'Bring one book, leave with a new reading buddy.',
      city: 'Bangalore',
      locationName: 'Church Street',
      startsAt: futureDate(11, 13),
      capacity: 10,
      difficulty: 'SOCIAL',
      interests: ['Books', 'Coffee'],
      chatThread: { create: { type: 'EVENT' } },
    },
    update: {
      description: 'Bring one book, leave with a new reading buddy.',
      city: 'Bangalore',
      locationName: 'Church Street',
      startsAt: futureDate(11, 13),
      capacity: 10,
      difficulty: 'SOCIAL',
      interests: ['Books', 'Coffee'],
    },
  });

  await prisma.circle.upsert({
    where: { id: 'seed-running-six-weeks' },
    create: {
      id: 'seed-running-six-weeks',
      title: 'Six-week Running Crew',
      description: 'Same 6 women, same route, every Saturday morning.',
      city: 'Bangalore',
      locationName: 'Koramangala',
      startsAt: futureDate(14, 2, 30),
      schedule: 'Saturdays, 8:00 AM',
      durationWeeks: 6,
      capacity: 6,
      difficulty: 'BEGINNER',
      interests: ['Running', 'Fitness'],
      chatThread: { create: { type: 'CIRCLE' } },
    },
    update: {
      description: 'Same 6 women, same route, every Saturday morning.',
      city: 'Bangalore',
      locationName: 'Koramangala',
      startsAt: futureDate(14, 2, 30),
      schedule: 'Saturdays, 8:00 AM',
      durationWeeks: 6,
      capacity: 6,
      difficulty: 'BEGINNER',
      interests: ['Running', 'Fitness'],
    },
  });

  await prisma.circle.upsert({
    where: { id: 'seed-makers-night' },
    create: {
      id: 'seed-makers-night',
      title: 'Makers Night',
      description: 'A recurring table for low-pressure creative projects.',
      city: 'Bangalore',
      locationName: 'HSR Layout',
      startsAt: futureDate(18, 13, 30),
      schedule: 'Wednesdays, 7:00 PM',
      durationWeeks: 4,
      capacity: 8,
      difficulty: 'FOCUSED',
      interests: ['Painting', 'Crafts'],
      chatThread: { create: { type: 'CIRCLE' } },
    },
    update: {
      description: 'A recurring table for low-pressure creative projects.',
      city: 'Bangalore',
      locationName: 'HSR Layout',
      startsAt: futureDate(18, 13, 30),
      schedule: 'Wednesdays, 7:00 PM',
      durationWeeks: 4,
      capacity: 8,
      difficulty: 'FOCUSED',
      interests: ['Painting', 'Crafts'],
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
