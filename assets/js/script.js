var weatherUrl = "http://api.openweathermap.org/";
var weatherApiId = "c276d907c17ef1ab60dbfff32e1fcf8d";

var cityEl = document.getElementById('city-name');
var forecastTodayEl = document.getElementById('forecast-today');

dayjs.extend(window.dayjs_plugin_utc);

function renderWeather(data) {
  let cityName = data.city.name;
  let weatherData = data.list[0];
  let localTime = getLocalTime(data);

  let tempEl = document.createElement('p');
  let windEl = document.createElement('p');
  let humidEl = document.createElement('p');
  let weatherIconEl = document.createElement('img');

  weatherIconEl.setAttribute('alt',weatherData.weather[0].description);
  weatherIconEl.setAttribute('src', `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`);
  weatherIconEl.setAttribute('class', 'weather-icon');

  cityEl.textContent = `${cityName} (${localTime.format('MM/DD/YYYY')})`;
  tempEl.textContent = `Temperature: ${weatherData.main.temp}°F`
  windEl.textContent = `Wind: ${weatherData.wind.speed} MPH`
  humidEl.textContent = `Humidity: ${weatherData.main.humidity}%`

  cityEl.append(weatherIconEl)
  forecastTodayEl.append(tempEl, windEl, humidEl);
}


function getLocalTime(data) {
  let offsetHr = data.city.timezone/-3600;
  let weatherData = data.list[0];
  let localTime = dayjs.unix(weatherData.dt).utc().subtract(offsetHr,'hour');
  return localTime;
}

function fetchWeather(data) {
  var forecastUrl = `${weatherUrl}data/2.5/forecast?lat=${data[0].lat}&lon=${data[0].lon}&units=imperial&appid=${weatherApiId}`;
    fetch(forecastUrl).then(function(response) {
      return response.json();
    }).then(function(data) {
      renderWeather(data);
      
    }).catch(function(error) {
      console.error(error);
    });
}

function fetchCoords(cityName) {
  var geocodingUrl = `${weatherUrl}geo/1.0/direct?q=${cityName},US&limit=5&appid=${weatherApiId}`;

  fetch(geocodingUrl).then(function(response) {
    return response.json();
  }).then(function(data) {
    if (!data[0]) {
      alert("Location not found");
    } else {
      fetchWeather(data);
    }
  }).catch(function(error) {
    console.error(err);
  });
}

fetchCoords("cupertino");

dayjs.extend(window.dayjs_plugin_utc);
var today = dayjs().utc();
console.log(today.format());


