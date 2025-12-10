import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Booking from './Booking'; 



// Vi måste veta om användaren skickas vidare till bekräftelsesidan.
// Så jag mockar useNavigate och sparar en spion-funktion mockedNavigate
// så jag kan kolla "har den här körts?" senare.
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Här gör jag en "fuska komponent" för BookingInfo. 
// för jag vill inte testa att inputs funkar (det är BookingInfo's ansvar),
// jag vill bara testa att Booking-komponenten tar emot datan när man skriver.
// Så jag gör enkla inputs som triggar "updateBookingDetails" direkt.
vi.mock('../components/BookingInfo/BookingInfo', () => ({
  default: ({ updateBookingDetails }) => (
    <div data-testid="booking-info-mock">
      <input data-testid="date-input" name="when" onChange={updateBookingDetails} />
      <input data-testid="time-input" name="time" onChange={updateBookingDetails} />
      <input data-testid="people-input" name="people" onChange={updateBookingDetails} />
      <input data-testid="lanes-input" name="lanes" onChange={updateBookingDetails} />
    </div>
  ),
}));

// Samma tänk här med Shoes. Det är en ganska komplex komponent egentligen,
// men för Booking.jsx är det enda viktiga att man kan lägga till/ta bort skor
// och ändra storlek. Så jag mockar upp knappar och inputs som gör exakt det.
vi.mock('../components/Shoes/Shoes', () => ({
  default: ({ updateSize, addShoe, removeShoe, shoes }) => (
    <div data-testid="shoes-mock">
      {/* En knapp som bara skickar in ett unikt ID för att simulera en ny sko */}
      <button data-testid="add-shoe-btn" onClick={() => addShoe(`shoe-${Date.now()}-${Math.random()}`)}>Add</button>
      
      {/* Loopar ut skorna vi får som props, så vi kan testa att ta bort dem */}
      {shoes.map((shoe, index) => (
        <div key={shoe.id}>
          <input
            data-testid={`shoe-input-${index}`}
            name={shoe.id} 
            onChange={updateSize}
            value={shoe.size}
          />
          <button data-testid={`remove-shoe-${index}`} onClick={() => removeShoe(shoe.id)}>Remove</button>
        </div>
      ))}
    </div>
  ),
}));

// Nav och Top är bara pynt, mockar bort dem så de inte stökar ner.
vi.mock('../components/Navigation/Navigation', () => ({ default: () => <nav>Nav</nav> }));
vi.mock('../components/Top/Top', () => ({ default: () => <header>Top</header> }));

// Mockar felmeddelandet så jag enkelt kan söka efter texten i testerna.
vi.mock('../components/ErrorMessage/ErrorMessage', () => ({ 
  default: ({ message }) => <div data-testid="error-message">{message}</div> 
}));



describe('Booking Component', () => {
  // Städar upp inför varje test så inte gamla mocks eller session-data spökar.
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // En liten hjälpis för att slippa skriva hela render-blocket varje gång.
  const renderBooking = () => render(
    <MemoryRouter>
      <Booking />
    </MemoryRouter>
  );

  // En annan hjälpis. Orkar inte skriva fireEvent.change 4 gånger i varje test.
  // Den här fyller i datum, tid, antal spelare och banor snabbt.
  const fillForm = (people = '2', lanes = '1') => {
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByTestId('time-input'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByTestId('people-input'), { target: { value: people } });
    fireEvent.change(screen.getByTestId('lanes-input'), { target: { value: lanes } });
  };

  // Hjälpis för att klicka på "Lägg till sko"-knappen X antal gånger.
  const addShoes = (count) => {
    const btn = screen.getByTestId('add-shoe-btn');
    for (let i = 0; i < count; i++) {
      fireEvent.click(btn);
    }
  };

  it('should allow user to book date, time, players and lanes, adding shoes and submit', async () => {
    // Vi testar att allt funkar som det ska.
    renderBooking();
    fillForm('2', '1'); // 2 pers, 1 bana
    addShoes(2); // Lägger till 2 skor

    // Letar upp sko inputarna
    const shoeInput0 = screen.getByTestId('shoe-input-0');
    const shoeInput1 = screen.getByTestId('shoe-input-1');

    // Fyller i skostorlekar viktigt, annars får vi felmeddelande
    fireEvent.change(shoeInput0, { target: { value: '42', name: shoeInput0.name } });
    fireEvent.change(shoeInput1, { target: { value: '43', name: shoeInput1.name } });

    // Trycker på STRIKE boka-knappen
    const bookBtn = screen.getByText('strIIIIIike!');
    fireEvent.click(bookBtn);

    // Väntar och kollar om vi blev skickade till confirmation-sidan
    // och att vi fick med oss någon data i state.
    await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/confirmation', expect.objectContaining({
            state: expect.objectContaining({
                confirmationDetails: expect.anything() // Nöjer mig med att det finns data där
            })
        }));
    });
  });


  it('should allow removing a shoe field', () => {
    // 2. Testar att man kan ångra sig om man la till en sko för mycket.
    renderBooking();
    addShoes(2);
    
    // Båda ska finnas
    expect(screen.getByTestId('shoe-input-0')).toBeInTheDocument();
    expect(screen.getByTestId('shoe-input-1')).toBeInTheDocument();

    // Tar bort den första
    fireEvent.click(screen.getByTestId('remove-shoe-0'));

    // Nu borde index ha shiftats eller den sista försvunnit. 
    // Enklast att kolla är att vi inte har två inputs längre.
    expect(screen.queryByTestId('shoe-input-1')).not.toBeInTheDocument();
  });


  it(' should show error if fields are missing', async () => {
    // 3. Felhantering  Försöker boka helt tomt formulär.
    renderBooking();
    fireEvent.click(screen.getByText('strIIIIIike!'));

    // Ska dyka upp ett felmeddelande.
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/alla fälten måste vara ifyllda/i);
    });
    // Och vi ska absolut INTE ha navigerat iväg.
    expect(mockedNavigate).not.toHaveBeenCalled();
  });


  it(' should show error if too many players for the lanes', async () => {
  // Max 4 pers per bana.
    renderBooking();
    fillForm('5', '1'); // 5 pers på 1 bana = FAIL
    
    addShoes(5); 

    // Måste fylla i storlekar så det inte är DET som ger felmeddelandet.
    for(let i=0; i<5; i++) {
        const input = screen.getByTestId(`shoe-input-${i}`);
        fireEvent.change(input, { target: { value: '40', name: input.name } });
    }

    fireEvent.click(screen.getByText('strIIIIIike!'));

    // Kolla att den klagar på max 4 spelare.
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/det får max vara 4 spelare per bana/i);
    });
  });

  it(' should show error if shoes count does not match people count', async () => {
    // 5. Testar regeln: Antal skor måste matcha antal spelare.
    renderBooking();
    fillForm('2', '1'); // 2 spelare
    addShoes(1); // Men bara 1 sko... snålt.

    fireEvent.click(screen.getByText('strIIIIIike!'));

    // Ska klaga på antalet skor.
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/antalet skor måste stämma överens/i);
    });
  });

  it('should show error if shoe sizes are not filled', async () => {
    // 6. Testar regeln: Man får inte glömma fylla i storlekarna.
    renderBooking();
    fillForm('1', '1');
    addShoes(1);
    // ... men jag struntar i att fylla i storleken i inputen (value är tomt

    fireEvent.click(screen.getByText('strIIIIIike!'));

    // Ska klaga på att skorna inte är ifyllda.
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/alla skor måste vara ifyllda/i);
    });
  });
});