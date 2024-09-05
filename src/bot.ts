import { Telegraf, Context } from 'telegraf';
import { getWeather, getWeatherFromWebsite } from './weather';
import { cacheWeatherData, getCachedWeatherData } from './cache';
import dotenv from 'dotenv';
import { Message } from 'telegraf/typings/core/types/typegram'; // Импорт типов для сообщений

// import { Message } from 'telegraf/types';
// import { Message } from 'telegraf';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Команда для начала работы
bot.start((ctx: Context) => ctx.reply('Привет! Я бот прогноза погоды. Используйте /weather <город> для получения прогноза.'));

// Функция для проверки, что сообщение текстовое
const isTextMessage = (message: Message): message is Message.TextMessage => {
    return 'text' in message;
};

// Команда для получения прогноза погоды через API
bot.command('weather', async (ctx: Context) => {
    if (ctx.message && isTextMessage(ctx.message)) {
        const city = ctx.message.text.split(' ')[1];
        if (!city) {
            return ctx.reply('Пожалуйста, укажите город.');
        }

        let weatherData = getCachedWeatherData(city);
        if (!weatherData) {
            const fetchedWeatherData = await getWeather(city);
            weatherData = fetchedWeatherData || undefined; // Явно приводим к `undefined`, если `fetchedWeatherData` равно `null`
            if (weatherData) {
                cacheWeatherData(city, weatherData);
            } else {
                return ctx.reply('Не удалось получить данные о погоде. Попробуйте позже.');
            }
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
