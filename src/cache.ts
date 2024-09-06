import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache data for 1 hour

export function cacheWeatherData(city: string, data: string) {
    cache.set(city, data);
}

export function getCachedWeatherData(city: string): string | undefined {
    return cache.get(city);
}

