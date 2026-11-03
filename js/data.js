/*
 * ALL EDITABLE CONTENT LIVES IN THIS FILE.
 *
 * Product names, print and commission prices, edition size, turnaround,
 * domestic-only shipping, the email and Instagram come from Priya. Anything marked
 * PLACEHOLDER still needs her real value. Search this file for "PLACEHOLDER".
 *
 * Photos: put image files in the images/ folder and set the matching
 * `photo` field below (e.g. photo: "images/martini.jpg"). While a photo is
 * "", the site shows a generated watercolor-style stand-in.
 */

const SITE = {
  name: "Priya Watercolors",
  // Contact links open an email to this address, and the house-portrait
  // form is delivered here by FormSubmit (see OWNER-NOTES.md).
  email: "priyaswatercolors@gmail.com",
  instagram: "https://instagram.com/priyaswatercolors",
  instagramHandle: "@priyaswatercolors",
  portraitPhoto: "", // PLACEHOLDER: photo of Priya, e.g. "images/priya.jpg"

  // F13: commission availability. Set open to false to close the form;
  // set bookedUntil (e.g. "March 1") to show a booked-until notice.
  commissions: {
    open: true,
    bookedUntil: "",
    turnaround: "2 weeks",
  },

  // C3: shipping by region. Priya ships within the US only at launch.
  shipping: {
    domesticOnly: true,
    regions: [
      { id: "us", label: "United States", price: 8 }, // PLACEHOLDER rate
      { id: "intl", label: "International", price: 25 },
    ],
  },
};

// Every print comes in these two sizes, at these prices. Landscape pieces
// print the same sizes turned sideways (7 × 5 and 10 × 8).
const PRINT_SIZES = [
  { id: "5x7", w: 5, h: 7, price: 10 },
  { id: "8x10", w: 8, h: 10, price: 20 },
];

// All commissions are 5 × 7 in originals. A type with one price shows that
// price; a type with min and max shows a range ("depending on detail").
const COMMISSION_SIZE = "5 × 7 in";
const COMMISSION_TYPES = [
  { label: "House", price: 50 },
  { label: "Pet", min: 30, max: 50 },
  { label: "Wedding venue or special place", min: 30, max: 50 },
  { label: "Something else", min: 30, max: 50 },
];

// "Where are you located?" on the house-portrait form. Picking a place with
// dropOff: true asks whether Priya could drop the painting off in person.
const LOCATIONS = [
  { label: "Austin, TX", dropOff: true },
  { label: "Colorado", dropOff: true },
  { label: "Somewhere else in the US", dropOff: false },
];

// Prints of Priya's four originals, a limited run of 6 each (both sizes
// together). Sizes and prices come from PRINT_SIZES above.
const PRODUCTS = [
  {
    slug: "martini",
    title: "Martini",
    subject: "martini",
    orientation: "portrait",
    edition: 6,
    stock: 6,
    added: "2026-10-30",
    featured: true,
    palette: ["#dfe8ec", "#b8cdd6", "#6f9a4f", "#8a96a3"],
    alt: "Watercolor of a martini glass with a green olive on a pick",
    story: "A very cold martini, two olives' worth of green, and a lot of glassy blue. [Placeholder story. Priya to replace.]",
    photo: "", // PLACEHOLDER: e.g. "images/martini.jpg"
    photoDetail: "", // optional close-up photo
  },
  {
    slug: "flatiron",
    title: "Flatiron",
    subject: "flatiron",
    orientation: "portrait",
    edition: 6,
    stock: 6,
    added: "2026-10-24",
    palette: ["#f1dcc4", "#d9a47c", "#a86a4a", "#5a4b46"],
    alt: "Watercolor of the Flatiron Building's narrow prow in warm terracotta tones",
    story: "The Flatiron's narrow prow catching the late afternoon light. [Placeholder story. Priya to replace.]",
    photo: "", // PLACEHOLDER: e.g. "images/flatiron.jpg"
    photoDetail: "", // optional close-up photo
  },
  {
    slug: "texas-stadium",
    title: "Texas Stadium",
    subject: "stadium",
    orientation: "landscape",
    edition: 6,
    stock: 6,
    added: "2026-10-18",
    palette: ["#cfe0f2", "#b9a48f", "#5f9a52", "#bf3a3a"],
    alt: "Watercolor of a Texas football stadium bowl seen from above with a green field",
    story: "Game day from the top row: the bowl, the bright green field and a big Texas sky. [Placeholder story. Priya to replace.]",
    photo: "", // PLACEHOLDER: e.g. "images/texas-stadium.jpg"
    photoDetail: "", // optional close-up photo
  },
  {
    slug: "oysters",
    title: "Oysters",
    subject: "oysters",
    orientation: "landscape",
    edition: 6,
    stock: 6,
    added: "2026-10-10",
    palette: ["#e6eef2", "#a7a29a", "#efe3d2", "#f2d15c"],
    alt: "Watercolor of half a dozen oysters on ice with a lemon wedge",
    story: "Half a dozen on ice with a squeeze of lemon. [Placeholder story. Priya to replace.]",
    photo: "", // PLACEHOLDER: e.g. "images/oysters.jpg"
    photoDetail: "", // optional close-up photo
  },
];

// Shared print details. PLACEHOLDER: Priya to confirm paper and printing.
const PRINT_DETAILS = {
  medium: "Giclée print of the original watercolor",
  paper: "Archival matte fine-art paper",
  framing: "Unframed, ships flat in a protective sleeve",
  year: 2026,
};

// Past house commissions shown as examples (5 × 7 originals). PLACEHOLDER: real ones need
// clients' permission; add a photo: "images/..." to each.
const COMMISSION_EXAMPLES = [
  { slug: "ex-maple", title: "The house on Maple Street", w: 5, h: 7, subject: "house", palette: ["#e8f0f4", "#f2e6d0", "#b5523b", "#5f8a55"], photo: "" },
  { slug: "ex-bungalow", title: "A blue bungalow", w: 5, h: 7, subject: "house", palette: ["#f4ecd8", "#a8c1dc", "#4f5d75", "#7aa060"], photo: "" },
  { slug: "ex-farmhouse", title: "The family farmhouse", w: 5, h: 7, subject: "house", palette: ["#eef3e6", "#fbfaf5", "#8a3f35", "#6c8f4d"], photo: "" },
  { slug: "ex-brownstone", title: "A first home", w: 5, h: 7, subject: "house", palette: ["#efe4dc", "#c9876b", "#3d4a5c", "#7f9a5d"], photo: "" },
];
