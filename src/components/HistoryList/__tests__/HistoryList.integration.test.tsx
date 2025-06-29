import { HistoryItemType } from '@app-types/history';
import { HistoryList } from '@components/HistoryList';
import { useHistoryStore } from '@store/historyStore';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addToHistory, clearHistory, getHistory, removeFromHistory } from '@utils/storage';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HistoryList Integration Tests', () => {
    const mockHistoryItem1: HistoryItemType = {
        id: 'test-id-1',
        fileName: 'sales-data.csv',
        timestamp: Date.now() - 1000,
        highlights: {
            total_spend_galactic: 1500,
            rows_affected: 150,
            less_spent_at: 2,
            big_spent_at: 300,
            less_spent_value: 15,
            big_spent_value: 750,
            average_spend_galactic: 75,
            big_spent_civ: 'humans',
            less_spent_civ: 'monsters',
        },
    };

    const mockHistoryItem2: HistoryItemType = {
        id: 'test-id-2',
        fileName: 'market-analysis.csv',
        timestamp: Date.now(),
        highlights: {
            total_spend_galactic: 2000,
            rows_affected: 200,
            less_spent_at: 1,
            big_spent_at: 365,
            less_spent_value: 20,
            big_spent_value: 1000,
            average_spend_galactic: 100,
            big_spent_civ: 'humans',
            less_spent_civ: 'monsters',
        },
    };

    beforeEach(() => {
        clearHistory();

        act(() => {
            const store = useHistoryStore.getState();
            store.hideModal();
            store.resetSelectedItem();
            store.clearHistory();
        });
    });

    describe('Initial Load and Synchronization', () => {
        it('should load history from localStorage on mount', async () => {
            addToHistory({
                fileName: 'sales-data.csv',
                highlights: mockHistoryItem1.highlights,
            });
            addToHistory({
                fileName: 'market-analysis.csv',
                highlights: mockHistoryItem2.highlights,
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });
        });

        it('should display empty state when no history exists', () => {
            render(<HistoryList />);

            expect(screen.queryByText('.csv')).not.toBeInTheDocument();
        });

        it('should synchronize store with localStorage data', async () => {
            addToHistory({
                fileName: 'sales-data.csv',
                highlights: mockHistoryItem1.highlights,
            });

            render(<HistoryList />);

            await waitFor(() => {
                const history = getHistory();

                expect(history).toHaveLength(1);
                expect(history[0].fileName).toBe('sales-data.csv');
                expect(history[0].id).toMatch(/^test-uuid-/);
            });
        });
    });

    describe('Store Integration', () => {
        it('should update display when store history changes', async () => {
            render(<HistoryList />);

            expect(screen.queryByText('sales-data.csv')).not.toBeInTheDocument();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
                useHistoryStore.getState().updateHistoryFromStorage();
            });

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
            });
        });

        it('should call updateHistoryFromStorage on mount', async () => {
            const spy = vi.spyOn(useHistoryStore.getState(), 'updateHistoryFromStorage');

            render(<HistoryList />);

            await waitFor(() => {
                expect(spy).toHaveBeenCalled();
            });

            spy.mockRestore();
        });

        it('should reflect store state changes immediately', async () => {
            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });

                addToHistory({
                    fileName: 'market-analysis.csv',
                    highlights: mockHistoryItem2.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });

            // Remove the first item from history
            const history = getHistory();
            const firstItemId = history[0].id;
            const firstItemFileName = history[0].fileName;

            act(() => {
                removeFromHistory(firstItemId);
                useHistoryStore.getState().updateHistoryFromStorage();
            });

            await waitFor(() => {
                if (firstItemFileName === 'sales-data.csv') {
                    expect(screen.queryByText('sales-data.csv')).not.toBeInTheDocument();
                    expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
                } else {
                    expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                    expect(screen.queryByText('market-analysis.csv')).not.toBeInTheDocument();
                }
            });
        });
    });

    describe('Item Interactions', () => {
        it('should open modal with correct data when item is clicked', async () => {
            const user = userEvent.setup();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
            });

            const history = getHistory();

            const historyItem = history.find((item) => item.fileName === 'sales-data.csv');

            expect(historyItem).toBeDefined();

            const clickableButton = screen.getByTestId(`open-button-${historyItem!.id}`);
            expect(clickableButton).toBeInTheDocument();

            await user.click(clickableButton);

            await waitFor(() => {
                expect(useHistoryStore.getState().isOpenModal).toBe(true);
            });
        });

        it('should handle clicks on different items correctly', async () => {
            const user = userEvent.setup();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
                addToHistory({
                    fileName: 'market-analysis.csv',
                    highlights: mockHistoryItem2.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });

            const history = getHistory();

            const historyItem = history.find((item) => item.fileName === 'sales-data.csv');

            if (historyItem) {
                const clickableButton = screen.getByTestId(`open-button-${historyItem.id}`);
                expect(clickableButton).toBeInTheDocument();

                await user.click(clickableButton);
                expect(useHistoryStore.getState().selectedItem?.id).toBe(historyItem.id);
            }

            // Click second item
            const historyItem2 = history.find((item) => item.fileName === 'market-analysis.csv');

            if (historyItem2) {
                const clickableButton2 = screen.getByTestId(`open-button-${historyItem2.id}`);
                expect(clickableButton2).toBeInTheDocument();

                await user.click(clickableButton2);
                expect(useHistoryStore.getState().selectedItem?.id).toBe(historyItem2.id);
            }
        });
    });

    describe('Item Deletion', () => {
        it('should remove item from both storage and store when deleted', async () => {
            const user = userEvent.setup();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
                addToHistory({
                    fileName: 'market-analysis.csv',
                    highlights: mockHistoryItem2.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });

            const history = getHistory();

            const historyItem = history.find((item) => item.fileName === 'sales-data.csv');

            if (historyItem) {
                const deleteButton = screen.getByTestId(`delete-button-${historyItem.id}`);

                await user.click(deleteButton);

                await waitFor(() => {
                    expect(useHistoryStore.getState().history).toHaveLength(1);
                    useHistoryStore.getState().updateHistoryFromStorage();
                });

                expect(screen.queryByText('sales-data.csv')).not.toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle corrupted localStorage data', async () => {
            act(() => {
                localStorage.setItem('tableHistory', 'invalid json');
            });

            expect(() => render(<HistoryList />)).not.toThrow();
        });

        it('should handle missing item data gracefully', () => {
            const incompleteItem = {
                highlights: {},
                fileName: 'sales-data.csv',
            } as HistoryItemType;

            act(() => {
                addToHistory(incompleteItem);
            });

            expect(() => render(<HistoryList />)).not.toThrow();
        });
    });
});
