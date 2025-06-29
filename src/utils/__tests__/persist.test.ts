import { describe, it, expect } from 'vitest';

import { createPersistConfig } from '../persist';

describe('persist utility', () => {
    describe('createPersistConfig', () => {
        interface MockState {
            user: { name: string; email: string };
            theme: string;
            temporary: boolean;
            counter: number;
        }

        const mockState: MockState = {
            user: { name: 'John', email: 'john@example.com' },
            theme: 'dark',
            temporary: true,
            counter: 42,
        };

        it('should return correct config structure', () => {
            const config = createPersistConfig<MockState>('test-store', ['user', 'theme']);

            expect(config).toHaveProperty('name', 'test-store');
            expect(config).toHaveProperty('partialize');
            expect(typeof config.partialize).toBe('function');
        });

        it('should set correct localStorage name', () => {
            const config1 = createPersistConfig<MockState>('user-preferences', ['user']);
            const config2 = createPersistConfig<MockState>('app-settings', ['theme']);

            expect(config1.name).toBe('user-preferences');
            expect(config2.name).toBe('app-settings');
        });

        describe('partialize function', () => {
            it('should include only specified keys in persisted state', () => {
                const config = createPersistConfig<MockState>('test-partialize', ['user', 'theme']);
                const result = config.partialize!(mockState);

                expect(result).toEqual({
                    user: { name: 'John', email: 'john@example.com' },
                    theme: 'dark',
                });
                expect(result).not.toHaveProperty('temporary');
                expect(result).not.toHaveProperty('counter');
                expect(config.name).toBe('test-partialize');
            });

            it('should return empty object when no keys specified', () => {
                const config = createPersistConfig<MockState>('test-empty', []);

                if (config.partialize) {
                    const result = config.partialize(mockState);

                    expect(result).toEqual({});
                    expect(Object.keys(result)).toHaveLength(0);
                }

                expect(config.name).toBe('test-empty');
            });

            it('should ignore non-existent keys', () => {
                const config = createPersistConfig<MockState>('test-non-existent', [
                    'user',
                    'nonExistent' as keyof MockState,
                ]);

                if (config.partialize) {
                    const result = config.partialize(mockState);

                    expect(result).toEqual({
                        user: { name: 'John', email: 'john@example.com' },
                    });
                    expect(result).not.toHaveProperty('nonExistent');
                }

                expect(config.name).toBe('test-non-existent');
            });

            it('should handle different data types correctly', () => {
                interface MixedState {
                    string: string;
                    number: number;
                    boolean: boolean;
                    object: { nested: string };
                    array: number[];
                    nullValue: null;
                    undefinedValue: undefined;
                }

                const mixedState: MixedState = {
                    string: 'test',
                    number: 123,
                    boolean: true,
                    object: { nested: 'value' },
                    array: [1, 2, 3],
                    nullValue: null,
                    undefinedValue: undefined,
                };

                const config = createPersistConfig<MixedState>('test-mixed', [
                    'string',
                    'number',
                    'boolean',
                    'object',
                    'array',
                    'nullValue',
                ]);

                if (config.partialize) {
                    const result = config.partialize(mixedState);

                    expect(result).toEqual({
                        string: 'test',
                        number: 123,
                        boolean: true,
                        object: { nested: 'value' },
                        array: [1, 2, 3],
                        nullValue: null,
                    });
                    expect(result).not.toHaveProperty('undefinedValue');
                }

                expect(config.name).toBe('test-mixed');
            });

            it('should preserve object references and structure', () => {
                const nestedObject = { deeply: { nested: { value: 'test' } } };
                const arrayData = [{ id: 1 }, { id: 2 }];

                interface ComplexState {
                    simple: string;
                    nested: typeof nestedObject;
                    array: typeof arrayData;
                }

                const complexState: ComplexState = {
                    simple: 'value',
                    nested: nestedObject,
                    array: arrayData,
                };

                const config = createPersistConfig<ComplexState>('test-complex', ['nested', 'array']);

                if (config.partialize) {
                    const result = config.partialize(complexState);

                    expect(result.nested).toBe(nestedObject);
                    expect(result.array).toBe(arrayData);
                    expect(result.nested.deeply.nested.value).toBe('test');
                    expect(result.array[0].id).toBe(1);
                }

                expect(config.name).toBe('test-complex');
            });
        });

        describe('edge cases', () => {
            it('should handle empty state object', () => {
                type EmptyState = Record<string, never>;
                const emptyState = {} as EmptyState;

                const config = createPersistConfig<EmptyState>('test', []);
                const result = config.partialize!(emptyState);

                expect(result).toEqual({});
            });

            it('should handle state with undefined values', () => {
                interface StateWithUndefined {
                    defined: string;
                    undefined: undefined;
                }

                const stateWithUndefined: StateWithUndefined = {
                    defined: 'value',
                    undefined: undefined,
                };

                const config = createPersistConfig<StateWithUndefined>('test-undefined', ['defined', 'undefined']);

                if (config.partialize) {
                    const result = config.partialize(stateWithUndefined);

                    expect(result).toEqual({
                        defined: 'value',
                        undefined: undefined,
                    });
                }

                expect(config.name).toBe('test-undefined');
            });

            it('should work with different naming conventions', () => {
                interface VariousNamesState {
                    camelCase: string;
                    snake_case: string;
                    'kebab-case': string;
                    PascalCase: string;
                }

                const variousNamesState: VariousNamesState = {
                    camelCase: 'camel',
                    snake_case: 'snake',
                    'kebab-case': 'kebab',
                    PascalCase: 'pascal',
                };

                const config = createPersistConfig<VariousNamesState>('test-various-names', [
                    'camelCase',
                    'kebab-case',
                ]);

                if (config.partialize) {
                    const result = config.partialize(variousNamesState);

                    expect(result).toEqual({
                        camelCase: 'camel',
                        'kebab-case': 'kebab',
                    });
                }

                expect(config.name).toBe('test-various-names');
            });
        });
    });
});
