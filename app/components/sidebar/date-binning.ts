import { format, isAfter, isThisWeek, isThisYear, isToday, isYesterday, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ChatHistoryItem } from '~/lib/persistence';

type Bin = { category: string; items: ChatHistoryItem[] };

export function binDates(_list: ChatHistoryItem[]) {
  const list = _list.toSorted((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const binLookup: Record<string, Bin> = {};
  const bins: Array<Bin> = [];

  list.forEach((item) => {
    const category = dateCategory(new Date(item.timestamp));

    if (!(category in binLookup)) {
      const bin = {
        category,
        items: [item],
      };

      binLookup[category] = bin;

      bins.push(bin);
    } else {
      binLookup[category].items.push(item);
    }
  });

  return bins;
}

function dateCategory(date: Date) {
  if (isToday(date)) {
    return 'Aujourd\'hui';
  }

  if (isYesterday(date)) {
    return 'Hier';
  }

  if (isThisWeek(date)) {
    // Format day of week in French with capitalized first letter
    return capitalizeFirstLetter(format(date, 'eeee', { locale: fr }));
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  if (isAfter(date, thirtyDaysAgo)) {
    return '30 derniers jours';
  }

  if (isThisYear(date)) {
    // Month name in French with capitalized first letter
    return capitalizeFirstLetter(format(date, 'MMMM', { locale: fr }));
  }

  // Month and year in French with capitalized month name
  return capitalizeFirstLetter(format(date, 'MMMM yyyy', { locale: fr }));
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}