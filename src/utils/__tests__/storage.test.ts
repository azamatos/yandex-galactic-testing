import { Highlights } from '@app-types/common';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { STORAGE_KEY } from '../consts';
import { getHistory, addToHistory, removeFromHistory, clearHistory } from '../storage';

describe('storage utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockHighlights: Highlights = {
        total_spend_galactic: 1000,
        rows_affected: 100,
        less_spent_at: 1,
        big_spent_at: 365,
        less_spent_value: 10,
        big_spent_value: 500,
        average_spend_galactic: 50,
        big_spent_civ: 'monsters',
        less_spent_civ: 'humans',
    };

    describe('addToHistory', () => {
        it('should add new item to empty history', () => {
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});

            const result = addToHistory({
                fileName: 'test.csv',
                highlights: mockHighlights,
            });

            expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.stringContaining('test.csv'));

            expect(result.fileName).toBe('test.csv');
            expect(result.id).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });

        it('should add new item to existing history at the beginning', () => {
            const existingHistory = [{ id: 'old-id', timestamp: 123456, fileName: 'old.csv' }];

            vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(existingHistory));
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});

            addToHistory({
                fileName: 'new.csv',
                highlights: mockHighlights,
            });

            // [
            //     [
            //       'tableHistory',
            //       '[{"fileName":"new.csv","highlights":{"total_spend_galactic":1000,"rows_affected":100,"less_spent_at":1,"big_spent_at":365,"less_spent_value":10,"big_spent_value":500,"average_spend_galactic":50,"big_spent_civ":"monsters","less_spent_civ":"humans"},"id":"test-uuid-k0bcvaw","timestamp":1751183327549},{"id":"old-id","timestamp":123456,"fileName":"old.csv"}]'
            //     ]
            //   ]
            // we getting such structure of calls
            const setItemCalls = vi.mocked(localStorage.setItem).mock.calls;
            // we need the first call, and the second element is the stringified history
            // which returns the new item and the old item history (objects)
            const savedHistory = JSON.parse(setItemCalls[0][1]);

            // here we are checking both of them
            expect(savedHistory[0].fileName).toBe('new.csv');
            expect(savedHistory[1].fileName).toBe('old.csv');
        });

        it('should handle localStorage errors', () => {
            vi.spyOn(localStorage, 'getItem').mockReturnValue('[]');
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('setItem testing=> localStorage error');
            });

            expect(() =>
                addToHistory({
                    fileName: 'test.csv',
                    highlights: mockHighlights,
                })
            ).toThrow('setItem testing=> localStorage error');
        });
    });

    describe('getHistory', () => {
        it('should return empty array when localStorage is empty', () => {
            vi.spyOn(localStorage, 'getItem').mockReturnValue(null);

            const history = getHistory();

            expect(history).toEqual([]);
        });

        it('should return parsed history from localStorage', () => {
            const mockHistoryData = [
                {
                    id: '1',
                    timestamp: Date.now(),
                    fileName: 'test.csv',
                    highlights: mockHighlights,
                },
            ];

            vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(mockHistoryData));

            const history = getHistory();

            expect(history).toEqual(mockHistoryData);
        });

        it('should return empty array when JSON.parse fails', () => {
            vi.spyOn(localStorage, 'getItem').mockReturnValue('invalid-json{');

            const history = getHistory();

            expect(history).toEqual([]);
        });
    });

    describe('removeFromHistory', () => {
        it('should remove item with specified id', () => {
            const existingHistory = [{ id: 'old-id', timestamp: 123456, fileName: 'old.csv' }];

            vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(existingHistory));
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});

            removeFromHistory(existingHistory[0].id);

            // when we remove item from history, we setItem without the existing one, which means, empty array
            const setItemCalls = vi.mocked(localStorage.setItem).mock.calls;

            const withoutTheRemovedOne = setItemCalls[0][1];

            expect(withoutTheRemovedOne).toBe('[]');
        });

        it('should handle localStorage errors', () => {
            vi.spyOn(localStorage, 'getItem').mockReturnValue('invalid-json{');
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('remove testing => localStorage error');
            });

            expect(() => removeFromHistory('any-id')).toThrow('remove testing => localStorage error');
        });
    });

    describe('clearHistory', () => {
        it('should call localStorage.removeItem with correct key', () => {
            vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {});

            clearHistory();

            expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        });

        it('should handle localStorage errors', () => {
            vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
                throw new Error('clear testing => localStorage error');
            });

            expect(() => clearHistory()).toThrow('clear testing => localStorage error');
        });
    });
});
