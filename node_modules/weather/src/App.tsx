import React, { useEffect, useState } from "react";
import { fetchWeatherApi } from "openmeteo";

type WeatherData = {
  time: Date[];
  temperature2m: number[];
  relativeHumidity2m: number[];
  precipitationProbability: number[];
  precipitation: number[];
  windSpeed10m: number[];
  windDirection10m: number[];
  weatherCode: number[];
};

const App: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [groupedByDay, setGroupedByDay] = useState<Record<string, number[]> | null>(null);

  useEffect(() => {
    const getWeather = async () => {
      const params = {
        latitude: 52.52,
        longitude: 13.41,
        hourly: [
          "temperature_2m",
          "relative_humidity_2m",
          "precipitation_probability",
          "precipitation",
          "wind_speed_10m",
          "wind_direction_10m",
          "weather_code"
        ]
      };

      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      const hourly = response.hourly()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();

      const start = Number(hourly.time());
      const end = Number(hourly.timeEnd());
      const interval = hourly.interval();

      const time = [...Array((end - start) / interval)].map((_, i) =>
        new Date((start + i * interval + utcOffsetSeconds) * 1000)
      );

      const data: WeatherData = {
        time,
        temperature2m: Array.from(hourly.variables(0)!.valuesArray()!),
        relativeHumidity2m: Array.from(hourly.variables(1)!.valuesArray()!),
        precipitationProbability: Array.from(hourly.variables(2)!.valuesArray()!),
        precipitation: Array.from(hourly.variables(3)!.valuesArray()!),
        windSpeed10m: Array.from(hourly.variables(4)!.valuesArray()!),
        windDirection10m: Array.from(hourly.variables(5)!.valuesArray()!),
        weatherCode: Array.from(hourly.variables(6)!.valuesArray()!)
      };

      setWeatherData(data);

      const grouped: Record<string, number[]> = {};

      data.time.forEach((date, i) => {
        const dayKey = date.toISOString().split("T")[0];
        if (!grouped[dayKey]) grouped[dayKey] = [];
        grouped[dayKey].push(i);
      });

      setGroupedByDay(grouped);
    };

    getWeather();
  }, []);

  return (
    <div className="p-4">
      {weatherData && groupedByDay ? (
        <section className="flex flex-row overflow-x-auto gap-4 p-2">
          {Object.entries(groupedByDay).map(([day, indices]) => {
            const temps = indices.map(i => weatherData.temperature2m[i]);
            const rain = indices.map(i => weatherData.precipitation[i]);
            const humidity = indices.map(i => weatherData.relativeHumidity2m[i]);
            const wind = indices.map(i => weatherData.windSpeed10m[i]);
            const code = indices.map(i => weatherData.weatherCode[i]);

            return (
              <article
                key={day}
                className="min-w-[250px] bg-blue-800 text-white rounded p-4 shadow flex flex-col gap-1"
              >
                <span className="font-bold text-lg">{day}</span>
                <span>🌡 Temp max: {Math.round(Math.max(...temps))}°C</span>
                <span>💧 Humidité moy: {Math.round(humidity.reduce((a, b) => a + b) / humidity.length)}%</span>
                <span>🌧 Pluie tot: {rain.reduce((a, b) => a + b, 0).toFixed(1)} mm</span>
                <span>💨 Vent moy: {Math.round(wind.reduce((a, b) => a + b) / wind.length)} km/h</span>
                <span>🔢 Code(s): {Array.from(new Set(code)).join(", ")}</span>
              </article>
            );
          })}
        </section>
      ) : (
        <p>Chargement des données météo...</p>
      )}
    </div>
  );
};

export default App;