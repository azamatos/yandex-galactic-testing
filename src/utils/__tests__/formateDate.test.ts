import { describe, expect, it } from 'vitest';

import { formatDate } from '../formateDate';

describe('formatDate utility', () => {
    describe('date formatting', () => {
        it('should format date to readable date string', () => {
            const date = new Date(2025, 5, 29);

            const formattedDate = formatDate(date);

            expect(formattedDate).toBe('29.06.2025');
        });

        it('should format timestamp to readable date string', () => {
            const today = new Date();
            const timestamp = Date.now();

            const formattedDate = formatDate(timestamp);

            expect(formattedDate).toBe(today.toLocaleDateString('ru-RU'));
        });

        it('should handle edge cases', () => {
            const timestamp = 0;

            const formattedDate = formatDate(timestamp);

            expect(formattedDate).toBe('01.01.1970');

            const date = new Date(0);

            const formattedDate2 = formatDate(date);

            expect(formattedDate2).toBe('01.01.1970');
        });

        it('should handle negative numbers', () => {
            const timestamp = -1000;

            const formattedDate = formatDate(timestamp);

            expect(formattedDate).toBe('01.01.1970');
        });

        it('should handle negative test cases', () => {
            const date = new Date(0);

            const formattedDate = formatDate(date);

            expect(formattedDate).not.toBe(date.toLocaleDateString('en-US'));
            expect(formattedDate).not.toBe(
                date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: '2-digit',
                })
            );
        });
    });
});
