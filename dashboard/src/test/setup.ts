import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock HTMLDialogElement methods for jsdom
HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();
