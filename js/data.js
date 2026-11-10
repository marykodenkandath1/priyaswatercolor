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
  name: "Priya's Watercolors",
  // Contact links open an email to this address.
  email: "priyaswatercolors@gmail.com",
  phone: "508-333-4830", // shown in the footer
  phoneLink: "+15083334830",
  // Web app URL of the Google Apps Script that saves print orders and
  // commission requests to Priya's Google Sheet and emails them to her.
  // Setup: OWNER-NOTES.md.
  formUrl: "https://script.google.com/macros/s/AKfycbxMdXYCGf-Su5s17pScjuuegLK9lAWmhvuN2qwg06BbBO_n4A-Jc50BxbCMAXUjWyEK/exec",
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

  // Delivery choices at checkout. Shipping is US only; local drop-off is
  // free in the places Priya visits.
  delivery: {
    shipPrice: 2, // flat rate per order
    dropOffPlaces: ["Austin, TX", "Colorado"],
  },
};

// Buyers pay by Venmo or Zelle after placing an order (prints) or once
// Priya sends a photo of the finished painting (commissions).
const VENMO_URL = "https://venmo.com/u/Pkodenkandath";
const PAYMENT = { venmo: "@Pkodenkandath", zelle: "508-333-4830" };

// Every print comes in these two sizes, at these prices. Landscape pieces
// print the same sizes turned sideways (7 × 5 and 10 × 8).
const PRINT_SIZES = [
  { id: "5x7", w: 5, h: 7, price: 8 },
  { id: "8x10", w: 8, h: 10, price: 18 },
];

// All commissions are 5 × 7 in originals. A type with one price shows that
// price; a type with min and max shows a range ("depending on detail").
const COMMISSION_SIZE = "5 × 7 in";
const COMMISSION_TYPES = [
  { label: "House", min: 20, max: 50 },
  { label: "Custom birthday/greeting card", min: 10, max: 20 },
  { label: "Something else", min: 10, max: 50 },
];

// "Where are you located?" on the house-portrait form. Picking a place with
// dropOff: true asks whether Priya could drop the painting off in person.
const LOCATIONS = [
  { label: "Austin, TX", dropOff: true },
  { label: "Colorado", dropOff: true },
  { label: "Somewhere else in the US", dropOff: false },
];

// Prints of Priya's originals, a limited run of 6 each (both sizes
// together). Sizes and prices come from PRINT_SIZES above. Orders are paid
// by Venmo or Zelle, so lower a print's `stock` by hand as orders come in (0 = sold out).
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
    alt: "Watercolor of a martini glass with three green olives on a pick",
    story: "Everyone's favorite drink!",
    photo: "images/martini.jpg",
  },
  {
    slug: "flatirons",
    oldSlugs: ["flatiron"], // old links still work
    title: "Flatirons",
    subject: "flatiron",
    orientation: "portrait",
    edition: 6,
    stock: 6,
    added: "2026-10-24",
    palette: ["#f1dcc4", "#d9a47c", "#a86a4a", "#5a4b46"],
    alt: "Watercolor of the Flatirons rock formations above Boulder, Colorado, in soft greens and purples",
    story: "What makes Boulder Boulder!",
    photo: "images/flatirons.jpg",
  },
  {
    slug: "ut-stadium",
    oldSlugs: ["texas-stadium"], // old links still work
    title: "UT Stadium",
    subject: "stadium",
    orientation: "landscape",
    edition: 6,
    stock: 6,
    added: "2026-10-18",
    palette: ["#cfe0f2", "#b9a48f", "#5f9a52", "#bf3a3a"],
    alt: "Watercolor of the UT football stadium seen from above, with a burnt orange Longhorn logo at midfield",
    story: "Hook 'em Horns!",
    photo: "images/ut-stadium.jpg",
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
    alt: "Watercolor of three open oyster shells with blue-tinged insides",
    story: "The world is your ____!",
    photo: "images/oysters.jpg",
  },
  // The two below were added last; their earlier `added` dates keep them after
  // the first four in the "Newest" order.
  {
    slug: "austin-motel",
    title: "Austin Motel",
    subject: "sign",
    orientation: "portrait",
    edition: 6,
    stock: 6,
    added: "2026-10-05",
    palette: ["#eef1ec", "#9fb46a", "#d93a33", "#c9a27e"],
    alt: "Watercolor of the red Austin Motel sign with trees behind it",
    story: "Austin's most iconic hotel.",
    photo: "images/austin-motel.jpg",
  },
  {
    slug: "de-nada",
    title: "De Nada",
    subject: "drinks",
    orientation: "portrait",
    edition: 6,
    stock: 6,
    added: "2026-10-04",
    palette: ["#fbf3f4", "#f2a7bd", "#e0457b", "#b9cf8f"],
    alt: "Watercolor of two pink frozen drinks with straws and lime wedges, one cup reading De Nada",
    story: "drink for a good time!",
    photo: "images/de-nada.jpg",
  },
];

