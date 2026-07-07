/**
 * Travel Deal Lab — curated dataset.
 *
 * This is a hand-authored snapshot, not a mirror of any live pricing API. The
 * fare bands and the points baseline are deliberately rough editorial
 * estimates meant to anchor a decision, and they will drift with the market, so
 * the surface discloses them as unverified. The engine in
 * `src/lib/travelDeals.ts` reasons against these numbers; keep them plausible
 * rather than precise, and refresh `TRAVEL_DEALS_AS_OF` when you touch them.
 */

import type {
  DealTactic,
  DestinationRegion,
  RecommendedTool,
} from "@/types/travelDeals";

/** Editorial freshness stamp for the fare bands and tactics below. */
export const TRAVEL_DEALS_AS_OF = "2026-07-07";

/**
 * These numbers are estimates, not live quotes. The page says so on the record
 * because a stale fare band presented as fact would be worse than useless.
 */
export const TRAVEL_DEALS_VERIFIED = false;

/**
 * Rough value of a transferable point (Chase, Amex, Capital One and the like)
 * in cents, used as the bar a redemption has to clear to count as good. It is a
 * blended editorial figure, not a specific transfer partner's sweet spot.
 */
export const POINTS_BASELINE_CENTS = 1.4;

/**
 * Typical round-trip economy fare bands per traveler from a major US hub, plus
 * the booking window that historically tends to be cheapest for each distance.
 * Ordered by distance. Every fare is an estimate; treat the band, not the point.
 */
export const DESTINATION_REGIONS: DestinationRegion[] = [
  {
    id: "domestic-short",
    label: "US regional / short-haul",
    kind: "domestic",
    typicalFareLow: 90,
    typicalFare: 190,
    typicalFareHigh: 380,
    bookWindowOpenDays: 90,
    sweetSpotMinDays: 21,
    sweetSpotMaxDays: 60,
    note: "Short domestic hops swing hard on day of week. Tuesday and Wednesday departures usually win.",
  },
  {
    id: "domestic-transcon",
    label: "US transcontinental",
    kind: "domestic",
    typicalFareLow: 160,
    typicalFare: 300,
    typicalFareHigh: 600,
    bookWindowOpenDays: 120,
    sweetSpotMinDays: 28,
    sweetSpotMaxDays: 75,
    note: "Coast to coast rewards a fare alert. Sales show up often enough that patience pays.",
  },
  {
    id: "canada-mexico",
    label: "Canada & Mexico",
    kind: "international",
    typicalFareLow: 200,
    typicalFare: 380,
    typicalFareHigh: 720,
    bookWindowOpenDays: 120,
    sweetSpotMinDays: 30,
    sweetSpotMaxDays: 90,
    note: "Close enough to price like domestic, far enough that shoulder season cuts fares a lot.",
  },
  {
    id: "caribbean-central-america",
    label: "Caribbean & Central America",
    kind: "international",
    typicalFareLow: 250,
    typicalFare: 470,
    typicalFareHigh: 900,
    bookWindowOpenDays: 150,
    sweetSpotMinDays: 45,
    sweetSpotMaxDays: 120,
    note: "Peak winter and spring break carry a premium. Late spring and fall are the value windows.",
  },
  {
    id: "south-america",
    label: "South America",
    kind: "international",
    typicalFareLow: 500,
    typicalFare: 780,
    typicalFareHigh: 1500,
    bookWindowOpenDays: 180,
    sweetSpotMinDays: 60,
    sweetSpotMaxDays: 150,
    note: "Long-haul but competitive out of Miami and New York. Watch for southern-hemisphere seasons flipping.",
  },
  {
    id: "western-europe",
    label: "Western Europe",
    kind: "international",
    typicalFareLow: 450,
    typicalFare: 780,
    typicalFareHigh: 1500,
    bookWindowOpenDays: 180,
    sweetSpotMinDays: 60,
    sweetSpotMaxDays: 150,
    note: "Shoulder season, roughly April to May and September to October, is where the real savings live.",
  },
  {
    id: "eastern-europe-mideast",
    label: "Eastern Europe & Middle East",
    kind: "international",
    typicalFareLow: 600,
    typicalFare: 950,
    typicalFareHigh: 1700,
    bookWindowOpenDays: 210,
    sweetSpotMinDays: 70,
    sweetSpotMaxDays: 160,
    note: "Gulf carriers run frequent sales. Routing through a hub often beats the nonstop on price.",
  },
  {
    id: "africa",
    label: "Africa",
    kind: "international",
    typicalFareLow: 800,
    typicalFare: 1250,
    typicalFareHigh: 2300,
    bookWindowOpenDays: 240,
    sweetSpotMinDays: 80,
    sweetSpotMaxDays: 180,
    note: "Fares are high and volatile, so a long-running alert matters more here than almost anywhere.",
  },
  {
    id: "south-southeast-asia",
    label: "South & Southeast Asia",
    kind: "international",
    typicalFareLow: 650,
    typicalFare: 1050,
    typicalFareHigh: 1900,
    bookWindowOpenDays: 210,
    sweetSpotMinDays: 75,
    sweetSpotMaxDays: 170,
    note: "Positioning to a West Coast gateway can undercut a through-fare noticeably.",
  },
  {
    id: "east-asia",
    label: "East Asia",
    kind: "international",
    typicalFareLow: 650,
    typicalFare: 980,
    typicalFareHigh: 1800,
    bookWindowOpenDays: 210,
    sweetSpotMinDays: 70,
    sweetSpotMaxDays: 165,
    note: "Competitive from the West Coast. Lunar New Year and cherry-blossom season spike hard.",
  },
  {
    id: "oceania",
    label: "Australia & the Pacific",
    kind: "international",
    typicalFareLow: 900,
    typicalFare: 1400,
    typicalFareHigh: 2400,
    bookWindowOpenDays: 300,
    sweetSpotMinDays: 90,
    sweetSpotMaxDays: 200,
    note: "The longest lead time on the board. Their summer is the northern winter, which flips the premium.",
  },
];

