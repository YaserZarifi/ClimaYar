document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const userLocation_ip = document.getElementById("user-location-ip");
  const userLocation_lat_long = document.getElementById("user-location-lat-long");
  const userIp = document.getElementById("user-ip");
  const getLocationBtn = document.getElementById("get-location");
  const loader = document.getElementById("loader");

  const dailyForecastDiv = document.getElementById("daily-forecast");
  const hourlyForecastDiv = document.getElementById("hourly-forecast");

  const apiKey = "fccfcc8428bd443bb1b114714252605";

  let lat, lon;
  let weatherChart; // This variable holds the weather chart
  let precipChart;  // For the precipitation chart

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

      fetchWeather(lat, lon);
    })
    .catch(() => {
      userLocation_ip.textContent = "Location detection failed.";
    });

  getLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      userLocation_lat_long.textContent = "Your browser does not support Geolocation.";
      return;
    }

    loader.style.display = "block";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        userLocation_lat_long.textContent = ` ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        fetchWeather(lat, lon);
      },
      (err) => {
        userLocation_lat_long.textContent = "❗ Location access was denied by the user.";
        loader.style.display = "none";
      }
    );
  });

  const citySelect = document.getElementById("city-select");

  // Map cities to coordinates
  const cityCoords = {
    "Tehran": { lat: 35.6892, lon: 51.3890 },
    "Mashhad": { lat: 36.2605, lon: 59.6168 },
    "Isfahan": { lat: 32.6546, lon: 51.6680 },
    "Shiraz": { lat: 29.5918, lon: 52.5836 },
    "Tabriz": { lat: 38.0962, lon: 46.2738 }
  };

  citySelect.addEventListener("change", () => {
    const selectedCity = citySelect.value;
    if (selectedCity && cityCoords[selectedCity]) {
      const { lat, lon } = cityCoords[selectedCity];
      fetchWeather(lat, lon);
    }
  });

  let cachedHourlyData = [];  // Cache the data so charts can be rendered on scroll

  async function fetchWeather(lat, lon) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=9`;

    try {
      loader.style.display = "block";
      clearForecasts();

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching data");
      const data = await response.json();

      const today = data.forecast.forecastday[0];

      document.getElementById("loc").textContent = data.location.name;
      document.getElementById("weather-date").textContent = formatDayWithDate(today.date);
      document.getElementById("weather-icon").src = "https:" + today.day.condition.icon;
      document.getElementById("weather-icon").alt = today.day.condition.text;
      document.getElementById("weather-condition").textContent = today.day.condition.text;
    //   document.getElementById("weather-temp-range").textContent = `${today.day.mintemp_c}°C / ${today.day.maxtemp_c}°C`;
    document.getElementById("weather-temp-range").textContent = `${data.current.temp_c}°C`;

     document.getElementById("weather-rain-chance").textContent = `Chance of rain: ${today.day.daily_chance_of_rain}%`;

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      data.forecast.forecastday.forEach((day) => {
        const dateObj = new Date(day.date);
        const dayName = daysOfWeek[dateObj.getDay()];
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("card");

        dayDiv.innerHTML = `
          <h5 class="font-semibold">${dayName}</h5>
          <p>${formattedDate}</p>
          <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
          <p >${day.day.condition.text}</p>
          <p>🌡️ ${day.day.maxtemp_c}°C / ${day.day.mintemp_c}°C</p>
        `;

        dailyForecastDiv.appendChild(dayDiv);
      });

      const hoursToday = data.forecast.forecastday[0].hour;
      const hoursTomorrow = data.forecast.forecastday[1]?.hour || [];

      [...hoursToday, ...hoursTomorrow].forEach((hour) => {
        const hourDiv = document.createElement("div");
        hourDiv.classList.add("card");
        const time = hour.time.split(" ")[1];

        hourDiv.innerHTML = `
          <strong class="d-block mb-1">${time}</strong>
          <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" class="mb-1" />
          <span class="small">${hour.temp_c}°C - ${hour.condition.text}</span>
        `;

        hourlyForecastDiv.appendChild(hourDiv);
      });

      cachedHourlyData = [...hoursToday, ...hoursTomorrow];

      loader.style.display = "none";
      initChartObserver(); // Activate observer for chart rendering
    } catch (error) {
      console.error("Error fetching weather data:", error);
      loader.style.display = "none";
      document.getElementById("weather-card").textContent =
        "Error fetching weather data.";
      clearForecasts();
    }
  }

  function formatDayWithDate(dateStr) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateObj = new Date(dateStr);
    const dayName = daysOfWeek[dateObj.getDay()];
    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    return `${dayName} - ${formattedDate}`;
  }

  // Function to draw temperature chart
  function drawChart(hourlyData) {
    const labels = hourlyData.map((item) => item.time.split(" ")[1]);
    const temperatureData = hourlyData.map((item) => item.temp_c);

    if (weatherChart) {
      weatherChart.destroy();
    }

    const ctx = document.getElementById("weatherChart").getContext("2d");

    weatherChart = new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          {
            type: "line",
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
          easing: 'easeInOutQuart',
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
            beginAtZero: false,
          },
          x: {
            title: {
              display: true,
              text: "Hour"
            }
          }
        },
      },
    });
  }

  // Function to draw precipitation chart
  function drawPrecipitationChart(hours) {
    const labels = hours.map(h => h.time.split(" ")[1]);
    const precipData = hours.map(h => h.precip_mm);

    if (precipChart) {
      precipChart.destroy();
    }

    const ctx = document.getElementById("precipitation-chart").getContext("2d");

    precipChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Precipitation (mm)',
          data: precipData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart',
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Millimeter'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Hour'
            }
          }
        }
      }
    });
  }

  // Intersection Observer to check if charts are visible in viewport
  function initChartObserver() {
    const chartSection = document.getElementById("charts-section");
    if (!chartSection) return;

    let chartsDrawn = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !chartsDrawn) {
          drawChart(cachedHourlyData);
          drawPrecipitationChart(cachedHourlyData);
          chartsDrawn = true;
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(chartSection);
  }

});
