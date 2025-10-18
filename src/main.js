// main.js — карусель + автодополнение + 7-дневный прогноз

// SVG-иконки
const ICONS = {
  sunny: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  partly: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="3"></circle><path d="M21 16a5 5 0 0 0-9.9-1"/><path d="M3 18h14a4 4 0 0 0 0-8"/></svg>`,
  cloud: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A4 4 0 0 0 16 14H7.5A4.5 4.5 0 0 1 7.5 5.5 6 6 0 0 1 17 8"/></svg>`,
  rain: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A4 4 0 0 0 16 13H7.5A4.5 4.5 0 0 1 7.5 4.5 6 6 0 0 1 17 7"/><path d="M8 19v2M12 18v3M16 19v2"/></svg>`,
  snow: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A4 4 0 0 0 16 14H7.5A4.5 4.5 0 0 1 7.5 5.5 6 6 0 0 1 17 8"/><path d="M8 18l.8.8M12 18l.8.8M16 18l.8.8M8 20l.8-.8M12 20l.8-.8M16 20l.8-.8"/></svg>`,
  fog: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M4 16h16M6 8h12"/></svg>`,
  thunder: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8L21 10h-7l-0-8z"/></svg>`,
  unknown: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.09 9a3 3 0 1 1 5.82 1c0 1.5-1.5 2.2-1.5 2.2"/><path d="M12 17h.01"/></svg>`
};

// WEATHER_META
const WEATHER_META = {
  0:  { key:'sunny',  label:'Ясно', color:'#F6C177', inner:'#FFF6E6', innerHover:'#FFE8B3' },
  1:  { key:'sunny',  label:'Преимущественно ясно', color:'#F6D7A3', inner:'#FFFBF0', innerHover:'#FFF2D6' },
  2:  { key:'partly', label:'Переменная облачность', color:'#C7D3E0', inner:'#F6F8FA', innerHover:'#E7EDF6' },
  3:  { key:'cloud',  label:'Пасмурно', color:'#AAB8C8', inner:'#F2F4F6', innerHover:'#E6E9EE' },
  45: { key:'fog',    label:'Туман', color:'#CFCFCF', inner:'#FBFBFB', innerHover:'#EDEDED' },
  48: { key:'fog',    label:'Инейный туман', color:'#CFCFCF', inner:'#FBFBFB', innerHover:'#EDEDED' },
  51: { key:'rain',   label:'Лёгкая морось', color:'#9FCBEA', inner:'#F2FAFF', innerHover:'#DDF3FF' },
  61: { key:'rain',   label:'Дождь', color:'#8FBCE6', inner:'#EAF8FF', innerHover:'#D4F0FF' },
  71: { key:'snow',   label:'Снег', color:'#CFE9FF', inner:'#F8FBFF', innerHover:'#E0F0FF' },
  95: { key:'thunder',label:'Гроза', color:'#E2C1FF', inner:'#FFF6FF', innerHover:'#FFE6FF' }
};

// DOM
const form = document.getElementById('weather-form');
const cityInput = document.getElementById('city');
const suggestionsEl = document.getElementById('suggestions');
const forecastEl = document.getElementById('forecast');
const metaEl = document.getElementById('meta');
const messageEl = document.getElementById('message');
const btn = document.getElementById('btn');
const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentIndex = 0;
let lastRenderedCount = 0;

