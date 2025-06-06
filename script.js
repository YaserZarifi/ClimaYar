document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const userLocation_ip = document.getElementById("user-location-ip");
  const userLocation_lat_long = document.getElementById(
    "user-location-lat-long"
  );

  

  let fullForecastData = [];
let chartsFirstDrawn = false; 
let activeDayIndex = 0;


const citySelectSpinner = document.getElementById("city-select-spinner");

  const getLocationBtn = document.getElementById("get-location");
const originalBtnHTML = getLocationBtn.innerHTML;


const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const body = document.body;


  const weatherCardLoader = document.getElementById("weather-card-loader");
  const weatherDetails = document.getElementById("weather-details");

  const userIp = document.getElementById("user-ip");
  const citySelect = document.getElementById("city-select");
  // const loader = document.getElementById("loader");

  const dailyForecastDiv = document.getElementById("daily-forecast");
  
  const hourlyForecastDiv = document.getElementById("hourly-forecast");

  // WeatherAPI key
  const weatherApiKey = "fccfcc8428bd443bb1b114714252605";

  // --- NEW: GeoNames Username ---
  const geonamesUsername = "yaser.zarifi";

  let lat, lon;
  let weatherChart;
  let precipChart;







// Function to set the theme
const setTheme = (theme) => {
  if (theme === 'dark') {
    body.classList.add('dark');
    themeToggleIcon.classList.remove('fa-sun');
    themeToggleIcon.classList.add('fa-moon');
    themeToggleIcon.style.color = '#e0e0e0'; 
  } else {
    body.classList.remove('dark');
    themeToggleIcon.classList.remove('fa-moon');
    themeToggleIcon.classList.add('fa-sun');
    themeToggleIcon.style.color = '#ffc107';
  }
};

// Check for a saved theme in localStorage and apply it on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
} else {
  setTheme('light'); 
}

themeToggleBtn.addEventListener('click', () => {
  if (body.classList.contains('dark')) {
    setTheme('light');
    localStorage.setItem('theme', 'light');
  } else {
    setTheme('dark');
    localStorage.setItem('theme', 'dark');
  }
});







  function clearForecasts() {
    dailyForecastDiv.innerHTML = "";
    hourlyForecastDiv.innerHTML = "";
    if (weatherChart) {
      weatherChart.destroy();
      weatherChart = null;
    }
    if (precipChart) {
      precipChart.destroy();
      precipChart = null;
    }
  }

  // --- NEW FUNCTION: Fetches 10 nearby cities from GeoNames ---

