// API information
var weatherUrl = "https://api.openweathermap.org/";
var weatherApiId = "c276d907c17ef1ab60dbfff32e1fcf8d";

// Get document elements
var cityEl = document.getElementById('city-name');
var forecastTodayEl = document.getElementById('forecast-today');
var displayForecastEl = document.getElementById('forecast-cards');

var searchCityEl = document.getElementById('search-city');
var searchForm = document.getElementById('search-form');
var searchHistoryEl = document.getElementById('search-history');
var clearBtn = document.getElementById('clear-btn');
var dashboardEl = document.getElementById('dashboard');

// Declare empty search history array
var searchHistory = [];

// Implement dayjs utc plugin
dayjs.extend(window.dayjs_plugin_utc);

// Renders today's weather to the according section
function renderWeather(cityName, data) {;
  let weatherData = data.list[0];
  // Get time local to the searched city to display the correct date for the city
  let localTime = convertTimezone(data.city.timezone, weatherData.dt);

  // Create document elements 
  let tempEl = document.createElement('p');
  let windEl = document.createElement('p');
  let humidEl = document.createElement('p');
  let weatherIconEl = document.createElement('img');

  // Get and input weather icon
  weatherIconEl.setAttribute('alt',weatherData.weather[0].description);
  weatherIconEl.setAttribute('src', `https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`);
  weatherIconEl.setAttribute('class', 'weather-icon');

  // Input data to respective dom elements
  cityEl.textContent = `${cityName} (${localTime.format('MM/DD/YYYY')})`;
  tempEl.textContent = `Temp: ${weatherData.main.temp}°F`
  windEl.textContent = `Wind: ${weatherData.wind.speed} MPH`
  humidEl.textContent = `Humidity: ${weatherData.main.humidity}%`

  // Clear previous render
  weatherIconEl.innerHTML = '';
  forecastTodayEl.innerHTML='';
  // Render information on page
  cityEl.append(weatherIconEl)
  forecastTodayEl.append(tempEl, windEl, humidEl);
}

// Render 5-day forecast in the forecast section
function renderForecast(data) {
  // Covert UTC to city local time to get the correct date 
  let timezone = data.city.timezone
  let startDateLocal = convertTimezone(timezone, data.list[0].dt).add(1,'day').startOf('day');
  let endDateLocal = startDateLocal.add(5,'day').startOf('day');
  // Convert start and end date back to utc time in order to compare with database
  let startDateUtc = startDateLocal.utc().unix();
  let endDateUtc = endDateLocal.utc().unix();

  console.log(convertTimezone(timezone,dayjs().unix()).format());

  // Clear previous render 
  displayForecastEl.innerHTML = '';

  // Interate through all the forecast data
  for (let i = 0; i < data.list.length; i++) {
    let forecastData = data.list[i];
    // Check if within the needed timeframe
    if (startDateUtc <= forecastData.dt && forecastData.dt <= endDateUtc) {
      // Get the forecast at local time around noon 
      let localHour = convertTimezone(timezone, forecastData.dt).get('hour');
      if (11 <= localHour && localHour <= 13) {
        // Create dom elements
        let cardEl = document.createElement('div');
        let cardBodyEl = document.createElement('div');
        let dateEl = document.createElement('h5');
        let tempEl = document.createElement('p');
        let windEl = document.createElement('p');
        let humidEl = document.createElement('p');
        let weatherIconEl = document.createElement('img');

        // Input data and style dom elements
        weatherIconEl.setAttribute('alt',forecastData.weather[0].description);
        weatherIconEl.setAttribute('src', `https://openweathermap.org/img/w/${forecastData.weather[0].icon}.png`);
        weatherIconEl.setAttribute('class', 'weather-icon ml-1');

        cardEl.setAttribute('class','col-lg col-md-4 mb-4');
        cardBodyEl.setAttribute('class', 'card-body p-2 rounded');

        dateEl.textContent = convertTimezone(timezone, forecastData.dt).format('MM/DD/YYYY');
        tempEl.textContent = `Temp: ${forecastData.main.temp}°F`;
        windEl.textContent = `Wind: ${forecastData.wind.speed} MPH`;
        humidEl.textContent = `Humidity: ${forecastData.main.humidity}%`;
        
        // Render information to page
        cardBodyEl.append(weatherIconEl, dateEl, tempEl, windEl, humidEl);
        cardEl.append(cardBodyEl);
        displayForecastEl.append(cardEl);
      }
    }
  }
}

