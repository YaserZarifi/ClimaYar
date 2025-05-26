document.addEventListener("DOMContentLoaded", () => {
  const userLocation = document.getElementById("user-location");
  const userIp = document.getElementById("user-ip");
  const getLocationBtn = document.getElementById("get-location");

  // 1. Get user's location based on IP
  fetch("http://ip-api.com/json/")
    .then(res => res.json())
    .then(data => {
      const city = data.city;
      const country = data.country;
      const lat = data.lat;
      const lon = data.lon;
      const ip = data.query;

      userIp.textContent = ip;
      userLocation.textContent = `${city}, ${country}`;

    });

  // 2. Get user's accurate location using browser geolocation
  getLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          userLocation.textContent = `دقیق: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;

          // You can call weather API here using lat and lon
        },
        err => {
          userLocation.textContent = "❗ دسترسی به مکان توسط کاربر رد شد.";
        }
      );
    } else {
      userLocation.textContent = "مرورگر شما از Geolocation پشتیبانی نمی‌کند.";
    }
  });
});