async function fetchNearbyCities(lat, lon) {
  // --- 1. Show Loading State ---
  citySelect.disabled = true;
  citySelect.innerHTML = `<option value="">Loading nearby cities...</option>`;

  const radius = 300; 
  const maxRows = 500; 
  const url = `https://secure.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lon}&radius=${radius}&maxRows=${maxRows}&username=${geonamesUsername}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch nearby cities from GeoNames.");
    }
    const data = await response.json();

    if (data.geonames && data.geonames.length > 0) {
      const selectedCities = [];
      const indicesToPick = [55, 165, 400, 455, 499];

      indicesToPick.forEach(index => {
        if (data.geonames[index]) {
          selectedCities.push(data.geonames[index]);
        }
      });

      if (selectedCities.length > 0) {
          citySelect.innerHTML = `<option value="">Select a nearby city (Location)</option>`;
          selectedCities.forEach((city) => {
              const option = document.createElement("option");
              option.value = city.name;
              option.textContent = `${city.name}, ${city.countryCode}`;
              option.dataset.lat = city.lat;
              option.dataset.lng = city.lng;
              citySelect.appendChild(option);
          });
      } else {
          citySelect.innerHTML = `<option value="">Could not select diverse cities</option>`;
      }
    } else {
       citySelect.innerHTML = '<option value="">No nearby cities found</option>';
    }
  } catch (error) {
    console.error("Error fetching nearby cities:", error);
    citySelect.innerHTML = '<option value="">Error loading cities</option>';
  } finally {
    // --- 2. Restore dropdown after loading (on success or error) ---
    citySelect.disabled = false;
  }
}

  // --- MODIFIED: Initial IP-based location detection ---
  fetch("http://ip-api.com/json/")
    .then((res) => res.json())
    .then((data) => {
      lat = data.lat;
      lon = data.lon;
      const city = data.city;
      const country = data.country;
      const ip = data.query;

      userIp.textContent = ip;
      userLocation_ip.textContent = `${city}, ${country}`;

    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]).setPopupContent(`${city}, ${country}`).openPopup();

      fetchWeather(lat, lon);
      fetchNearbyCities(lat, lon);
    })
    .catch(() => {
      userLocation_ip.textContent = "Location detection failed.";
    });

  getLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      userLocation_lat_long.textContent =
        "Your browser does not support Geolocation.";
      return;
    }

    // --- MODIFICATION: Disable button and show loading state ---
    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span role="status"> Detecting...</span>`;
    // loader.classList.remove("d-none");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        userLocation_lat_long.textContent = ` ${lat.toFixed(4)}, ${lon.toFixed(
          4
        )}`;

        fetchWeather(lat, lon);

        fetchNearbyCities(lat, lon);

        if (map) {
          map.setView([lat, lon], 13);
          if (marker) {
            marker.setLatLng([lat, lon]).setPopupContent("Your Location").openPopup();
          } else {
            marker = L.marker([lat, lon]).addTo(map).bindPopup("Your Location").openPopup();
          }
        }
      },
      (err) => {
        userLocation_lat_long.textContent =
          "❗ Location access was denied by the user.";
        
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = originalBtnHTML;
      }
    );
  });

  citySelect.addEventListener("change", () => {
    const selectedOption = citySelect.options[citySelect.selectedIndex];
  
    if (selectedOption.value && selectedOption.dataset.lat && selectedOption.dataset.lng) {
      const lat = selectedOption.dataset.lat;
      const lon = selectedOption.dataset.lng;
      const cityName = selectedOption.text;
  
      userLocation_lat_long.textContent = `Lat: ${parseFloat(lat).toFixed(4)}, Lon: ${parseFloat(lon).toFixed(4)}`;

      fetchWeather(lat, lon);
  
      // 2. Update the map view
      const latFloat = parseFloat(lat);
      const lonFloat = parseFloat(lon);
      if (!isNaN(latFloat) && !isNaN(lonFloat)) {
        map.setView([latFloat, lonFloat], 11);
        marker.setLatLng([latFloat, lonFloat]).setPopupContent(cityName).openPopup();
      }
    }
  });


  let cachedHourlyData = [];

  let map = L.map("city-map").setView([35.6892, 51.389], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let marker = L.marker([35.6892, 51.389])
    .addTo(map)
    .bindPopup("Tehran")
    .openPopup();


    
  getLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      userLocation_lat_long.textContent =
        "Your browser does not support Geolocation.";
      return;
    }

    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span role="status"> Detecting...</span>`;
    // loader.classList.remove("d-none");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        userLocation_lat_long.textContent = ` ${lat.toFixed(4)}, ${lon.toFixed(
          4
        )}`;

        fetchWeather(lat, lon);

        fetchNearbyCities(lat, lon);

        if (map) {
          map.setView([lat, lon], 13);
          if (marker) {
            marker.setLatLng([lat, lon]).setPopupContent("Your Location").openPopup();
          } else {
            marker = L.marker([lat, lon]).addTo(map).bindPopup("Your Location").openPopup();
          }
        }
      },
      (err) => {
        userLocation_lat_long.textContent =
          "❗ Location access was denied by the user.";
          userLocation_lat_long.style.color = "red";
        // loader.classList.add("d-none");
        
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = originalBtnHTML;
      }
    );
  });



async function fetchWeather(lat, lon) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=9`;
    const cardBody = document.getElementById('weather-card').querySelector('.card-body');

        chartsFirstDrawn = false;
    activeDayIndex = 0;

    if (!cardBody.contains(weatherDetails)) {
        cardBody.innerHTML = '';
        cardBody.appendChild(weatherCardLoader);
        cardBody.appendChild(weatherDetails);
    }
    
    weatherDetails.classList.add("d-none");
    weatherCardLoader.classList.remove("d-none");

    try {
      clearForecasts();


      renderSkeletonCards(dailyForecastDiv, 14); // Render 14 skeletons for the daily forecast
      renderSkeletonCards(hourlyForecastDiv, 24); // Render 24 for the hourly forecast
    

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching data");
      const data = await response.json();

      fullForecastData = data.forecast.forecastday; // Store the full forecast

      const today = fullForecastData[0];

      document.getElementById("loc").textContent = data.location.name;
      document.getElementById("weather-date").textContent = formatDayWithDate(
        today.date
      );
      document.getElementById("weather-icon").src =
        "https:" + today.day.condition.icon;
      document.getElementById("weather-icon").alt = today.day.condition.text;
      document.getElementById("weather-condition").textContent =
        today.day.condition.text;
      document.getElementById(
        "weather-temp-range"
      ).textContent = `${data.current.temp_c}°C`;
      document.getElementById(
        "weather-rain-chance"
      ).textContent = `Chance of rain: ${today.day.daily_chance_of_rain}%`;
      
      weatherCardLoader.classList.add("d-none");
      weatherDetails.classList.remove("d-none");


      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      dailyForecastDiv.innerHTML = '';
      fullForecastData.forEach((day, index) => { // Added 'index' here
        const dateObj = new Date(day.date);
        const dayName = daysOfWeek[dateObj.getDay()];
        const formattedDate = `${dateObj.getDate()}/${
          dateObj.getMonth() + 1
        }`;

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("card", "daily-card"); // Added 'daily-card' class for listener
        dayDiv.dataset.dayIndex = index; // Add data-attribute to identify the day

        const todayDate = new Date();
        const isToday =
          dateObj.getDate() === todayDate.getDate() &&
          dateObj.getMonth() === todayDate.getMonth() &&
          dateObj.getFullYear() === todayDate.getFullYear();

        if (isToday) {
          dayDiv.classList.add("today-card", "active"); 
        }

  

        dayDiv.innerHTML = `
          <div class="daily-card-summary">
            <h5 class="font-semibold">${dayName}</h5>
            <p>${formattedDate}</p>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" style="display: block; margin: 0 auto;" />
            <p>${day.day.condition.text}</p>
            <p>🌡️ ${day.day.maxtemp_c}°C / ${day.day.mintemp_c}°C</p>
          </div>
           <div class="daily-card-details" style="margin-top: 10px; border-top: 1px solid rgba(128,128,128,0.3); padding-top: 10px;">
            </div>
        `;
        dailyForecastDiv.appendChild(dayDiv);
      });
            

 updateHourlyForecast(0); 
      initChartObserver(); 
      // Show today's hourly forecast by default
    } catch (error) {
      console.error("Error fetching weather data:", error);
      
      cardBody.innerHTML = "<p class='text-danger fw-bold'>Could not fetch weather data.</p>";
      clearForecasts();
    } finally {
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = originalBtnHTML;
    }
}



