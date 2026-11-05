/**
 * Priya's Watercolors: print orders and commission requests -> Google Sheet + email.
 *
 * Lives inside Priya's "Priya's Watercolors orders" Google Sheet (Extensions >
 * Apps Script) and is deployed as a web app. The website POSTs each print
 * order (kind: "order") and commission request (kind: "commission") here as JSON.
 *
 * Print orders: adds a row to the "Orders" tab and emails NOTIFY_EMAIL
 * ("New order PW-4821 — $30"). Buyers pay by Venmo or Zelle afterwards.
 *
 * Commission requests:
 *   1. saves the reference photos to a private Google Drive folder,
 *   2. adds a row to the "Requests" tab (with a Status column to track),
 *   3. emails NOTIFY_EMAIL the full request with the photos attached.
 *
 * Setup steps are in OWNER-NOTES.md. After changing this file, redeploy:
 * Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
 */

const NOTIFY_EMAIL = "priyaswatercolors@gmail.com";
const SHEET_NAME = "Requests";
const ORDERS_SHEET = "Orders";
const ORDER_STATUSES = ["New", "Paid", "Shipped / dropped off", "Cancelled"];
const PHOTO_FOLDER = "Priya's Watercolors - commission photos";
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // all photos together, matches the website
const STATUSES = ["New", "Price confirmed", "Painting", "Finished", "Paid", "Shipped / delivered", "Declined"];

// Sheet columns: [header, key in the request]. Status and Notes are Priya's.
const COLUMNS = [
  ["Received", "_received"],
  ["Status", "_status"],
  ["Name", "name"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["Commission", "type"],
  ["Listed price", "price"],
  ["Size", "size"],
  ["Description", "description"],
  ["House address", "address"],
  ["Located in", "location"],
  ["Open to drop-off", "dropOff"],
  ["Needed by", "neededBy"],
  ["Gift or occasion", "gift"],
  ["May share finished piece", "sharePublicly"],
  ["Photos", "_photos"],
  ["Notes", "_notes"],
];

// Orders tab columns, same idea as COLUMNS below.
const ORDER_COLUMNS = [
  ["Received", "_received"],
  ["Status", "_status"],
  ["Order code", "code"],
  ["Total", "total"],
  ["Name", "name"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["Items", "itemsText"],
  ["Subtotal", "subtotal"],
  ["Delivery cost", "shipping"],
  ["Delivery", "delivery"],
  ["Shipping address", "address"],
  ["Buyer's notes", "notes"],
  ["Notes", "_notes"],
];

/** Run once from the editor (Run > setup) to create the Orders and Requests tabs. */
function setup() {
  getSheet_(ORDERS_SHEET, ORDER_COLUMNS, ORDER_STATUSES);
  const sheet = getSheet_(SHEET_NAME, COLUMNS, STATUSES);
  sheet.getParent().setActiveSheet(sheet);
}

/** Opening the web app URL in a browser shows this, which is handy for checking the deployment. */
function doGet() {
  return json_({ ok: true, message: "Priya's Watercolors order and commission forms are connected." });
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Hidden field that only spam bots fill in: pretend it worked, do nothing.
    if (req.honey) return json_({ ok: true });

    const isOrder = req.kind === "order";
    const problem = isOrder ? validateOrder_(req) : validate_(req);
    if (problem) return json_({ ok: false, error: problem });

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const received = new Date();
      if (isOrder) {
        appendOrder_(req, received);
        sendOrderEmail_(req, received);
        return json_({ ok: true });
      }
      const blobs = photoBlobs_(req.photos || []);
      const folder = savePhotos_(blobs, received, req.name);
      appendRow_(req, received, folder);
      sendEmail_(req, received, blobs, folder);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "Something went wrong saving your request." });
  }
}

function validate_(req) {
  if (!str_(req.name)) return "Missing name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str_(req.email))) return "Missing or invalid email.";
  if (!str_(req.description)) return "Missing description.";
  const photos = req.photos || [];
  if (!photos.length) return "Missing photos.";
  if (photos.length > MAX_PHOTOS) return "Too many photos.";
  const bytes = photos.reduce((n, p) => n + Math.floor(String(p.data || "").length * 0.75), 0);
  if (bytes > MAX_PHOTO_BYTES * 1.05) return "Photos are too large.";
  return "";
}

function validateOrder_(req) {
  if (!/^PW-\d{4}$/.test(str_(req.code))) return "Missing order code.";
  if (!str_(req.name)) return "Missing name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str_(req.email))) return "Missing or invalid email.";
  if (!Array.isArray(req.items) || !req.items.length) return "The order has no items.";
  if (!str_(req.delivery)) return "Missing delivery method.";
  if (/^Ship/.test(str_(req.delivery)) && !str_(req.address)) return "Missing shipping address.";
  return "";
}

