// src/setupTests.js
import '@testing-library/jest-dom/vitest'; 
import { server } from './mocks/server';
import { vi } from 'vitest';



// Starta servern innan alla tester körs
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Återställ alla handlers efter varje test så att de inte påverkar nästa test
afterEach(() => server.resetHandlers());

// Stäng servern efter att alla tester har körts
afterAll(() => server.close());




// Mocka sessionStorage (för att hantera US 5)
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
});

// Mocka useNavigate för att hantera US 4/5 navigering
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
        // Vi behåller useLocation som originalet för att testa ConfirmationPage
    };
});