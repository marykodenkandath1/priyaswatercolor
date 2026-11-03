# Owner's notes

Plain-language notes for keeping the site up to date. Almost everything lives in one file,
**`js/data.js`**. Search it for `PLACEHOLDER` to find every value that still needs a real one.

## Turn on the house-portrait form (one time)

The request form is emailed to **priyaswatercolors@gmail.com** by FormSubmit, a free
service. Nothing needs to run on a server.

1. Once the site is online, send one test request through the form yourself.
2. FormSubmit emails priyaswatercolors@gmail.com an **activation** message. Check the spam
   folder too. Click the button in it.
3. Every request after that arrives as an email titled "New house portrait request", with
   the reference photos attached. Reply to it directly to answer the customer.

Good to know:

- Customers may see a quick "I'm not a robot" check after pressing Send. That is
  FormSubmit's spam protection.
- Photos can add up to **10 MB in total** per request (FormSubmit's limit). The form
  enforces this and tells people when a photo is too big.
- Optional: after activation, FormSubmit offers a random address (like
  `formsubmit.co/abc123...`) that hides the Gmail address from the page's code. To use it,
  replace `SITE.email` in the `form.action` line of `js/app.js`.

## Common changes

| To change | Edit in `js/data.js` |
| --- | --- |
| A print's price, size or story | that print in `PRODUCTS` |
| How many of a print are left | `stock` on that print |
| House-portrait sizes or prices | `COMMISSION_PRICING` (and `COMMISSION_MAX_SIZE`) |
| Drop-off locations | `LOCATIONS` (`dropOff: true` shows the drop-off question) |
| Turnaround time | `SITE.commissions.turnaround` |
| Pause commissions | `SITE.commissions.open: false` |
| Show "booked until" | `SITE.commissions.bookedUntil: "March 1"` |
| Shipping rate | `SITE.shipping` |
| Email or Instagram | `SITE.email`, `SITE.instagram`, `SITE.instagramHandle` |

The written copy on each page (FAQ answers, About text and so on) is in that page's
`.html` file.

## Adding real photos

Drop the files into `images/` and set the matching `photo` field in `js/data.js`.
Details are in `images/README.md`.

## Before launch

- Replace every `PLACEHOLDER` in `js/data.js` and the bracketed "[Placeholder ...]" notes
  in the HTML pages.
- Remove the "Prototype" bar at the top of the site (in `renderChrome`, `js/app.js`).
- Shop checkout is still simulated. Selling prints for real needs a hosted checkout such as
  Shopify; the PRD recommends building the shop there.
