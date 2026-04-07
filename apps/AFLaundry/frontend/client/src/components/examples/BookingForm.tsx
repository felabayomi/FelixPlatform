import BookingForm from '../BookingForm';

export default function BookingFormExample() {
  return (
    <BookingForm 
      onSubmit={(data) => console.log('Booking submitted:', data)} 
    />
  );
}
