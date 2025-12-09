import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Confirmation from './Confirmation';

// Orkar inte rendera hela Navigation och Top, de är inte viktiga för 
// just det här testet. Ersätter dem med dummy-grejer.
vi.mock('../components/Navigation/Navigation', () => ({
  default: () => <nav>Nav</nav>,
}));
vi.mock('../components/Top/Top', () => ({
  default: () => <header>Top</header>,
}));

// Det här är lite av ett hack. Mockar Input-komponenten så att den 
// bara spottar ut texten i en div. 
// Det gör det sjukt mycket lättare att hitta värdena med "getByText" sen 
// istället för att böka med input-fältens "value"-attribut.
vi.mock('../components/Input/Input', () => ({
  default: ({ label, defaultValue }) => (
    <div data-testid="confirmation-input">
      <span>{label}</span>
      <span data-testid="value">{defaultValue}</span>
    </div>
  ),
}));

describe('Confirmation Component', () => {
  // Städar undan gammalt skräp innan varje test så man inte får 
  // "false positives" eller konstiga fel från förra körningen.
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // Bara lite dummy-data att leka med så vi slipper skriva om det hela tiden.
  const mockData = {
    when: '2025-01-01T12:00',
    people: 4,
    lanes: 1,
    bookingId: '12345',
    price: 580,
  };

  it('should display confirmation details from location state', () => {
    // Scenario 1: Allt gick bra, vi kommer direkt från bokningen.
    // Då ska datan ligga i location.state.
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/confirmation',
            state: { confirmationDetails: mockData },
          },
        ]}
      >
        <Confirmation />
      </MemoryRouter>
    );

    // Kollar så att datumet renderas. Enkel check.
    expect(screen.getByText('2025-01-01 12:00')).toBeInTheDocument();

    // Letar upp bokningsnumret. Eftersom jag mockade Input-komponenten
    // kan jag leta efter test-id "value" och se om texten matchar.
    expect(
      screen.getAllByTestId('value').find((el) => el.textContent === '12345')
    ).toBeInTheDocument();

    // Priset ska också synas.
    expect(screen.getByText('580 sek')).toBeInTheDocument();
  });

  it('should display confirmation details from sessionStorage if state is missing', () => {
    // Scenario 2: Användaren refreshade sidan typ.
    // State är tomt, men vi hoppas att infon sparades i sessionStorage.
    sessionStorage.setItem('confirmation', JSON.stringify(mockData));

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/confirmation',
            state: null, // ingen state, så komponenten måste läsa från sessionStorage
          },
        ]}
      >
        <Confirmation />
      </MemoryRouter>
    );

    // Borde funka exakt likadant som förra testet, fast datan hämtas från storage.
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('580 sek')).toBeInTheDocument();
  });

  it('should display "Inga bokning gjord" if no data exists', () => {
    // Scenario 3: Ingen data alls. Nån försökte kanske gå direkt till URL:en.
    // Inget i state, inget i storage.
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/confirmation',
            state: null,
          },
        ]}
      >
        <Confirmation />
      </MemoryRouter>
    );

    // Då ska användaren få veta att det inte finns nån bokning.
    expect(screen.getByText('Inga bokning gjord!')).toBeInTheDocument();
  });
});