/**
 * The playbook. Concrete tactics grouped by category, written the way I would
 * actually explain them to someone planning a trip. `impact` is my read on how
 * much each one tends to move the total, not a measured figure.
 */
export const DEAL_TACTICS: DealTactic[] = [
  {
    id: "flights-alerts",
    category: "flights",
    title: "Set price alerts and let them run",
    body: "The single highest-leverage thing you can do is stop refreshing prices and let a tool watch for you. I set a Google Flights alert the day I know roughly when and where I am going, and I add a deal service like Going for the routes I fly most. Fares move constantly, and the point of an alert is to catch the dip you would otherwise miss.",
    impact: "high",
  },
  {
    id: "flights-flexible-dates",
    category: "flights",
    title: "Treat dates and airports as variables",
    body: "The date grid and nearby-airport search are where most of the savings hide. Shifting a departure by a day or two, or flying into a secondary airport an hour from your destination, often beats every coupon and hack combined. I check the whole month view before I ever look at a specific day.",
    impact: "high",
  },
  {
    id: "flights-mistake-fares",
    category: "flights",
    title: "Be ready to jump on a mistake fare",
    body: "Every so often an airline publishes a fare far below cost, and those disappear within hours. You cannot plan around them, but you can be ready. Follow a couple of deal feeds, keep your passport current, and book first while asking questions later, since a refundable 24-hour window usually covers you if it falls through.",
    impact: "medium",
  },
  {
    id: "flights-one-way-mix",
    category: "flights",
    title: "Price one-ways and mixed carriers",
    body: "A round trip is not always cheaper than two one-ways on different airlines, especially on competitive routes. Search engines that mix carriers will surface those combinations. It adds a little complexity if a flight is cancelled, so I only do it when the savings are real, but the savings often are.",
    impact: "medium",
  },
  {
    id: "hotels-compare-direct",
    category: "hotels",
    title: "Shop the aggregators, then book direct",
    body: "I use the big aggregators to find the property and the going rate, then I check the hotel's own site before booking. Chains increasingly match or beat third-party prices for members and throw in perks, and booking direct makes changes and loyalty credit far less painful. The aggregator is for discovery, not always for the transaction.",
    impact: "high",
  },
  {
    id: "hotels-opaque",
    category: "hotels",
    title: "Use opaque and last-minute rates when you are flexible",
    body: "Opaque deals, where you see the star rating and neighborhood but not the name until you book, can cut a nice hotel by a third. Last-minute apps do the same for tonight and tomorrow. Neither is worth it if you need a specific property, but if you mostly care about a clean room in the right part of town, the discount is large.",
    impact: "medium",
  },
  {
    id: "hotels-apartments",
    category: "hotels",
    title: "Weigh apartments against hotels honestly",
    body: "For longer stays or a group, an apartment with a kitchen usually wins on total cost once you count breakfasts and laundry. For a two-night city stop, a hotel often wins once you add cleaning and service fees to the nightly rate. I compare the all-in number, not the headline nightly rate, because the fees are where the surprise lives.",
    impact: "medium",
  },
  {
    id: "points-value-first",
    category: "points",
    title: "Redeem on value, not on impulse",
    body: "Points are worth roughly a cent and a half each in the abstract, so I only spend them when a redemption clears that bar comfortably. That usually means long-haul flights and premium cabins, not a cheap domestic ticket where the cash price already makes the points a wash. The value checker on this page exists to force that comparison before you burn a balance.",
    impact: "high",
  },
  {
    id: "points-transfer-partners",
    category: "points",
    title: "Keep points flexible until you book",
    body: "Transferable points from a bank program are worth more than points locked into one airline, because you can move them to whichever partner has award space. I keep the balance in the flexible program and only transfer once I have found and can see the specific award seat, since transfers are usually one-way and final.",
    impact: "medium",
  },
  {
    id: "points-cards",
    category: "points",
    title: "Earn deliberately, not everywhere",
    body: "A sign-up bonus on the right card can fund most of a long-haul ticket, but chasing every card creates annual fees and clutter that eat the gains. I match a card to spending I already do and to the trip I am actually planning, then I stop. The goal is a specific redemption, not a hobby.",
    impact: "medium",
  },
  {
    id: "timing-shoulder-season",
    category: "timing",
    title: "Travel in the shoulder season",
    body: "The weeks on either side of peak season are the best value in travel. The weather is usually still good, the crowds thin out, and both flights and hotels drop noticeably. For most of Europe that is spring and early fall, and nearly every destination has its own version. Moving a trip by a few weeks often saves more than any booking trick.",
    impact: "high",
  },
  {
    id: "timing-avoid-holidays",
    category: "timing",
    title: "Book holidays far ahead or skip them",
    body: "Fixed-date demand around major holidays is the one case where waiting never helps, because everyone wants the same dates and prices only rise. If you must travel then, book as early as the window opens. If you can move the trip off the peak by even a week, do that instead, since the discount is steep.",
    impact: "medium",
  },
  {
    id: "ground-intercity",
    category: "ground",
    title: "Compare trains, buses, and budget flights together",
    body: "Once you are on the ground, do not assume the plane is cheapest or fastest. A multi-modal search will put trains, buses, and low-cost carriers side by side, and for a lot of regional hops the train wins on total time once you count getting to the airport. I price all three before booking any leg between cities.",
    impact: "medium",
  },
  {
    id: "ground-cars",
    category: "ground",
    title: "Rebook rental cars as prices fall",
    body: "Rental rates move like fares, and most reservations are free to cancel until pickup. I book a refundable rate early to lock in a car, then let a tool re-check the price and rebook if it drops. It is the rare case where you can capture the downside with almost no risk.",
    impact: "low",
  },
  {
    id: "ground-fx",
    category: "ground",
    title: "Stop losing money on foreign exchange",
    body: "Foreign transaction fees and bad airport exchange rates quietly tax a whole trip. A no-foreign-fee card for purchases and a low-cost transfer service or fee-free debit card for cash will save a few percent on everything you spend abroad. It is not glamorous, but on a long trip it adds up to a real number.",
    impact: "low",
  },
];

