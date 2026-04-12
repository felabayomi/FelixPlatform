import { type Tour } from "@shared/schema";
import baltimoreImage from "@assets/generated_images/Baltimore_Inner_Harbor_sunset_9e4ce905.png";
import wheelingImage from "@assets/generated_images/Wheeling_Suspension_Bridge_view_c2beaa3e.png";
import charlestonImage from "@assets/generated_images/Charleston_Rainbow_Row_houses_580fc3c6.png";
import savannahImage from "@assets/generated_images/Savannah_historic_square_oaks_88b92e3f.png";
import nashvilleImage from "@assets/generated_images/Nashville_skyline_at_dusk_81989aa1.png";
import portlandImage from "@assets/generated_images/Portland_Maine_Old_Port_600d29a9.png";

export const mockTours: Tour[] = [
  {
    id: "1",
    city: "Baltimore",
    state: "Maryland",
    description: "Discover a harbor city bursting with creativity, culture, and waterfront energy — from the iconic Inner Harbor, vibrant Fells Point and Federal Hill neighborhoods, and rich maritime history, to local art at the Baltimore Museum of Art and flavors of Maryland blue crab.",
    highlights: [
      "Explore the historic Inner Harbor waterfront",
      "Visit vibrant Fells Point neighborhood",
      "Tour the Baltimore Museum of Art",
      "Experience Federal Hill's stunning views",
      "Taste authentic Maryland blue crab",
      "Discover the city's rich maritime history"
    ],
    startDate: "April 27, 2026",
    endDate: "May 3, 2026",
    maxParticipants: 20,
    currentParticipants: 14,
    imageUrl: baltimoreImage,
  },
  {
    id: "2",
    city: "Wheeling",
    state: "West Virginia",
    description: "Discover a riverfront city that blends historic charm with modern energy — from the iconic Wheeling Suspension Bridge, lively Centre Market arts and dining scene, and scenic Heritage Trail, to live performances at Capitol Theatre and adventures at Oglebay Resort.",
    highlights: [
      "Cross the iconic Wheeling Suspension Bridge",
      "Explore Centre Market arts and dining",
      "Walk the scenic Heritage Trail",
      "Attend performances at Capitol Theatre",
      "Visit Oglebay Resort and gardens",
      "Experience riverfront history and culture"
    ],
    startDate: "April 19, 2027",
    endDate: "April 23, 2027",
    maxParticipants: 18,
    currentParticipants: 8,
    imageUrl: wheelingImage,
  },
  {
    id: "3",
    city: "Charleston",
    state: "South Carolina",
    description: "Experience the charm of the Lowcountry with its pastel antebellum houses, cobblestone streets, and award-winning cuisine. Explore historic plantations, vibrant markets, and pristine beaches while discovering the unique Gullah culture that defines this coastal gem.",
    highlights: [
      "Stroll Rainbow Row's colorful historic homes",
      "Tour historic plantations and gardens",
      "Visit Charleston City Market",
      "Experience authentic Lowcountry cuisine",
      "Explore Fort Sumter National Monument",
      "Discover Gullah culture and heritage"
    ],
    startDate: "June 15, 2026",
    endDate: "June 21, 2026",
    maxParticipants: 22,
    currentParticipants: 18,
    imageUrl: charlestonImage,
  },
  {
    id: "4",
    city: "Savannah",
    state: "Georgia",
    description: "Step into a city of Spanish moss-draped squares, historic architecture, and Southern hospitality. From the bustling River Street to peaceful Forsyth Park, discover the artistic heart of coastal Georgia with its galleries, ghost tours, and world-class restaurants.",
    highlights: [
      "Tour 22 historic garden squares",
      "Explore River Street's shops and galleries",
      "Visit Forsyth Park and fountain",
      "Experience Southern culinary traditions",
      "Discover Savannah's haunted history",
      "Enjoy riverside cafes and entertainment"
    ],
    startDate: "September 8, 2026",
    endDate: "September 14, 2026",
    maxParticipants: 20,
    currentParticipants: 12,
    imageUrl: savannahImage,
  },
  {
    id: "5",
    city: "Nashville",
    state: "Tennessee",
    description: "Immerse yourself in Music City's legendary honky-tonks, world-class museums, and vibrant culinary scene. From the Grand Ole Opry to Broadway's neon lights, experience the sounds, tastes, and stories that make Nashville an unforgettable destination.",
    highlights: [
      "Tour the Grand Ole Opry",
      "Experience Broadway's live music scene",
      "Visit the Country Music Hall of Fame",
      "Explore historic RCA Studio B",
      "Taste Nashville hot chicken",
      "Discover Printer's Alley nightlife"
    ],
    startDate: "October 3, 2026",
    endDate: "October 9, 2026",
    maxParticipants: 24,
    currentParticipants: 16,
    imageUrl: nashvilleImage,
  },
  {
    id: "6",
    city: "Portland",
    state: "Maine",
    description: "Explore the coastal charm of Maine's largest city with its working waterfront, craft brewery scene, and fresh lobster. Wander the historic Old Port district, visit lighthouses, and savor the flavors of New England while enjoying stunning ocean views.",
    highlights: [
      "Explore the historic Old Port district",
      "Visit Portland Head Light lighthouse",
      "Experience craft breweries and distilleries",
      "Taste fresh Maine lobster",
      "Tour Casco Bay islands by ferry",
      "Discover local art galleries and shops"
    ],
    startDate: "July 12, 2026",
    endDate: "July 18, 2026",
    maxParticipants: 16,
    currentParticipants: 9,
    imageUrl: portlandImage,
  },
];
