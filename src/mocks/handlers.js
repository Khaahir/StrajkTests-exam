// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

// Den exakta API-URL:en från din Booking-komponent
const API_URL = 'https://731xy9c2ak.execute-api.eu-north-1.amazonaws.com/booking';
const API_KEY = 'strajk-B2mWxADrthdHqd22';

// Standard mock-svar för en bokning
const mockSuccessConfirmation = {
  bookingDetails: {
    // Fält som matchar Confirmation.jsx:
    when: '2025-12-24T18:00', // Datum + Tid
    people: 4, 
    lanes: 1,
    bookingId: 'ST-20251224-42', 
    price: 580,
  },
};

export const handlers = [
  // Fånga upp POST-anropet
  http.post(API_URL, async ({ request }) => {
    // Validera API Key Bra att göra i testet, även om det inte är ett krav
    if (request.headers.get('x-api-key') !== API_KEY) {
        return HttpResponse.json({ 
            error: 'Obehörig - Ogiltig API-nyckel.' 
        }, { status: 403 });
    }
    
    // Returnera det mockade bekräftelsesvaret som om anropet lyckades
    return HttpResponse.json(mockSuccessConfirmation, { status: 201 });
  }),
];