/**
 * Tools I actually reach for, grouped loosely by what they are best at. Links go
 * to the product's home page. `free` marks whether the core function costs
 * nothing; several paid services still offer a useful free tier.
 */
export const RECOMMENDED_TOOLS: RecommendedTool[] = [
  {
    id: "google-flights",
    name: "Google Flights",
    url: "https://www.google.com/travel/flights",
    category: "flights",
    bestFor: "Date grids, price alerts, nearby airports",
    note: "The default first stop. The calendar and price graph do most of the timing work for you.",
    free: true,
  },
  {
    id: "skyscanner",
    name: "Skyscanner",
    url: "https://www.skyscanner.com",
    category: "flights",
    bestFor: "Everywhere search and mixed carriers",
    note: "Search a whole month or an open destination when the trip is flexible and the dates are not.",
    free: true,
  },
  {
    id: "kayak",
    name: "Kayak",
    url: "https://www.kayak.com",
    category: "flights",
    bestFor: "Price forecasts and fee-aware comparisons",
    note: "The forecast and the baggage-fee filters help when you are deciding whether to wait or book.",
    free: true,
  },
  {
    id: "going",
    name: "Going",
    url: "https://www.going.com",
    category: "flights",
    bestFor: "Curated fare drops and mistake fares",
    note: "A deal feed that watches routes for you. The free tier is enough to catch the big drops.",
    free: true,
  },
  {
    id: "ita-matrix",
    name: "ITA Matrix",
    url: "https://matrix.itasoftware.com",
    category: "flights",
    bestFor: "Advanced routing and fare construction",
    note: "The power-user tool for finding routings the consumer sites hide. It does not book, so you take the itinerary elsewhere.",
    free: true,
  },
  {
    id: "google-hotels",
    name: "Google Hotels",
    url: "https://www.google.com/travel/hotels",
    category: "hotels",
    bestFor: "Cross-site rate comparison",
    note: "Fast way to see the same property's price across booking sites and the hotel direct.",
    free: true,
  },
  {
    id: "booking",
    name: "Booking.com",
    url: "https://www.booking.com",
    category: "hotels",
    bestFor: "Inventory breadth and free cancellation",
    note: "The widest inventory, and the free-cancellation filter lets you hold a room while you keep shopping.",
    free: true,
  },
  {
    id: "hoteltonight",
    name: "HotelTonight",
    url: "https://www.hoteltonight.com",
    category: "hotels",
    bestFor: "Same-day and next-day discounts",
    note: "For when you are flexible on the property and want tonight's unsold rooms at a cut.",
    free: true,
  },
  {
    id: "airbnb",
    name: "Airbnb",
    url: "https://www.airbnb.com",
    category: "hotels",
    bestFor: "Apartments for longer or group stays",
    note: "Best when a kitchen and space matter. Read the all-in total, since cleaning fees swing the value.",
    free: true,
  },
  {
    id: "points-guy",
    name: "The Points Guy valuations",
    url: "https://thepointsguy.com/loyalty-programs/monthly-valuations/",
    category: "points",
    bestFor: "A reference value for every points currency",
    note: "Use it as the baseline your redemption has to beat before you spend points instead of cash.",
    free: true,
  },
  {
    id: "seats-aero",
    name: "seats.aero",
    url: "https://seats.aero",
    category: "points",
    bestFor: "Finding award seats across programs",
    note: "Searches award availability broadly so you can see where your points actually book before you transfer them.",
    free: true,
  },
  {
    id: "rome2rio",
    name: "Rome2Rio",
    url: "https://www.rome2rio.com",
    category: "ground",
    bestFor: "Trains, buses, and flights side by side",
    note: "The fastest way to see every way between two cities and what each one costs and takes.",
    free: true,
  },
  {
    id: "autoslash",
    name: "AutoSlash",
    url: "https://www.autoslash.com",
    category: "ground",
    bestFor: "Rental car price tracking",
    note: "Books a refundable rate and re-checks the price for you, rebooking when it drops.",
    free: true,
  },
  {
    id: "wise",
    name: "Wise",
    url: "https://wise.com",
    category: "ground",
    bestFor: "Low-cost foreign exchange",
    note: "A fee-transparent way to hold and spend other currencies without the airport-kiosk markup.",
    free: true,
  },
];
