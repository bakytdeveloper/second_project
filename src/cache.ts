// import NodeCache from 'node-cache';
//
// const cache = new NodeCache({ stdTTL: 3600 }); // Данные кэшируются на 1 час
//
// export function cacheWeatherData(city: string, data: string) {
//     cache.set(city, data);
// }
//
// export function getCachedWeatherData(city: string): string | undefined {
//     return cache.get(city);
// }


import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Данные кэшируются на 1 час

export function cacheWeatherData(city: string, data: string) {
    cache.set(city, data);
}

export function getCachedWeatherData(city: string): string | undefined {
    return cache.get(city);
}


