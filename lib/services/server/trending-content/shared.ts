export interface TrendingOptions {
  limit?: number;
  minSeeders?: number;
  minQuality?: string;
  daysSinceRelease?: number;
  excludeAdult?: boolean;
}

export function isAdultContent(title: string): boolean {
  const adultKeywords = [
    'xxx', 'porn', 'adult', 'sex', 'erotic', 'nude', 'naked',
    'hentai', 'brazzers', 'playboy', 'penthouse',
  ];
  const lowerTitle = title.toLowerCase();
  return adultKeywords.some(keyword => lowerTitle.includes(keyword));
}
