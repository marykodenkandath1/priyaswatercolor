# Priya's Watercolors

Website for Priya's Watercolors: limited-run prints of four watercolors and 5 × 7
original commissions. It is a static site (HTML, CSS and plain JavaScript) with no build step
and no dependencies.

For day-to-day changes such as prices, photos and opening or closing commissions, see
**[OWNER-NOTES.md](OWNER-NOTES.md)**.

## Run it locally

```sh
python3 -m http.server 8765
```

Then open http://localhost:8765.

## How it works

| Part | Status |
| --- | --- |
| Print orders | **Real once connected.** The cart is kept in the buyer's browser. Checkout is an order form (details plus shipping or local drop-off) that sends the order to Priya's Google script, which adds it to the Orders tab and emails her. The buyer then pays on Venmo with their order code. No payment processor. |
| Commission request form | **Real once connected.** Sent to the same Google Apps Script (`google-apps-script/Code.gs`) in Priya's account, which adds a row to her Google Sheet, saves the photos to her Drive and emails her the request. Needs a one-time setup (see owner notes). |
| Contact | **Real.** "Contact" and footer links open an email to priyaswatercolors@gmail.com. |
| Artwork and prices | **Placeholders**, all in `js/data.js`. |

## Decisions from Priya

- **Shop:** prints of Martini, Flatiron, Texas Stadium and Oysters, 6 of each (both sizes
  together). Every print comes in 5 × 7 ($10) or 8 × 10 ($20).
- **Commissions:** 5 × 7 originals only, $30–$50 depending on detail (house, wedding
  venue or special place, something else). Ready about 2 weeks after the form is sent, no deposit.
- **Local drop-off:** the form asks where the buyer is located. For Austin or Colorado it
  also asks whether they'd be open to Priya dropping the painting off in person.
- **Shipping:** US only. **Instagram:** @priyaswatercolors.
- **Look:** red gingham. The check color is one token, `--gingham`, in `css/styles.css`.

## Files

| Path | What it is |
| --- | --- |
| `js/data.js` | All editable content: print sizes and prices, commission types and prices, stock, photos, email, turnaround, shipping |
| `js/app.js` | Shared header and footer, shop, cart, commission form and sending it |
| `google-apps-script/Code.gs` | Runs in Priya's Google Sheet: saves orders and commission requests (with photos) and emails her |
| `css/styles.css` | Styles, including the gingham patterns |
| `images/` | Real photos go here (see `images/README.md`) |
| `index.html` | Home |
| `shop.html`, `product.html?p=<slug>` | Print grid and print detail (photos, zoom, in-a-room view) |
| `cart.html`, `checkout.html`, `order-confirmed.html` | Cart, order form, and order code with the Pay on Venmo button |
| `commissions.html`, `commission-thanks.html` | Commissions, request form and confirmation |
| `about.html`, `faq.html` | About Priya; FAQ and policies |

Each HTML page includes the shared header and footer through `js/app.js`, so the
navigation only needs editing in one place (`NAV` in `js/app.js`).
