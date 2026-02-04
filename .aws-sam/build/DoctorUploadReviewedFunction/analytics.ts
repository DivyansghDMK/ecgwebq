import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AnalyticsData {
  visitors: number;
  countries: Array<{ name: string; percentage: number; count: number }>;
  timestamp: number;
  error?: string;
}

// In-memory store (for demo - in production, use Vercel KV or a database)
interface CountryStats {
  count: number;
  name: string;
}

let visitorStats: {
  totalVisitors: number;
  countries: Map<string, CountryStats>;
  lastUpdate: number;
} = {
  totalVisitors: 0,
  countries: new Map(),
  lastUpdate: Date.now(),
};

// Country code to name mapping
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  IN: 'India',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  PH: 'Philippines',
  ID: 'Indonesia',
  VN: 'Vietnam',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  TR: 'Turkey',
  RU: 'Russia',
  NZ: 'New Zealand',
};

function getCountryName(code: string): string {
  return countryNames[code] || code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get country from Vercel's request headers
    // Vercel automatically adds x-vercel-ip-country header
    let countryCode = req.headers['x-vercel-ip-country'] as string;
    let country = countryCode ? getCountryName(countryCode) : null;

    // Fallback: If no Vercel header (local dev), try to get from IP geolocation
    if (!country) {
      try {
        const forwardedFor = req.headers['x-forwarded-for'];
        const forwardedIP = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : (Array.isArray(forwardedFor) ? forwardedFor[0] : null);
        const realIP = typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] : (Array.isArray(req.headers['x-real-ip']) ? req.headers['x-real-ip'][0] : null);
        const clientIP = forwardedIP || realIP || req.socket.remoteAddress;
        
        if (clientIP && clientIP !== '::1' && clientIP !== '127.0.0.1') {
          // Try ipapi.co for geolocation
          const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            country = geoData.country_name || null;
          }
        }
      } catch (geoError) {
        // If geolocation fails, use a default or skip
        console.log('Geolocation fallback failed:', geoError);
      }
    }

    // Track this visitor
    if (country) {
      // Increment visitor count for this country
      const existing = visitorStats.countries.get(country);
      if (existing) {
        existing.count += 1;
      } else {
        visitorStats.countries.set(country, { count: 1, name: country });
      }
      
      visitorStats.totalVisitors += 1;
      visitorStats.lastUpdate = Date.now();
    } else {
      // Even if no country detected, increment visitor count
      visitorStats.totalVisitors += 1;
    }

    // Convert Map to Array with percentages, sorted by count (descending)
    const countriesArray = Array.from(visitorStats.countries.values())
      .map((country) => ({
        name: country.name,
        count: country.count,
        percentage: visitorStats.totalVisitors > 0 
          ? Math.round((country.count / visitorStats.totalVisitors) * 100) 
          : 0,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 10); // Limit to top 10 countries

    return res.status(200).json({
      visitors: visitorStats.totalVisitors,
      countries: countriesArray,
      timestamp: Date.now(),
    } as AnalyticsData);

  } catch (error: any) {
    console.error('Analytics API error:', error);
    
    // Convert Map to Array with percentages for error case too
    const countriesArray = Array.from(visitorStats.countries.values())
      .map((country) => ({
        name: country.name,
        count: country.count,
        percentage: visitorStats.totalVisitors > 0 
          ? Math.round((country.count / visitorStats.totalVisitors) * 100) 
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return res.status(200).json({
      visitors: visitorStats.totalVisitors,
      countries: countriesArray,
      timestamp: Date.now(),
      error: error.message || 'Failed to fetch analytics',
    } as AnalyticsData);
  }
}