// This new function updates the hourly forecast section for a specific day
function updateHourlyForecast(dayIndex) {
  const hourlyForecastTitle = document.getElementById("hourly-forecast-title");
  const selectedDay = fullForecastData[dayIndex];
  const dayName = new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long' });

  hourlyForecastTitle.textContent = `Hourly Forecast for ${dayName}`;
  hourlyForecastDiv.innerHTML = ''; // Clear previous hourly forecast

  const hours = selectedDay.hour;
  const now = new Date();
  const currentHour = now.getHours();
  const todayDateStr = now.toISOString().split("T")[0];
  let currentHourCardExists = false; // Flag to see if the special card was created

  hours.forEach((hour) => {
    const hourDiv = document.createElement("div");
    hourDiv.classList.add("card");
    const time = hour.time.split(" ")[1];
    const hourDate = hour.time.split(" ")[0];
    const hourHour = parseInt(time.split(":")[0]);

    if (hourDate === todayDateStr && hourHour === currentHour) {
      hourDiv.classList.add("current-hour-card");
      hourDiv.setAttribute("id", "current-hour");
      currentHourCardExists = true; // Set the flag because we found the current hour
    }

    hourDiv.innerHTML = `
      <strong class="d-block mb-1">${time}</strong>
      <img class="mb-1" style="display: block; margin: 0 auto;" src="https:${hour.condition.icon} " />
      <span class="small">${hour.temp_c}°C - ${hour.condition.text}</span>
    `;
    hourlyForecastDiv.appendChild(hourDiv);
  });
  
  if (chartsFirstDrawn) {
    drawChart(hours);
    drawPrecipitationChart(hours);
  }

  // Only activate the observer if the current-hour-card was actually created.
  if (currentHourCardExists) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const currentHourCard = document.getElementById("current-hour");
              if (currentHourCard) {
                currentHourCard.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest",
                });
              }
              // Disconnect after the scroll has been triggered once
              obs.disconnect();
            }
          });
        },
        {
          threshold: 0.5,
        }
      );

      const hourlySection = document.getElementById("hourly-section");
      if (hourlySection) {
        observer.observe(hourlySection);
      }
  }
}

