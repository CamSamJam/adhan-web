let currentTimings = {};
let timezone = "";
let nextPrayerTime = null;
let nextPrayerName = "";

const cityInput = document.getElementById('city');
const suggestionsBox = document.getElementById('suggestions');

cityInput.addEventListener('input', async () => {
  const query = cityInput.value;
  if (query.length < 2) {
    suggestionsBox.style.display = 'none';
    return;
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(query)}&format=json&limit=5`);
  const data = await response.json();

  suggestionsBox.innerHTML = '';
  data.forEach(place => {
    const div = document.createElement('div');
    div.textContent = place.display_name;
    div.addEventListener('click', () => {
      cityInput.value = place.display_name;
      suggestionsBox.style.display = 'none';
    });
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = data.length > 0 ? 'block' : 'none';
});

document.getElementById('city-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value;
  if (city) {
    await getPrayerTimes(city);
    updateNextPrayer();
  }
});

async function getPrayerTimes(city) {
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(city)}`);
    const data = await response.json();
    currentTimings = data.data.timings;
    timezone = data.data.meta.timezone;
    displayTimings();
  } catch (e) {
    document.getElementById('prayer-times').innerText = "Erreur lors du chargement.";
  }
}

function displayTimings() {
  const times = `
    Fajr : ${currentTimings.Fajr}<br>
    Dhuhr : ${currentTimings.Dhuhr}<br>
    Asr : ${currentTimings.Asr}<br>
    Maghrib : ${currentTimings.Maghrib}<br>
    Isha : ${currentTimings.Isha}
  `;
  document.getElementById('prayer-times').innerHTML = times;
}

function updateNextPrayer() {
  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));

  let found = false;
  for (let name of prayerOrder) {
    const [hour, minute] = currentTimings[name].split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(hour, minute, 0, 0);
    if (prayerDate > now) {
      nextPrayerName = name;
      nextPrayerTime = prayerDate;
      found = true;
      break;
    }
  }

  if (!found) {
    // prochaine prière : Fajr demain
    const [hour, minute] = currentTimings['Fajr'].split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setDate(prayerDate.getDate() + 1);
    prayerDate.setHours(hour, minute, 0, 0);
    nextPrayerName = 'Fajr';
    nextPrayerTime = prayerDate;
  }

  document.getElementById('next-prayer').innerText = nextPrayerName;
}

function updateCountdown() {
  if (!nextPrayerTime) return;

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const diffMs = nextPrayerTime - now;

  if (diffMs <= 0) {
    document.getElementById('countdown').innerText = "C'est l'heure !";
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  document.getElementById('countdown').innerText =
    `${hours.toString().padStart(2, '0')}:` +
    `${minutes.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;
}

setInterval(updateCountdown, 1000);
