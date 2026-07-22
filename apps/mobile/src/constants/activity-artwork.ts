import { ImageSourcePropType } from 'react-native';

type ActivityArtworkInput = {
  coverImageUrl?: string;
  interests: string[];
  title: string;
};

export const activityArtwork = {
  books: require('../../assets/home/book-circle.webp'),
  booksHero: require('../../assets/home/coffee-books-hero.webp'),
  booksPlan: require('../../assets/home/book-swap-plan-v2.webp'),
  empty: require('../../assets/home/empty-gatherings.webp'),
  pottery: require('../../assets/home/pottery-hero.webp'),
  walk: require('../../assets/home/walk-chai.webp'),
} satisfies Record<string, ImageSourcePropType>;

export function resolveActivityArtwork(
  activity: ActivityArtworkInput,
): ImageSourcePropType {
  if (activity.coverImageUrl) {
    return { uri: activity.coverImageUrl };
  }

  const searchText =
    `${activity.title} ${activity.interests.join(' ')}`.toLowerCase();

  if (
    searchText.includes('pottery') ||
    searchText.includes('clay') ||
    searchText.includes('ceramic')
  ) {
    return activityArtwork.pottery;
  }

  if (
    searchText.includes('walk') ||
    searchText.includes('run') ||
    searchText.includes('fitness') ||
    searchText.includes('park')
  ) {
    return activityArtwork.walk;
  }

  return activityArtwork.booksHero;
}

export function resolveActivityCardArtwork(
  activity: ActivityArtworkInput,
): ImageSourcePropType {
  if (activity.coverImageUrl) {
    return { uri: activity.coverImageUrl };
  }

  const searchText =
    `${activity.title} ${activity.interests.join(' ')}`.toLowerCase();

  if (
    searchText.includes('pottery') ||
    searchText.includes('clay') ||
    searchText.includes('ceramic')
  ) {
    return activityArtwork.pottery;
  }

  if (
    searchText.includes('walk') ||
    searchText.includes('run') ||
    searchText.includes('fitness') ||
    searchText.includes('park')
  ) {
    return activityArtwork.walk;
  }

  return activityArtwork.books;
}

export function resolveActivityPlanArtwork(
  activity: ActivityArtworkInput,
): ImageSourcePropType {
  if (activity.coverImageUrl) {
    return { uri: activity.coverImageUrl };
  }

  const searchText =
    `${activity.title} ${activity.interests.join(' ')}`.toLowerCase();

  if (
    searchText.includes('pottery') ||
    searchText.includes('clay') ||
    searchText.includes('ceramic')
  ) {
    return activityArtwork.pottery;
  }

  if (
    searchText.includes('walk') ||
    searchText.includes('run') ||
    searchText.includes('fitness') ||
    searchText.includes('park')
  ) {
    return activityArtwork.walk;
  }

  return activityArtwork.booksPlan;
}
