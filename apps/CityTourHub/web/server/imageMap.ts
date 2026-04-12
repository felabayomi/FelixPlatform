import path from "path";

const imageBasePath = path.join(process.cwd(), "attached_assets", "generated_images");

// Map state/city names to actual generated images
export const imageMap: Record<string, string> = {
  // Original images
  "baltimore": path.join(imageBasePath, "Baltimore_Inner_Harbor_sunset_9e4ce905.png"),
  "maryland": path.join(imageBasePath, "Baltimore_Inner_Harbor_sunset_9e4ce905.png"),
  "wheeling": path.join(imageBasePath, "Wheeling_Suspension_Bridge_view_c2beaa3e.png"),
  "charleston": path.join(imageBasePath, "Charleston_Rainbow_Row_houses_580fc3c6.png"),
  "southcarolina": path.join(imageBasePath, "Charleston_Rainbow_Row_houses_580fc3c6.png"),
  "savannah": path.join(imageBasePath, "Savannah_historic_square_oaks_88b92e3f.png"),
  "georgia": path.join(imageBasePath, "Savannah_historic_square_oaks_88b92e3f.png"),
  "nashville": path.join(imageBasePath, "Nashville_skyline_at_dusk_81989aa1.png"),
  "tennessee": path.join(imageBasePath, "Nashville_skyline_at_dusk_81989aa1.png"),
  "portland": path.join(imageBasePath, "Portland_Maine_Old_Port_600d29a9.png"),
  "maine": path.join(imageBasePath, "Portland_Maine_Old_Port_600d29a9.png"),
  
  // New state images - Batch 1
  "alabama": path.join(imageBasePath, "Birmingham_Alabama_cityscape_689f776e.png"),
  "birmingham": path.join(imageBasePath, "Birmingham_Alabama_cityscape_689f776e.png"),
  "alaska": path.join(imageBasePath, "Anchorage_Alaska_mountain_backdrop_441ca7f7.png"),
  "anchorage": path.join(imageBasePath, "Anchorage_Alaska_mountain_backdrop_441ca7f7.png"),
  "arizona": path.join(imageBasePath, "Phoenix_Arizona_desert_skyline_b317b961.png"),
  "phoenix": path.join(imageBasePath, "Phoenix_Arizona_desert_skyline_b317b961.png"),
  "arkansas": path.join(imageBasePath, "Little_Rock_Arkansas_riverfront_c926e1ff.png"),
  "littlerock": path.join(imageBasePath, "Little_Rock_Arkansas_riverfront_c926e1ff.png"),
  "california": path.join(imageBasePath, "San_Diego_California_harbor_view_4380b182.png"),
  "sandiego": path.join(imageBasePath, "San_Diego_California_harbor_view_4380b182.png"),
  "colorado": path.join(imageBasePath, "Denver_Colorado_mountain_skyline_5704a94b.png"),
  "denver": path.join(imageBasePath, "Denver_Colorado_mountain_skyline_5704a94b.png"),
  "connecticut": path.join(imageBasePath, "Mystic_Connecticut_seaport_charm_0337b7e2.png"),
  "mystic": path.join(imageBasePath, "Mystic_Connecticut_seaport_charm_0337b7e2.png"),
  "delaware": path.join(imageBasePath, "Rehoboth_Beach_Delaware_coast_ac3a446d.png"),
  "rehobothbeach": path.join(imageBasePath, "Rehoboth_Beach_Delaware_coast_ac3a446d.png"),
  "florida": path.join(imageBasePath, "Jacksonville_Florida_riverfront_skyline_241db261.png"),
  "jacksonville": path.join(imageBasePath, "Jacksonville_Florida_riverfront_skyline_241db261.png"),
  "hawaii": path.join(imageBasePath, "Honolulu_Hawaii_Waikiki_Beach_616f79ac.png"),
  "honolulu": path.join(imageBasePath, "Honolulu_Hawaii_Waikiki_Beach_616f79ac.png"),
  
  // Batch 2
  "idaho": path.join(imageBasePath, "Boise_Idaho_foothills_view_aa42005c.png"),
  "boise": path.join(imageBasePath, "Boise_Idaho_foothills_view_aa42005c.png"),
  "illinois": path.join(imageBasePath, "Chicago_Illinois_lakefront_skyline_41301165.png"),
  "chicago": path.join(imageBasePath, "Chicago_Illinois_lakefront_skyline_41301165.png"),
  "indiana": path.join(imageBasePath, "Indianapolis_Indiana_downtown_2884bae2.png"),
  "indianapolis": path.join(imageBasePath, "Indianapolis_Indiana_downtown_2884bae2.png"),
  "iowa": path.join(imageBasePath, "Des_Moines_Iowa_capital_4deb3a10.png"),
  "desmoines": path.join(imageBasePath, "Des_Moines_Iowa_capital_4deb3a10.png"),
  "kansas": path.join(imageBasePath, "Kansas_City_riverfront_skyline_808f8159.png"),
  "kansascity": path.join(imageBasePath, "Kansas_City_riverfront_skyline_808f8159.png"),
  "kentucky": path.join(imageBasePath, "Louisville_Kentucky_riverfront_77b9822a.png"),
  "louisville": path.join(imageBasePath, "Louisville_Kentucky_riverfront_77b9822a.png"),
  "louisiana": path.join(imageBasePath, "New_Orleans_French_Quarter_f0d4b86d.png"),
  "neworleans": path.join(imageBasePath, "New_Orleans_French_Quarter_f0d4b86d.png"),
  "massachusetts": path.join(imageBasePath, "Boston_Massachusetts_historic_harbor_02bc8640.png"),
  "boston": path.join(imageBasePath, "Boston_Massachusetts_historic_harbor_02bc8640.png"),
  "michigan": path.join(imageBasePath, "Detroit_Michigan_Renaissance_Center_37540d93.png"),
  "detroit": path.join(imageBasePath, "Detroit_Michigan_Renaissance_Center_37540d93.png"),
  "minnesota": path.join(imageBasePath, "Minneapolis_Minnesota_skyline_35dd8d67.png"),
  "minneapolis": path.join(imageBasePath, "Minneapolis_Minnesota_skyline_35dd8d67.png"),
  
  // Batch 3
  "mississippi": path.join(imageBasePath, "Jackson_Mississippi_capital_city_857f3f77.png"),
  "jackson": path.join(imageBasePath, "Jackson_Mississippi_capital_city_857f3f77.png"),
  "missouri": path.join(imageBasePath, "St_Louis_Missouri_Gateway_Arch_34217ea3.png"),
  "stlouis": path.join(imageBasePath, "St_Louis_Missouri_Gateway_Arch_34217ea3.png"),
  "montana": path.join(imageBasePath, "Bozeman_Montana_mountain_town_d16d5f94.png"),
  "bozeman": path.join(imageBasePath, "Bozeman_Montana_mountain_town_d16d5f94.png"),
  "nebraska": path.join(imageBasePath, "Omaha_Nebraska_riverfront_07e25ea8.png"),
  "omaha": path.join(imageBasePath, "Omaha_Nebraska_riverfront_07e25ea8.png"),
  "nevada": path.join(imageBasePath, "Las_Vegas_Nevada_Strip_44a0c6f4.png"),
  "lasvegas": path.join(imageBasePath, "Las_Vegas_Nevada_Strip_44a0c6f4.png"),
  "newhampshire": path.join(imageBasePath, "New_Hampshire_lake_scenery_15a49902.png"),
  "lakewinnipesaukee": path.join(imageBasePath, "New_Hampshire_lake_scenery_15a49902.png"),
  "newjersey": path.join(imageBasePath, "West_Orange_New_Jersey_0cfb8157.png"),
  "westorange": path.join(imageBasePath, "West_Orange_New_Jersey_0cfb8157.png"),
  "newmexico": path.join(imageBasePath, "Santa_Fe_New_Mexico_adobe_3b5c5a76.png"),
  "santafe": path.join(imageBasePath, "Santa_Fe_New_Mexico_adobe_3b5c5a76.png"),
  "newyork": path.join(imageBasePath, "Brooklyn_New_York_skyline_view_c67254f4.png"),
  "brooklyn": path.join(imageBasePath, "Brooklyn_New_York_skyline_view_c67254f4.png"),
  "northcarolina": path.join(imageBasePath, "Raleigh_North_Carolina_downtown_81039abc.png"),
  "raleigh": path.join(imageBasePath, "Raleigh_North_Carolina_downtown_81039abc.png"),
  
  // Batch 4
  "northdakota": path.join(imageBasePath, "Fargo_North_Dakota_downtown_1875d69d.png"),
  "fargo": path.join(imageBasePath, "Fargo_North_Dakota_downtown_1875d69d.png"),
  "ohio": path.join(imageBasePath, "Cincinnati_Ohio_riverfront_bridge_de856b91.png"),
  "cincinnati": path.join(imageBasePath, "Cincinnati_Ohio_riverfront_bridge_de856b91.png"),
  "oklahoma": path.join(imageBasePath, "Oklahoma_City_skyline_97969b85.png"),
  "oklahomacity": path.join(imageBasePath, "Oklahoma_City_skyline_97969b85.png"),
  "oregon": path.join(imageBasePath, "Portland_Oregon_mountain_backdrop_7f916ea8.png"),
  "pennsylvania": path.join(imageBasePath, "Philadelphia_Pennsylvania_Independence_Hall_21cd5305.png"),
  "philadelphia": path.join(imageBasePath, "Philadelphia_Pennsylvania_Independence_Hall_21cd5305.png"),
  "rhodeisland": path.join(imageBasePath, "Providence_Rhode_Island_historic_49afbec9.png"),
  "providence": path.join(imageBasePath, "Providence_Rhode_Island_historic_49afbec9.png"),
  "southdakota": path.join(imageBasePath, "Sioux_Falls_South_Dakota_87bd3c26.png"),
  "siouxfalls": path.join(imageBasePath, "Sioux_Falls_South_Dakota_87bd3c26.png"),
  "texas": path.join(imageBasePath, "Houston_Texas_skyline_7c0112a2.png"),
  "houston": path.join(imageBasePath, "Houston_Texas_skyline_7c0112a2.png"),
  "utah": path.join(imageBasePath, "Salt_Lake_City_Utah_mountains_6637f113.png"),
  "saltlakecity": path.join(imageBasePath, "Salt_Lake_City_Utah_mountains_6637f113.png"),
  "vermont": path.join(imageBasePath, "Burlington_Vermont_lakefront_d53b9a48.png"),
  "burlington": path.join(imageBasePath, "Burlington_Vermont_lakefront_d53b9a48.png"),
  
  // Batch 5
  "virginia": path.join(imageBasePath, "Richmond_Virginia_capital_a46b7bfa.png"),
  "richmond": path.join(imageBasePath, "Richmond_Virginia_capital_a46b7bfa.png"),
  "washington": path.join(imageBasePath, "Seattle_Washington_Space_Needle_f348659d.png"),
  "seattle": path.join(imageBasePath, "Seattle_Washington_Space_Needle_f348659d.png"),
  "westvirginia": path.join(imageBasePath, "Wheeling_Suspension_Bridge_view_c2beaa3e.png"),
  "wisconsin": path.join(imageBasePath, "Milwaukee_Wisconsin_lakefront_d5f5ee64.png"),
  "milwaukee": path.join(imageBasePath, "Milwaukee_Wisconsin_lakefront_d5f5ee64.png"),
  "wyoming": path.join(imageBasePath, "Jackson_Hole_Wyoming_Tetons_e0329978.png"),
  "jacksonhole": path.join(imageBasePath, "Jackson_Hole_Wyoming_Tetons_e0329978.png"),
};

// Fallback image for states without specific images (no longer needed but kept for safety)
export const fallbackImage = path.join(imageBasePath, "American_cityscape_hero_panorama_5758d44c.png");

export function getImagePath(stateName: string): string {
  const key = stateName.toLowerCase().replace(/\s+/g, "");
  return imageMap[key] || fallbackImage;
}
