import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Dropzone } from '../Dropzone';

describe('Dropzone Integration Tests', () => {
    const mockOnFileSelect = vi.fn();
    const mockOnClear = vi.fn();

    const createMockCsvFile = (name = 'test.csv') => {
        return new File(['col1,col2\nval1,val2'], name, { type: 'text/csv' });
    };

    const createMockTextFile = (name = 'test.txt') => {
        return new File(['some text content'], name, { type: 'text/plain' });
    };

    const createDragEvent = (files: File[]) => {
        return {
            dataTransfer: {
                files: files,
                items: files.map((file) => ({
                    kind: 'file',
                    type: file.type,
                    getAsFile: () => file,
                })),
                types: ['Files'],
            },
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as unknown as React.DragEvent;
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial State and Basic Rendering', () => {
        it('should render empty dropzone with upload button and default text', () => {
            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.getByRole('button', { name: 'Загрузить файл' })).toBeInTheDocument();
            expect(screen.getByText('или перетащите сюда .csv файл')).toBeInTheDocument();
        });

        it('should render with file selected', () => {
            const mockFile = createMockCsvFile('my-data.csv');

            render(
                <Dropzone
                    file={mockFile}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.getByText('my-data.csv')).toBeInTheDocument();
            expect(screen.getByText('файл загружен!')).toBeInTheDocument();
            // clear button when we already have file
            expect(screen.getByTestId('clear-file-button')).toBeInTheDocument();
        });
    });

    describe('File Selection via Click', () => {
        it('should handle valid CSV file selection', async () => {
            const user = userEvent.setup();
            const mockFile = createMockCsvFile();

            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const uploadButton = screen.getByRole('button', { name: 'Загрузить файл' });

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false,
            });

            await user.click(uploadButton);
            fireEvent.change(fileInput);

            expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
        });

        it('should reject non-CSV files and show validation error', async () => {
            const user = userEvent.setup();
            const mockFile = createMockTextFile('document.txt');

            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const uploadButton = screen.getByRole('button', { name: 'Загрузить файл' });

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false,
            });

            await user.click(uploadButton);
            fireEvent.change(fileInput);

            expect(mockOnFileSelect).not.toHaveBeenCalled();
            expect(screen.getByText('Можно загружать только *.csv файлы')).toBeInTheDocument();
        });
    });

    describe('Drag and Drop Functionality', () => {
        it('should handle drag enter and show active state', () => {
            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.dragEnter(dropzone, createDragEvent([]));

            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('Отпустите для загрузки');
        });

        it('should handle valid CSV file drop', () => {
            const mockFile = createMockCsvFile('dropped.csv');

            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.dragEnter(dropzone, createDragEvent([mockFile]));

            fireEvent.drop(dropzone, createDragEvent([mockFile]));

            expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
        });

        it('should reject non-CSV file drop and show validation error', () => {
            const mockFile = createMockTextFile('invalid.txt');

            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.drop(dropzone, createDragEvent([mockFile]));

            expect(mockOnFileSelect).not.toHaveBeenCalled();

            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('Можно загружать только *.csv файлы');
        });

        it('should handle drag leave and return to normal state', () => {
            render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.dragEnter(dropzone, createDragEvent([]));
            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('Отпустите для загрузки');

            fireEvent.dragLeave(dropzone, createDragEvent([]));
            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('или перетащите сюда .csv файл');
        });
    });

    describe('Analysis Status States', () => {
        it('should show loader and processing text when status is processing', () => {
            const mockFile = createMockCsvFile();

            render(
                <Dropzone
                    file={mockFile}
                    status="processing"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('идёт парсинг файла');
        });

        it('should show completed state', () => {
            const mockFile = createMockCsvFile();

            render(
                <Dropzone
                    file={mockFile}
                    status="completed"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('готово!');
        });

        it('should show error message when error prop is provided', () => {
            const mockFile = createMockCsvFile();
            const errorMessage = 'Ошибка обработки файла';

            render(
                <Dropzone
                    file={mockFile}
                    status="error"
                    error={errorMessage}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.getByTestId('dropzone-status')).toHaveTextContent(errorMessage);
        });
    });

    describe('Clear File Functionality', () => {
        it('should call onClear when clear button is clicked', async () => {
            const user = userEvent.setup();
            const mockFile = createMockCsvFile();

            render(
                <Dropzone
                    file={mockFile}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const clearButton = screen.getByTestId('clear-file-button');
            await user.click(clearButton);

            expect(mockOnClear).toHaveBeenCalledTimes(1);
        });

        it('should disable clear button when processing', () => {
            const mockFile = createMockCsvFile();

            render(
                <Dropzone
                    file={mockFile}
                    status="processing"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('идёт парсинг файла');
            expect(screen.queryByTestId('clear-file-button')).not.toBeInTheDocument();
        });
    });

    describe('Interaction Prevention During Processing', () => {
        it('should prevent drag interactions when processing', () => {
            const mockFile = createMockCsvFile();

            render(
                <Dropzone
                    file={mockFile}
                    status="processing"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.dragEnter(dropzone, createDragEvent([]));

            expect(screen.queryByTestId('dropzone-status')).not.toHaveTextContent('Отпустите для загрузки');
            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('идёт парсинг файла');
        });

        it('should prevent new file drops when processing', () => {
            const mockFile = createMockCsvFile();
            const newFile = createMockCsvFile('new-file.csv');

            render(
                <Dropzone
                    file={mockFile}
                    status="processing"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.drop(dropzone, createDragEvent([newFile]));

            expect(mockOnFileSelect).not.toHaveBeenCalled();
        });
    });

    describe('Error Recovery', () => {
        it('should clear validation error when new valid file is selected', async () => {
            const invalidFile = createMockTextFile();
            const validFile = createMockCsvFile();

            const { rerender } = render(
                <Dropzone
                    file={null}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            const dropzone = screen.getByTestId('dropzone');

            fireEvent.drop(dropzone, createDragEvent([invalidFile]));
            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('Можно загружать только *.csv файлы');

            fireEvent.drop(dropzone, createDragEvent([validFile]));

            expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);

            rerender(
                <Dropzone
                    file={validFile}
                    status="idle"
                    error={null}
                    onFileSelect={mockOnFileSelect}
                    onClear={mockOnClear}
                />
            );

            expect(screen.queryByTestId('dropzone-status')).not.toHaveTextContent('Можно загружать только *.csv файлы');
            expect(screen.getByTestId('dropzone-status')).toHaveTextContent('файл загружен!');
        });
    });
});
