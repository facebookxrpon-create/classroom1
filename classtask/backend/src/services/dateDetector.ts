// backend/src/services/dateDetector.ts
import { isValid, parse } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";

const TIMEZONE = "Asia/Bangkok";

// Thai month name mapping
const thaiMonths: Record<string, number> = {
  มกราคม: 1,
  กุมภาพันธ์: 2,
  มีนาคม: 3,
  เมษายน: 4,
  พฤษภาคม: 5,
  มิถุนายน: 6,
  กรกฎาคม: 7,
  สิงหาคม: 8,
  กันยายน: 9,
  ตุลาคม: 10,
  พฤศจิกายน: 11,
  ธันวาคม: 12,
  "ม.ค.": 1,
  "ก.พ.": 2,
  "มี.ค.": 3,
  "เม.ย.": 4,
  "พ.ค.": 5,
  "มิ.ย.": 6,
  "ก.ค.": 7,
  "ส.ค.": 8,
  "ก.ย.": 9,
  "ต.ค.": 10,
  "พ.ย.": 11,
  "ธ.ค.": 12,
};

function monthNameToNumber(name: string): number {
  return thaiMonths[name] || 0;
}

function thaiWeekdayToNumber(name: string): number {
  const map: Record<string, number> = {
    อาทิตย์: 0,
    จันทร์: 1,
    อังคาร: 2,
    พุธ: 3,
    พฤหัสบดี: 4,
    ศุกร์: 5,
    เสาร์: 6,
  };
  return map[name] ?? 0;
}

function nextWeekday(date: Date, target: number): Date {
  const d = new Date(date);
  const diff = (target + 7 - d.getDay()) % 7 || 7; // ถ้าเป็นวันนี้ให้ขยับไปสัปดาห์หน้า
  d.setDate(d.getDate() + diff);
  return d;
}

function nextBusinessDay(date: Date): Date {
  const d = new Date(date);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

/**
 * Detect a due date inside a free‑text string.
 * Returns UTC Date (converted from Asia/Bangkok) and the raw matched text.
 */
export function detectDueDate(text: string, refDate = new Date()): { date: Date; raw: string } | null {
  const patterns: RegExp[] = [
    // "28 ตุลาคม 2569" หรือ "28 Oct 2026"
    /(\d{1,2})\s*(\w+)[\s.]*(\d{2,4})/gi,
    // "30/10/2026" หรือ "30-10-2569"
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
    // "Deadline: 31 Oct 2026"
    /deadline[:\s]*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})/gi,
    // relative words
    /วัน(จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)นี้/gi,
    /สัปดาห์หน้า/gi,
    /คาบเรียนครั้งถัดไป/gi,
  ];

  for (const regex of patterns) {
    const match = regex.exec(text);
    if (!match) continue;
    const raw = match[0];
    // 1) Numeric day + month name + year
    if (match.length >= 4) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2];
      const yearRaw = parseInt(match[3], 10);
      let year = yearRaw;
      if (year < 100) year += 2000; // 2‑digit year
      if (year > 2500) year -= 543; // พ.ศ. → ค.ศ.

      // month may be Thai or English
      let month = monthNameToNumber(monthStr);
      if (!month) {
        // try English abbreviation
        const eng = monthStr.toLowerCase();
        const engMap: Record<string, number> = {
          jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
          jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
        };
        month = engMap[eng] ?? 0;
      }
      if (month) {
        const candidate = new Date(year, month - 1, day);
        if (isValid(candidate)) {
          return { date: zonedTimeToUtc(candidate, TIMEZONE), raw };
        }
      }
    }
    // 2) DD/MM/YYYY style
    if (regex.source.includes("[\\/\\-]")) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);
      if (year < 100) year += 2000;
      if (year > 2500) year -= 543;
      const candidate = new Date(year, month - 1, day);
      if (isValid(candidate)) {
        return { date: zonedTimeToUtc(candidate, TIMEZONE), raw };
      }
    }
    // 3) Relative weekday – "วันศุกร์นี้"
    if (/วัน(จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)นี้/i.test(raw)) {
      const wd = raw.match(/วัน(จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)นี้/i)![1];
      const target = nextWeekday(refDate, thaiWeekdayToNumber(wd));
      return { date: zonedTimeToUtc(target, TIMEZONE), raw };
    }
    // 4) "สัปดาห์หน้า"
    if (/สัปดาห์หน้า/i.test(raw)) {
      const target = new Date(refDate);
      target.setDate(target.getDate() + 7);
      return { date: zonedTimeToUtc(target, TIMEZONE), raw };
    }
    // 5) "คาบเรียนครั้งถัดไป"
    if (/คาบเรียนครั้งถัดไป/i.test(raw)) {
      const target = nextBusinessDay(refDate);
      return { date: zonedTimeToUtc(target, TIMEZONE), raw };
    }
  }
  return null;
}
