let demoMode = false;

const PLATFORM_RATES = {
  'Spotify':       { rate: 0.004, share: 1.0,  color: '#1db954' },
  'Apple Music':   { rate: 0.008, share: 0.35, color: '#fc3c44' },
  'YouTube Music': { rate: 0.002, share: 0.60, color: '#ff0000' },
  'Amazon Music':  { rate: 0.004, share: 0.20, color: '#00a8e1' },
  'Tidal':         { rate: 0.010, share: 0.05, color: '#000000' },
};

const GENRE_MERCH_AFFINITY = {
  'hip hop': 0.9, 'rap': 0.9, 'pop': 0.75, 'rock': 0.95,
  'metal': 1.0, 'punk': 0.95, 'indie': 0.8, 'country': 0.7,
  'r&b': 0.65, 'electronic': 0.6, 'edm': 0.55, 'jazz': 0.4,
  'classical': 0.3, 'latin': 0.7, 'k-pop': 0.95, 'reggaeton': 0.7,
  'alternative': 0.85, 'folk': 0.6, 'soul': 0.55, 'blues': 0.5,
};

const DEMO_ARTISTS = {
  '06HL4z0CvFAxyc27GXpf02': {
    name: 'Taylor Swift', followers: 120_500_000, monthlyListeners: 82_000_000,
    popularity: 98, genres: ['pop', 'country pop'],
    image: 'https://i.scdn.co/image/ab6761610000e5eb6a224073987b930f99adc706',
    socials: { instagram: '@taylorswift', twitter: '@taylorswift13', tiktok: '@taylorswift' },
    topTracks: [
      { name: 'Cruel Summer', streams: 2_400_000_000, popularity: 92 },
      { name: 'Anti-Hero', streams: 2_100_000_000, popularity: 88 },
      { name: 'Blank Space', streams: 2_000_000_000, popularity: 85 },
      { name: 'Shake It Off', streams: 1_900_000_000, popularity: 84 },
      { name: 'Love Story', streams: 1_700_000_000, popularity: 82 },
    ],
  },
  '3TVXtAsR1Inumwj472S9r4': {
    name: 'Drake', followers: 83_000_000, monthlyListeners: 72_000_000,
    popularity: 96, genres: ['canadian hip hop', 'hip hop', 'rap'],
    image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d429161f84d869cba',
    socials: { instagram: '@champagnepapi', twitter: '@Drake', tiktok: '@drake' },
    topTracks: [
      { name: 'One Dance', streams: 2_900_000_000, popularity: 86 },
      { name: "God's Plan", streams: 2_600_000_000, popularity: 88 },
      { name: 'Hotline Bling', streams: 2_100_000_000, popularity: 83 },
      { name: 'Passionfruit', streams: 1_800_000_000, popularity: 85 },
      { name: 'Rich Flex', streams: 1_200_000_000, popularity: 80 },
    ],
  },
  '6eUKZXaKkcviH0Ku9w2n3V': {
    name: 'Ed Sheeran', followers: 95_000_000, monthlyListeners: 75_000_000,
    popularity: 95, genres: ['pop', 'singer-songwriter'],
    image: 'https://i.scdn.co/image/ab6761610000e5eb3bcef85e105dfc42399ef0ba',
    socials: { instagram: '@teddysphotos', twitter: '@edsheeran', tiktok: '@edsheeran' },
    topTracks: [
      { name: 'Shape of You', streams: 4_100_000_000, popularity: 90 },
      { name: 'Perfect', streams: 3_200_000_000, popularity: 88 },
      { name: 'Thinking Out Loud', streams: 2_500_000_000, popularity: 85 },
      { name: 'Photograph', streams: 1_800_000_000, popularity: 83 },
      { name: 'Bad Habits', streams: 1_600_000_000, popularity: 81 },
    ],
  },
  '66CXWjxzNUsdJxJ2JdwvnR': {
    name: 'Ariana Grande', followers: 80_000_000, monthlyListeners: 68_000_000,
    popularity: 94, genres: ['pop', 'dance pop'],
    image: 'https://i.scdn.co/image/ab6761610000e5ebcdce7620dc940db079c3f5f7',
    socials: { instagram: '@arianagrande', twitter: '@ArianaGrande', tiktok: '@arianagrande' },
    topTracks: [
      { name: '7 rings', streams: 2_500_000_000, popularity: 86 },
      { name: 'thank u, next', streams: 2_200_000_000, popularity: 85 },
      { name: 'no tears left to cry', streams: 1_700_000_000, popularity: 82 },
      { name: 'positions', streams: 1_400_000_000, popularity: 80 },
      { name: 'Into You', streams: 1_300_000_000, popularity: 81 },
    ],
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  const resp = await fetch('/api/config');
  const config = await resp.json();
  demoMode = !config.hasCredentials;
  if (demoMode) {
    document.getElementById('demo-note').style.display = 'flex';
  }
});