function appendOrder_(req, received) {
  const sheet = getSheet_(ORDERS_SHEET, ORDER_COLUMNS, ORDER_STATUSES);
  sheet.appendRow(
    ORDER_COLUMNS.map(([, key]) => {
      if (key === "_received") return received;
      if (key === "_status") return "New";
      if (key === "_notes") return "";
      return cell_(req[key]);
    })
  );
}

function sendOrderEmail_(req, received) {
  const items = req.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 12px 4px 0">${esc_(i.title)}, ${esc_(i.size)}</td><td style="padding:4px 12px">× ${esc_(i.qty)}</td><td align="right" style="padding:4px 0">$${esc_(i.lineTotal)}</td></tr>`
    )
    .join("");
  const row = (label, v) =>
    str_(v)
      ? `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0;color:#555">${esc_(label)}</th><td style="padding:4px 0;white-space:pre-wrap">${esc_(str_(v))}</td></tr>`
      : "";
  const html =
    `<p>New print order <strong>${esc_(req.code)}</strong> from the website, received ${esc_(received.toLocaleString())}. ` +
    `The buyer was asked to pay <strong>${esc_(req.total)}</strong> by Venmo or Zelle with ${esc_(req.code)} in the payment note.</p>` +
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${items}` +
    `<tr><td style="padding:4px 12px 4px 0">${esc_(req.delivery)}</td><td></td><td align="right">${esc_(req.shipping)}</td></tr>` +
    `<tr><th align="left" style="padding:8px 12px 4px 0">Total</th><td></td><th align="right">${esc_(req.total)}</th></tr></table>` +
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-top:16px">` +
    row("Name", req.name) + row("Email", req.email) + row("Phone", req.phone) +
    row("Delivery", req.delivery) + row("Shipping address", req.address) + row("Buyer's notes", req.notes) +
    `</table><p>Reply to this email to reach ${esc_(str_(req.name))} directly.</p>`;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New order ${str_(req.code)} — ${str_(req.total)}`,
    htmlBody: html,
    replyTo: str_(req.email),
    name: "Priya's Watercolors website",
  });
}

function photoBlobs_(photos) {
  return photos.map((p) =>
    Utilities.newBlob(Utilities.base64Decode(p.data), p.type || "application/octet-stream", safeName_(p.name))
  );
}

function savePhotos_(blobs, received, name) {
  const root = folderNamed_(PHOTO_FOLDER, DriveApp.getRootFolder());
  const stamp = Utilities.formatDate(received, Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
  const folder = root.createFolder(`${stamp} ${safeName_(name)}`);
  blobs.forEach((b) => folder.createFile(b));
  return folder;
}

function appendRow_(req, received, folder) {
  const sheet = getSheet_(SHEET_NAME, COLUMNS, STATUSES);
  const row = COLUMNS.map(([, key]) => {
    if (key === "_received") return received;
    if (key === "_status") return "New";
    if (key === "_photos") return folder.getUrl();
    if (key === "_notes") return "";
    if (key === "sharePublicly") return req.sharePublicly ? "Yes" : "No";
    return cell_(req[key]);
  });
  sheet.appendRow(row);
}

function sendEmail_(req, received, blobs, folder) {
  const rows = COLUMNS.filter(([, key]) => !key.startsWith("_"))
    .map(([label, key]) => {
      const v = key === "sharePublicly" ? (req.sharePublicly ? "Yes" : "No") : str_(req[key]);
      return v
        ? `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0;color:#555">${esc_(label)}</th><td style="padding:4px 0;white-space:pre-wrap">${esc_(v)}</td></tr>`
        : "";
    })
    .join("");
  const html =
    `<p>New commission request from the website, received ${esc_(received.toLocaleString())}.</p>` +
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table>` +
    `<p>Photos are attached and saved in <a href="${folder.getUrl()}">Google Drive</a>. ` +
    `Reply to this email to answer ${esc_(str_(req.name))} directly.</p>`;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New commission request: ${str_(req.type) || "Commission"} from ${str_(req.name)}`,
    htmlBody: html,
    replyTo: str_(req.email),
    name: "Priya's Watercolors website",
    attachments: blobs,
  });
}

function getSheet_(name, columns, statuses) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(columns.map(([header]) => header));
    sheet.getRange(1, 1, 1, columns.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    const statusCol = columns.findIndex(([, key]) => key === "_status") + 1;
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(statuses, true).build();
    sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  }
  return sheet;
}

function folderNamed_(name, parent) {
  const found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

const str_ = (v) => (v == null ? "" : String(v).trim());
// A leading = + - @ would make the sheet treat customer text as a formula.
const cell_ = (v) => str_(v).replace(/^[=+\-@]/, "'$&");
const esc_ = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const safeName_ = (s) => str_(s).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80) || "request";
