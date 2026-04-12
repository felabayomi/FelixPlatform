import TourCard from '../TourCard';
import baltimoreImage from '@assets/generated_images/Baltimore_Inner_Harbor_sunset_9e4ce905.png';

export default function TourCardExample() {
  return (
    <div className="max-w-sm">
      <TourCard
        id="1"
        city="Baltimore"
        state="Maryland"
        description="Discover a harbor city bursting with creativity, culture, and waterfront energy — from the iconic Inner Harbor, vibrant Fells Point and Federal Hill neighborhoods."
        startDate="Apr 27, 2026"
        endDate="May 3, 2026"
        imageUrl={baltimoreImage}
        maxParticipants={20}
        currentParticipants={14}
      />
    </div>
  );
}
