import axios from 'axios';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;

console.log('API_KEY:', API_KEY);

if (!API_KEY) {
    throw new Error('API_KEY is not defined');
}

// Получение погоды через API
export async function getWeather(city: string): Promise<string | null> {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather/`, {
            params: {
                q: city,
                appid: API_KEY,
                units: 'metric'
            }
        });

        const weatherData = response.data;
        return `Температура в ${city}: ${weatherData.main.temp}°C, ${weatherData.weather[0].description}`;
    } catch (error) {
        console.error('Ошибка при получении данных о погоде через API:', error);
        return null;
    }
}

// Парсинг погоды через Puppeteer
export async function getWeatherFromWebsite(city: string): Promise<string> {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Пример использования сайта для парсинга (например, weather.com)
        await page.goto(`https://www.weather.com/weather/today/l/${encodeURIComponent(city)}`);

        // Извлечение данных о погоде из HTML
        const weatherData = await page.evaluate(() => {
            const temperature = document.querySelector('.CurrentConditions--tempValue--3KcTQ')?.textContent;
            const description = document.querySelector('.CurrentConditions--phraseValue--2xXSr')?.textContent;
            return `Температура: ${temperature}, Описание: ${description}`;
        });

        await browser.close();
        return weatherData || 'Не удалось получить данные о погоде с сайта.';
    } catch (error) {
        console.error('Ошибка при парсинге сайта:', error);
        throw new Error('Ошибка при парсинге сайта.');
    }
}
