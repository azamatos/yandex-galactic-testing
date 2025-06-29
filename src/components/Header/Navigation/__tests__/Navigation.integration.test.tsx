import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';

import { Navigation } from '../Navigation';

describe('Navigation Integration Tests', () => {
    const renderNavigationWithRouter = (initialRoute = '/') => {
        return render(
            <MemoryRouter initialEntries={[initialRoute]}>
                <Navigation />
            </MemoryRouter>
        );
    };

    beforeEach(() => {});

    describe('Navigation Links Rendering', () => {
        it('should render all navigation links with correct titles and icons', () => {
            renderNavigationWithRouter();

            expect(screen.getByText('CSV Аналитик')).toBeInTheDocument();
            expect(screen.getByText('CSV Генератор')).toBeInTheDocument();
            expect(screen.getByText('История')).toBeInTheDocument();
        });

        it('should render navigation links as anchor elements with correct href attributes', () => {
            renderNavigationWithRouter();

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            expect(homeLink).toHaveAttribute('href', '/');
            expect(generateLink).toHaveAttribute('href', '/generate');
            expect(historyLink).toHaveAttribute('href', '/history');
        });
    });

    describe('Active State Management', () => {
        it('should show CSV Аналитик as active when on "/" route', () => {
            renderNavigationWithRouter();

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            expect(homeLink.className).toMatch(/active/);
            expect(generateLink.className).not.toMatch(/active/);
            expect(historyLink.className).not.toMatch(/active/);
        });

        it('should show CSV Генератор as active when on "/generate" route', () => {
            renderNavigationWithRouter('/generate');

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            expect(homeLink.className).not.toMatch(/active/);
            expect(generateLink.className).toMatch(/active/);
            expect(historyLink.className).not.toMatch(/active/);
        });

        it('should show История as active when on "/history" route', () => {
            renderNavigationWithRouter('/history');

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            expect(homeLink.className).not.toMatch(/active/);
            expect(generateLink.className).not.toMatch(/active/);
            expect(historyLink.className).toMatch(/active/);
        });

        it('should ensure only one nav element is active at a time', () => {
            renderNavigationWithRouter('/generate');

            const links = screen.getAllByRole('link');

            const activeLinks = links.filter((link) =>
                Array.from(link.classList).some((className) => className.includes('active'))
            );

            expect(activeLinks).toHaveLength(1);
            expect(activeLinks[0]).toHaveTextContent('CSV Генератор');
        });
    });

    describe('Navigation User Flow', () => {
        it('should allow navigation between all sections with proper active state updates', async () => {
            const user = userEvent.setup();
            renderNavigationWithRouter();

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            expect(homeLink.className).toMatch(/active/);

            // Going to generate
            await user.click(generateLink);
            expect(generateLink.className).toMatch(/active/);
            expect(homeLink.className).not.toMatch(/active/);

            // Going to history
            await user.click(historyLink);
            expect(historyLink.className).toMatch(/active/);
            expect(screen.getByRole('link', { name: /CSV Генератор/i }).className).not.toMatch(/active/);

            // Going to home
            await user.click(homeLink);
            expect(homeLink.className).toMatch(/active/);
            expect(screen.getByRole('link', { name: /История/i }).className).not.toMatch(/active/);
        });

        it('should handle rapid navigation clicks without breaking state', async () => {
            const user = userEvent.setup();
            renderNavigationWithRouter();

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            await user.click(generateLink);
            await user.click(historyLink);
            await user.click(homeLink);
            await user.click(generateLink);

            expect(generateLink.className).toMatch(/active/);
            expect(homeLink.className).not.toMatch(/active/);
            expect(historyLink.className).not.toMatch(/active/);
        });
    });

    describe('Accessibility and UX', () => {
        it('should support keyboard navigation with Tab and Enter', async () => {
            const user = userEvent.setup();
            renderNavigationWithRouter();

            const homeLink = screen.getByRole('link', { name: /CSV Аналитик/i });
            const generateLink = screen.getByRole('link', { name: /CSV Генератор/i });
            const historyLink = screen.getByRole('link', { name: /История/i });

            await user.tab();
            expect(homeLink).toHaveFocus();

            await user.tab();
            expect(generateLink).toHaveFocus();

            await user.tab();
            expect(historyLink).toHaveFocus();

            await user.keyboard('{Enter}');
            expect(historyLink.className).toMatch(/active/);
        });

        it('should have proper semantic structure with nav element and links', () => {
            renderNavigationWithRouter();

            const nav = screen.getByRole('navigation');

            expect(nav).toBeInTheDocument();

            const links = screen.getAllByRole('link');

            expect(links).toHaveLength(3);

            links.forEach((link) => {
                expect(link).toBeInstanceOf(HTMLAnchorElement);
                expect(link).toHaveAttribute('href');
            });
        });
    });
});
