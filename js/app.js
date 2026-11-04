/*
 * Priya Watercolors prototype: shared header/footer, placeholder artwork,
 * stock and cart, and the per-page behavior selected by <body data-page="...">.
 */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const money = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const cm = (inches) => (Math.round(inches * 2.54 * 10) / 10).toString();

  // Prints: every piece comes in the PRINT_SIZES, turned sideways for landscape work.
  // p.w / p.h give the artwork's shape for the images (examples set them directly).
  PRODUCTS.forEach((p) => Object.assign(p, p.orientation === "landscape" ? { w: 10, h: 8 } : { w: 8, h: 10 }));
  const findSize = (id) => PRINT_SIZES.find((s) => s.id === id);
  const printDims = (p, s) => (p.orientation === "landscape" ? { w: s.h, h: s.w } : { w: s.w, h: s.h });
  const sizeLabel = (p, s) => { const d = printDims(p, s); return `${d.w} × ${d.h} in`; };
  const sizeLabelFull = (p, s) => { const d = printDims(p, s); return `${d.w} × ${d.h} in (${cm(d.w)} × ${cm(d.h)} cm)`; };
  const sizesLabel = (p) => PRINT_SIZES.map((s) => sizeLabel(p, s).replace(" in", "")).join(" or ") + " in";
  const prices = PRINT_SIZES.map((s) => s.price);
  const printPriceRange = `${money(Math.min(...prices))}–${money(Math.max(...prices))}`;
  const commissionPrice = (t) => (t.price ? money(t.price) : `${money(t.min)}–${money(t.max)}`);

  // Browser storage is a convenience only; every read/write tolerates failure.
  function storage(kind) {
    return {
      get(key, fallback) {
        try {
          const v = window[kind].getItem(key);
          return v ? JSON.parse(v) : fallback;
        } catch (e) {
          return fallback;
        }
      },
      set(key, value) {
        try {
          window[kind].setItem(key, JSON.stringify(value));
        } catch (e) {
          /* storage unavailable */
        }
      },
    };
  }
  const local = storage("localStorage");
  const session = storage("sessionStorage");

  /* ---------------------------------------------------------------- *
   * Stock and cart
   * ---------------------------------------------------------------- */

  const findProduct = (slug) => PRODUCTS.find((p) => p.slug === slug);

  // Priya lowers `stock` in data.js as Venmo orders come in.
  const inStock = (p) => Math.max(0, p.stock);
  const isSoldOut = (p) => inStock(p) === 0;

  // Cart lines are keyed "slug|size"; both sizes of a piece share its stock.
  const lineKey = (slug, sizeId) => `${slug}|${sizeId}`;
  const parseKey = (key) => {
    const [slug, sizeId] = key.split("|");
    return { key, p: findProduct(slug), size: findSize(sizeId) };
  };

  const cart = {
    // { "slug|size": quantity }, clamped so each piece stays within its stock.
    lines() {
      const raw = local.get("pw-cart-lines", {});
      const lines = {};
      const used = {};
      Object.keys(raw).forEach((key) => {
        const { p, size } = parseKey(key);
        if (!p || !size) return;
        const qty = Math.min(raw[key], inStock(p) - (used[p.slug] || 0));
        if (qty > 0) {
          lines[key] = qty;
          used[p.slug] = (used[p.slug] || 0) + qty;
        }
      });
      return lines;
    },
    items() {
      const lines = this.lines();
      return Object.keys(lines).map((key) => ({ ...parseKey(key), qty: lines[key] }));
    },
    qty(key) {
      return this.lines()[key] || 0;
    },
    // How many of a piece are in the cart, across both sizes.
    qtyOf(slug) {
      return this.items().filter((i) => i.p.slug === slug).reduce((n, i) => n + i.qty, 0);
    },
    count() {
      return Object.values(this.lines()).reduce((a, b) => a + b, 0);
    },
    set(key, qty) {
      const lines = this.lines();
      delete lines[key];
      const { p } = parseKey(key);
      const room = inStock(p) - Object.keys(lines).filter((k) => k.startsWith(p.slug + "|")).reduce((n, k) => n + lines[k], 0);
      if (qty > 0 && room > 0) lines[key] = Math.min(qty, room);
      local.set("pw-cart-lines", lines);
      updateCartCount();
    },
    clear() {
      local.set("pw-cart-lines", {});
      updateCartCount();
    },
  };

  function updateCartCount() {
    const n = cart.count();
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $$("[data-cart-link]").forEach((el) =>
      el.setAttribute("aria-label", `Cart, ${n} ${n === 1 ? "item" : "items"}`)
    );
  }

  function stockLabel(p) {
    const left = inStock(p);
    if (left === 0) return "Sold out";
    if (left <= 3) return `Only ${left} left`;
    return `${left} of ${p.edition} left`;
  }

  /* ---------------------------------------------------------------- *
   * Placeholder artwork: watercolor-style SVGs generated per piece so
   * the prototype has believable images until real photos arrive.
   * ---------------------------------------------------------------- */

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function artSVG(p, view) {
    const seed = hash(p.slug);
    const r = rng(seed);
    const W = 1000;
    const H = Math.round((1000 * p.h) / p.w);
    const c = p.palette;
    const between = (a, b) => a + r() * (b - a);
    const tag = (name, attrs) =>
      "<" + name + Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join("") + "/>";

    let s = tag("rect", { x: W * 0.05, y: H * 0.05, width: W * 0.9, height: H * 0.9, fill: c[0], opacity: 0.45 });

    switch (p.subject) {
      case "martini": {
        const top = H * 0.24, rim = W * 0.27, tip = H * 0.56;
        s += tag("polygon", { points: `${W / 2 - rim},${top} ${W / 2 + rim},${top} ${W / 2},${tip}`, fill: c[1], opacity: 0.45 });
        s += tag("polygon", { points: `${W / 2 - rim * 0.8},${top + 40} ${W / 2 + rim * 0.8},${top + 40} ${W / 2},${tip - 10}`, fill: c[1], opacity: 0.55 });
        s += tag("rect", { x: W / 2 - 9, y: tip - 10, width: 18, height: H * 0.26, fill: c[3], opacity: 0.55 });
        s += tag("ellipse", { cx: W / 2, cy: tip + H * 0.26, rx: W * 0.16, ry: 22, fill: c[3], opacity: 0.5 });
        s += tag("rect", { x: W * 0.38, y: top - 60, width: 10, height: 300, fill: "#8a6a4a", opacity: 0.7, transform: `rotate(-28 ${W * 0.42} ${top + 80})` });
        s += tag("circle", { cx: W * 0.47, cy: top + 95, r: 44, fill: c[2], opacity: 0.85 });
        s += tag("circle", { cx: W * 0.47 + 10, cy: top + 88, r: 13, fill: "#c8443a", opacity: 0.85 });
        s += tag("ellipse", { cx: W / 2, cy: H * 0.9, rx: W * 0.35, ry: H * 0.03, fill: c[3], opacity: 0.25 });
        break;
      }
      case "flatiron": {
        const base = H * 0.86, topY = H * 0.14;
        s += tag("rect", { x: W * 0.05, y: base, width: W * 0.9, height: H * 0.09, fill: c[3], opacity: 0.35 });
        s += tag("polygon", { points: `${W * 0.34},${base} ${W * 0.34},${topY + 40} ${W * 0.47},${topY} ${W * 0.53},${topY} ${W * 0.53},${base}`, fill: c[1], opacity: 0.6 });
        s += tag("polygon", { points: `${W * 0.53},${base} ${W * 0.53},${topY} ${W * 0.7},${topY + 60} ${W * 0.7},${base}`, fill: c[2], opacity: 0.55 });
        for (let y = topY + 70; y < base - 30; y += 46) {
          for (let x = W * 0.37; x < W * 0.5; x += 38) s += tag("rect", { x, y, width: 18, height: 26, fill: c[3], opacity: 0.45 });
          for (let x = W * 0.56; x < W * 0.68; x += 38) s += tag("rect", { x, y: y + 10, width: 16, height: 26, fill: c[3], opacity: 0.5 });
        }
        s += tag("rect", { x: W * 0.1, y: H * 0.45, width: W * 0.2, height: base - H * 0.45, fill: c[0], opacity: 0.8 });
        s += tag("rect", { x: W * 0.74, y: H * 0.5, width: W * 0.18, height: base - H * 0.5, fill: c[0], opacity: 0.8 });
        break;
      }
      case "stadium": {
        const star = (cx, cy, R) => {
          const pts = [];
          for (let i = 0; i < 10; i++) {
            const rad = i % 2 ? R * 0.42 : R;
            const a = (Math.PI / 5) * i - Math.PI / 2;
            pts.push(`${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`);
          }
          return tag("polygon", { points: pts.join(" "), fill: c[3], opacity: 0.75 });
        };
        s += star(W * 0.82, H * 0.2, 46);
        s += tag("ellipse", { cx: W / 2, cy: H * 0.6, rx: W * 0.42, ry: H * 0.27, fill: c[1], opacity: 0.6 });
        s += tag("ellipse", { cx: W / 2, cy: H * 0.6, rx: W * 0.34, ry: H * 0.2, fill: c[1], opacity: 0.4 });
        s += tag("ellipse", { cx: W / 2, cy: H * 0.62, rx: W * 0.26, ry: H * 0.13, fill: c[2], opacity: 0.75 });
        for (let i = 1; i < 6; i++) s += tag("rect", { x: W * (0.26 + i * 0.08), y: H * 0.52, width: 4, height: H * 0.2, fill: "#ffffff", opacity: 0.6 });
        s += tag("ellipse", { cx: W / 2, cy: H * 0.37, rx: W * 0.3, ry: H * 0.04, fill: c[3], opacity: 0.45 });
        break;
      }
      case "oysters": {
        s += tag("ellipse", { cx: W / 2, cy: H * 0.55, rx: W * 0.42, ry: H * 0.36, fill: c[0], opacity: 0.9 });
        const spots = [[0.3, 0.38], [0.52, 0.32], [0.72, 0.42], [0.36, 0.66], [0.58, 0.62], [0.76, 0.7]];
        spots.forEach(([x, y], i) => {
          const cx = W * x, cy = H * y, rot = between(-40, 40);
          s += tag("ellipse", { cx, cy, rx: 105, ry: 72, fill: c[1], opacity: 0.6, transform: `rotate(${rot} ${cx} ${cy})` });
          s += tag("ellipse", { cx: cx + 4, cy: cy - 2, rx: 72, ry: 46, fill: c[2], opacity: 0.85, transform: `rotate(${rot} ${cx} ${cy})` });
          s += tag("ellipse", { cx: cx + 10, cy, rx: 28, ry: 18, fill: c[1], opacity: 0.35 + (i % 2) * 0.1, transform: `rotate(${rot} ${cx} ${cy})` });
        });
        s += tag("polygon", { points: `${W * 0.44},${H * 0.5} ${W * 0.56},${H * 0.47} ${W * 0.5},${H * 0.56}`, fill: c[3], opacity: 0.85 });
        break;
      }
      default: {
        // house portrait
        const ground = H * 0.78;
        const hx = W * 0.25, hw = W * 0.5, hh = H * 0.3;
        s += tag("rect", { x: W * 0.05, y: ground, width: W * 0.9, height: H * 0.17, fill: c[3], opacity: 0.45 });
        s += tag("circle", { cx: W * 0.16, cy: ground - 120, r: 110, fill: c[3], opacity: 0.55 });
        s += tag("circle", { cx: W * 0.86, cy: ground - 90, r: 90, fill: c[3], opacity: 0.5 });
        s += tag("rect", { x: hx, y: ground - hh, width: hw, height: hh, fill: c[1], opacity: 0.85 });
        s += tag("polygon", { points: `${hx - 30},${ground - hh} ${W / 2},${ground - hh - H * 0.17} ${hx + hw + 30},${ground - hh}`, fill: c[2], opacity: 0.7 });
        s += tag("rect", { x: W / 2 - 34, y: ground - 130, width: 68, height: 130, fill: c[2], opacity: 0.75 });
        [hx + 50, hx + hw - 130].forEach((x) => (s += tag("rect", { x, y: ground - hh + 50, width: 80, height: 80, fill: "#ffffff", opacity: 0.75 })));
        s += tag("ellipse", { cx: W / 2, cy: ground + 30, rx: 50, ry: 14, fill: c[2], opacity: 0.3 });
      }
    }

    // "detail" crops into the middle of the piece, like a close-up photo.
    const viewBox = view === "detail" ? `${W * 0.3} ${H * 0.3} ${W * 0.4} ${H * 0.4}` : `0 0 ${W} ${H}`;

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${viewBox}">` +
      `<defs>` +
      `<filter id="w" x="-20%" y="-20%" width="140%" height="140%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="3" seed="${seed % 97}" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="38" xChannelSelector="R" yChannelSelector="G"/>` +
      `<feGaussianBlur stdDeviation="2.5"/></filter>` +
      `<filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="7"/>` +
      `<feColorMatrix values="0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0 0.35 0 0 0 0.08 0"/></filter>` +
      `</defs>` +
      `<rect width="${W}" height="${H}" fill="#fcfaf5"/>` +
      `<g filter="url(#w)">${s}</g>` +
      `<rect width="${W}" height="${H}" filter="url(#p)"/>` +
      `</svg>`
    );
  }

  const artCache = new Map();
  function artSrc(p, view = "full") {
    // A real photo from data.js wins over the generated stand-in.
    if (p.photo) return (view === "detail" && p.photoDetail) || p.photo;
    const key = p.slug + ":" + view;
    if (!artCache.has(key)) {
      artCache.set(key, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(artSVG(p, view)));
    }
    return artCache.get(key);
  }

  function artImg(p, { view = "full", lazy = true, alt } = {}) {
    const h = Math.round((1000 * p.h) / p.w);
    return `<img src="${artSrc(p, view)}" width="1000" height="${h}" alt="${esc(alt || p.alt || p.title)}"${
      lazy ? ' loading="lazy"' : ""
    } decoding="async">`;
  }

  /* ---------------------------------------------------------------- *
   * Shared chrome
   * ---------------------------------------------------------------- */

  const NAV = [
    { href: "shop.html", label: "Shop prints", page: "shop" },
    { href: "commissions.html", label: "Commissions", page: "commissions" },
    { href: "about.html", label: "About", page: "about" },
    { href: "faq.html", label: "FAQ", page: "faq" },
    { href: `mailto:${SITE.email}`, label: "Contact", page: "contact" },
  ];

  function renderChrome() {
    const page = document.body.dataset.page;
    const header = $("[data-site-header]");
    if (header) {
      header.innerHTML = `
        <div class="proto-bar">Prototype: photos, print details and some copy are placeholders.</div>
        <div class="gingham gingham-band" aria-hidden="true"></div>
        <div class="wrap header-inner">
          <a class="wordmark" href="index.html">Priya <span>Watercolors</span></a>
          <nav class="site-nav" aria-label="Main">
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-list">
              <span class="nav-toggle-bars" aria-hidden="true"></span><span class="sr-only">Menu</span>
            </button>
            <ul id="nav-list" class="nav-list">
              ${NAV.map(
                (n) =>
                  `<li><a href="${n.href}"${n.page === page || (page === "product" && n.page === "shop") ? ' aria-current="page"' : ""}>${n.label}</a></li>`
              ).join("")}
            </ul>
          </nav>
          <a class="cart-link" href="cart.html" data-cart-link>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
            <span class="cart-count" data-cart-count hidden>0</span>
          </a>
        </div>`;

      const toggle = $(".nav-toggle", header);
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        header.classList.toggle("nav-open", open);
      });
    }

    const footer = $("[data-site-footer]");
    if (footer) {
      footer.innerHTML = `
        <div class="gingham gingham-band" aria-hidden="true"></div>
        <div class="wrap footer-inner">
          <div>
            <p class="wordmark wordmark-footer">Priya <span>Watercolors</span></p>
            <p class="muted">Limited-run watercolor prints and 5 × 7 original commissions.</p>
            <p><a href="${SITE.instagram}" rel="noopener">Instagram ${SITE.instagramHandle}</a><br>
            <a href="mailto:${SITE.email}">${SITE.email}</a></p>
          </div>
          <nav aria-label="Footer">
            <ul class="footer-links">
              <li><a href="shop.html">Shop prints</a></li>
              <li><a href="commissions.html">Commissions</a></li>
              <li><a href="about.html">About Priya</a></li>
              <li><a href="mailto:${SITE.email}">Contact</a></li>
            </ul>
          </nav>
          <nav aria-label="Policies">
            <ul class="footer-links">
              <li><a href="faq.html#payment">Paying with Venmo</a></li>
              <li><a href="faq.html#shipping">Shipping</a></li>
              <li><a href="faq.html#returns">Returns</a></li>
              <li><a href="faq.html#care">Caring for your print</a></li>
              <li><a href="faq.html#commission-terms">Commission terms</a></li>
              <li><a href="faq.html#privacy">Privacy policy</a></li>
            </ul>
          </nav>
        </div>
        <div class="wrap footer-base muted">© ${new Date().getFullYear()} Priya Watercolors. All artwork and images are copyright the artist.</div>`;
    }
    updateCartCount();
  }

  function card(p, { lazy = true } = {}) {
    const out = isSoldOut(p);
    const left = inStock(p);
    return `
      <li>
        <a class="card" href="product.html?p=${p.slug}">
          <div class="mat">
            <div class="mat-inner">${artImg(p, { lazy })}</div>
            ${out ? '<span class="badge badge-sold">Sold out</span>' : left <= 3 ? `<span class="badge badge-low">Only ${left} left</span>` : ""}
          </div>
          <div class="card-body">
            <h3 class="card-title">${esc(p.title)}</h3>
            <p class="card-meta">Print · ${sizesLabel(p)} · ${out ? '<span class="sold-text">Sold out</span>' : printPriceRange}</p>
          </div>
        </a>
      </li>`;
  }

  const newestFirst = (a, b) => b.added.localeCompare(a.added);

  /* ---------------------------------------------------------------- *
   * Pages
   * ---------------------------------------------------------------- */

  const pages = {};

  pages.home = function () {
    const available = PRODUCTS.filter((p) => !isSoldOut(p));
    const hero = available.find((p) => p.featured) || available[0] || PRODUCTS[0];
    $("[data-hero-art]").innerHTML = `
      <a class="hero-art" href="product.html?p=${hero.slug}">
        <div class="mat mat-hero"><div class="mat-inner">${artImg(hero, { lazy: false })}</div></div>
        <span class="hero-caption">${esc(hero.title)}, print, ${sizesLabel(hero)}</span>
      </a>`;

    $("[data-featured]").innerHTML = PRODUCTS.slice().sort(newestFirst).map((p) => card(p)).join("");

    $("[data-commission-art]").innerHTML = COMMISSION_EXAMPLES.slice(0, 2)
      .map((e) => `<div class="mat mat-small"><div class="mat-inner">${artImg(e, { alt: e.title })}</div></div>`)
      .join("");

    $("[data-portrait]").innerHTML = portraitSVG();
    $("[data-from-price]").textContent = commissionPrice(COMMISSION_TYPES.find((t) => t.label === "House"));
    $$("[data-commission-size]").forEach((el) => (el.textContent = COMMISSION_SIZE));
    $$("[data-turnaround]").forEach((el) => (el.textContent = SITE.commissions.turnaround));
  };

  pages.shop = function () {
    const grid = $("[data-gallery]");
    const status = $("[data-results]");
    const availability = $("#filter-availability");
    const sort = $("#sort");

    function render() {
      let list = PRODUCTS.slice();
      if (availability.value === "available") list = list.filter((p) => !isSoldOut(p));
      if (availability.value === "sold") list = list.filter((p) => isSoldOut(p));

      if (sort.value === "name") list.sort((a, b) => a.title.localeCompare(b.title));
      else list.sort(newestFirst);

      // Keep in-stock prints ahead of sold-out ones unless filtering to sold out.
      if (availability.value === "all") list.sort((a, b) => isSoldOut(a) - isSoldOut(b));

      grid.innerHTML = list.length
        ? list.map((p, i) => card(p, { lazy: i > 3 })).join("")
        : `<li class="empty-inline">Nothing here right now.</li>`;
      status.textContent = `${list.length} ${list.length === 1 ? "print" : "prints"}`;
    }

    availability.addEventListener("change", render);
    sort.addEventListener("change", render);
    render();
  };

  pages.product = function () {
    const slug = new URLSearchParams(location.search).get("p");
    const p = findProduct(slug);
    const root = $("[data-product]");

    if (!p) {
      document.title = "Print not found | Priya Watercolors";
      root.innerHTML = `<div class="empty"><h1>We couldn't find that print</h1><p>It may have been removed from the shop.</p><a class="btn" href="shop.html">Back to the shop</a></div>`;
      return;
    }

    document.title = `${p.title}, watercolor print | Priya Watercolors`;
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", `${p.title}: a limited-run print of an original watercolor by Priya, ${sizesLabel(p)}, edition of ${p.edition}.`);

    // Gallery views stand in for the 3–6 photos per piece (S4).
    const views = [
      { id: "full", label: "Full print", zoom: true },
      { id: "detail", label: "Close-up detail", zoom: true },
      { id: "room", label: "In a room, to scale", zoom: false },
    ];

    function viewHTML(v) {
      if (v.id === "room") return roomMockup(p, chosenSize());
      return `<div class="mat mat-stage"><div class="mat-inner">${artImg(p, { view: v.id, lazy: false, alt: v.id === "detail" ? `Close-up detail of ${p.title}` : p.alt })}</div></div>`;
    }

    root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="shop.html">Shop prints</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(p.title)}</span></nav>
      <div class="detail">
        <div class="detail-media">
          <div class="stage" data-stage></div>
          <div class="thumbs" role="group" aria-label="Photos">
            ${views
              .map(
                (v, i) => `
              <button type="button" class="thumb" data-view="${v.id}" aria-pressed="${i === 0}" aria-label="${v.label}">
                ${v.id === "room" ? '<span class="thumb-room" aria-hidden="true"></span>' : `<span class="thumb-img">${artImg(p, { view: v.id, alt: "" })}</span>`}
              </button>`
              )
              .join("")}
          </div>
          <p class="fine muted">Photographed in daylight. Colors can look slightly different from screen to screen.</p>
        </div>

        <div class="detail-info">
          <p class="eyebrow">Limited-run print · edition of ${p.edition}</p>
          <h1>${esc(p.title)}</h1>
          <p class="price" data-price></p>
          <p class="avail" data-avail></p>
          <div data-buy></div>
          <p class="story">${esc(p.story)}</p>
          <dl class="facts">
            <div><dt>Sizes</dt><dd>${PRINT_SIZES.map((s) => `${sizeLabelFull(p, s)}, ${money(s.price)}`).join("<br>")}</dd></div>
            <div><dt>Medium</dt><dd>${esc(PRINT_DETAILS.medium)}</dd></div>
            <div><dt>Paper</dt><dd>${esc(PRINT_DETAILS.paper)}</dd></div>
            <div><dt>Edition</dt><dd>Limited to ${p.edition} prints</dd></div>
            <div><dt>Framing</dt><dd>${esc(PRINT_DETAILS.framing)}</dd></div>
            <div><dt>Year</dt><dd>${PRINT_DETAILS.year}</dd></div>
          </dl>
          <p class="fine muted">Ships within the US in 3 business days. <a href="faq.html#shipping">Shipping and returns</a></p>
        </div>
      </div>

      <section class="section-tight" aria-labelledby="similar-h">
        <h2 id="similar-h">More prints</h2>
        <ul class="grid grid-3" data-similar></ul>
      </section>`;

    // Stage and thumbnails
    let sizeId = PRINT_SIZES[0].id;
    const chosenSize = () => findSize(sizeId);
    let shown = 0;
    const stage = $("[data-stage]");
    function show(i) {
      shown = i;
      const v = views[i];
      stage.innerHTML = v.zoom
        ? `<button type="button" class="stage-zoom" aria-label="Zoom in on ${esc(v.label.toLowerCase())}">${viewHTML(v)}<span class="zoom-hint" aria-hidden="true">Tap to zoom</span></button>`
        : viewHTML(v);
      $$(".thumb", root).forEach((t, j) => t.setAttribute("aria-pressed", String(j === i)));
      const zoomBtn = $(".stage-zoom", stage);
      if (zoomBtn) zoomBtn.addEventListener("click", () => openLightbox(p, v.id));
    }
    $$(".thumb", root).forEach((t, i) => t.addEventListener("click", () => show(i)));
    show(0);

    // Buy box
    function renderBuy() {
      const left = inStock(p);
      const inCart = cart.qtyOf(p.slug);
      $("[data-price]").innerHTML = left ? money(chosenSize().price) : '<span class="badge badge-sold badge-inline">Sold out</span>';
      $("[data-avail]").innerHTML = left
        ? `<span class="dot" aria-hidden="true"></span> ${stockLabel(p)}`
        : "";
      const box = $("[data-buy]");

      if (!left) {
        box.innerHTML = `
          <p>All ${p.edition} prints of ${esc(p.title)} have found homes. Follow <a href="${SITE.instagram}" rel="noopener">${SITE.instagramHandle}</a> to hear about new prints, or commission an original of your own.</p>
          <a class="btn btn-block" href="commissions.html#request">Commission a painting</a>`;
        return;
      }

      const max = left - inCart;
      if (max <= 0) {
        box.innerHTML = `
          <a class="btn btn-block" href="cart.html">In your cart (${inCart}): check out</a>
          <p class="fine muted">You have all the remaining prints in your cart.</p>`;
        return;
      }

      box.innerHTML = `
        <fieldset class="size-pick">
          <legend>Size</legend>
          <div class="chips">
            ${PRINT_SIZES.map(
              (s) => `<label class="chip"><input type="radio" name="print-size" value="${s.id}"${s.id === sizeId ? " checked" : ""}><span>${sizeLabel(p, s)} · ${money(s.price)}</span></label>`
            ).join("")}
          </div>
        </fieldset>
        <div class="buy-row">
          <div class="qty">
            <label for="qty">Quantity</label>
            <select id="qty">${Array.from({ length: max }, (_, i) => `<option>${i + 1}</option>`).join("")}</select>
          </div>
          <button type="button" class="btn" data-add>Add to cart</button>
        </div>
        ${inCart ? `<p class="fine"><a href="cart.html">${inCart} already in your cart: check out</a></p>` : ""}`;
      $$('[name="print-size"]', box).forEach((r) =>
        r.addEventListener("change", () => {
          sizeId = r.value;
          renderBuy();
          if (views[shown].id === "room") show(shown);
          $(`[name="print-size"][value="${sizeId}"]`).focus();
        })
      );
      $("[data-add]", box).addEventListener("click", () => {
        const n = Number($("#qty").value);
        const key = lineKey(p.slug, sizeId);
        cart.set(key, cart.qty(key) + n);
        renderBuy();
        announce(`${n} ${sizeLabel(p, chosenSize())} ${p.title} ${n === 1 ? "print" : "prints"} added to cart`);
        const link = $("[data-buy] a");
        if (link) link.focus();
      });
    }
    renderBuy();

    const others = PRODUCTS.filter((o) => o.slug !== p.slug);
    others.sort((a, b) => isSoldOut(a) - isSoldOut(b) || newestFirst(a, b));
    $("[data-similar]").innerHTML = others.map((o) => card(o)).join("");
  };

  function roomMockup(p, size) {
    // The sofa is about 84 in wide and spans 64% of the wall, so the print
    // (plus roughly 2 in of frame or mat on each side) is drawn to the same scale.
    const width = ((printDims(p, size).w + 4) * 64) / 84;
    return `
      <div class="room" role="img" aria-label="${esc(p.title)}, ${sizeLabel(p, size)}, shown to scale on a wall above an 84-inch sofa">
        <div class="room-art" style="width:${width}%">
          <div class="room-frame">${artImg(p, { lazy: false, alt: "" })}</div>
        </div>
        <div class="room-sofa"><span></span></div>
        <div class="room-floor"></div>
      </div>`;
  }

  function openLightbox(p, view) {
    let dlg = $("#lightbox");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "lightbox";
      dlg.className = "lightbox";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", (e) => {
        if (e.target === dlg) dlg.close();
      });
    }
    dlg.setAttribute("aria-label", `${p.title}, zoomed`);
    dlg.innerHTML = `
      <div class="lightbox-inner">
        <img src="${artSrc(p, view)}" alt="${esc(view === "detail" ? `Close-up detail of ${p.title}` : p.alt)}">
        <span class="watermark" aria-hidden="true">© Priya Watercolors</span>
      </div>
      <form method="dialog"><button class="lightbox-close" aria-label="Close zoomed view">×</button></form>`;
    dlg.showModal();
  }

  pages.cart = function () {
    const root = $("[data-cart]");
    function render(notice = "") {
      const items = cart.items();

      if (!items.length) {
        root.innerHTML = `${notice}
          <div class="empty">
            <p>Your cart is empty.</p>
            <a class="btn" href="shop.html">Browse prints</a>
          </div>`;
        return;
      }

      const subtotal = items.reduce((sum, { size, qty }) => sum + size.price * qty, 0);
      root.innerHTML = `${notice}
        <div class="cart-layout">
          <ul class="cart-items">
            ${items
              .map(
                ({ key, p, size, qty }, idx) => `
              <li class="cart-item">
                <a class="cart-thumb" href="product.html?p=${p.slug}"><div class="mat mat-small"><div class="mat-inner">${artImg(p, { alt: "" })}</div></div></a>
                <div class="cart-item-body">
                  <h2 class="cart-item-title"><a href="product.html?p=${p.slug}">${esc(p.title)}</a></h2>
                  <p class="muted">Print · ${sizeLabel(p, size)} · ${money(size.price)} each</p>
                  <div class="cart-qty">
                    <label for="qty-${idx}">Qty</label>
                    <select id="qty-${idx}" data-qty="${key}">
                      ${Array.from({ length: qty + inStock(p) - cart.qtyOf(p.slug) }, (_, i) => `<option${i + 1 === qty ? " selected" : ""}>${i + 1}</option>`).join("")}
                    </select>
                    <button type="button" class="btn-link" data-remove="${key}">Remove<span class="sr-only"> ${esc(p.title)}, ${sizeLabel(p, size)}</span></button>
                  </div>
                </div>
                <p class="cart-item-price">${money(size.price * qty)}</p>
              </li>`
              )
              .join("")}
          </ul>
          <aside class="summary card-edge" aria-labelledby="summary-h">
            <h2 id="summary-h" class="summary-title">Order summary</h2>
            <dl>
              <div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>
              <div><dt>Delivery</dt><dd>${deliveryNote()}</dd></div>
            </dl>
            <a class="btn btn-block" href="checkout.html">Check out</a>
            <p class="fine muted center">You'll pay with Venmo after placing your order.</p>
          </aside>
        </div>`;

      $$("[data-qty]", root).forEach((sel) =>
        sel.addEventListener("change", () => {
          cart.set(sel.dataset.qty, Number(sel.value));
          render();
          const again = $(`[data-qty="${sel.dataset.qty}"]`);
          if (again) again.focus();
        })
      );
      $$("[data-remove]", root).forEach((b) =>
        b.addEventListener("click", () => {
          const { p, size } = parseKey(b.dataset.remove);
          cart.set(b.dataset.remove, 0);
          render();
          announce(`${p.title}, ${sizeLabel(p, size)}, removed from cart`);
        })
      );
    }

    // Stock check: tell the buyer if anything sold out or ran low since it was added (S5).
    const raw = local.get("pw-cart-lines", {});
    const kept = cart.lines();
    const changed = [...new Set(
      Object.keys(raw)
        .map(parseKey)
        .filter(({ key, p, size }) => p && size && raw[key] > (kept[key] || 0))
        .map(({ p }) => p.title)
    )];
    local.set("pw-cart-lines", cart.lines());
    updateCartCount();
    render(
      changed.length
        ? `<div class="notice" role="status">Stock changed for ${esc(changed.join(", "))} since you added ${changed.length === 1 ? "it" : "them"}, so your cart has been updated.</div>`
        : ""
    );
  };

  const places = () => SITE.delivery.dropOffPlaces.map((x) => x.replace(", TX", "")).join(" or ");
  const deliveryNote = () => `${money(SITE.delivery.shipPrice)} shipping (US only), or free local drop-off in ${places()}`;

  // Sends a print order or commission request to Priya's Google Apps Script
  // (google-apps-script/Code.gs), which adds it to her sheet and emails her.
  // A plain-text body keeps this a "simple" request, so there's no CORS preflight.
  async function postForm(payload) {
    if (!SITE.formUrl) throw new Error("SITE.formUrl is not set in js/data.js");
    const res = await fetch(SITE.formUrl, { method: "POST", body: JSON.stringify(payload) });
    const reply = await res.json();
    if (!reply.ok) throw new Error(reply.error || "The form service said no.");
  }

  function showSendError(form, summary, button, label, why) {
    console.error("Form not sent:", why);
    button.disabled = false;
    button.textContent = label;
    summary.hidden = false;
    summary.innerHTML = `<h2 class="error-summary-title">Sorry, that didn't send</h2>
      <p>Nothing was charged. Please try again in a minute. If it still doesn't work, email
      <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>`;
    summary.focus();
  }

  pages.checkout = function () {
    const items = cart.items();
    const root = $("[data-checkout]");
    if (!items.length) {
      root.innerHTML = `<div class="empty"><p>Your cart is empty.</p><a class="btn" href="shop.html">Browse prints</a></div>`;
      return;
    }

    // One code per visit, so retrying after an error reuses it.
    const code = "PW-" + String(1000 + Math.floor(Math.random() * 9000));
    const subtotal = items.reduce((sum, { size, qty }) => sum + size.price * qty, 0);
    const form = $("#order-form");
    const el = (name) => form.elements[name];
    const shipping = () => (el("delivery").value === "ship" ? SITE.delivery.shipPrice : 0);

    $("[data-ship-price]").textContent = money(SITE.delivery.shipPrice);
    $("[data-dropoff-places]").textContent = places();
    $("#dropoff-place").innerHTML =
      `<option value="">Choose one</option>` + SITE.delivery.dropOffPlaces.map((x) => `<option>${esc(x)}</option>`).join("");

    $("[data-order-lines]").innerHTML = items
      .map(
        ({ p, size, qty }) =>
          `<li><span>${esc(p.title)}, ${sizeLabel(p, size)} <span class="muted">× ${qty}</span></span><span>${money(size.price * qty)}</span></li>`
      )
      .join("");

    function update() {
      const ship = el("delivery").value === "ship";
      const drop = el("delivery").value === "dropoff";
      $("[data-ship-fields]").hidden = !ship;
      $("[data-dropoff-fields]").hidden = !drop;
      $$("[data-ship-fields] input, [data-ship-fields] select", form).forEach((c) => (c.disabled = !ship));
      $("#dropoff-place").disabled = !drop;
      $("[data-subtotal]").textContent = money(subtotal);
      $("[data-shipping]").textContent = !el("delivery").value ? "Choose delivery" : shipping() ? money(shipping()) : "Free";
      $("[data-total]").textContent = money(subtotal + shipping());
    }
    $$('[name="delivery"]', form).forEach((r) => r.addEventListener("change", update));
    update();

    const required = (name, msg) => () => (el(name).disabled || el(name).value.trim() ? "" : msg);
    const rules = {
      name: required("name", "Please enter your name."),
      email: () =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el("email").value.trim()) ? "" : "Please enter a valid email so Priya can reach you.",
      delivery: () => (el("delivery").value ? "" : "Choose shipping or local drop-off."),
      "dropoff-place": required("dropoff-place", "Choose where you'd like it dropped off."),
      address1: required("address1", "Enter a street address."),
      city: required("city", "Enter a city."),
      state: required("state", "Enter a state."),
      zip: () => (el("zip").disabled || /^\d{5}(-\d{4})?$/.test(el("zip").value.trim()) ? "" : "Enter a 5-digit ZIP code."),
    };
    const anchorFor = (name) => (name === "delivery" ? "delivery-ship" : name);
    let submitted = false;

    function validate(name) {
      const msg = rules[name]();
      $(`#${name}-error`).textContent = msg;
      $(`[data-field="${name}"]`).classList.toggle("has-error", Boolean(msg));
      const c = el(name);
      (c instanceof RadioNodeList ? Array.from(c) : [c]).forEach((x) => x.setAttribute("aria-invalid", msg ? "true" : "false"));
      return msg;
    }
    form.addEventListener("input", () => submitted && Object.keys(rules).forEach(validate));
    form.addEventListener("change", () => submitted && Object.keys(rules).forEach(validate));

    const summary = $("[data-error-summary]");
    const button = $("[type=submit]", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submitted = true;
      const errors = Object.keys(rules)
        .map((n) => ({ name: n, msg: validate(n) }))
        .filter((x) => x.msg);
      if (errors.length) {
        summary.hidden = false;
        summary.innerHTML = `<h2 class="error-summary-title">Please fix ${errors.length} ${errors.length === 1 ? "thing" : "things"} before placing your order</h2>
          <ul>${errors.map((x) => `<li><a href="#${anchorFor(x.name)}">${x.msg}</a></li>`).join("")}</ul>`;
        summary.focus();
        return;
      }
      summary.hidden = true;

      // Honeypot: real people never fill this hidden field.
      if (el("website").value) {
        location.href = "order-confirmed.html";
        return;
      }

      const ship = el("delivery").value === "ship";
      const lines = items.map(({ p, size, qty }) => ({
        title: p.title,
        size: sizeLabel(p, size),
        qty,
        price: size.price,
        lineTotal: size.price * qty,
      }));
      const order = {
        kind: "order",
        code,
        name: el("name").value.trim(),
        email: el("email").value.trim(),
        phone: el("phone").value.trim(),
        items: lines,
        itemsText: lines.map((l) => `${l.title}, ${l.size} × ${l.qty} = ${money(l.lineTotal)}`).join("\n"),
        subtotal: money(subtotal),
        shipping: money(shipping()),
        total: money(subtotal + shipping()),
        delivery: ship ? "Ship (US)" : `Local drop-off in ${el("dropoff-place").value}`,
        address: ship
          ? [el("address1").value, el("address2").value, `${el("city").value.trim()}, ${el("state").value.trim()} ${el("zip").value.trim()}`]
              .map((x) => x.trim())
              .filter(Boolean)
              .join("\n")
          : "",
        notes: el("notes").value.trim(),
        honey: "",
      };

      button.disabled = true;
      button.textContent = "Placing your order…";
      announce("Placing your order");
      try {
        await postForm(order);
      } catch (err) {
        return showSendError(form, summary, button, "Place order", err);
      }
      session.set("pw-order", order);
      cart.clear();
      location.href = "order-confirmed.html";
    });
  };

  pages.order = function () {
    const order = session.get("pw-order", null);
    const root = $("[data-order]");
    if (!order) {
      root.innerHTML = `<p>We couldn't find a recent order in this browser. If you placed one, use the order code you noted when paying on Venmo, or email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p><a class="btn" href="shop.html">Back to the shop</a>`;
      return;
    }
    root.innerHTML = `
      <div class="order-code card-edge">
        <p class="eyebrow">Your order code</p>
        <p class="order-code-value">${esc(order.code)}</p>
        <p class="order-code-total">Total: <strong>${esc(order.total)}</strong></p>
        <a class="btn btn-block btn-venmo" href="${esc(VENMO_URL)}" target="_blank" rel="noopener">Pay on Venmo</a>
        <p class="venmo-note">Please include your order code in the Venmo note. Your order ships once payment is received.</p>
      </div>
      <p>Thanks, ${esc(order.name.split(" ")[0])}! Priya has your order and will email <strong>${esc(order.email)}</strong> if she has any questions.</p>
      <ul class="order-items">
        ${order.items.map((l) => `<li><span>${esc(l.title)}, ${esc(l.size)} <span class="muted">× ${l.qty}</span></span><span>${money(l.lineTotal)}</span></li>`).join("")}
        <li><span>${esc(order.delivery)}</span><span>${order.shipping === money(0) ? "Free" : esc(order.shipping)}</span></li>
        <li class="order-total"><span>Total</span><span>${esc(order.total)}</span></li>
      </ul>
      ${order.address ? `<p class="muted">Shipping to:<br>${esc(order.address).replace(/\n/g, "<br>")}</p>` : ""}
      <a class="btn btn-ghost" href="shop.html">Keep browsing</a>`;
  };

  /* ---------------------------------------------------------------- *
   * Commissions (5 × 7 originals) and request form (F1–F13)
   * ---------------------------------------------------------------- */

  pages.commissions = function () {
    $("[data-pricing]").innerHTML = COMMISSION_TYPES.map(
      (t) => `<tr><th scope="row">${esc(t.label)}</th><td>${commissionPrice(t)}${t.price ? "" : ' <span class="muted">depending on detail</span>'}</td></tr>`
    ).join("");
    $$("[data-commission-size]").forEach((el) => (el.textContent = COMMISSION_SIZE));

    $("[data-examples]").innerHTML = COMMISSION_EXAMPLES.map(
      (e) => `
      <li class="example">
        <div class="mat"><div class="mat-inner">${artImg(e, { alt: `Watercolor house commission: ${e.title}` })}</div></div>
        <p class="card-title">${esc(e.title)}</p>
        <p class="card-meta">House · ${e.w} × ${e.h} in original</p>
      </li>`
    ).join("");

    $$("[data-turnaround]").forEach((el) => (el.textContent = SITE.commissions.turnaround));

    // F13: booked-until notice, or a closed form when the waitlist is full.
    const notice = $("[data-booking]");
    if (!SITE.commissions.open) {
      notice.innerHTML = `<strong>Commissions are closed for now.</strong> Priya's list is full. Follow <a href="${SITE.instagram}">${SITE.instagramHandle}</a> to hear when they reopen.`;
      $("[data-form-wrap]").innerHTML = `<p>The request form will be back when commissions reopen.</p>`;
      return;
    }
    notice.innerHTML = SITE.commissions.bookedUntil
      ? `<strong>Currently booked until ${esc(SITE.commissions.bookedUntil)}.</strong> Send your request now to hold a spot; your ${esc(SITE.commissions.turnaround)} start then.`
      : `<strong>Now taking requests.</strong> Your painting is ready about ${esc(SITE.commissions.turnaround)} after you send the form. Nothing to pay up front.`;

    $("#type-options").innerHTML = COMMISSION_TYPES.map(
      (t, i) => `<label class="chip"><input type="radio" id="type-${i}" name="type" value="${esc(t.label)}" aria-describedby="type-error"><span>${esc(t.label)} · ${commissionPrice(t)}</span></label>`
    ).join("");
    $("#commission-form").elements.size.value = `${COMMISSION_SIZE} original`;

    $("#location").innerHTML =
      `<option value="">Choose one</option>` + LOCATIONS.map((l) => `<option>${esc(l.label)}</option>`).join("");

    const neededBy = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    $("#needed-by").min = neededBy;

    setupCommissionForm();
  };

  const MAX_FILES = 5;
  const MAX_BYTES = 10 * 1024 * 1024;
  const OK_TYPES = /\.(jpe?g|png|heic)$/i;

  function setupCommissionForm() {
    const form = $("#commission-form");
    const el = (name) => form.elements[name];
    const files = [];
    const totalBytes = () => files.reduce((n, f) => n + f.file.size, 0);

    // Description counter (F3)
    const desc = $("#description");
    const counter = $("[data-count]");
    const updateCount = () => (counter.textContent = `${desc.value.length} / 1,000`);
    desc.addEventListener("input", updateCount);
    updateCount();

    // Gift / event follow-up (F7)
    const gift = $("#gift");
    const occasion = $("[data-occasion]");
    gift.addEventListener("change", () => (occasion.hidden = !gift.checked));

    // The house address question only applies to house commissions.
    const addressField = $("[data-address]");
    const syncType = () => {
      const type = form.elements.type.value;
      const t = COMMISSION_TYPES.find((x) => x.label === type);
      addressField.hidden = type !== "House";
      el("address").disabled = addressField.hidden;
      $("[data-type-price]").textContent = t
        ? `${t.label}: ${commissionPrice(t)}${t.price ? "" : ", depending on detail. Priya confirms the exact price when she replies"}.`
        : "";
    };
    $$('[name="type"]', form).forEach((r) => r.addEventListener("change", syncType));

    // Local drop-off follow-up, only for places Priya visits.
    const placeSelect = $("#location");
    const dropOff = $("[data-dropoff]");
    const syncDropOff = () => {
      const place = LOCATIONS.find((l) => l.label === placeSelect.value);
      dropOff.hidden = !(place && place.dropOff);
      // Disabled radios aren't sent, so a hidden question stays out of the email.
      $$("input", dropOff).forEach((r) => (r.disabled = dropOff.hidden));
      $("[data-dropoff-place]").textContent = place ? place.label.replace(", TX", "") : "";
    };
    placeSelect.addEventListener("change", syncDropOff);
    syncDropOff();

    // Reference photos (F4): keep our own list so people can add in batches and remove.
    const input = $("#photos");
    const list = $("[data-files]");
    const fileNote = $("[data-file-note]");

    function renderFiles() {
      list.innerHTML = files
        .map((f, i) => {
          const preview = /\.heic$/i.test(f.file.name)
            ? `<span class="file-fallback" aria-hidden="true">HEIC</span>`
            : `<img src="${f.url}" alt="">`;
          return `<li class="file">${preview}<span class="file-name">${esc(f.file.name)}</span>
            <button type="button" class="file-remove" data-i="${i}" aria-label="Remove ${esc(f.file.name)}">×</button></li>`;
        })
        .join("");
      $$(".file-remove", list).forEach((b) =>
        b.addEventListener("click", () => {
          const [gone] = files.splice(Number(b.dataset.i), 1);
          URL.revokeObjectURL(gone.url);
          renderFiles();
          validateField("photos");
          input.focus();
        })
      );
      const mb = (totalBytes() / 1048576).toFixed(1);
      $("[data-file-count]").textContent = `${files.length} of ${MAX_FILES} photos added` + (files.length ? ` · ${mb} of 10 MB` : "");
    }

    input.addEventListener("change", () => {
      const rejected = [];
      Array.from(input.files).forEach((file) => {
        if (files.length >= MAX_FILES) rejected.push(`${file.name} (limit is ${MAX_FILES} photos)`);
        else if (!OK_TYPES.test(file.name)) rejected.push(`${file.name} (use JPG, PNG or HEIC)`);
        else if (totalBytes() + file.size > MAX_BYTES) rejected.push(`${file.name} (photos can add up to 10 MB in total)`);
        else files.push({ file, url: URL.createObjectURL(file) });
      });
      input.value = "";
      fileNote.textContent = rejected.length ? `Not added: ${rejected.join("; ")}.` : "";
      renderFiles();
      validateField("photos");
    });
    renderFiles();

    // Validation (F11)
    syncType();
    const rules = {
      name: () => (el("name").value.trim() ? "" : "Please enter your name."),
      email: () => {
        const v = el("email").value.trim();
        if (!v) return "Please enter your email so Priya can reply.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "That email doesn't look right. Check for typos.";
      },
      description: () => {
        const v = el("description").value.trim();
        if (!v) return "Tell Priya a little about what you'd like painted.";
        return v.length < 20 ? "Add a bit more detail (at least 20 characters)." : "";
      },
      type: () => (el("type").value ? "" : "Choose what you'd like painted."),
      photos: () => (files.length ? "" : "Add at least one reference photo."),
      zip: () => {
        const v = el("zip").value.trim();
        return !v || /^\d{5}(-\d{4})?$/.test(v) ? "" : "Enter a 5-digit ZIP code.";
      },
      terms: () => (el("terms").checked ? "" : "Please agree to the commission terms to send your request."),
    };

    const touched = new Set();
    const controlsFor = (name) => {
      const c = name === "photos" ? input : el(name);
      return c instanceof RadioNodeList ? Array.from(c) : [c];
    };

    function validateField(name) {
      const msg = rules[name]();
      const errEl = $(`#${name}-error`);
      if (errEl) errEl.textContent = msg;
      const field = $(`[data-field="${name}"]`);
      if (field) field.classList.toggle("has-error", Boolean(msg));
      controlsFor(name).forEach((c) => c.setAttribute("aria-invalid", msg ? "true" : "false"));
      return msg;
    }

    Object.keys(rules).forEach((name) => {
      controlsFor(name).forEach((c) => {
        const instant = c.type === "radio" || c.type === "checkbox" || c.tagName === "SELECT";
        c.addEventListener("blur", () => {
          if (name !== "photos" && name !== "type") touched.add(name);
          if (touched.has(name)) validateField(name);
        });
        c.addEventListener(instant ? "change" : "input", () => {
          if (instant) touched.add(name);
          if (touched.has(name)) validateField(name);
        });
      });
    });

    const anchorFor = (name) => (name === "type" ? "type-0" : name);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      Object.keys(rules).forEach((n) => touched.add(n));
      const errors = Object.keys(rules)
        .map((n) => ({ name: n, msg: validateField(n) }))
        .filter((x) => x.msg);

      const summary = $("[data-error-summary]");
      if (errors.length) {
        summary.hidden = false;
        summary.innerHTML = `<h2 class="error-summary-title">Please fix ${errors.length} ${errors.length === 1 ? "thing" : "things"} before sending</h2>
          <ul>${errors.map((x) => `<li><a href="#${anchorFor(x.name)}">${x.msg}</a></li>`).join("")}</ul>`;
        summary.focus();
        return;
      }
      summary.hidden = true;

      // Honeypot: real people never fill this hidden field (F11).
      if (el("website").value) {
        location.href = "commission-thanks.html";
        return;
      }

      const t = COMMISSION_TYPES.find((x) => x.label === el("type").value);
      const request = {
        name: el("name").value.trim(),
        email: el("email").value.trim(),
        phone: el("phone").value.trim(),
        type: el("type").value,
        price: t ? commissionPrice(t) + (t.price ? "" : " depending on detail") : "",
        address: el("address").disabled ? "" : el("address").value.trim(),
        description: el("description").value.trim(),
        photos: files.map((f) => f.file.name),
        size: el("size").value,
        neededBy: el("needed-by").value,
        gift: el("gift").checked ? el("occasion").value.trim() || "Yes" : "",
        framing: el("framing").value,
        location: el("location").value,
        dropOff: dropOff.hidden ? "" : (form.querySelector('[name="dropoff"]:checked') || {}).value || "",
        zip: el("zip").value.trim(),
        heard: el("heard").value,
        sharePublicly: el("share").checked,
        sentOn: new Date().toISOString(),
      };
      sendRequest(request);
    });

    const readBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

    async function sendRequest(request) {
      const button = $("[type=submit]", form);
      button.disabled = true;
      button.textContent = "Sending…";
      announce("Sending your request");
      try {
        const photos = await Promise.all(
          files.map(async ({ file }) => ({ name: file.name, type: file.type, data: await readBase64(file) }))
        );
        await postForm({ kind: "commission", ...request, photos, honey: "" });
      } catch (err) {
        return showSendError(form, $("[data-error-summary]"), button, "Send my request", err);
      }
      session.set("pw-commission", request);
      location.href = "commission-thanks.html";
    }
  }

  pages["commission-thanks"] = function () {
    const d = session.get("pw-commission", null);
    const root = $("[data-request]");
    if (!d) {
      root.innerHTML = `<p>Priya has your request and will reply by email.</p>`;
      return;
    }
    const fmt = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const ready = fmt(new Date(new Date(d.sentOn).getTime() + 14 * 86400000).toISOString());
    const row = (k, v) => (v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "");
    $("[data-thanks-email]").textContent = d.email;
    $("[data-ready]").textContent = ready;
    root.innerHTML = `
      <h2>Your request</h2>
      <dl class="facts">
        ${row("Name", d.name)}
        ${row("Email", d.email)}
        ${row("Phone", d.phone)}
        ${row("Commission", d.type)}
        ${row("House address", d.address)}
        ${row("Description", d.description)}
        ${row("Photos", d.photos.join(", "))}
        ${row("Size", d.size)}
        ${row("Price", (() => { const t = COMMISSION_TYPES.find((x) => x.label === d.type); return t ? commissionPrice(t) + (t.price ? "" : ", depending on detail") : ""; })())}
        ${row("Needed by", d.neededBy ? fmt(d.neededBy + "T12:00") : "")}
        ${row("Gift or event", d.gift)}
        ${row("Framing", d.framing)}
        ${row("Located in", d.location)}
        ${row("Open to drop-off", d.dropOff)}
        ${row("Ship to ZIP", d.zip)}
        ${row("Heard about us", d.heard)}
        ${row("Share the finished piece", d.sharePublicly ? "Yes, Priya may share it" : "Please keep it private")}
      </dl>`;
  };

  pages.about = function () {
    $("[data-portrait]").innerHTML = portraitSVG();
  };

  /* ---------------------------------------------------------------- */

  function portraitSVG() {
    if (SITE.portraitPhoto) return `<img src="${esc(SITE.portraitPhoto)}" alt="Priya">`;
    // Placeholder for Priya's portrait until a real photo is provided.
    return `<svg viewBox="0 0 200 200" role="img" aria-label="Placeholder for a portrait of Priya">
      <defs><filter id="pp"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="18"/><feGaussianBlur stdDeviation="1.2"/></filter></defs>
      <g filter="url(#pp)">
        <circle cx="100" cy="100" r="92" fill="#f2c4c0" opacity=".45"/>
        <circle cx="100" cy="82" r="34" fill="#b8352d" opacity=".4"/>
        <ellipse cx="100" cy="168" rx="58" ry="44" fill="#26304a" opacity=".35"/>
      </g></svg>`;
  }

  function announce(msg) {
    let live = $("#live");
    if (!live) {
      live = document.createElement("div");
      live.id = "live";
      live.className = "sr-only";
      live.setAttribute("role", "status");
      document.body.appendChild(live);
    }
    live.textContent = "";
    setTimeout(() => (live.textContent = msg), 50);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderChrome();
    const page = pages[document.body.dataset.page];
    if (page) page();
  });
})();