// Shared print details.
const PRINT_DETAILS = {
  framing: "Unframed, ships flat in a protective sleeve",
  year: 2026,
};

// "Previous work" gallery wall on the Commissions page (and the two small
// pictures in the homepage Commissions section, which use the first two).
//
// TO ADD A PHOTO: put the file in images/work/ and add a line below, e.g.
//   { src: "images/work/smith-house.jpg", title: "The Smith house", shape: "portrait" },
// Only `src` and `shape` are needed. The list order is the wall order.
//
//   shape  "portrait" (3:4), "landscape" (4:3), "square", "round" (circle) or
//          "oval" (upright oval). The photo is cropped to this shape.
//   ratio  optional exact width ÷ height of the painting, e.g. 5 / 7 for a 5 × 7.
//   focus  optional point to keep in view when cropping, "x% y%" (default
//          "50% 50%"). Lower y moves the crop up, e.g. "50% 35%".
//   zoom   optional, e.g. 1.15 zooms in 15% to cut a table or background out
//          of a phone photo.
//   size   optional "lg", "md" or "sm". Left out, sizes rotate so big and
//          small pieces are spread across the wall.
//   title  optional name, read out by screen readers (no caption is shown).
//   frame  optional "navy" or "pink". Left out, the frame colors alternate.
//
// Photos are Priya's phone shots, cropped and straightened to just the paper
// (originals are in the pastcommissions/ folder, which isn't published).
const PREVIOUS_WORK = [
  { src: "images/work/yellow-house.jpg", title: "House in the trees", shape: "landscape", ratio: 1599 / 1028, size: "lg" },
  { src: "images/work/starfish.jpg", title: "Starfish", shape: "portrait", ratio: 1203 / 1600, size: "sm" },
  { src: "images/work/aperol.jpg", title: "Aperol", shape: "portrait", ratio: 609 / 876, size: "md" },
  { src: "images/work/taxi.jpg", title: "Taxi", shape: "landscape", ratio: 953 / 685, size: "sm" },
  { src: "images/work/oldwell.jpg", title: "The Old Well", shape: "portrait", ratio: 1207 / 1600, size: "md" },
  { src: "images/work/gray-house.jpg", title: "Gray house", shape: "landscape", ratio: 1601 / 1179, size: "lg" },
  { src: "images/work/ballet.jpg", title: "Ballet slippers", shape: "portrait", ratio: 1109 / 1203, size: "md" },
  { src: "images/work/birthday-cards.jpg", title: "Birthday cards", shape: "portrait", ratio: 933 / 1109, size: "sm" },
  { src: "images/work/sea-turtle.jpg", title: "Sea turtle", shape: "square", focus: "50% 45%", size: "sm" },
  { src: "images/work/white-house.jpg", title: "Colonial house", shape: "landscape", ratio: 1225 / 942, size: "md" },
];
