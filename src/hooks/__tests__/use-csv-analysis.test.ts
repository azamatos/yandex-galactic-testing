import { renderHook } from '@testing-library/react';
import { transformAnalysisData } from '@utils/analysis';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { useCsvAnalysis } from '../use-csv-analysis';

describe('useCsvAnalysis hook', () => {
    let mockOnData: ReturnType<typeof vi.fn>;
    let mockOnError: ReturnType<typeof vi.fn>;
    let mockOnComplete: ReturnType<typeof vi.fn>;
    let mockFile: File;

    beforeEach(() => {
        mockOnData = vi.fn();
        mockOnError = vi.fn();
        mockOnComplete = vi.fn();
        mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    describe('callback function validation', () => {
        it('should create analyzeCsv function', () => {
            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            expect(result.current).toHaveProperty('analyzeCsv');
            expect(typeof result.current.analyzeCsv).toBe('function');
        });

        it('should call onData and onComplete on successful analysis', async () => {
            const serverResponseData = {
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

            const responseJson = JSON.stringify(serverResponseData);
            const encoder = new TextEncoder();
            const uint8Array = encoder.encode(responseJson + '\n');

            const mockReader = {
                read: vi
                    .fn()
                    .mockResolvedValueOnce({ done: false, value: uint8Array })
                    .mockResolvedValueOnce({ done: true, value: undefined }),
            };

            const mockStream = {
                getReader: vi.fn().mockReturnValue(mockReader),
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: mockStream as unknown as ReadableStream,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            // transforming mock data to highlights array and object
            const { highlights: highlightsFromApi, highlightsToStore } = transformAnalysisData(uint8Array);

            // checking if onData was called with highlightsToStore
            expect(mockOnData).toHaveBeenCalledWith(highlightsToStore);

            // checking if onComplete was called with highlightsFromApi
            expect(mockOnComplete).toHaveBeenCalledWith(highlightsFromApi);
        });
    });

    describe('hook behavior with callbacks', () => {
        it('should call onError when fetch fails', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Неизвестная ошибка парсинга :(',
                })
            );

            expect(mockOnData).not.toHaveBeenCalled();
            expect(mockOnComplete).not.toHaveBeenCalled();
        });

        it('should call onError when response has no body', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: null,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Неизвестная ошибка парсинга :(',
                })
            );
        });

        it('should call onError when response is not ok', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                body: {} as ReadableStream,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Неизвестная ошибка парсинга :(',
                })
            );
        });

        it('should call onError with InvalidServerResponseError when server response is invalid', async () => {
            const invalidData = JSON.stringify({ invalid_key: 'invalid_value' });
            const encoder = new TextEncoder();
            const uint8Array = encoder.encode(invalidData + '\n');

            const mockReader = {
                read: vi
                    .fn()
                    .mockResolvedValueOnce({ done: false, value: uint8Array })
                    .mockResolvedValueOnce({ done: true, value: undefined }),
            };

            const mockStream = {
                getReader: vi.fn().mockReturnValue(mockReader),
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: mockStream as unknown as ReadableStream,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'InvalidServerResponseError',
                    message: 'Файл не был корректно обработан на сервере :(',
                })
            );
        });

        it('should call fetch with correct parameters', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: { getReader: () => ({ read: () => Promise.resolve({ done: true }) }) },
            } as unknown as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/aggregate?rows=10000'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );
        });
    });
});