// HELPERS
function addDaysISO(dateStr, days){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate() + days);
  const Y = dt.getFullYear();
  const M = String(dt.getMonth()+1).padStart(2,'0');
  const D = String(dt.getDate()).padStart(2,'0');
  return `${Y}-${M}-${D}`;
}
function formatLabel(dateStr){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(dt);
}
function getVisibleCount(){
  if(window.innerWidth < 600) return 1;
  if(window.innerWidth < 900) return 2;
  return 3;
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// API
async function geocode(q){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=ru`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Ошибка геокодинга');
  const data = await res.json();
  return data.results || [];
}
async function fetchForecast(lat, lon, start, end){
  const url =  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,relative_humidity_2m_min,surface_pressure_max,surface_pressure_min,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum,sunshine_duration,precipitation_probability_max,uv_index_max,visibility_mean&timezone=auto&start_date=${start}&end_date=${end}`;
;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Ошибка прогноза');
  return res.json();
}

// RENDER
function renderForecast(cityLabel, lat, lon, weatherData){
  forecastEl.innerHTML = '';
  metaEl.textContent = `${cityLabel} · ${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  const times = (weatherData.daily && weatherData.daily.time) || [];
  const tmax = (weatherData.daily && weatherData.daily.temperature_2m_max) || [];
  const tmin = (weatherData.daily && weatherData.daily.temperature_2m_min) || [];
  const codes = (weatherData.daily && weatherData.daily.weathercode) || [];

  if(!times.length){
    messageEl.textContent = 'Нет данных для выбранного города.';
    carousel.classList.remove('has-content');
    lastRenderedCount = 0;
    updateButtonsState();
    return;
  }

  messageEl.textContent = '';
  times.forEach((dateStr,i)=>{
    const max = (tmax[i] !== undefined) ? Math.round(tmax[i]) : '—';
    const min = (tmin[i] !== undefined) ? Math.round(tmin[i]) : '—';
    const code = codes[i];
    const meta = WEATHER_META[code] || { key:'unknown', label:'Неизвестно', color:'#d0d0d0', inner:'#fff', innerHover:'#f9f9f9' };
    const iconSvg = ICONS[meta.key] || ICONS.unknown;

    const card = document.createElement('article');
    card.className = 'card';
    card.style.setProperty('--icon-color', meta.color);
    card.style.setProperty('--card-inner', meta.inner);
    card.style.setProperty('--card-inner-hover', meta.innerHover);

    card.innerHTML = `
      <div class="card-inner">
        <div class="day">${formatLabel(dateStr)}</div>
        <div class="icon-wrap">${iconSvg}</div>
        <div class="temps"><div class="max">${max}°</div><div class="min">${min}°</div></div>
        <div class="label">${meta.label}</div>
      </div>
    `;
    forecastEl.appendChild(card);

    card.addEventListener('click', () => {
    const dayData = {
      date: dateStr,
      label: meta.label,
      icon: iconSvg,
      tempMax: max,
      tempMin: min,
      humidityMax: weatherData.daily.relative_humidity_2m_max?.[i],
      humidityMin: weatherData.daily.relative_humidity_2m_min?.[i],
      pressureMax: weatherData.daily.surface_pressure_max?.[i],
      pressureMin: weatherData.daily.surface_pressure_min?.[i],
      windSpeed: weatherData.daily.wind_speed_10m_max?.[i],
      windDir: weatherData.daily.wind_direction_10m_dominant?.[i],
      precipitation: weatherData.daily.precipitation_sum?.[i],
      sunshine: weatherData.daily.sunshine_duration?.[i],
      precipitationProb: weatherData.daily.precipitation_probability_max?.[i],
      uvIndex: weatherData.daily.uv_index_max?.[i],
      visibility: weatherData.daily.visibility_mean?.[i],
    };
    showModal(dayData);
});

  });

  lastRenderedCount = forecastEl.querySelectorAll('.card').length;
  carousel.classList.add('has-content');

  // Ставим сегодня в начало карусели
  const todayStr = new Date().toISOString().slice(0,10);
  const todayIndex = times.findIndex(d => d === todayStr);
  currentIndex = todayIndex >= 0 ? todayIndex : 0;

  requestAnimationFrame(()=>setTimeout(()=>adjustCarouselAfterRender(),60));
}

// ПОКАЗАТЬ ЛОАДЕР
function showLoading(){
  forecastEl.innerHTML = '';
  metaEl.textContent = '';
  messageEl.innerHTML = `<div class="loader" aria-hidden="false"></div>`;
  carousel.classList.remove('has-content');
  lastRenderedCount = 0;
  updateButtonsState();
}

// AUTOCOMPLETE
let acController = null;
cityInput.addEventListener('input', async ()=>{
  const q = cityInput.value.trim();
  suggestionsEl.innerHTML = '';
  cityInput.removeAttribute('data-lat');
  cityInput.removeAttribute('data-lon');
  if(q.length < 2) return;
  try{
    if(acController) acController.abort();
    acController = new AbortController();
    const results = await geocode(q);
    acController = null;
    suggestionsEl.innerHTML = '';
    results.forEach(r=>{
      const li = document.createElement('li');
      li.textContent = `${r.name}${r.admin1 ? ', '+r.admin1 : ''}, ${r.country}`;
      li.addEventListener('click', ()=>{
        cityInput.value = r.name;
        cityInput.dataset.lat = r.latitude;
        cityInput.dataset.lon = r.longitude;
        suggestionsEl.innerHTML = '';
      });
      suggestionsEl.appendChild(li);
    });
  }catch(err){
    suggestionsEl.innerHTML = '';
  }
});
document.addEventListener('click',(e)=>{ if(!e.target.closest('.autocomplete')) suggestionsEl.innerHTML = ''; });

// FORM SUBMIT
form.addEventListener('submit', async(e)=>{
  e.preventDefault();
  let city = cityInput.value.trim();
  if(!city) return;

  showLoading();
  btn.disabled = true;

  try{
    let lat = cityInput.dataset.lat;
    let lon = cityInput.dataset.lon;

    if(!lat || !lon){
      const results = await geocode(city);
      if(!results.length) throw new Error('Город не найден');
      const r = results[0];
      lat = r.latitude; lon = r.longitude;
      city = `${r.name}${r.admin1 ? ', '+r.admin1 : ''}, ${r.country}`;
      cityInput.dataset.lat = lat;
      cityInput.dataset.lon = lon;
    }

    const today = new Date();
    const start = today.toISOString().slice(0,10);
    const end = addDaysISO(start,6);
    const forecastData = await fetchForecast(lat,lon,start,end);
    renderForecast(city, parseFloat(lat), parseFloat(lon), forecastData);
  }catch(err){
    messageEl.textContent = `Ошибка: ${err.message || err}`;
    forecastEl.innerHTML = '';
    carousel.classList.remove('has-content');
    lastRenderedCount = 0;
    updateButtonsState();
  }finally{
    btn.disabled = false;
  }
});

// КАРУСЕЛЬ
function getGap(){
  const cs = window.getComputedStyle(forecastEl);
  return parseFloat(cs.getPropertyValue('gap')) || parseFloat(cs.getPropertyValue('column-gap')) || 16;
}

function adjustCarouselAfterRender() {
  const cards = Array.from(forecastEl.querySelectorAll('.card'));
  const visible = getVisibleCount();

  if (cards.length <= visible) {
    forecastEl.scrollLeft = 0;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    carousel.classList.add('no-scroll');
    return;
  } else {
    carousel.classList.remove('no-scroll');
  }

  const maxIndex = Math.max(0, cards.length - visible);
  currentIndex = clamp(currentIndex, 0, maxIndex);

  updateCarousel(false); // старт без анимации
}

function updateCarousel(animate = true) {
  const cards = Array.from(forecastEl.querySelectorAll('.card'));
  if (!cards.length) return;

  const visible = getVisibleCount();
  const maxIndex = Math.max(0, cards.length - visible);
  currentIndex = clamp(currentIndex, 0, maxIndex);

  const cardWidth = cards[0].offsetWidth;
  const gap = getGap();
  const targetScroll = (cardWidth + gap) * currentIndex;

  forecastEl.scrollTo({
    left: targetScroll,
    behavior: animate ? 'smooth' : 'auto'
  });

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex >= maxIndex;
}

function updateButtonsState() {
  const cards = Array.from(forecastEl.querySelectorAll('.card'));
  const visible = getVisibleCount();

  if (!cards.length || cards.length <= visible) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    carousel.classList.remove('has-content');
    carousel.classList.add('no-scroll');
    return;
  }

  const maxIndex = Math.max(0, cards.length - visible);
  currentIndex = clamp(currentIndex, 0, maxIndex);

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex >= maxIndex;
  carousel.classList.add('has-content');
  carousel.classList.remove('no-scroll');
}

prevBtn.addEventListener('click', () => {
  currentIndex -= getVisibleCount();
  updateCarousel();
});
nextBtn.addEventListener('click', () => {
  currentIndex += getVisibleCount();
  updateCarousel();
});

// свайп на мобилке
let startX = 0;
forecastEl.addEventListener('touchstart', (e) => { 
  startX = e.touches[0].clientX; 
});
forecastEl.addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].clientX - startX;
  const thresh = 40;
  const cards = forecastEl.querySelectorAll('.card');
  const visible = getVisibleCount();
  const maxIndex = Math.max(0, cards.length - visible);

  if (diff > thresh) {
    currentIndex = Math.max(0, currentIndex - visible);
    updateCarousel();
  } else if (diff < -thresh) {
    currentIndex = Math.min(maxIndex, currentIndex + visible);
    updateCarousel();
  }
});

// пересчёт при ресайзе
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const cards = forecastEl.querySelectorAll('.card');
    const visible = getVisibleCount();
    currentIndex = Math.min(currentIndex, Math.max(0, cards.length - visible));
    updateButtonsState();
    updateCarousel(false);
  }, 120);
});

function showModal(data) {
  let modal = document.getElementById('weather-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'weather-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <button class="modal-close" aria-label="Закрыть">&times;</button>
        <div class="modal-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  const content = modal.querySelector('.modal-content');
  content.innerHTML = `
    <div class="modal-header">
      ${data.icon}
      <div>
        <h2>${formatLabel(data.date)} — ${data.label}</h2>
        <p>${data.tempMin}° / ${data.tempMax}°</p>
      </div>
    </div>
    <ul class="modal-details">
      <li><strong>Влажность:</strong> ${data.humidityMin ?? '—'}–${data.humidityMax ?? '—'}%</li>
      <li><strong>Давление:</strong> ${data.pressureMin ?? '—'}–${data.pressureMax ?? '—'} гПа</li>
      <li><strong>Ветер:</strong> ${data.windSpeed ?? '—'} км/ч (${degToDir(data.windDir)})</li>
      <li><strong>Осадки:</strong> ${data.precipitation ?? '—'} мм</li>
      <li><strong>Солнечные часы:</strong> ${data.sunshine ?? '—'} ч</li>
      <li><strong>Вероятность осадков:</strong> ${data.precipitationProb ?? '—'}%</li>
      <li><strong>Индекс УФ:</strong> ${data.uvIndex ?? '—'}</li>
      <li><strong>Видимость:</strong> ${data.visibility ?? '—'} м</li>
    </ul>
  `;
}

function degToDir(deg) {
  if (deg == null) return '—';
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  return dirs[Math.round(deg / 45) % 8];
}
