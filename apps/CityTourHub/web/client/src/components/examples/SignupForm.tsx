import SignupForm from '../SignupForm';

export default function SignupFormExample() {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
  };

  return (
    <div className="max-w-md p-6">
      <SignupForm tourId="1" onSubmit={handleSubmit} />
    </div>
  );
}