function parseArtistId(input) {
  input = input.trim();
  const match = input.match(/artist[/:]([a-zA-Z0-9]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;
  return null;
}

function tryExample(id) {
  document.getElementById('spotify-input').value = `https://open.spotify.com/artist/${id}`;
  analyzeArtist();
}

async function analyzeArtist() {
  const input = document.getElementById('spotify-input').value;
  const artistId = parseArtistId(input);
  const errorEl = document.getElementById('error-msg');
  const resultsEl = document.getElementById('results');
  const btn = document.getElementById('analyze-btn');

  errorEl.style.display = 'none';
  resultsEl.style.display = 'none';

  if (!artistId) {
    errorEl.textContent = 'Please enter a valid Spotify artist link or ID.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Analyzing...';
  btn.querySelector('.btn-loader').style.display = 'block';

  try {
    let data;
    if (demoMode) {
      await new Promise(r => setTimeout(r, 800));
      data = buildDemoData(artistId);
    } else {
      const resp = await fetch(`/api/artist/${artistId}`);
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to fetch artist data');
      }
      data = await resp.json();
      data = normalizeApiData(data);
    }

    renderResults(data);
    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Analyze';
    btn.querySelector('.btn-loader').style.display = 'none';
  }
}

function buildDemoData(artistId) {
  const demo = DEMO_ARTISTS[artistId];
  if (!demo) {
    const names = Object.values(DEMO_ARTISTS).map(a => a.name);
    throw new Error(`Demo mode: artist not found. Try one of: ${names.join(', ')}`);
  }
  return { ...demo };
}

function normalizeApiData(raw) {
  const artist = raw.artist;
  const tracks = raw.topTracks || [];

  const socials = {};
  if (artist.external_urls) {
    socials.spotify = artist.external_urls.spotify;
  }

  return {
    name: artist.name,
    followers: artist.followers?.total || 0,
    monthlyListeners: estimateMonthlyListeners(artist.followers?.total, artist.popularity),
    popularity: artist.popularity || 0,
    genres: artist.genres || [],
    image: artist.images?.[0]?.url || '',
    socials,
    topTracks: tracks.map(t => ({
      name: t.name,
      streams: estimateStreams(t.popularity),
      popularity: t.popularity || 0,
    })),
  };
}

function estimateMonthlyListeners(followers, popularity) {
  if (!followers) return 0;
  const ratio = 0.3 + (popularity / 100) * 1.2;
  return Math.round(followers * ratio);
}

function estimateStreams(popularity) {
  return Math.round(Math.pow(10, 4 + (popularity / 100) * 6));
}

function fmt(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function fmtMoney(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

function renderResults(data) {
  document.getElementById('artist-name').textContent = data.name;
  document.getElementById('artist-followers').textContent = fmt(data.followers) + ' followers';
  document.getElementById('artist-listeners').textContent = fmt(data.monthlyListeners) + ' monthly listeners';
  document.getElementById('artist-genres').textContent = data.genres.slice(0, 2).join(', ') || 'Unknown genre';

  const img = document.getElementById('artist-img');
  if (data.image) {
    img.src = data.image;
    img.alt = data.name;
  } else {
    img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2322222e" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="30">?</text></svg>');
  }

  renderSocials(data);
  const earnings = calculateEarnings(data);
  renderEarnings(earnings);
  const score = calculateAudienceScore(data);
  renderAudienceScore(score, data);
  const merch = calculateMerchPotential(data, score);
  renderMerchPotential(merch, data);
  renderTopTracks(data.topTracks);
  renderCatalogValue(earnings, score);
}

function renderSocials(data) {
  const container = document.getElementById('social-links');
  container.innerHTML = '';

  const socialIcons = {
    spotify: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
    instagram: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
    twitter: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    tiktok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z"/></svg>',
    youtube: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
  };

  for (const [platform, handle] of Object.entries(data.socials || {})) {
    const link = document.createElement('a');
    link.className = 'social-link';
    link.href = '#';
    link.onclick = (e) => e.preventDefault();
    link.innerHTML = (socialIcons[platform] || '') + ' ' + (typeof handle === 'string' && handle.startsWith('http') ? platform : handle);
    container.appendChild(link);
  }

  if (Object.keys(data.socials || {}).length === 0) {
    const note = document.createElement('span');
    note.className = 'social-link';
    note.textContent = 'Social links available with Spotify API';
    container.appendChild(note);
  }
}

function calculateEarnings(data) {
  const estMonthlyStreams = data.monthlyListeners * 3.5;

  const platforms = {};
  let totalMonthly = 0;

  for (const [name, cfg] of Object.entries(PLATFORM_RATES)) {
    const streams = estMonthlyStreams * cfg.share;
    const revenue = streams * cfg.rate;
    platforms[name] = { streams, revenue, color: cfg.color };
    totalMonthly += revenue;
  }

  return { platforms, totalMonthly, annualRevenue: totalMonthly * 12 };
}

function renderEarnings(earnings) {
  document.getElementById('total-monthly').textContent = fmtMoney(earnings.totalMonthly);
  document.getElementById('annual-revenue').textContent = fmtMoney(earnings.annualRevenue);

  const maxRevenue = Math.max(...Object.values(earnings.platforms).map(p => p.revenue));
  const container = document.getElementById('platform-list');
  container.innerHTML = '';

  for (const [name, p] of Object.entries(earnings.platforms)) {
    const pct = (p.revenue / maxRevenue) * 100;
    container.innerHTML += `
      <div class="platform-row">
        <span class="platform-name">${name}</span>
        <div class="platform-bar-bg">
          <div class="platform-bar" style="width:${pct}%; background:${p.color}"></div>
        </div>
        <span class="platform-amount">${fmtMoney(p.revenue)}</span>
      </div>`;
  }
}

function calculateAudienceScore(data) {
  const listenerScore = Math.min(30, (data.monthlyListeners / 100_000_000) * 30);
  const followerRatio = data.followers / Math.max(data.monthlyListeners, 1);
  const loyaltyScore = Math.min(25, followerRatio * 25);
  const popScore = Math.min(25, (data.popularity / 100) * 25);

  let socialScore = 0;
  const socialCount = Object.keys(data.socials || {}).length;
  socialScore = Math.min(20, socialCount * 5);
  if (data.monthlyListeners > 10_000_000) socialScore = Math.max(socialScore, 12);
  if (data.monthlyListeners > 50_000_000) socialScore = Math.max(socialScore, 18);

  const total = Math.round(listenerScore + loyaltyScore + popScore + socialScore);

  return {
    total: Math.min(100, total),
    breakdown: {
      'Listener Reach': Math.round(listenerScore),
      'Fan Loyalty': Math.round(loyaltyScore),
      'Popularity Index': Math.round(popScore),
      'Social Presence': Math.round(socialScore),
    },
  };
}

function renderAudienceScore(score) {
  const circle = document.getElementById('score-circle');
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score.total / 100) * circumference;

  requestAnimationFrame(() => {
    circle.style.transition = 'stroke-dashoffset 1s ease';
    circle.style.strokeDashoffset = offset;
  });

  document.getElementById('score-value').textContent = score.total;

  let label = 'Emerging';
  if (score.total >= 90) label = 'Superstar';
  else if (score.total >= 75) label = 'Major Artist';
  else if (score.total >= 60) label = 'Established';
  else if (score.total >= 40) label = 'Rising';
  document.getElementById('score-label').textContent = label;

  const container = document.getElementById('score-breakdown');
  container.innerHTML = '';
  for (const [key, val] of Object.entries(score.breakdown)) {
    container.innerHTML += `
      <div class="score-row">
        <span>${key}</span>
        <span>${val}/25</span>
      </div>`;
  }
}

function calculateMerchPotential(data, score) {
  let genreAffinity = 0.6;
  for (const genre of data.genres) {
    const g = genre.toLowerCase();
    for (const [key, val] of Object.entries(GENRE_MERCH_AFFINITY)) {
      if (g.includes(key)) {
        genreAffinity = Math.max(genreAffinity, val);
      }
    }
  }

  const conversionRate = 0.005 + (score.total / 100) * 0.025;
  const potentialBuyers = Math.round(data.monthlyListeners * conversionRate);
  const avgOrderValue = 25 + (score.total / 100) * 20;
  const monthlyMerchRevenue = potentialBuyers * avgOrderValue;
  const annualMerchRevenue = monthlyMerchRevenue * 12;

  let tier, tierDesc;
  if (annualMerchRevenue > 10_000_000) { tier = 'Platinum'; tierDesc = 'Stadium-level merch operation — full product lines, pop-ups, collabs'; }
  else if (annualMerchRevenue > 1_000_000) { tier = 'Gold'; tierDesc = 'Major merch business — diversified products, tour exclusives'; }
  else if (annualMerchRevenue > 100_000) { tier = 'Silver'; tierDesc = 'Strong merch potential — core apparel + accessories'; }
  else if (annualMerchRevenue > 10_000) { tier = 'Bronze'; tierDesc = 'Growing merch opportunity — start with essentials'; }
  else { tier = 'Starter'; tierDesc = 'Early stage — test demand with limited drops'; }

  const products = [
    { name: 'T-Shirts & Hoodies', margin: '60-70%', viable: true },
    { name: 'Hats & Accessories', margin: '65-75%', viable: annualMerchRevenue > 50_000 },
    { name: 'Vinyl & Physicals', margin: '40-50%', viable: annualMerchRevenue > 100_000 },
    { name: 'Limited Edition Drops', margin: '70-80%', viable: annualMerchRevenue > 250_000 },
    { name: 'Brand Collaborations', margin: '30-40%', viable: annualMerchRevenue > 1_000_000 },
    { name: 'Festival Merch Booth', margin: '55-65%', viable: annualMerchRevenue > 500_000 },
  ];

  return {
    tier, tierDesc, genreAffinity,
    potentialBuyers, avgOrderValue,
    monthlyMerchRevenue, annualMerchRevenue,
    conversionRate, products,
  };
}

function renderMerchPotential(merch) {
  document.getElementById('merch-tier-label').textContent = merch.tier;
  document.getElementById('merch-tier-desc').textContent = merch.tierDesc;

  document.getElementById('merch-stats').innerHTML = `
    <div class="merch-stat">
      <div class="merch-stat-value">${fmt(merch.potentialBuyers)}</div>
      <div class="merch-stat-label">Potential Buyers/mo</div>
    </div>
    <div class="merch-stat">
      <div class="merch-stat-value">$${merch.avgOrderValue.toFixed(0)}</div>
      <div class="merch-stat-label">Avg Order Value</div>
    </div>
    <div class="merch-stat">
      <div class="merch-stat-value">${fmtMoney(merch.monthlyMerchRevenue)}</div>
      <div class="merch-stat-label">Monthly Revenue</div>
    </div>
    <div class="merch-stat">
      <div class="merch-stat-value">${(merch.conversionRate * 100).toFixed(1)}%</div>
      <div class="merch-stat-label">Conv. Rate</div>
    </div>`;

  const recsList = document.getElementById('merch-recs-list');
  recsList.innerHTML = '';
  for (const p of merch.products) {
    recsList.innerHTML += `
      <div class="merch-rec-item" style="opacity:${p.viable ? 1 : 0.4}">
        <span>${p.viable ? '✓' : '○'} ${p.name}</span>
        <span class="rec-margin">${p.margin}</span>
      </div>`;
  }
}

function renderTopTracks(tracks) {
  const container = document.getElementById('tracks-table');
  container.innerHTML = `
    <div class="track-row header">
      <span class="track-num">#</span>
      <span class="track-name">Track</span>
      <span class="track-streams">Total Streams</span>
      <span class="track-est">Est. Earnings</span>
      <span class="track-pop">Popularity</span>
    </div>`;

  (tracks || []).slice(0, 10).forEach((t, i) => {
    const earnings = t.streams * 0.004;
    container.innerHTML += `
      <div class="track-row">
        <span class="track-num">${i + 1}</span>
        <span class="track-name">${t.name}</span>
        <span class="track-streams">${fmt(t.streams)}</span>
        <span class="track-est">${fmtMoney(earnings)}</span>
        <span class="track-pop">
          <div class="pop-bar"><div class="pop-fill" style="width:${t.popularity}%"></div></div>
          ${t.popularity}
        </span>
      </div>`;
  });
}

function renderCatalogValue(earnings, score) {
  let multiple = 10;
  if (score.total >= 90) multiple = 28;
  else if (score.total >= 75) multiple = 22;
  else if (score.total >= 60) multiple = 18;
  else if (score.total >= 40) multiple = 14;

  const catalogValue = earnings.annualRevenue * multiple;
  document.getElementById('catalog-value').textContent = fmtMoney(catalogValue);
}

function showSetupInfo() {
  document.getElementById('setup-modal').style.display = 'flex';
}

function closeSetupModal() {
  document.getElementById('setup-modal').style.display = 'none';
}

document.getElementById('setup-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSetupModal();
});

document.getElementById('spotify-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') analyzeArtist();
});