// This new event listener handles clicks on the daily forecast cards

dailyForecastDiv.addEventListener('click', (e) => {
  const clickedCard = e.target.closest('.daily-card');
  if (!clickedCard) return; // Exit if the click was not on a card

  const dayIndex = parseInt(clickedCard.dataset.dayIndex);
  activeDayIndex = dayIndex; // Keep track of the active day for the separate hourly forecast

  // Handle expansion:
  const isAlreadyExpanded = clickedCard.classList.contains('expanded');
  
  // First, collapse any other card that might be expanded
  dailyForecastDiv.querySelectorAll('.daily-card.expanded').forEach(card => {
    if (card !== clickedCard) { // Don't collapse the one we are about to toggle
      card.classList.remove('expanded');
      const detailsDiv = card.querySelector('.daily-card-details');

    }
  });

  // Now, toggle the clicked card's expansion
  clickedCard.classList.toggle('expanded');
  const detailsDiv = clickedCard.querySelector('.daily-card-details');

  if (clickedCard.classList.contains('expanded')) {
    // If it's now expanded, populate its details
    const dayData = fullForecastData[dayIndex];
    detailsDiv.innerHTML = `
      <p><i class="fas fa-info-circle"></i> <strong>Summary:</strong> ${dayData.day.condition.text}</p>
      <p><i class="fas fa-wind"></i> <strong>Max Wind:</strong> ${dayData.day.maxwind_kph} kph</p>
      <p><i class="fas fa-tint"></i> <strong>Avg Humidity:</strong> ${dayData.day.avghumidity}%</p>
      <p><i class="fas fa-sun"></i> <strong>Sunrise:</strong> ${dayData.astro.sunrise}</p>
      <p><i class="far fa-moon"></i> <strong>Sunset:</strong> ${dayData.astro.sunset}</p>
    `;
  } else {
    // If it's now collapsed, clear its details
    if (detailsDiv) { // Ensure detailsDiv exists before trying to clear
        detailsDiv.innerHTML = '';
    }
  }

  // This part remains: Update the separate hourly forecast section for the clicked day
  updateHourlyForecast(dayIndex);

  // This part also remains: Manage the '.active' class for visual feedback
  // (e.g., if you have a style for .active to highlight it differently)
  const currentActiveHighlight = dailyForecastDiv.querySelector('.card.active');
  if (currentActiveHighlight) {
    currentActiveHighlight.classList.remove('active');
  }
  clickedCard.classList.add('active'); 
  

});
  


  function formatDayWithDate(dateStr) {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dateObj = new Date(dateStr);
    const dayName = daysOfWeek[dateObj.getDay()];
    const formattedDate = `${dateObj.getDate()}/${
      dateObj.getMonth() + 1
    }/${dateObj.getFullYear()}`;
    return `${dayName} - ${formattedDate}`;
  }

  function drawChart(hourlyData) {
    const labels = hourlyData.map((item) => item.time.split(" ")[1]);
    const temperatureData = hourlyData.map((item) => item.temp_c);

    if (weatherChart) {
      weatherChart.destroy();
    }

    const ctx = document.getElementById("weatherChart").getContext("2d");
    weatherChart = new Chart(ctx, {
        type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: temperatureData,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            yAxisID: "y",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        stacked: false,
        animation: {
          duration: 1500,
          easing: "easeInOutQuart",
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Temperature (°C)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour",
            },
          },
        },
      },
    });
  }

  function drawPrecipitationChart(hours) {
    const labels = hours.map((h) => h.time.split(" ")[1]);
    const precipData = hours.map((h) => h.precip_mm);

    if (precipChart) {
      precipChart.destroy();
    }

    const ctx = document.getElementById("precipitation-chart").getContext("2d");
    precipChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Precipitation (mm)",
            data: precipData,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        animation: {
          duration: 1500,
          easing: "easeInOutQuart",
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Millimeter",
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour",
            },
          },
        },
      },
    });
  }

