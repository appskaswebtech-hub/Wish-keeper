(function () {
  var LOG = "[WL CUSTOM DEBUG]";
  var registry = []; // { btn, productId, refreshState }

  // ─── Toast (same look as the built-in wishlist button) ─────────────────────
  function wlToast(message, type, imgUrl, productName) {
    var containerId = "wl-toast-tl";
    var tc = document.getElementById(containerId);
    if (!tc) {
      tc = document.createElement("div");
      tc.id = containerId;
      tc.style.cssText = "position:fixed;top:20px;left:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
      document.body.appendChild(tc);
    }

    var toast = document.createElement("div");
    toast.style.cssText = "display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,0.12);min-width:260px;max-width:340px;pointer-events:all;opacity:0;transform:translateX(-20px);transition:opacity 0.35s cubic-bezier(0.22,1,0.36,1),transform 0.35s cubic-bezier(0.22,1,0.36,1);";

    var imgHtml = imgUrl
      ? '<img src="' + imgUrl + '" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;" />'
      : '<div style="width:44px;height:44px;border-radius:8px;background:#f3f4f6;flex-shrink:0;display:flex;align-items:center;justify-content:center;">' +
        (type === "add"
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>')
        + '</div>';

    var nameHtml = productName
      ? '<div style="font-size:12px;color:#6b7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">' + productName + '</div>'
      : '';

    toast.innerHTML =
      imgHtml +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:13px;font-weight:600;color:#111827;">' + message + '</div>' +
        nameHtml +
      '</div>' +
      '<button style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:16px;padding:0;line-height:1;flex-shrink:0;pointer-events:all;margin-left:4px;" onclick="(function(el){el.style.opacity=\'0\';el.style.transform=\'translateX(-20px)\';setTimeout(function(){el.remove();},350);})(this.parentNode)">✕</button>';

    tc.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
      });
    });
    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-20px)";
      setTimeout(function () { toast.remove(); }, 350);
    }, 4000);
  }

  // Given a pasted HTML snippet, figure out how to find that same element on
  // the live page later: prefer id, then class, then fall back to matching
  // by tag + visible text. Returns null if the snippet can't be parsed.
  function deriveMatcher(html) {
    if (!html || !html.trim()) return null;
    try {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var el = doc.body.firstElementChild;
      if (!el) return null;
      if (el.id) {
        return { type: "css", selector: "#" + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id) };
      }
      if (el.className && typeof el.className === "string" && el.className.trim()) {
        var classes = el.className.trim().split(/\s+/).map(function (c) {
          return "." + (window.CSS && CSS.escape ? CSS.escape(c) : c);
        }).join("");
        return { type: "css", selector: el.tagName.toLowerCase() + classes };
      }
      var text = (el.textContent || "").trim();
      if (text) {
        return { type: "text", tag: el.tagName.toLowerCase(), text: text };
      }
      return { type: "css", selector: el.tagName.toLowerCase() };
    } catch (err) {
      console.error(LOG, "deriveMatcher failed to parse custom button HTML", err);
      return null;
    }
  }

  // Resolves the current product's handle straight from the page URL, for
  // buttons that don't carry a data-handle attribute themselves (e.g. an
  // arbitrary button a merchant already has on their product page).
  function getPageProductHandle() {
    var match = location.pathname.match(/\/products\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // For buttons living inside a product card or a quick-view popup (home
  // page, collection page), the page URL doesn't identify a single product.
  // Instead, walk up from the button and look for a nearby link to that
  // exact product (a product image/title link, or a "View full details"
  // link) within the same card/popup, and pull the handle from its href.
  function findNearbyProductHandle(btn) {
    var el = btn;
    var depth = 0;
    while (el && depth < 8) {
      var link = el.querySelector && el.querySelector('a[href*="/products/"]');
      if (link) {
        var match = link.getAttribute("href").match(/\/products\/([a-zA-Z0-9_-]+)/);
        if (match) return match[1];
      }
      el = el.parentElement;
      depth++;
    }
    return null;
  }

  function init() {
    var cfg = window.__wlCustomBtnConfig;
    if (!cfg) { console.warn(LOG, "no config found on window.__wlCustomBtnConfig"); return; }

    var shop = cfg.shop;
    var proxyUrl = cfg.proxyUrl;
    var selector = cfg.selector || ".st-wishlist-button";
    var customerId = cfg.customerId;
    var customMatcher = null;

    // Apply the last known icon color immediately, so it doesn't flash away
    // while settings are still loading after a page refresh.
    var ICON_COLOR_KEY = "wl_icon_color";
    try {
      var cachedIconColor = localStorage.getItem(ICON_COLOR_KEY);
      if (cachedIconColor) document.documentElement.style.setProperty("--wl-icon-color", cachedIconColor);
    } catch (_) {}

    // Each set-up button registers a painter here, so every button can be
    // recolored once the real icon color arrives from settings.
    var painters = [];
    function currentIconColor() {
      var c = "";
      try { c = getComputedStyle(document.documentElement).getPropertyValue("--wl-icon-color").trim(); } catch (_) {}
      return c || "#e74c6f";
    }

    var GUEST_KEY = "wishlist_guest_id";

    function getGuestId() {
      var id = null;
      try { id = localStorage.getItem(GUEST_KEY); } catch (_) {}
      if (!id) {
        id = "guest_" + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
        try { localStorage.setItem(GUEST_KEY, id); } catch (_) {}
      }
      return id;
    }

    if (!customerId) {
      customerId = getGuestId();
    } else {
      var guestId = null;
      try { guestId = localStorage.getItem(GUEST_KEY); } catch (_) {}
      if (guestId) {
        fetch(proxyUrl + "/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop: shop, customerId: customerId, guestId: guestId, action: "merge" })
        }).then(function () { try { localStorage.removeItem(GUEST_KEY); } catch (_) {} });
      }
    }

    var hasActivePlan = null;
    var productInfoCache = {};

    function getProductInfo(handle) {
      if (productInfoCache[handle]) return productInfoCache[handle];
      productInfoCache[handle] = fetch("/products/" + encodeURIComponent(handle) + ".js")
        .then(function (r) {
          if (!r.ok) throw new Error("product fetch failed with status " + r.status);
          return r.json();
        })
        .then(function (p) {
          var info = {
            productId: String(p.id),
            variantId: p.variants && p.variants[0] ? String(p.variants[0].id) : null
          };
          return info;
        })
        .catch(function (err) {
          console.error(LOG, "getProductInfo failed for handle", handle, err);
          throw err;
        });
      return productInfoCache[handle];
    }

    // Updates only the button's text, so an inline icon (or any other markup
    // the merchant put inside the button) is left in place. Buttons with no
    // child elements behave exactly as before.
    function setBtnLabel(btn, text) {
      if (!btn.children.length) { btn.textContent = text; return; }
      for (var n = btn.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && n.textContent.trim()) { n.textContent = text; return; }
      }
    }

    function applyDisabledState(btn) {
      if (hasActivePlan === false) {
        btn.disabled = true;
        btn.style.opacity = "0.35";
        btn.style.cursor = "not-allowed";
      }
    }

    function setupButton(btn) {
      if (btn.dataset.wlCustomInitialized) return;
      btn.dataset.wlCustomInitialized = "true";

      var handle = btn.dataset.handle || findNearbyProductHandle(btn) || getPageProductHandle();
      if (!handle) { console.warn(LOG, "button has no data-handle and no product could be resolved nearby or from the page URL, skipping", btn); return; }

      var addText = btn.dataset.textAdd || btn.textContent.trim() || "Add to Wishlist";
      var removeText = btn.dataset.textRemove || "In Wishlist";
      var isActive = false;
      var productId = null;
      var variantId = null;
      var ready = false;

      // Same behavior as the built-in icon: the settings color shows only
      // while the product is saved, and is removed again when it isn't.
      function paintIcon() {
        var active = btn.classList.contains("active");
        // Many themes style the saved state with their own "is-active" class.
        btn.classList.toggle("is-active", active);
        // An outline + filled icon pair means the merchant's own CSS swaps
        // and colors the icons, so their colors are left untouched.
        if (btn.querySelectorAll("svg").length > 1) return;
        var color = currentIconColor();
        var icons = btn.querySelectorAll("svg, i");
        if (!icons.length) {
          if (active) btn.style.color = color; else btn.style.removeProperty("color");
          return;
        }
        Array.prototype.forEach.call(icons, function (icon) {
          var isSvg = icon.tagName.toLowerCase() === "svg";
          var targets = [icon];
          if (isSvg) targets = targets.concat(Array.prototype.slice.call(icon.querySelectorAll("path, circle, rect, polygon, ellipse, line, polyline")));
          targets.forEach(function (el) {
            var fillAttr = el.getAttribute && el.getAttribute("fill");
            var strokeAttr = el.getAttribute && el.getAttribute("stroke");
            if (active) {
              if (el === icon) el.style.color = color;
              if (isSvg && (el === icon || (fillAttr && fillAttr !== "none"))) el.style.fill = color;
              if (isSvg && strokeAttr && strokeAttr !== "none") el.style.stroke = color;
            } else {
              el.style.removeProperty("color");
              el.style.removeProperty("fill");
              el.style.removeProperty("stroke");
            }
          });
        });
      }
      painters.push(paintIcon);

      var activeKey = "wl_btn_active:" + customerId + ":" + handle;
      function cacheActive(v) {
        try { if (v) localStorage.setItem(activeKey, "1"); else localStorage.removeItem(activeKey); } catch (_) {}
      }
      // Show the last known saved state right away on refresh; the server
      // check below then confirms or corrects it.
      try {
        if (localStorage.getItem(activeKey) === "1") {
          btn.classList.add("active");
          setBtnLabel(btn, removeText);
          paintIcon();
        }
      } catch (_) {}

      applyDisabledState(btn);

      // Every variant of this product that is currently saved. This button
      // can't know which variant a shopper picked, so it reads the whole
      // wishlist and treats the product as saved if ANY variant is in it. That
      // works the same on every server version.
      var savedVariants = [];

      function refreshState(silent) {
        if (!productId) return;
        var listUrl = proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) +
          "&customerId=" + encodeURIComponent(customerId);
        return fetch(listUrl)
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (!d || !d.wishlist) throw new Error("wishlist unavailable");
            var items = d.wishlist.items || [];
            savedVariants = items
              .filter(function (i) { return String(i.productId) === String(productId); })
              .map(function (i) { return i.variantId || null; });
            isActive = savedVariants.length > 0;
            btn.classList.toggle("active", isActive);
            setBtnLabel(btn, isActive ? removeText : addText);
            cacheActive(isActive);
            paintIcon();
            ready = true;
          })
          .catch(function (err) {
            if (!silent) console.error(LOG, "refreshState failed", err);
          });
      }

      getProductInfo(handle).then(function (info) {
        productId = info.productId;
        variantId = info.variantId;
        registry.push({ btn: btn, refreshState: function () { refreshState(true); } });
        return refreshState(false);
      }).catch(function (err) {
        console.error(LOG, "setup chain failed for button, click will stay inert", err);
      });

      btn.addEventListener("click", function () {
        if (!ready || btn.disabled) {
          return;
        }
        var action = isActive ? "remove" : "add";
        btn.classList.add("loading");

        function post(vid, act) {
          return fetch(proxyUrl + "/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shop: shop,
              customerId: customerId,
              productId: productId,
              variantId: vid,
              action: act
            })
          });
        }

        // Removing takes out every saved variant of the product, one request
        // per variant, so nothing is left behind to "come back" on refresh.
        var requests = action === "remove"
          ? (savedVariants.length ? savedVariants : [variantId]).map(function (vid) { return post(vid, "remove"); })
          : [post(variantId, "add")];

        Promise.all(requests)
          .then(function (responses) {
            var failed = responses.filter(function (r) { return !r.ok; })[0];
            if (failed) return failed.text().then(function (t) { console.error(LOG, "action failed body", t); });
            savedVariants = action === "add" ? [variantId] : [];
            isActive = !isActive;
            btn.classList.toggle("active", isActive);
            setBtnLabel(btn, isActive ? removeText : addText);
            cacheActive(isActive);
            paintIcon();
            if (window.__wlBumpBadge) window.__wlBumpBadge(action === "add" ? 1 : -1);
            if (window.__wlRefreshBadge) window.__wlRefreshBadge();

            var imgEl = document.querySelector('#mainPreview img, .grid__item.product__media-wrapper img, .amn-wraper img, .product__media img, .product-media img, .product__photo img, .product-featured-media img, [class*="product"] .media img');
            var titleEl = document.querySelector('h1.product__title, h1[class*="product"], .product__title h1, h1');
            var imgSrc = imgEl ? imgEl.src : null;
            var productName = titleEl ? titleEl.textContent.trim() : null;
            wlToast(
              action === "add" ? "Added to Wishlist" : "Removed from Wishlist",
              action === "add" ? "add" : "remove",
              imgSrc,
              productName
            );
          })
          .catch(function (err) { console.error(LOG, "action request errored", err); })
          .finally(function () { btn.classList.remove("loading"); });
      });
    }

    function findAllMatches() {
      var seen = new Set();
      var results = [];
      document.querySelectorAll(selector).forEach(function (el) {
        if (!seen.has(el)) { seen.add(el); results.push(el); }
      });
      if (customMatcher) {
        var matched = customMatcher.type === "css"
          ? document.querySelectorAll(customMatcher.selector)
          : Array.prototype.filter.call(
              document.querySelectorAll(customMatcher.tag),
              function (el) { return (el.textContent || "").trim() === customMatcher.text; }
            );
        matched.forEach(function (el) {
          if (!seen.has(el)) { seen.add(el); results.push(el); }
        });
      }
      return results;
    }

    function scan() {
      var found = findAllMatches();
      found.forEach(setupButton);
    }

    // Set up buttons matching the default selector right away instead of
    // waiting for the settings request; scan() runs again once it finishes
    // to pick up any button matched from the pasted HTML.
    scan();

    var settingsUrl = proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&action=settings";
    fetch(settingsUrl)
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        hasActivePlan = d.hasActivePlan !== false;
        if (d.settings) {
          var iconColor = d.settings.customIconColor || d.settings.activeColor;
          if (iconColor) {
            document.documentElement.style.setProperty("--wl-icon-color", iconColor);
            try { localStorage.setItem(ICON_COLOR_KEY, iconColor); } catch (_) {}
            painters.forEach(function (paint) { paint(); });
          }
          if (d.settings.customCss && !document.getElementById("wl-custom-css")) {
            var cssEl = document.createElement("style");
            cssEl.id = "wl-custom-css";
            cssEl.textContent = d.settings.customCss;
            document.head.appendChild(cssEl);
          }
        }
        if (d.settings && d.settings.customWishlistButtonHtml) {
          customMatcher = deriveMatcher(d.settings.customWishlistButtonHtml);
        }
        if (hasActivePlan === false) {
          findAllMatches().forEach(applyDisabledState);
        }
      })
      .catch(function (err) {
        console.error(LOG, "settings fetch failed, assuming plan active", err);
        hasActivePlan = true;
      })
      .finally(scan);

    // Some product pages build their content client-side after an async
    // fetch (e.g. a custom variant-picker that fetches its own data before
    // inserting its markup), so the button may not exist yet on the first
    // scan. Watch for it appearing later and pick it up automatically.
    var scanTimer = null;
    var observer = new MutationObserver(function (mutations) {
      var hasNew = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) { hasNew = true; break; }
      }
      if (!hasNew) return;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(scan, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-check every registered button's state whenever the page becomes
  // visible again (e.g. navigating back from the collection page via
  // browser back/forward, which often restores from bfcache without
  // re-running init at all) so a stale "Add to Wishlist" doesn't linger
  // after the item was actually added elsewhere.
  window.addEventListener("pageshow", function () {
    registry.forEach(function (entry) { entry.refreshState(); });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      registry.forEach(function (entry) { entry.refreshState(); });
    }
  });
})();
