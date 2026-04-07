import Hero from '../Hero';

export default function HeroExample() {
  return (
    <Hero
      onBookNow={() => console.log('Book now clicked')}
      onRequestQuote={() => console.log('Request quote clicked')}
    />
  );
}
