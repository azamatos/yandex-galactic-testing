import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Modal } from '../Modal';

describe('Modal Integration Tests', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Rendering and Visibility', () => {
        it('should render modal when isOpen is true', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div data-testid="modal-content">Modal Content</div>
                </Modal>
            );

            expect(screen.getByTestId('modal-content')).toBeInTheDocument();
        });

        it('should not display modal when isOpen is false', () => {
            render(
                <Modal isOpen={false} onClose={mockOnClose}>
                    <div data-testid="modal-content">Modal Content</div>
                </Modal>
            );

            expect(screen.getByTestId('modal-content')).toBeInTheDocument();
            expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();
        });

        it('should render close button when onClose is provided', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>Content</div>
                </Modal>
            );

            expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
        });

        it('should not render close button when onClose is not provided', () => {
            render(
                <Modal isOpen={true}>
                    <div>Content</div>
                </Modal>
            );

            expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
        });
    });

    describe('Close Button Functionality', () => {
        it('should call onClose when close button is clicked', async () => {
            const user = userEvent.setup();

            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>Content</div>
                </Modal>
            );

            const closeButton = screen.getByTestId('modal-close-button');
            await user.click(closeButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Backdrop Click Functionality', () => {
        it('should call onClose when backdrop is clicked', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>Content</div>
                </Modal>
            );

            const backdrop = screen.getByTestId('modal-backdrop');
            expect(backdrop).toBeInTheDocument();

            fireEvent.click(backdrop!);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should not call onClose when backdrop is clicked and onClose is not provided', () => {
            render(
                <Modal isOpen={true}>
                    <div>Content</div>
                </Modal>
            );

            const backdrop = screen.getByTestId('modal-backdrop');
            fireEvent.click(backdrop!);

            expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
        });
    });

    describe('Event Propagation', () => {
        it('should not call onClose when modal content is clicked', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div data-testid="modal-content">Content</div>
                </Modal>
            );

            const modalContent = screen.getByTestId('modal-content');
            fireEvent.click(modalContent);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('should not call onClose when clicking inside modal area', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>
                        <button data-testid="inside-modal-button">Inside Modal Button</button>
                        <input data-testid="inside-modal-input" placeholder="Inside Modal Input" />
                    </div>
                </Modal>
            );

            fireEvent.click(screen.getByTestId('inside-modal-button'));
            fireEvent.click(screen.getByTestId('inside-modal-input'));

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Portal Integration', () => {
        it('should render modal outside of component tree via portal', () => {
            render(
                <div data-testid="app-root">
                    <Modal isOpen={true} onClose={mockOnClose}>
                        <div data-testid="modal-content">Portal Content</div>
                    </Modal>
                </div>
            );

            const appRoot = screen.getByTestId('app-root');
            const modalContent = screen.getByTestId('modal-content');

            expect(appRoot).not.toContainElement(modalContent);

            expect(modalContent).toBeInTheDocument();
        });
    });
});
