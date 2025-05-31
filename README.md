# ClimaYar - Weather Forecast Web Application

ClimaYar is an interactive web application that provides users with current weather conditions and a 7-9 day forecast for locations worldwide. It features automatic location detection, manual search via an interactive map or city dropdown, and a responsive design with switchable light and dark themes.

## Features

* **Dynamic Location Detection:**
    * Automatically determines user's location via IP address on initial page load.
    * Option to use the browser's Geolocation API ("Use My Location" button) for more precise positioning.
* **Flexible Location Selection:**
    * Interactive Leaflet map: Click anywhere on the map to get weather for that point.
    * City dropdown: Dynamically populated with nearby cities based on the current location, using the GeoNames API.
* **Comprehensive Weather Display:**
    * **Main Weather Card:** Shows current day's overall weather, including temperature, condition, icon, and chance of rain. Updates if a different day is selected from the daily forecast.
    * **Daily Forecast:** Displays a 7-9 day forecast. Each daily card is expandable on click to show more details (summary, max wind, average humidity, sunrise/sunset times).
    * **Hourly Forecast:** Shows an hourly breakdown for the currently selected day from the daily forecast. Automatically scrolls to the current hour for today's forecast.
    * **Interactive Charts:** Temperature and precipitation charts (using Chart.js) display hourly data for the selected day. These charts are lazy-loaded (appear when scrolled into view).
* **User Interface & Experience:**
    * **Light/Dark Theme:** Switchable theme with a toggle button. User preference is saved in `localStorage` and applied on subsequent visits.
    * **Custom Backgrounds:** Features distinct, blurred background patterns for light and dark modes.
    * **Responsive Design:** Adapts to various screen sizes, from mobile to desktop.
    * **Interactive Map Controls:**
        * Maximize/Minimize: View the map in a larger "popup window" style.
        * Recenter: Quickly jump to the user's current geolocation on the map.
    * **Loading Feedback:** Spinners and loading messages are displayed during data fetching operations (e.g., for weather data, nearby cities, geolocation).
    * **Smooth Animations:** Implements smooth transitions for card expansions, content fade-ins, and map resizing.
    * **Styled Scrollbars:** Custom-styled scrollbars for forecast sections for better theme integration.
    * **Persistent Location:** Remembers the user's last manually selected location (via map or dropdown) across sessions using `localStorage`.
* **Accessibility:**
    * Includes ARIA labels for icon-only buttons for better screen reader support.
    * Focus management for the maximized map view.

## Technologies Used

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Styling & Layout:** Custom CSS, Bootstrap 5 (for some layout utilities)
* **Mapping:** Leaflet.js (with OpenStreetMap tiles)
* **Charting:** Chart.js
* **Icons:** Font Awesome
* **Fonts:** Vazir (primary), Inter (optional)
* **APIs:**
    * [IP-API (ip-api.com)](http://ip-api.com/): For initial IP-based geolocation.
    * [WeatherAPI (weatherapi.com)](https://www.weatherapi.com/): For all weather forecast data.
    * [GeoNames API](http://www.geonames.org/): For fetching nearby cities.

## Setup and Usage

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `script.js`.
2.  **Internet Connection:** An active internet connection is required for the application to fetch data from external APIs.
3.  **Open in Browser:** Simply open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).

**Note on API Keys:**
* The WeatherAPI key and GeoNames username are currently hardcoded in `script.js`.
* If you plan to deploy this application or use it extensively, it is highly recommended to obtain your own free API key from [WeatherAPI.com](https://www.weatherapi.com/) and a username from [GeoNames.org](http://www.geonames.org/export/web-services.html) to avoid potential rate limiting or service interruptions.

## How It Works

1.  **Initialization:**
    * On page load, the script first checks `localStorage` for a `lastWeatherLocation`. If found, it fetches weather for these coordinates.
    * If no saved location, it attempts to determine the user's location via their IP address using the IP-API.
    * The Leaflet map is initialized, and the theme (light/dark) is set based on `localStorage` or defaults to light.
2.  **Location Input & Data Fetching:**
    * Users can trigger location updates via:
        * The "Use My Location" button (browser Geolocation API).
        * The city selection dropdown (dynamically populated by `fetchNearbyCities` using GeoNames).
        * Clicking on the interactive Leaflet map.
    * When a location (latitude and longitude) is determined:
        * `fetchWeather(lat, lon)` is called: This function fetches detailed forecast data from WeatherAPI. It also saves the current location to `localStorage`.
        * `fetchNearbyCities(lat, lon)` is called: This function fetches a list of nearby cities from GeoNames to populate the dropdown.
3.  **Data Display & UI Updates:**
    * The main weather card is updated with the overall weather for the current day (by default) or the selected day.
    * Daily forecast cards are generated. Clicking a daily card expands it to show more details (like wind, humidity, sunrise/sunset) and updates the hourly forecast section below. The main weather card remains focused on the current day's weather unless explicitly changed.
    * The hourly forecast section and its associated charts (temperature and precipitation) are updated to reflect the selected day. Charts are lazy-loaded.
    * The map marker and view are updated to the selected location.
    * Loading states (spinners, messages) provide feedback during API calls.
    * Theme changes (light/dark) and map view changes (normal/maximized) are handled with smooth transitions.


## Potential Future Enhancements

* Unit Toggling (Celsius/Fahrenheit) for temperature.
* More detailed error messages for API failures.
* Search input field for cities instead of only a dropdown.
* Implementation of animated weather icons (e.g., using LottieFiles or animated SVGs).

---

This project was developed as part of a web programming assignment, focusing on API integration, dynamic content rendering, and interactive UI development.
