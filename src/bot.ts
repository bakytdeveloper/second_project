// import axios from 'axios';
// import dotenv from 'dotenv';
// import puppeteer from 'puppeteer';
// import { Telegraf, Context, Markup } from 'telegraf';
// import { getCurrentWeather, getForecastWeather, getWeatherFromWebsite } from './weather';
// import { cacheWeatherData, getCachedWeatherData } from './cache';
// import { Message } from 'telegraf/typings/core/types/typegram'; // Импорт типов для сообщений
//
// dotenv.config();
//
// const API_KEY = process.env.OPENWEATHER_API_KEY;
//
// if (!API_KEY) {
//     throw new Error('API_KEY is not defined');
// }
//
// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
//
// // Команда для начала работы
// bot.start((ctx: Context) => {
//     ctx.reply(
//         'Привет! Я бот прогноза погоды. Введите название города и количество дней для получения прогноза (по умолчанию 1 день).',
//         Markup.inlineKeyboard([
//             [Markup.button.callback('Сменить город', 'change_city')]
//         ])
//     );
// });
//
// // Функция для проверки, что сообщение текстовое
// const isTextMessage = (message: Message): message is Message.TextMessage => {
//     return 'text' in message;
// };
//
// // Обработчик текстовых сообщений
// bot.on('text', async (ctx: Context) => {
//     if (ctx.message && isTextMessage(ctx.message)) {
//         const text = ctx.message.text.trim();
//         const parts = text.split(' ');
//         const city = parts[0];
//         const days = parseInt(parts[1], 10) || 1; // По умолчанию 1 день
//
//         if (!city) {
//             return ctx.reply('Пожалуйста, укажите город.');
//         }
//
//         // Проверка кэша
//         let weatherData = getCachedWeatherData(`${city}-${days}`);
//         if (!weatherData) {
//             let weather;
//             if (days === 1) {
//                 weather = await getCurrentWeather(city);
//                 if (!weather) {
//                     weather = await getWeatherFromWebsite(city); // Парсинг если API недоступен
//                 }
//             } else {
//                 weather = await getForecastWeather(city, days); // Прогноз на несколько дней
//             }
//             weatherData = weather || 'Не удалось получить данные о погоде. Попробуйте позже.';
//             cacheWeatherData(`${city}-${days}`, weatherData);
//         }
//
//         ctx.reply(weatherData, Markup.inlineKeyboard([
//             [Markup.button.callback('Сменить город', 'change_city')]
//         ]));
//     } else {
//         ctx.reply('Сообщение не содержит текст.');
//     }
// });
//
// // Обработчик callback запросов для кнопки смены города
// bot.action('change_city', (ctx: Context) => {
//     ctx.reply('Пожалуйста, введите новый город и количество дней для прогноза (по умолчанию 1 день).');
//     ctx.reply('Пример: Москва 3', Markup.inlineKeyboard([
//         [Markup.button.callback('Отменить', 'cancel')]
//     ]));
// });
//
// // Обработчик команды отмены
// bot.action('cancel', (ctx: Context) => {
//     ctx.reply('Запрос отменен. Вы можете начать новый запрос.');
// });
//
// // Обработка ошибок
// bot.catch((err: any, ctx: Context) => {
//     console.error(`Ошибка для пользователя ${ctx.updateType}`, err);
//     ctx.reply('Произошла ошибка, попробуйте позже.');
// });
//
// bot.launch().then(() => console.log('Бот запущен'));






import axios from 'axios';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { Telegraf, Context, Markup } from 'telegraf';
import { getCurrentWeather, getForecastWeather, getWeatherFromWebsite } from './weather';
import { cacheWeatherData, getCachedWeatherData } from './cache';
import { Message } from 'telegraf/typings/core/types/typegram'; // Импорт типов для сообщений

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEOLOCATION_API_URL = 'https://ipinfo.io/json'; // URL для получения геолокации

if (!API_KEY) {
    throw new Error('API_KEY is not defined');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

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

// Функция для получения текущей погоды для геолокации
async function getWeatherForGeolocation(): Promise<string> {
    const location = await getGeolocation();
    if (!location) {
        return 'Не удалось определить ваше местоположение.';
    }

    const weather = await getCurrentWeather(location.city);
    return weather || 'Не удалось получить данные о текущей погоде.';


}


// Команда для начала работы
bot.start(async (ctx: Context) => {
    const weatherInfo = await getWeatherForGeolocation();

    let k = weatherInfo.concat().split(" ")


    console.log("weatherInfo!!!!!!", k, k[0])

    ctx.reply(
        `Привет! Я бот прогноза погоды. Приветствую вас в г.${k[2]}. Сегодня температура воздуха ${k[3]} Введите название города и количество дней для получения прогноза (по умолчанию 1 день).`,
        Markup.inlineKeyboard([
            [Markup.button.callback('Сменить город', 'change_city')]
        ])
    );
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

        ctx.reply(weatherData, Markup.inlineKeyboard([
            [Markup.button.callback('Сменить город', 'change_city')]
        ]));
    } else {
        ctx.reply('Сообщение не содержит текст.');
    }
});

// Обработчик callback запросов для кнопки смены города
bot.action('change_city', (ctx: Context) => {
    ctx.reply('Пожалуйста, введите новый город и количество дней для прогноза (по умолчанию 1 день).');
    ctx.reply('Пример: Москва 3', Markup.inlineKeyboard([
        [Markup.button.callback('Отменить', 'cancel')]
    ]));
});

// Обработчик команды отмены
bot.action('cancel', (ctx: Context) => {
    ctx.reply('Запрос отменен. Вы можете начать новый запрос.');
});

// Обработка ошибок
bot.catch((err: any, ctx: Context) => {
    console.error(`Ошибка для пользователя ${ctx.updateType}`, err);
    ctx.reply('Произошла ошибка, попробуйте позже.');
});

bot.launch().then(() => console.log('Бот запущен'));



