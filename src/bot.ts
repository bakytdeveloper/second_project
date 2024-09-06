import axios from 'axios';
import dotenv from 'dotenv';
import { Telegraf, Context, Markup } from 'telegraf';
import { getCurrentWeather, getForecastWeather, getWeatherFromWebsite } from './weather';
import { cacheWeatherData, getCachedWeatherData } from './cache';
import { Message } from 'telegraf/typings/core/types/typegram';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEOLOCATION_API_URL = 'https://ipinfo.io/json'; // URL для получения геолокации

if (!API_KEY) {
    throw new Error('API_KEY is not defined');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Переменные для хранения выбранных единиц измерения и количества дней
let selectedUnits: 'metric' | 'imperial' = 'metric';
let selectedDays: number = 1;

// Функция для получения геолокации по IP-адресу
async function getGeolocation(): Promise<{ city: string; country: string } | null> {
    try {
        const response = await axios.get(GEOLOCATION_API_URL);
        const { city, country } = response.data;
        return { city, country };
    } catch (error) {
        console.error('Ошибка при получении геолокации:', error);
        return null;
    }
}

// Функция для получения текущей погоды для геолокации с выбором единиц измерения
async function getWeatherForGeolocation(units: 'metric' | 'imperial', days: number): Promise<string> {
    const location = await getGeolocation();
    if (!location) {
        return 'Не удалось определить ваше местоположение.';
    }

    let weather;
    if (days === 1) {
        weather = await getCurrentWeather(location.city, units);
    } else {
        weather = await getForecastWeather(location.city, days, units);
    }

    return weather || 'Не удалось получить данные о текущей погоде.';
}

// Команда для начала работы
bot.start(async (ctx: Context) => {
    const weatherInfo = await getWeatherForGeolocation(selectedUnits, selectedDays);
    const k = weatherInfo.concat().split(" ");

    ctx.reply(
        `Привет! Я бот прогноза погоды. Приветствую вас в г.${k[2]}. Сегодня температура воздуха ${k[3]}${selectedUnits === 'metric' ? '°C' : '°F'}. Введите название города и количество дней для получения прогноза (по умолчанию 1 день).`
    );
});

// Обработчик кнопки смены единиц измерения
bot.action('change_units', async (ctx: Context) => {
    try {
        await ctx.deleteMessage();
    } catch (error) {
        console.error('Ошибка при удалении предыдущего сообщения:', error);
    }

    // Переключение между единицами измерения
    selectedUnits = selectedUnits === 'metric' ? 'imperial' : 'metric';

    ctx.reply(`Единицы измерения изменены на ${selectedUnits === 'metric' ? 'Цельсий' : 'Фаренгейт'}.`);

    const weatherInfo = await getWeatherForGeolocation(selectedUnits, selectedDays);
    ctx.reply(weatherInfo, Markup.inlineKeyboard([
        [Markup.button.callback('Сменить единицы измерения', 'change_units')],
        [Markup.button.callback('Сменить город', 'change_city')],
        [Markup.button.callback('Отменить', 'cancel')]
    ]));
});

// Функция для проверки, что сообщение текстовое
const isTextMessage = (message: Message): message is Message.TextMessage => {
    return 'text' in message;
};

// Обработчик текстовых сообщений
bot.on('text', async (ctx: Context) => {
    if (ctx.message && isTextMessage(ctx.message)) {
        const text = ctx.message.text.trim();
        const parts = text.split(' ');
        const city = parts[0];
        selectedDays = parseInt(parts[1], 10) || 1;

        if (!city) {
            return ctx.reply('Пожалуйста, укажите город.');
        }

        cacheWeatherData(city, '');

        let weatherData = getCachedWeatherData(`${city}-${selectedDays}`);
        if (!weatherData) {
            let weather;
            if (selectedDays === 1) {
                weather = await getCurrentWeather(city, selectedUnits);
                if (!weather) {
                    weather = await getWeatherFromWebsite(city);
                }
            } else {
                weather = await getForecastWeather(city, selectedDays, selectedUnits);
            }
            weatherData = weather || 'Не удалось получить данные о погоде. Попробуйте позже.';
            cacheWeatherData(`${city}-${selectedDays}`, weatherData);
        }

        try {
            await ctx.deleteMessage();
        } catch (error) {
            console.error('Ошибка при удалении предыдущего сообщения:', error);
        }
        ctx.reply(weatherData, Markup.inlineKeyboard([
            [Markup.button.callback('Сменить единицы измерения', 'change_units')],
            [Markup.button.callback('Сменить город', 'change_city')],
            [Markup.button.callback('Отменить', 'cancel')]
        ]));
    } else {
        ctx.reply('Сообщение не содержит текст.');
    }
});

// Обработчик callback запросов для кнопки смены города
bot.action('change_city', async (ctx: Context) => {
    try {
        await ctx.deleteMessage();
    } catch (error) {
        console.error('Ошибка при удалении предыдущего сообщения:', error);
    }

    ctx.reply('Пожалуйста, введите новый город и количество дней для прогноза (по умолчанию 1 день).', Markup.inlineKeyboard([
        [Markup.button.callback('Отменить', 'cancel')]
    ]));
});

// Обработчик команды отмены
bot.action('cancel', async (ctx: Context) => {
    try {
        await ctx.deleteMessage();
    } catch (error) {
        console.error('Ошибка при удалении сообщения с кнопкой отмены:', error);
    }
});

// Обработка ошибок
bot.catch((err: any, ctx: Context) => {
    console.error(`Ошибка для пользователя ${ctx.updateType}`, err);
    ctx.reply('Произошла ошибка, попробуйте позже.');
});

bot.launch().then(() => console.log('Бот запущен'));
