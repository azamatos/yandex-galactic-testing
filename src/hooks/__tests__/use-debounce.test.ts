import { renderHook } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

import { useDebounce } from '../use-debounce';

describe('useDebounce hook', () => {
    let mockFn: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockFn = vi.fn();
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    describe('animation frame debounce (default)', () => {
        it('should debounce function calls using requestAnimationFrame', async () => {
            const { result } = renderHook(() => useDebounce(mockFn));
            const debouncedFn = result.current;

            debouncedFn('call1');
            debouncedFn('call2');
            debouncedFn('call3');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn).toHaveBeenNthCalledWith(1, 'call1');
            expect(mockFn).toHaveBeenNthCalledWith(2, 'call2');
            expect(mockFn).toHaveBeenNthCalledWith(3, 'call3');
        });

        it('should process calls in order', async () => {
            const { result } = renderHook(() => useDebounce(mockFn));
            const debouncedFn = result.current;

            debouncedFn('first');
            debouncedFn('second');
            debouncedFn('third');

            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn.mock.calls).toEqual([['first'], ['second'], ['third']]);
        });
    });

    describe('timeout debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('should debounce function calls using setTimeout', () => {
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: 100 }));
            const debouncedFn = result.current;

            debouncedFn('call1');
            debouncedFn('call2');
            debouncedFn('call3');

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('call1');

            vi.advanceTimersByTime(200);

            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        it('should respect custom delay', () => {
            const customDelay = 500;
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: customDelay }));
            const debouncedFn = result.current;

            debouncedFn('test');

            vi.advanceTimersByTime(customDelay - 1);
            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(mockFn).toHaveBeenCalledWith('test');
        });

        afterEach(() => {
            vi.useRealTimers();
        });
    });

    describe('queue processing', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should process all queued calls in order', () => {
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: 50 }));
            const debouncedFn = result.current;

            debouncedFn('first');
            debouncedFn('second');
            debouncedFn('third');

            vi.runAllTimers();

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn.mock.calls).toEqual([['first'], ['second'], ['third']]);
            expect(mockFn.mock.calls).not.toEqual([['third'], ['second'], ['first']]);
        });

        it('should handle different argument types', () => {
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: 10 }));
            const debouncedFn = result.current;

            debouncedFn('string');
            debouncedFn(123);
            debouncedFn({ key: 'value' });

            vi.runAllTimers();

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn).toHaveBeenNthCalledWith(1, 'string');
            expect(mockFn).toHaveBeenNthCalledWith(2, 123);
            expect(mockFn).toHaveBeenNthCalledWith(3, { key: 'value' });
        });
    });
});
