export type ChartResults = {
  jd: number;
  sunLongitude: number; // degrees 0..360
  ascendant: number; // degrees 0..360
  midheaven: number; // degrees 0..360
  houses: number[]; // 12 values, equal houses from Ascendant
  sunSign: string;
  ascSign: string;
  mcSign: string;
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function normalizeDegrees(d: number): number {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

export function degToRad(d: number): number {
  return d * DEG2RAD;
}

export function radToDeg(r: number): number {
  return r * RAD2DEG;
}

// Julian Day from UTC date/time (decimal hours)
export function julianDayFromUTC(year: number, month: number, day: number, hourUTC: number): number {
  // Algorithm from "Astronomical Algorithms" (Meeus)
  let Y = year;
  let M = month;
  if (M <= 2) { Y -= 1; M += 12; }
  const D = day + hourUTC / 24;
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  return JD;
}

function julianCenturies(JD: number): number {
  return (JD - 2451545.0) / 36525.0;
}

// Mean obliquity of the ecliptic (deg) + correction for nutation
function obliquityEcliptic(JD: number): number {
  const T = julianCenturies(JD);
  const seconds = 21.448 - T * (46.8150 + T * (0.00059 - T * 0.001813));
  const eps0 = 23 + (26 / 60) + (seconds / 3600);
  const omega = 125.04 - 1934.136 * T; // deg
  const eps = eps0 + 0.00256 * Math.cos(degToRad(omega));
  return eps;
}

// Apparent Sun ecliptic longitude (deg), NOAA algorithm
export function sunApparentEclipticLongitude(JD: number): number {
  const T = julianCenturies(JD);
  const L0 = normalizeDegrees(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = normalizeDegrees(357.52911 + T * (35999.05029 - 0.0001537 * T));
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mrad = degToRad(M);
  const C = (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(Mrad)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
          + 0.000289 * Math.sin(3 * Mrad);
  const trueLong = L0 + C; // deg
  const omega = 125.04 - 1934.136 * T; // deg
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
  return normalizeDegrees(lambda);
}

function greenwichMeanSiderealTime(JD: number): number {
  const T = (JD - 2451545.0) / 36525.0;
  let theta = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
  return normalizeDegrees(theta);
}

function localSiderealTime(JD: number, longitudeDegEast: number): number {
  const GMST = greenwichMeanSiderealTime(JD);
  return normalizeDegrees(GMST + longitudeDegEast);
}

export function ascendantLongitude(JD: number, latitudeDeg: number, longitudeDegEast: number): number {
  const eps = degToRad(obliquityEcliptic(JD));
  const phi = degToRad(latitudeDeg);
  const theta = degToRad(localSiderealTime(JD, longitudeDegEast));
  const numerator = -Math.cos(theta);
  const denominator = Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps);
  let lambda = Math.atan2(numerator, denominator) + Math.PI; // add 180? to get eastern horizon
  return normalizeDegrees(radToDeg(lambda));
}

export function midheavenLongitude(JD: number, longitudeDegEast: number): number {
  const eps = degToRad(obliquityEcliptic(JD));
  const theta = degToRad(localSiderealTime(JD, longitudeDegEast));
  const lambda = Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps));
  return normalizeDegrees(radToDeg(lambda));
}

export function zodiacSignName(deg: number): string {
  const signs = [
    "B?lier", "Taureau", "G?meaux", "Cancer", "Lion", "Vierge",
    "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons",
  ];
  const idx = Math.floor(normalizeDegrees(deg) / 30) % 12;
  return signs[idx];
}

export function formatZodiacDegree(deg: number): { sign: string; degInSign: number; minutes: number } {
  const d = normalizeDegrees(deg);
  const sign = zodiacSignName(d);
  const degInSignFloat = d % 30;
  const wholeDeg = Math.floor(degInSignFloat);
  const minutes = Math.round((degInSignFloat - wholeDeg) * 60);
  return { sign, degInSign: wholeDeg, minutes };
}

export function computeChartFromJD(JD: number, latitudeDeg: number, longitudeDegEast: number): ChartResults {
  const sunLongitude = sunApparentEclipticLongitude(JD);
  const ascendant = ascendantLongitude(JD, latitudeDeg, longitudeDegEast);
  const midheaven = midheavenLongitude(JD, longitudeDegEast);
  const houses = Array.from({ length: 12 }, (_, i) => normalizeDegrees(ascendant + i * 30));
  return {
    jd: JD,
    sunLongitude,
    ascendant,
    midheaven,
    houses,
    sunSign: zodiacSignName(sunLongitude),
    ascSign: zodiacSignName(ascendant),
    mcSign: zodiacSignName(midheaven),
  };
}
