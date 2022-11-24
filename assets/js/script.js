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
  tempEl.textContent = `Temperature: ${weatherData.main.temp}°F`
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
  let startDateLocal = convertTimezone(timezone, data.list[0].dt).add(5,'day').startOf('day');
  let endDateLocal = startDateLocal.add(5,'day').startOf('day');
  // Convert start and end date back to utc time in order to compare with database
  let startDateUtc = startDateLocal.utc().unix();
  let endDateUtc = endDateLocal.utc().unix();

  // Clear previous render 
  displayForecastEl.innerHTML = '';

  // Interate through all the forecast data
  for (let i = 0; i < data.list.length; i++) {
    // Check if within the needed timeframe
    if (startDateUtc <= data.list[i].dt < endDateUtc) {
      let forecastData = data.list[i];
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
        weatherIconEl.setAttribute('class', 'weather-icon mx-auto');

        cardEl.setAttribute('class','col-lg col-md-4 mb-4');
        cardBodyEl.setAttribute('class', 'card-body p-2 rounded');

        dateEl.textContent = convertTimezone(timezone, forecastData.dt).format('MM/DD/YYYY');
        tempEl.textContent = `Temperature: ${forecastData.main.temp}°F`;
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
      addToHistory(cityName);
      fetchWeather(data[0]);
    }
  }).catch(function(error) {
    console.error(err);
  });
}

// Searchs for the city entered in the input upon submission, does nothing if empty
function searchCity(event) {
  event.preventDefault();
  let cityName = searchCityEl.value.trim();
  if (cityName !== '') {
    fetchCoords(cityName);
    searchCityEl.value = '';
  }
}

// Displays buttons for each search history item
function renderSearchHistory() {
  // Only proceed if not part of history already
  if (searchHistory.length !== 0) {
    // Clear container to render new information
    searchHistoryEl.innerHTML = '';
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
  }
}

// Add search to history
function addToHistory(searchCity) {
  // Check if the 
   if (searchHistory.indexOf(searchCity.toLowerCase()) === -1) {
      searchHistory.push(searchCity.toLowerCase());
      console.log(searchHistory);
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      renderSearchHistory();
   }
}

function initSearchHistory() {
  searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
  renderSearchHistory();
}

initSearchHistory();
searchForm.addEventListener('submit', searchCity);