function initChartObserver() {
    const chartSection = document.getElementById("charts-section");
    if (!chartSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if the section is visible AND if the charts haven't been drawn yet
          if (entry.isIntersecting && !chartsFirstDrawn) {
            
            // Get the hourly data for the currently active day
            const hoursForActiveDay = fullForecastData[activeDayIndex].hour;

            // Draw the charts for the first time
            drawChart(hoursForActiveDay);
            drawPrecipitationChart(hoursForActiveDay);
            
            // Set the flag to true so they don't re-draw on scroll
            chartsFirstDrawn = true;
            
            // We can now disconnect the observer as its job is done
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(chartSection);
}

// --- New Map Interactivity ---

// 1. Logic for clicking on the map to get weather
map.on('click', function(e) {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;

  // Move the marker to the clicked location
  marker.setLatLng(e.latlng).setPopupContent(`Weather at ${lat.toFixed(2)}, ${lon.toFixed(2)}`).openPopup();

  // Update the coordinate display
  userLocation_lat_long.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
  
  // Fetch weather for the new coordinates
  fetchNearbyCities(lat, lon);
  fetchWeather(lat, lon);
});

// 2. Logic for the Maximize button

// Get all elements needed for the map popup view
const maximizeMapBtn = document.getElementById('maximize-map-btn');
const mapContainer = document.getElementById('map-container');
const mapOverlay = document.getElementById("map-overlay");

// 1. A single, reusable function to open and close the map
function toggleMapView() {
  mapContainer.classList.toggle('maximized');
  const isMaximized = mapContainer.classList.contains('maximized');

  // Show or hide the dark background overlay
  mapOverlay.style.display = isMaximized ? 'block' : 'none';

  // Change the button's icon and title
  const icon = maximizeMapBtn.querySelector('i');
  if (isMaximized) {
    icon.classList.remove('fa-expand');
    icon.classList.add('fa-compress');
    maximizeMapBtn.title = "Minimize map";
  } else {
    icon.classList.remove('fa-compress');
    icon.classList.add('fa-expand');
    maximizeMapBtn.title = "Maximize map";
  }

  // Tell Leaflet to recalculate its size after the change
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

// 2. Attach the same function to both the button and the overlay
maximizeMapBtn.addEventListener('click', toggleMapView);
mapOverlay.addEventListener('click', toggleMapView); // This makes the "empty black space" clickable



// 3. Logic for the "Recenter" button

const recenterMapBtn = document.getElementById('recenter-map-btn');
const originalRecenterBtnHTML = recenterMapBtn.innerHTML; // Save the original icon

recenterMapBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    // 1. Show the loading spinner
    recenterMapBtn.disabled = true;
    recenterMapBtn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Fly to the user's location on the map
        map.flyTo([lat, lon], 13);
        marker.setLatLng([lat, lon]).setPopupContent("Your Location").openPopup();

        // 2. Restore the button after success
        recenterMapBtn.disabled = false;
        recenterMapBtn.innerHTML = originalRecenterBtnHTML;
      },
      (err) => {
        // Handle error if user denies location
        alert("Could not get your location. Please grant permission.");
        
        // 3. Restore the button on error
        recenterMapBtn.disabled = false;
        recenterMapBtn.innerHTML = originalRecenterBtnHTML;
      }
    );
  }
});


const mapControlContainer = document.getElementById('maximize-map-btn').parentElement;
L.DomEvent.on(mapControlContainer, 'mousedown dblclick', L.DomEvent.stopPropagation);
L.DomEvent.on(mapControlContainer, 'click', L.DomEvent.stopPropagation);



function renderSkeletonCards(container, count) {
  container.innerHTML = ''; // Clear any previous content
  for (let i = 0; i < count; i++) {
    const skeletonDiv = document.createElement('div');
    skeletonDiv.classList.add('skeleton-card');
    container.appendChild(skeletonDiv);
  }
}

});