# Priya Watercolors

Website for Priya Watercolors: limited-run prints of four watercolors and 5 × 7
original commissions. It is a static site (HTML, CSS and plain JavaScript) with no build step
and no dependencies.

For day-to-day changes such as prices, photos and opening or closing commissions, see
**[OWNER-NOTES.md](OWNER-NOTES.md)**.

## Run it locally

```sh
python3 -m http.server 8765
```

Then open http://localhost:8765.

## What's real and what's simulated

| Part | Status |
| --- | --- |
| Commission request form | **Real.** Delivered by [FormSubmit](https://formsubmit.co) to priyaswatercolors@gmail.com with the photos attached. Needs a one-time activation (see owner notes). |
| Contact | **Real.** "Contact" and footer links open an email to priyaswatercolors@gmail.com. |
| Shop, cart and checkout | **Simulated.** "Simulate a successful order" only reduces stock in the visitor's own browser. Real payments need a hosted checkout (for example Shopify, per the PRD). |
| Artwork and prices | **Placeholders**, all in `js/data.js`. |

## Decisions from Priya

- **Shop:** prints of Martini, Flatiron, Texas Stadium and Oysters, 6 of each (both sizes
  together). Every print comes in 5 × 7 ($10) or 8 × 10 ($20).
- **Commissions:** 5 × 7 originals only. Houses $50; pets, places and everything else
  $30–$50 depending on detail. Ready about 2 weeks after the form is sent, no deposit.
- **Local drop-off:** the form asks where the buyer is located. For Austin or Colorado it
  also asks whether they'd be open to Priya dropping the painting off in person.
- **Shipping:** US only. **Instagram:** @priyaswatercolors.
- **Look:** red gingham. The check color is one token, `--gingham`, in `css/styles.css`.

## Files

| Path | What it is |
| --- | --- |
| `js/data.js` | All editable content: print sizes and prices, commission types and prices, stock, photos, email, turnaround, shipping |
| `js/app.js` | Shared header and footer, shop, cart, commission form and its FormSubmit delivery |
| `css/styles.css` | Styles, including the gingham patterns |
| `images/` | Real photos go here (see `images/README.md`) |
| `index.html` | Home |
| `shop.html`, `product.html?p=<slug>` | Print grid and print detail (photos, zoom, in-a-room view) |
| `cart.html`, `order-confirmed.html` | Cart and the simulated checkout |
| `commissions.html`, `commission-thanks.html` | Commissions, request form and confirmation |
| `about.html`, `faq.html` | About Priya; FAQ and policies |

Each HTML page includes the shared header and footer through `js/app.js`, so the
navigation only needs editing in one place (`NAV` in `js/app.js`).
