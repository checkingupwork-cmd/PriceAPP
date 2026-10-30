import { BranchRecord, LiveBranchStatus, CustomCheckResult } from '../types/branches';

export const BRANCHES_DATA: BranchRecord[] = [
  {
    id: 'b1',
    name: 'Al Qouz Test Center',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/jTPjAZb8HQzeySTh6',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b2',
    name: 'Deira City Center',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/5oEMDbfsG8Dx5hJG6',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b3',
    name: 'Meaisem City Center',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/tiT6QQfcqmte36at5',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b4',
    name: 'Hor Al Anz 1',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/5Abk2Yu2dYpgf8cYA',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b5',
    name: 'Hor Al Anz 2',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/f5AcVRDEaXbMTYQD7',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b6',
    name: 'Sonapur',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/sdWW9RuwvPX42ij56',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b7',
    name: 'Dubai Investment Park 1',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/TX1tScNJyUxLG3iT6',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b8',
    name: 'Dubai Investment Park 2',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/5wJRUy3DY2Kegcse9',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b9',
    name: 'Al Qouz 4',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/GPsYxiooLQ7nomNs9',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b10',
    name: 'Al Qouz Industrial Area 2',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/PRDqmQJ1rba8auej6',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b11',
    name: 'Jebal Ali industrial Area 1',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/cVnntz7Nw41kRhcw5',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b12',
    name: 'Al Saleem Mall - Jebel Ali',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/fMCjm1LcAR1N55Ki7',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b13',
    name: 'Dubai Silicon Oasis',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/qyyvkEoijHASV7dk7',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b14',
    name: 'Saphire Mall',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/ie9nUavgesFoJTsY7',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b15',
    name: 'Dragon Mart 2',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/pMGNMgTBz9L8vNEA6',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b16',
    name: 'International City',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/MvKQsbYoCNVzdA2y8',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b17',
    name: 'Discovery Garden',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/N9q8PdG5Lhn9kugn9',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b18',
    name: 'Al Nahda 1',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/WCgXBf8VdTiXu8Um9',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b19',
    name: 'Al Karama ',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/1Cysszgq1u3bahty6',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b20',
    name: 'Circle Mall',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/NdDqbeWFmYkc6BG17',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b21',
    name: 'Ibn batutta Mall',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/mbEMAFeReEwn7ayi7',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b22',
    name: 'Satwa',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/FqQ9uQ12Y5Yp4rm2A',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b23',
    name: 'Dubai Mall',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/4dLXnTRwKJFyPGAaA',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b24',
    name: 'Mall of Emirates',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/YMYUaL3Bz9ADCz997',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b25',
    name: 'Dubai Internet City',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/EvY5RcyRGXRKdwAz9',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b26',
    name: 'Nesto Mall Jebel Ali',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/zkJYQGMio3AJQGTJ7',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b27',
    name: 'Grand Mall Jebel Ali',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/LxgF5NGv41TGqHpt5',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b28',
    name: 'Frij Murar',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/DtRAEppgW3HpmERb8',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b29',
    name: 'CIG Mall',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/TCUD4MLPxfJK4L5Q9',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b30',
    name: 'Al Fahidi',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/uV9ZY3Df38iT1Pvf8',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b31',
    name: 'Al Karama New',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/2DNrkaKGsjyc6mKF9',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b32',
    name: 'Hor Al Branch New',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/29zc2d2ufdciaxZt6',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b33',
    name: 'Lulu Al Barsha',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/rzQqjum3bERgUaHw6',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b34',
    name: 'Nesto Burj Al Nahar Mall',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/2JRX1ywWgUq8SSob8',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b35',
    name: 'Union Corp - Al Aweer',
    zone: 'Yellow',
    locationUrl: 'https://maps.app.goo.gl/XuQg6C2ZJtrESzrF7',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b36',
    name: 'Lulu Hypermarket Al Warqa',
    zone: 'Green',
    locationUrl: 'https://maps.app.goo.gl/SyCBNvfT7xPVGcnW9',
    comment: '',
    hasRestrictions: false,
  },
  {
    id: 'b37',
    name: 'Lulu Hypermarket Rashidiya',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/sfF5FbZ9mS2cKBca9',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b38',
    name: 'Lulu Hypermarket Al Qusais',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/suGSnkb6QKjiyvZE6',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
  {
    id: 'b39',
    name: 'Al Jafiliya resgistration Office',
    zone: 'Red',
    locationUrl: 'https://maps.app.goo.gl/yE3FXMZFcpmgX7Aq9',
    comment: 'Monday to Thursday 6pm to 8pm road training is not permitted',
    hasRestrictions: true,
  },
];

/**
 * Dynamically parses restriction rules from a branch comment.
 * If ambiguous or non-standard, marks as isAmbiguous: true.
 */
export function parseCommentRestriction(comment: string): {
  hasRestriction: boolean;
  isAmbiguous: boolean;
  restrictedDays: string[];
  startMinute: number;
  endMinute: number;
  daysSummary: string;
  timeSummary: string;
} {
  const trimmed = comment.trim();
  if (!trimmed) {
    return {
      hasRestriction: false,
      isAmbiguous: false,
      restrictedDays: [],
      startMinute: 0,
      endMinute: 0,
      daysSummary: 'No restrictions',
      timeSummary: 'All hours',
    };
  }

  const lower = trimmed.toLowerCase();

  // Words indicating a training restriction
  const restrictionKeywords = [
    'not permitted',
    'not allowed',
    'prohibited',
    'closed',
    'restricted',
    'no road training',
    'cannot practice',
  ];
  const hasRestrictionKeyword = restrictionKeywords.some((kw) => lower.includes(kw));

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMap: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
  };

  const restrictedDays: string[] = [];
  let daysSummary = '';

  // Look for day ranges like "Monday to Thursday" or "Mon-Thu"
  const dayRangeMatch = lower.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s*(?:to|-)\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/
  );

  if (dayRangeMatch) {
    const startDayIndex = dayMap[dayRangeMatch[1]];
    const endDayIndex = dayMap[dayRangeMatch[2]];
    if (startDayIndex !== undefined && endDayIndex !== undefined) {
      let curr = startDayIndex;
      while (true) {
        const dName = dayNames[curr];
        const capitalized = dName.charAt(0).toUpperCase() + dName.slice(1);
        restrictedDays.push(capitalized);
        if (curr === endDayIndex) break;
        curr = (curr + 1) % 7;
      }
      daysSummary = `${dayRangeMatch[1].charAt(0).toUpperCase() + dayRangeMatch[1].slice(1)} to ${dayRangeMatch[2].charAt(0).toUpperCase() + dayRangeMatch[2].slice(1)}`;
    }
  } else {
    // Check for individual days
    for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      if (lower.includes(d)) {
        restrictedDays.push(d.charAt(0).toUpperCase() + d.slice(1));
      }
    }
    if (restrictedDays.length > 0) {
      daysSummary = restrictedDays.join(', ');
    }
  }

  // Look for time range e.g. "6pm to 8pm", "6:00pm to 8:00pm", "6pm - 8pm", "18:00 to 20:00"
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = lower.match(timeRegex);

  let startMinute = 0;
  let endMinute = 0;
  let timeSummary = '';

  if (timeMatch) {
    let startHour = parseInt(timeMatch[1], 10);
    const startMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const endAmPm = timeMatch[6].toLowerCase();
    // If start doesn't specify am/pm, inherit from endAmPm (e.g. 6 to 8pm -> 6pm to 8pm)
    const startAmPm = timeMatch[3]?.toLowerCase() || endAmPm;

    let endHour = parseInt(timeMatch[4], 10);
    const endMin = timeMatch[5] ? parseInt(timeMatch[5], 10) : 0;

    if (startAmPm === 'pm' && startHour < 12) startHour += 12;
    if (startAmPm === 'am' && startHour === 12) startHour = 0;

    if (endAmPm === 'pm' && endHour < 12) endHour += 12;
    if (endAmPm === 'am' && endHour === 12) endHour = 0;

    startMinute = startHour * 60 + startMin;
    endMinute = endHour * 60 + endMin;

    const formatHour = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 === 0 ? 12 : h % 12;
      return `${dispH}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    timeSummary = `${formatHour(startHour, startMin)} – ${formatHour(endHour, endMin)}`;
  }

  // Check if ambiguous: if comment mentions road training / restrictions but couldn't parse day or time
  const hasTimeOrDayMention = dayRangeMatch !== null || timeMatch !== null || restrictedDays.length > 0;
  const isAmbiguous = (hasRestrictionKeyword && !timeMatch) || (hasRestrictionKeyword && restrictedDays.length === 0) || (!hasRestrictionKeyword && trimmed.length > 0 && !hasTimeOrDayMention);

  return {
    hasRestriction: hasRestrictionKeyword || trimmed.length > 0,
    isAmbiguous,
    restrictedDays,
    startMinute,
    endMinute,
    daysSummary: daysSummary || 'Unspecified Days',
    timeSummary: timeSummary || 'Unspecified Hours',
  };
}

/**
 * Evaluates live availability for a branch given a date in Asia/Dubai timezone.
 */
export function evaluateBranchAvailability(
  branch: BranchRecord,
  dubaiDate: Date
): LiveBranchStatus {
  if (!branch.hasRestrictions || !branch.comment.trim()) {
    return {
      status: 'AVAILABLE',
      statusLabel: 'AVAILABLE',
      reason: 'No restrictions specified',
      isRestrictedNow: false,
    };
  }

  const parsed = parseCommentRestriction(branch.comment);

  if (parsed.isAmbiguous) {
    return {
      status: 'MANUAL_CONFIRMATION_REQUIRED',
      statusLabel: 'MANUAL CONFIRMATION REQUIRED',
      reason: 'Restriction comment requires manual confirmation.',
      isRestrictedNow: true,
    };
  }

  // Parse Dubai weekday and time
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
  });
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const weekday = dayFormatter.format(dubaiDate); // "Monday"
  const timeStr = hourFormatter.format(dubaiDate); // "18:30" or "9:15"
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || '0', 10);
  const minutesSinceMidnight = hour * 60 + minute;

  const isDayRestricted = parsed.restrictedDays.includes(weekday);
  const isTimeRestricted =
    minutesSinceMidnight >= parsed.startMinute && minutesSinceMidnight < parsed.endMinute;

  if (isDayRestricted && isTimeRestricted) {
    return {
      status: 'NOT_AVAILABLE',
      statusLabel: 'NOT AVAILABLE',
      reason: `Road training is restricted on ${parsed.daysSummary} between ${parsed.timeSummary}.`,
      isRestrictedNow: true,
    };
  }

  return {
    status: 'AVAILABLE',
    statusLabel: 'AVAILABLE',
    reason: isDayRestricted
      ? `Currently outside the ${parsed.timeSummary} restriction window.`
      : `Unrestricted day (${weekday}).`,
    isRestrictedNow: false,
  };
}

/**
 * Evaluates custom availability check on a specific branch, date (YYYY-MM-DD), and time (HH:MM).
 */
export function evaluateBranchCustomCheck(
  branch: BranchRecord,
  dateStr: string,
  timeStr: string
): CustomCheckResult {
  // 1. Determine weekday in Dubai timezone for the selected calendar date
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Use UTC midday to avoid any daylight savings or offset shifts
  const targetDateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const selectedWeekday = weekdayFormatter.format(targetDateObj);
  const selectedDateFormatted = dateFormatter.format(targetDateObj);

  // 2. Parse time (HH:MM)
  const [hourPart, minPart] = timeStr.split(':');
  const hourNum = parseInt(hourPart || '0', 10);
  const minNum = parseInt(minPart || '0', 10);
  const totalMinutes = hourNum * 60 + minNum;

  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
  const selectedTimeFormatted = `${displayHour}:${minNum.toString().padStart(2, '0')} ${ampm} (${timeStr} GST)`;

  // 3. Evaluate restriction from branch comment
  if (!branch.hasRestrictions || !branch.comment.trim()) {
    return {
      branch,
      selectedDate: dateStr,
      selectedDateFormatted,
      selectedWeekday,
      selectedTime: timeStr,
      selectedTimeFormatted,
      status: 'AVAILABLE',
      statusLabel: 'AVAILABLE',
      explanation: 'Road training is permitted at this branch. No restrictions are specified.',
      comment: branch.comment || 'No restrictions specified',
    };
  }

  const parsed = parseCommentRestriction(branch.comment);

  if (parsed.isAmbiguous) {
    return {
      branch,
      selectedDate: dateStr,
      selectedDateFormatted,
      selectedWeekday,
      selectedTime: timeStr,
      selectedTimeFormatted,
      status: 'MANUAL_CONFIRMATION_REQUIRED',
      statusLabel: 'MANUAL CONFIRMATION REQUIRED',
      explanation:
        'The restriction comment contains special guidelines that cannot be reliably interpreted automatically. Please verify with institute operations.',
      comment: branch.comment,
    };
  }

  const isDayRestricted = parsed.restrictedDays.includes(selectedWeekday);
  const isTimeRestricted =
    totalMinutes >= parsed.startMinute && totalMinutes < parsed.endMinute;

  if (isDayRestricted && isTimeRestricted) {
    return {
      branch,
      selectedDate: dateStr,
      selectedDateFormatted,
      selectedWeekday,
      selectedTime: timeStr,
      selectedTimeFormatted,
      status: 'NOT_AVAILABLE',
      statusLabel: 'NOT AVAILABLE',
      explanation: `Road training is NOT permitted on ${selectedWeekday} at ${displayHour}:${minNum.toString().padStart(2, '0')} ${ampm}. Restriction: ${parsed.daysSummary} from ${parsed.timeSummary}.`,
      comment: branch.comment,
    };
  }

  if (!isDayRestricted) {
    return {
      branch,
      selectedDate: dateStr,
      selectedDateFormatted,
      selectedWeekday,
      selectedTime: timeStr,
      selectedTimeFormatted,
      status: 'AVAILABLE',
      statusLabel: 'AVAILABLE',
      explanation: `Road training is permitted. ${selectedWeekday} is outside the restricted days (${parsed.daysSummary}).`,
      comment: branch.comment,
    };
  }

  return {
    branch,
    selectedDate: dateStr,
    selectedDateFormatted,
    selectedWeekday,
    selectedTime: timeStr,
    selectedTimeFormatted,
    status: 'AVAILABLE',
    statusLabel: 'AVAILABLE',
    explanation: `Road training is permitted. ${displayHour}:${minNum.toString().padStart(2, '0')} ${ampm} is outside the restricted time window (${parsed.timeSummary}).`,
    comment: branch.comment,
  };
}

/**
 * Returns formatted Dubai date/time string for live clock
 */
export function getDubaiTimeInfo(date: Date) {
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return {
    dateStr: dateFormatter.format(date),
    timeStr: timeFormatter.format(date),
    fullStr: `${dateFormatter.format(date)} • ${timeFormatter.format(date)} (GST / UTC+4)`,
  };
}