// Converts UTC time to search city local time and returns local time
function convertTimezone(timezone, unixTime) {
  return dayjs.unix(unixTime).utcOffset(timezone/60);
}

// Fetches weather forecast and calls on render functions
function fetchWeather(cityInfo) {
  var forecastUrl = `${weatherUrl}data/2.5/forecast?lat=${cityInfo.lat}&lon=${cityInfo.lon}&units=imperial&appid=${weatherApiId}`;
    fetch(forecastUrl).then(function(response) {
      return response.json();
    }).then(function(data) {
      renderWeather(cityInfo.name, data);
      renderForecast(data);
      // Toggle dashboard board visible after all information loaded
      dashboardEl.classList.remove('invisible');
    }).catch(function(error) {
      console.error(error);
    })
}

// Returns given city coordinates 
function fetchCoords(cityName) {
  var geocodingUrl = `${weatherUrl}geo/1.0/direct?q=${cityName}&limit=5&appid=${weatherApiId}`;

  fetch(geocodingUrl).then(function(response) {
    return response.json();
  }).then(function(data) {
    if (!data[0]) {
      // Alerts user if input unfound
      alert("Location not found");
    } else {
      // Save city to search history and fetch for weather data with the first city that showed up
      addToHistory(cityName);
      fetchWeather(data[0]);
    }
  }).catch(function(error) {
    console.error(err);
  });
}

// Searchs for the city entered upon submission
function searchCity(event) {
  event.preventDefault();
  let cityName = searchCityEl.value.trim();
  if (cityName !== '') {
    fetchCoords(cityName);
    searchCityEl.value = '';
  } else {
    // If search term is empty, hide dashboard
    dashboardEl.classList.add('invisible');
  }
}

// Render weather dasboard when a search history button is clicked 
function renderHistoryCity(event) {
  // Check if element clicked is a search history button
  if (event.target.className.includes('history-btn')) {
    let searchCity = event.target.id;
    searchCity = searchCity.substring(searchCity.indexOf('-')+1).replaceAll('-', ' ');
    fetchCoords(searchCity);
  }

}

// Displays buttons for each search history item
function renderSearchHistory() {
  searchHistoryEl.innerHTML = '';
  // Only proceed if not part of history already
  if (searchHistory.length !== 0) {
    // Clear container to render new information
    for (let i=0; i < searchHistory.length; i++) {
      // Get searched city without space to use as id
      let cityId = searchHistory[i].replaceAll(' ','-');
      // Create button with seached city name as button name
      let historyBtn = document.createElement('button');
      historyBtn.setAttribute('class', 'btn history-btn mb-2');
      historyBtn.setAttribute('id', `history-${cityId}`);
      historyBtn.textContent = searchHistory[i];
      // Display button
      searchHistoryEl.append(historyBtn);
    }
    // Show a button to clear search history if it is not empty
    clearBtn.classList.remove('invisible');
  } 
}

// Add search to history
function addToHistory(searchCity) {
  // Check if the city is already stored in search history
   if (searchHistory.indexOf(searchCity.toLowerCase()) === -1) {
      searchHistory.push(searchCity.toLowerCase());
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      renderSearchHistory();
   }
}

// Clears local storage search history
function clearHistory() {
  localStorage.removeItem('searchHistory');
  searchHistory = [];
  renderSearchHistory();
  // Remove clear search history button and clear dashboard
  clearBtn.classList.add('invisible')
  dashboardEl.innerHTML = '';
}

// Loads and displays search history from local storage
function initSearchHistory() {
  searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
  renderSearchHistory();
}

initSearchHistory();
searchForm.addEventListener('submit', searchCity);
searchHistoryEl.addEventListener('click', renderHistoryCity);
clearBtn.addEventListener('click', clearHistory);


