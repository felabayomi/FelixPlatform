import ConfirmationView from '../ConfirmationView';

export default function ConfirmationViewExample() {
  const mockBooking = {
    id: 'example-booking-1',
    status: 'scheduled',
    customerName: 'John Doe',
    customerPhone: '(304) 555-0123',
    customerEmail: 'john@example.com',
    dropoffDate: '2025-10-10',
    dropoffTime: '10:00 AM',
    pickupDate: '2025-10-12',
    pickupTime: '2:00 PM',
    soapType: 'Tide Regular',
    hasHeavyItems: true,
    heavyItemsCount: 2,
    specialInstructions: 'Please use gentle detergent for delicate items',
    rescheduleToken: null,
    remindersSent: [],
    createdAt: new Date('2025-10-09T12:00:00Z'),
  };

  return (
    <ConfirmationView
      booking={mockBooking}
      onNewBooking={() => console.log('New booking clicked')}
    />
  );
}
