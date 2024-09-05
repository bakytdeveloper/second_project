

import { Telegraf, Context } from 'telegraf';
import { getCurrentWeather, getForecastWeather, getWeatherFromWebsite } from './weather';
import { cacheWeatherData, getCachedWeatherData } from './cache';
import dotenv from 'dotenv';
import { Message } from 'telegraf/typings/core/types/typegram'; // Импорт типов для сообщений

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Команда для начала работы
bot.start((ctx: Context) => ctx.reply('Привет! Я бот прогноза погоды. Введите название города и количество дней для получения прогноза (по умолчанию 1 день).'));

// Функция для проверки, что сообщение текстовое
const isTextMessage = (message: Message): message is Message.TextMessage => {
    return 'text' in message;
};


bot.on('text', async (ctx: Context) => {
    if (ctx.message && isTextMessage(ctx.message)) {
        const text = ctx.message.text.trim();
        const parts = text.split(' ');
        const city = parts[0];
        const days = parseInt(parts[1], 10) || 1; // По умолчанию 1 день

        if (!city) {
            return ctx.reply('Пожалуйста, укажите город.');
        }

        // Проверка кэша
        let weatherData = getCachedWeatherData(`${city}-${days}`);
        if (!weatherData) {
            let weather;
            if (days === 1) {
                weather = await getCurrentWeather(city);
                if (!weather) {
                    weather = await getWeatherFromWebsite(city); // Парсинг если API недоступен
                }
            } else {
                weather = await getForecastWeather(city, days); // Прогноз на несколько дней
            }
            weatherData = weather || 'Не удалось получить данные о погоде. Попробуйте позже.';
            cacheWeatherData(`${city}-${days}`, weatherData);
        }

        ctx.reply(weatherData);
    } else {
        ctx.reply('Сообщение не содержит текст.');
    }
});



bot.catch((err: any, ctx: Context) => {
    console.error(`Ошибка для пользователя ${ctx.updateType}`, err);
    ctx.reply('Произошла ошибка, попробуйте позже.');
});

bot.launch().then(() => console.log('Бот запущен'));
