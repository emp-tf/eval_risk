/**
 * realDataFetcher.js
 * Pre-fetches real data from free APIs to anchor AI risk scoring.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// ISO Code Map — ~55 African countries
// ---------------------------------------------------------------------------

const ISO_CODE_MAP = {
  'algeria': { iso2: 'DZ', iso3: 'DZA' },
  'angola': { iso2: 'AO', iso3: 'AGO' },
  'benin': { iso2: 'BJ', iso3: 'BEN' },
  'botswana': { iso2: 'BW', iso3: 'BWA' },
  'burkina faso': { iso2: 'BF', iso3: 'BFA' },
  'burundi': { iso2: 'BI', iso3: 'BDI' },
  'cabo verde': { iso2: 'CV', iso3: 'CPV' },
  'cape verde': { iso2: 'CV', iso3: 'CPV' },
  'cameroon': { iso2: 'CM', iso3: 'CMR' },
  'central african republic': { iso2: 'CF', iso3: 'CAF' },
  'chad': { iso2: 'TD', iso3: 'TCD' },
  'comoros': { iso2: 'KM', iso3: 'COM' },
  'congo': { iso2: 'CG', iso3: 'COG' },
  'democratic republic of the congo': { iso2: 'CD', iso3: 'COD' },
  'drc': { iso2: 'CD', iso3: 'COD' },
  "côte d'ivoire": { iso2: 'CI', iso3: 'CIV' },
  'ivory coast': { iso2: 'CI', iso3: 'CIV' },
  'djibouti': { iso2: 'DJ', iso3: 'DJI' },
  'egypt': { iso2: 'EG', iso3: 'EGY' },
  'equatorial guinea': { iso2: 'GQ', iso3: 'GNQ' },
  'eritrea': { iso2: 'ER', iso3: 'ERI' },
  'eswatini': { iso2: 'SZ', iso3: 'SWZ' },
  'swaziland': { iso2: 'SZ', iso3: 'SWZ' },
  'ethiopia': { iso2: 'ET', iso3: 'ETH' },
  'gabon': { iso2: 'GA', iso3: 'GAB' },
  'gambia': { iso2: 'GM', iso3: 'GMB' },
  'ghana': { iso2: 'GH', iso3: 'GHA' },
  'guinea': { iso2: 'GN', iso3: 'GIN' },
  'guinea-bissau': { iso2: 'GW', iso3: 'GNB' },
  'kenya': { iso2: 'KE', iso3: 'KEN' },
  'lesotho': { iso2: 'LS', iso3: 'LSO' },
  'liberia': { iso2: 'LR', iso3: 'LBR' },
  'libya': { iso2: 'LY', iso3: 'LBY' },
  'madagascar': { iso2: 'MG', iso3: 'MDG' },
  'malawi': { iso2: 'MW', iso3: 'MWI' },
  'mali': { iso2: 'ML', iso3: 'MLI' },
  'mauritania': { iso2: 'MR', iso3: 'MRT' },
  'mauritius': { iso2: 'MU', iso3: 'MUS' },
  'morocco': { iso2: 'MA', iso3: 'MAR' },
  'mozambique': { iso2: 'MZ', iso3: 'MOZ' },
  'namibia': { iso2: 'NA', iso3: 'NAM' },
  'niger': { iso2: 'NE', iso3: 'NER' },
  'nigeria': { iso2: 'NG', iso3: 'NGA' },
  'rwanda': { iso2: 'RW', iso3: 'RWA' },
  'são tomé and príncipe': { iso2: 'ST', iso3: 'STP' },
  'senegal': { iso2: 'SN', iso3: 'SEN' },
  'sierra leone': { iso2: 'SL', iso3: 'SLE' },
  'somalia': { iso2: 'SO', iso3: 'SOM' },
  'south africa': { iso2: 'ZA', iso3: 'ZAF' },
  'south sudan': { iso2: 'SS', iso3: 'SSD' },
  'sudan': { iso2: 'SD', iso3: 'SDN' },
  'tanzania': { iso2: 'TZ', iso3: 'TZA' },
  'togo': { iso2: 'TG', iso3: 'TGO' },
  'tunisia': { iso2: 'TN', iso3: 'TUN' },
  'uganda': { iso2: 'UG', iso3: 'UGA' },
  'zambia': { iso2: 'ZM', iso3: 'ZMB' },
  'zimbabwe': { iso2: 'ZW', iso3: 'ZWE' },
};

export function getIsoCodes(countryName) {
  if (!countryName) return null;
  return ISO_CODE_MAP[countryName.toLowerCase().trim()] ?? null;
}

// ---------------------------------------------------------------------------
// World Bank
// ---------------------------------------------------------------------------

export async function fetchWorldBankData(iso2) {
  try {
    const indicators = [
      { id: 'NY.GDP.MKTP.KD.ZG', label: 'GDP growth (%)' },
      { id: 'FP.CPI.TOTL.ZG', label: 'Inflation (%)' },
      { id: 'SL.UEM.TOTL.ZS', label: 'Unemployment (%)' },
      { id: 'PV.EST', label: 'Political Stability (WGI, -2.5 to +2.5)' },
      { id: 'SP.URB.GROW', label: 'Urban population growth (%)' },
    ];

    const results = await Promise.allSettled(
      indicators.map(async ({ id, label }) => {
        const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${id}?format=json&mrv=5`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) return null;
        const data = await res.json();
        const record = data[1]?.filter((d) => d.value !== null)[0];
        if (!record) return null;
        return `${label}: ${Number(record.value).toFixed(2)} (${record.date})`;
      })
    );

    const lines = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);

    if (lines.length === 0) return '';
    return `World Bank Data (${iso2}):\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[RealData][fetchWorldBankData]', e.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// IMF
// ---------------------------------------------------------------------------

export async function fetchImfData(iso3) {
  try {
    const currentYear = new Date().getFullYear();
    const indicators = [
      { id: 'NGDP_RPCH', label: 'Real GDP growth (%)' },
      { id: 'PCPIPCH', label: 'Inflation (%)' },
    ];

    const results = await Promise.allSettled(
      indicators.map(async ({ id, label }) => {
        const url = `https://www.imf.org/external/datamapper/api/v1/${id}/${iso3}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) return null;
        const data = await res.json();
        const yearlyValues = data?.values?.[id]?.[iso3];
        if (!yearlyValues) return null;
        const years = Object.keys(yearlyValues)
          .map(Number)
          .filter((y) => y <= currentYear)
          .sort((a, b) => b - a);
        if (years.length === 0) return null;
        const latestYear = years[0];
        return `${label}: ${Number(yearlyValues[latestYear]).toFixed(2)} (${latestYear})`;
      })
    );

    const lines = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);

    if (lines.length === 0) return '';
    return `IMF Data (${iso3}):\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[RealData][fetchImfData]', e.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// GDELT
// ---------------------------------------------------------------------------

export async function fetchGdeltData(country) {
  try {
    const query = encodeURIComponent(`${country} real estate risk`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=10&format=json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return '';
    const data = await res.json();

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const articles = (data?.articles ?? [])
      .filter((a) => {
        if (a.language && a.language !== 'English') return false;
        // seendate format: YYYYMMDDTHHMMSSZ
        if (a.seendate) {
          const raw = a.seendate.replace('T', '').replace('Z', '');
          const year = raw.slice(0, 4);
          const month = raw.slice(4, 6);
          const day = raw.slice(6, 8);
          const parsed = new Date(`${year}-${month}-${day}`).getTime();
          if (!isNaN(parsed) && parsed < cutoff) return false;
        }
        return true;
      })
      .slice(0, 5);

    if (articles.length === 0) return '';
    const lines = articles.map(
      (a) => `- "${a.title}" (${a.domain}, ${a.seendate?.slice(0, 8) ?? ''})`
    );
    return `Recent news (GDELT, last 30 days):\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[RealData][fetchGdeltData]', e.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// NASA POWER
// ---------------------------------------------------------------------------

export async function fetchNasaPowerData(lat, lng) {
  if (!lat || !lng) return '';
  try {
    const url =
      `https://power.larc.nasa.gov/api/temporal/monthly/point` +
      `?parameters=T2M,PRECTOTCORR&community=RE` +
      `&longitude=${lng}&latitude=${lat}&start=2021&end=2024&format=JSON`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) return '';
    const data = await res.json();

    const t2m = data?.properties?.parameter?.T2M ?? {};
    const precip = data?.properties?.parameter?.PRECTOTCORR ?? {};

    const tempValues = Object.entries(t2m).filter(([k]) => !k.endsWith('13'));
    const precipValues = Object.entries(precip).filter(([k]) => !k.endsWith('13'));

    if (tempValues.length === 0) return '';

    const temps = tempValues.map(([, v]) => v).filter((v) => v != null && v > -900);
    const precipVals = precipValues.map(([, v]) => v).filter((v) => v != null && v > -900);

    const meanTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 'N/A';
    const hottestMonth = tempValues.length
      ? tempValues.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0]
      : 'N/A';
    const meanPrecip = precipVals.length
      ? (precipVals.reduce((a, b) => a + b, 0) / precipVals.length).toFixed(1)
      : 'N/A';
    const wettestMonth = precipValues.length
      ? precipValues.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0]
      : 'N/A';

    return (
      `NASA POWER Climate Data (lat=${lat}, lng=${lng}, 2021-2024):\n` +
      `Mean temperature: ${meanTemp}°C | Hottest month: ${hottestMonth}\n` +
      `Mean monthly precipitation: ${meanPrecip} mm/day | Wettest month: ${wettestMonth}`
    );
  } catch (e) {
    console.warn('[RealData][fetchNasaPowerData]', e.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// OpenAQ
// ---------------------------------------------------------------------------

export async function fetchOpenAqData(lat, lng) {
  if (!lat || !lng) return '';
  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) return '';
  try {
    const url = `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=25000&limit=5`;
    const res = await fetchWithTimeout(url, { headers: { 'X-API-Key': apiKey } });
    if (!res.ok) return '';
    const data = await res.json();

    const locations = data?.results ?? [];
    if (locations.length === 0) return '';

    const readings = [];
    for (const loc of locations) {
      for (const sensor of loc.sensors ?? []) {
        const param = sensor.parameter?.name?.toLowerCase() ?? '';
        if (['pm25', 'pm10', 'no2'].includes(param)) {
          const val = sensor.latest?.value;
          if (val != null) {
            readings.push(`${param.toUpperCase()}: ${val} ${sensor.parameter?.units ?? ''} at ${loc.name}`);
          }
        }
      }
    }

    if (readings.length === 0) return '';

    // WHO guidelines for reference
    const whoNote = 'WHO guidelines: PM2.5 <15 µg/m³ (annual), PM10 <45 µg/m³, NO2 <10 µg/m³';
    return `OpenAQ Air Quality (nearest stations within 25 km):\n${readings.join('\n')}\n${whoNote}`;
  } catch (e) {
    console.warn('[RealData][fetchOpenAqData]', e.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// AQICN
// ---------------------------------------------------------------------------

export async function fetchAqicnData(city) {
  if (!city) return '';
  const apiKey = process.env.AQICN_API_KEY;
  if (!apiKey) return '';
  try {
    const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return '';
    const body = await res.json();
    if (body?.status !== 'ok') return '';
    const d = body.data;
    const aqi = d?.aqi;
    const pm25 = d?.iaqi?.pm25?.v;
    const pm10 = d?.iaqi?.pm10?.v;
    const no2 = d?.iaqi?.no2?.v;

    const parts = [];
    if (aqi != null) parts.push(`AQI: ${aqi}`);
    if (pm25 != null) parts.push(`PM2.5: ${pm25}`);
    if (pm10 != null) parts.push(`PM10: ${pm10}`);
    if (no2 != null) parts.push(`NO2: ${no2}`);

    if (parts.length === 0) return '';
    return `AQICN Air Quality (${city}):\n${parts.join(' | ')}`;
  } catch (e) {
    console.warn('[RealData][fetchAqicnData]', e.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Composite environmental fetcher
// ---------------------------------------------------------------------------

export async function fetchEnvironmentalData({ lat, lng, city }) {
  const [openAqText, aqicnText] = await Promise.all([
    fetchOpenAqData(lat, lng),
    fetchAqicnData(city),
  ]);
  return [openAqText, aqicnText].filter(Boolean).join('\n\n');
}
