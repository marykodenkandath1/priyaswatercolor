# Owner's notes

Plain-language notes for keeping the site up to date. Almost everything lives in one file,
**`js/data.js`**. Search it for `PLACEHOLDER` to find every value that still needs a real one.

## How print orders and payment work

Buyers add prints to the cart and place an order on the checkout page (no payment there).
They get an order number like **PW-4821**, Priya's Venmo (@Pkodenkandath) and Zelle
(508-333-4830) details and a **Pay on Venmo** button, and are asked to put the number in
the payment note. Priya gets an email "New order PW-4821 — $28" and a row in the
**Orders** tab of her sheet.

For each order:

1. Wait for the Venmo or Zelle payment with that number. Set the row's Status to **Paid**.
2. Ship it (or email the buyer to arrange local drop-off), then set **Shipped / dropped off**.
3. Lower that print's `stock` in `js/data.js` so the site shows the right number left.
   The site can't do this automatically, because payment happens on Venmo or Zelle.
   Unpaid orders don't hold stock, so check `stock` before confirming a last print.

The Venmo link is `VENMO_URL` and the Venmo and Zelle details shown to buyers are
`PAYMENT`, both in `js/data.js`. The FAQ and commissions pages also mention them in words.
The shipping price and drop-off places are in
`SITE.delivery`.

## Connect the order and commission forms to Google (one time, about 10 minutes)

Print orders and commission requests both go to a small Google script that runs in
Priya's Google account. For each **order** it adds a row to the **Orders** tab and emails
her. For each **commission request** it:

- adds a row to the **Requests** tab, with a **Status** column (New, Price confirmed, Painting,
  Finished, Paid, Shipped / delivered, Declined) and a **Notes** column for Priya;
- saves the reference photos to a private Google Drive folder, "Priya's Watercolors -
  commission photos", and links it from the row;
- emails priyaswatercolors@gmail.com the full request with the photos attached. Replying
  to that email goes straight to the customer.

Until this is set up, both forms show "Sorry, that didn't send" with Priya's email
address, so nothing is lost silently.

**Steps** (signed in as priyaswatercolors@gmail.com):

1. Go to [sheets.new](https://sheets.new) to create a blank Google Sheet. Name it
   **Priya's Watercolors orders**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the sample code in `Code.gs`, paste in everything from
   `google-apps-script/Code.gs` in this repo, and click **Save** (the disk icon).
4. In the function menu next to **Run**, choose **setup**, then click **Run**. Google asks
   for permission:
   - **Review permissions** → choose priyaswatercolors@gmail.com.
   - "Google hasn't verified this app" is expected, because it's your own script. Click
     **Advanced → Go to (project name) (unsafe)** → **Allow**.
   - The script asks to manage your spreadsheets, Drive files and send email as you,
     which is exactly what it does.

   Back in the sheet, **Orders** and **Requests** tabs now have their column headers.
5. Click **Deploy → New deployment**. Click the gear next to "Select type" and choose
   **Web app**. Set:
   - Description: `Commission form`
   - Execute as: **Me (priyaswatercolors@gmail.com)**
   - Who has access: **Anyone** (so website visitors can send requests; they can't see
     the sheet)

   Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
6. Open the URL in a browser tab. It should say "Priya's Watercolors commission form is
   connected."
7. Put the URL into `js/data.js` as `formUrl: "https://script.google.com/.../exec",`,
   then commit and push. Or paste it to Claude and it will do this for you.
8. From the live site, place one test order and send one test commission request.
   Check both tabs, the Drive folder and the two emails.

**If you change `Code.gs` later**, paste the new version and redeploy: **Deploy → Manage
deployments → pencil icon → Version: New version → Deploy**. The URL stays the same.

Good to know:

- Photos can add up to **10 MB in total** per request. The form enforces this and tells
  people when a photo is too big.
- A free Google account can send about 100 emails a day from scripts, far more than
  needed.
- To stop the form, set `SITE.commissions.open: false` in `js/data.js`. To fully
  disconnect, Deploy → Manage deployments → Archive.

## Common changes

| To change | Edit in `js/data.js` |
| --- | --- |
| Print sizes or prices (shared by every print) | `PRINT_SIZES` |
| A print's title, story or photo | that print in `PRODUCTS` |
| How many of a print are left | `stock` on that print (lower it as orders are paid) |
| Venmo link, Venmo and Zelle details | `VENMO_URL`, `PAYMENT` |
| Shipping price or drop-off places | `SITE.delivery` |
| Commission types or prices | `COMMISSION_TYPES` (and `COMMISSION_SIZE`) |
| Drop-off locations | `LOCATIONS` (`dropOff: true` shows the drop-off question) |
| Turnaround time | `SITE.commissions.turnaround` |
| Pause commissions | `SITE.commissions.open: false` |
| Show "booked until" | `SITE.commissions.bookedUntil: "March 1"` |
| Email or Instagram | `SITE.email`, `SITE.instagram`, `SITE.instagramHandle` |

The written copy on each page (FAQ answers, About text and so on) is in that page's
`.html` file. The FAQ, the home page and the commissions page description also mention
the prices in words, so update those too if prices change.

## Analytics

The live site counts page views with Vercel Web Analytics, which uses no cookies. See the
numbers in the Vercel dashboard: project **priyas-watercolors** > **Analytics**.

## Adding real photos

Drop the files into `images/` and set the matching `photo` field in `js/data.js`.
Details are in `images/README.md`.

## Before launch

- Replace every `PLACEHOLDER` in `js/data.js`.
