
import { getCurrentWeather } from '../src/weather';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getCurrentWeather', () => {
    it('should return the correct weather description and temperature', async () => {
        const city = 'London';
        const mockResponse = {
            data: {
                main: { temp: 20 },
                weather: [{ description: 'clear sky' }],
            },
        };

        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await getCurrentWeather(city);
        expect(result).toBe('Температура в London: 20°C, Ясное небо');
    });

    it('should handle API errors gracefully', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        const result = await getCurrentWeather('London');
        expect(result).toBeNull();
    });
});
