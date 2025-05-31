document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const userLocation_ip = document.getElementById("user-location-ip");
  const userLocation_lat_long = document.getElementById(
    "user-location-lat-long"
  );

  const getLocationBtn = document.getElementById("get-location");
const originalBtnHTML = getLocationBtn.innerHTML;


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
  // Step 1: Fetch 50 nearby cities within a 300km radius.
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
      const indicesToPick = [55, 165, 400, 455, 499]; // Some Random locations nearby filtered from 500 locations nearby

      indicesToPick.forEach(index => {
        // Check if a city exists at this index before adding it
        if (data.geonames[index]) {
          selectedCities.push(data.geonames[index]);
        }
      });

      // Step 3: Populate the dropdown with the 5 selected cities.
      if (selectedCities.length > 0) {
          citySelect.innerHTML = `<option value="">Select a nearby city(Location)</option>`;
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

      // --- THE FIX: Update map view and marker to the user's IP location ---
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]).setPopupContent(`${city}, ${country}`).openPopup();

      // Fetch weather for the detected location
      fetchWeather(lat, lon);
      // --- NEW: Call the function to get nearby cities ---
      fetchNearbyCities(lat, lon);
    })
    .catch(() => {
      userLocation_ip.textContent = "Location detection failed.";
    });

  // --- MODIFIED: Geolocation button functionality ---
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

        // This function will now handle restoring the button state
        fetchWeather(lat, lon);

        // --- NEW: Call the function to get nearby cities ---
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
        // loader.classList.add("d-none");
        
        // --- MODIFICATION: Restore button on error ---
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = originalBtnHTML;
      }
    );
  });

  // --- THE FIX: A single, consolidated event listener for city selection ---
  citySelect.addEventListener("change", () => {
    const selectedOption = citySelect.options[citySelect.selectedIndex];
  
    // Ensure the selected option is a valid city with coordinates
    if (selectedOption.value && selectedOption.dataset.lat && selectedOption.dataset.lng) {
      const lat = selectedOption.dataset.lat;
      const lon = selectedOption.dataset.lng;
      const cityName = selectedOption.text;
  
      // --- NEW: Display the coordinates of the selected city ---
      userLocation_lat_long.textContent = `Lat: ${parseFloat(lat).toFixed(4)}, Lon: ${parseFloat(lon).toFixed(4)}`;

      // 1. Fetch the new weather data
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

        // This function will now handle restoring the button state
        fetchWeather(lat, lon);

        // --- NEW: Call the function to get nearby cities ---
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
        
        // --- MODIFICATION: Restore button on error ---
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = originalBtnHTML;
      }
    );
  });



// ⬇️ REPLACE the existing 'fetchWeather' function with this new, corrected one ⬇️
async function fetchWeather(lat, lon) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=9`;
    const cardBody = document.getElementById('weather-card').querySelector('.card-body');

    // --- FIX: Manage visibility without destroying elements ---
    // First, ensure our required elements are inside the card body (in case an error cleared them before)
    if (!cardBody.contains(weatherDetails)) {
        cardBody.innerHTML = ''; // Clear out the error message
        cardBody.appendChild(weatherCardLoader);
        cardBody.appendChild(weatherDetails);
    }
    
    // Now, correctly toggle visibility
    weatherDetails.classList.add("d-none");
    weatherCardLoader.classList.remove("d-none");

    try {
      clearForecasts();

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching data");
      const data = await response.json();

      const today = data.forecast.forecastday[0];

      // This part is now safe because the #weather-details div was never deleted
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
      
      // --- FIX: Hide loader and show the populated details ---
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
      data.forecast.forecastday.forEach((day) => {
        const dateObj = new Date(day.date);
        const dayName = daysOfWeek[dateObj.getDay()];
        const formattedDate = `${dateObj.getDate()}/${
          dateObj.getMonth() + 1
        }`;

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("card");

        const todayDate = new Date();
        const isToday =
          dateObj.getDate() === todayDate.getDate() &&
          dateObj.getMonth() === todayDate.getMonth() &&
          dateObj.getFullYear() === todayDate.getFullYear();

        if (isToday) {
          dayDiv.classList.add("today-card");
        }

                console.log("--------------------------------------------------");
        console.log(day.day.condition.icon);

        dayDiv.innerHTML = `
        <h5 class="font-semibold">${dayName}</h5>
        <p>${formattedDate}</p>
        <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" style="display: block; margin: 0 auto;" />
        <p>${day.day.condition.text}</p>
        <p>🌡️ ${day.day.maxtemp_c}°C / ${day.day.mintemp_c}°C</p>
    `;
        dailyForecastDiv.appendChild(dayDiv);
      });

      hourlyForecastDiv.innerHTML = '';
      const hoursToday = data.forecast.forecastday[0].hour;
      const hoursTomorrow = data.forecast.forecastday[1]?.hour || [];
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.toISOString().split("T")[0];

      [...hoursToday, ...hoursTomorrow].forEach((hour) => {
        const hourDiv = document.createElement("div");
        hourDiv.classList.add("card");
        const time = hour.time.split(" ")[1];
        const hourDate = hour.time.split(" ")[0];
        const hourHour = parseInt(time.split(":")[0]);

        if (hourDate === currentDate && hourHour === currentHour) {
          hourDiv.classList.add("current-hour-card");
          hourDiv.setAttribute("id", "current-hour");
        }


        console.log("-------------------------------------sdfsdf--------------");
        console.log(hour.condition.icon);

        hourDiv.innerHTML = `
          <strong class="d-block mb-1">${time}</strong>
          <img src="https:${hour.condition.icon}"
            class="mb-1" style="display: block; margin: 0 auto;" />
          <span class="small">${hour.temp_c}°C - ${hour.condition.text}</span>
  `;
        hourlyForecastDiv.appendChild(hourDiv);
      });

      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const currentHourCard = document.getElementById("current-hour");
              if (currentHourCard) {
                currentHourCard.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest",
                });
                currentHourCard.classList.add("highlight");
                setTimeout(() => {
                  currentHourCard.classList.remove("highlight");
                }, 5000);
              }
              observer.disconnect();
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

      cachedHourlyData = [...hoursToday, ...hoursTomorrow];
      initChartObserver();
    } catch (error) {
      console.error("Error fetching weather data:", error);
      
      // --- FIX: On error, just replace the card body content with the error ---
      cardBody.innerHTML = "<p class='text-danger fw-bold'>Could not fetch weather data.</p>";
      clearForecasts();
    } finally {
        // This restores the "Use My Location" button state
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = originalBtnHTML;
    }
  }




  


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

    let chartsDrawn = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !chartsDrawn) {
            drawChart(cachedHourlyData);
            drawPrecipitationChart(cachedHourlyData);
            chartsDrawn = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(chartSection);
  }
});