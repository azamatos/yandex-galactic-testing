import { HistoryItemType } from '@app-types/history';
import { HistoryModal } from '@components/HistoryModal';
import { useHistoryStore } from '@store/historyStore';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration Test for HistoryModal Component
 *
 * Tests the modal integration with Zustand store:
 * - Modal visibility based on store state
 * - Selected item display and data transformation
 * - Modal close functionality
 * - Store state synchronization
 * - Highlight cards rendering
 */
describe('HistoryModal Integration Tests', () => {
    const mockHistoryItem: HistoryItemType = {
        id: 'test-id-123',
        fileName: 'test-data.csv',
        timestamp: Date.now(),
        highlights: {
            total_spend_galactic: 1000,
            rows_affected: 100,
            less_spent_at: 1,
            big_spent_at: 365,
            less_spent_value: 10,
            big_spent_value: 500,
            average_spend_galactic: 50,
            big_spent_civ: 'aliens',
            less_spent_civ: 'humans',
        },
    };

    beforeEach(() => {
        localStorage.clear();

        act(() => {
            const store = useHistoryStore.getState();
            store.hideModal();
            store.resetSelectedItem();
            store.clearHistory();
        });

        document.body.innerHTML = '';
    });

    describe('Modal Visibility', () => {
        it('should not render modal when isOpenModal is false', () => {
            render(<HistoryModal />);

            expect(screen.queryByTestId('history-modal-content')).not.toBeInTheDocument();
        });

        it('should not render modal when no selectedItem exists', () => {
            act(() => {
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.queryByTestId('history-modal-content')).not.toBeInTheDocument();
        });

        it('should render modal when isOpenModal is true and selectedItem exists', () => {
            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByTestId('history-modal-content')).toBeInTheDocument();
        });
    });

    describe('Store Integration', () => {
        it('should display selectedItem data correctly', () => {
            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByText('1000')).toBeInTheDocument();
            expect(screen.getByText('Общие расходы')).toBeInTheDocument();
            expect(screen.getByText('aliens')).toBeInTheDocument();
            expect(screen.getByText('humans')).toBeInTheDocument();
        });

        it('should call hideModal when modal is closed', async () => {
            const user = userEvent.setup();

            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(useHistoryStore.getState().isOpenModal).toBe(true);

            const closeButton = screen.getByTestId('modal-close-button');
            await user.click(closeButton);

            expect(useHistoryStore.getState().isOpenModal).toBe(false);
        });

        it('should handle data transformation with convertHighlightsToArray', () => {
            const itemWithHighlights = {
                ...mockHistoryItem,
                highlights: {
                    total_spend_galactic: 2500,
                    average_spend_galactic: 125,
                    big_spent_civ: 'robots',
                    less_spent_civ: 'elves',
                    rows_affected: 200,
                    less_spent_at: 5,
                    big_spent_at: 350,
                    less_spent_value: 25,
                    big_spent_value: 800,
                },
            };

            act(() => {
                useHistoryStore.getState().setSelectedItem(itemWithHighlights);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByText('2500')).toBeInTheDocument();
            expect(screen.getByText('125')).toBeInTheDocument();
            expect(screen.getByText('robots')).toBeInTheDocument();
            expect(screen.getByText('elves')).toBeInTheDocument();
        });
    });

    describe('Highlight Cards Display', () => {
        it('should render highlight cards correctly', () => {
            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            const descriptions = [
                'Общие расходы',
                'День min расходов',
                'День max расходов',
                'Min расходы в день',
                'Max расходы в день',
                'Средние расходы',
                'Цивилизация max расходов',
                'Цивилизация min расходов',
            ];

            descriptions.forEach((description) => {
                expect(screen.getByText(description)).toBeInTheDocument();
            });
        });

        it('should handle empty highlights gracefully', () => {
            const itemWithoutHighlights = {
                ...mockHistoryItem,
                highlights: undefined,
            };

            act(() => {
                useHistoryStore.getState().setSelectedItem(itemWithoutHighlights);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.queryByTestId('history-modal-content')).not.toBeInTheDocument();
        });

        it('should display numeric values as strings', () => {
            const itemWithNumbers = {
                ...mockHistoryItem,
                highlights: {
                    ...mockHistoryItem.highlights!,
                    total_spend_galactic: 1234.56,
                    average_spend_galactic: 67.89,
                },
            };

            act(() => {
                useHistoryStore.getState().setSelectedItem(itemWithNumbers);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            // Should round and display as strings
            expect(screen.getByText('1235')).toBeInTheDocument();
            expect(screen.getByText('68')).toBeInTheDocument();
        });
    });
});
