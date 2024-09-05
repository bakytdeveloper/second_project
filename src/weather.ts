
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
    throw new Error('API_KEY is not defined');
}

// Словарь для перевода описаний погоды
const weatherDescriptions: { [key: string]: string } = {
    'clear sky': 'Ясное небо',
    'few clouds': 'Малая облачность',
    'scattered clouds': 'Рассеянные облака',
    'broken clouds': 'Разорванные облака',
    'overcast clouds': 'Пасмурно',
    'light rain': 'Легкий дождь',
    'moderate rain': 'Умеренный дождь',
    'heavy intensity rain': 'Сильный дождь',
    'thunderstorm': 'Гроза',
    'snow': 'Снег',
    'mist': 'Туман',
    'fog': 'Густой туман'
};

// Получение текущей погоды через API
export async function getCurrentWeather(city: string): Promise<string | null> {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather/`, {
            params: {
                q: city,
                appid: API_KEY,
                units: 'metric'
            }
        });

        const weatherData = response.data;
        const description = weatherDescriptions[weatherData.weather[0].description] || weatherData.weather[0].description;
        return `Температура в ${city}: ${weatherData.main.temp}°C, ${description}`;
    } catch (error) {
        console.error('Ошибка при получении данных о текущей погоде через API:', error);
        return null;
    }
}

// Получение прогноза погоды на несколько дней вперед через API
export async function getForecastWeather(city: string, days: number): Promise<string | null> {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast/`, {
            params: {
                q: city,
                appid: API_KEY,
                units: 'metric'
            }
        });

        const forecastData = response.data;
        let forecast = `Прогноз погоды для ${city}:\n`;

        const getTimeOfDay = (hour: number) => {
            if (hour >= 6 && hour < 12) return 'Утро';
            if (hour >= 12 && hour < 18) return 'Обед';
            if (hour >= 18 && hour < 24) return 'Вечер';
            return 'Ночь';
        };

        const groupedByDate: { [key: string]: any[] } = {};

        forecastData.list.forEach((item: any) => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            const timeOfDay = getTimeOfDay(new Date(item.dt * 1000).getHours());

            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }

            if (['Утро', 'Обед', 'Вечер'].includes(timeOfDay) && groupedByDate[date].length < 3) {
                const description = weatherDescriptions[item.weather[0].description] || item.weather[0].description;
                groupedByDate[date].push({
                    timeOfDay,
                    temp: item.main.temp,
                    description
                });
            }
        });

        Object.keys(groupedByDate).forEach(date => {
            forecast += `${date}:\n`;
            groupedByDate[date].forEach(({ timeOfDay, temp, description }) => {
                forecast += `${timeOfDay}: ${temp}°C, ${description}\n`;
            });
            forecast += '\n';
        });

        return forecast || 'Нет данных для прогноза на указанный период.';
    } catch (error) {
        console.error('Ошибка при получении данных о прогнозе погоды через API:', error);
        return null;
    }
}
