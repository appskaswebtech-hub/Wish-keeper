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

  function init() {
    var cfg = window.__wlCustomBtnConfig;
    if (!cfg) { console.warn(LOG, "no config found on window.__wlCustomBtnConfig"); return; }
    console.log(LOG, "init start", cfg);

    var shop = cfg.shop;
    var proxyUrl = cfg.proxyUrl;
    var selector = cfg.selector || ".st-wishlist-button";
    var customerId = cfg.customerId;

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
      console.log(LOG, "using guest customerId", customerId);
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
      console.log(LOG, "fetching product info for handle", handle);
      productInfoCache[handle] = fetch("/products/" + encodeURIComponent(handle) + ".js")
        .then(function (r) {
          console.log(LOG, "/products/" + handle + ".js status", r.status);
          if (!r.ok) throw new Error("product fetch failed with status " + r.status);
          return r.json();
        })
        .then(function (p) {
          var info = {
            productId: String(p.id),
            variantId: p.variants && p.variants[0] ? String(p.variants[0].id) : null
          };
          console.log(LOG, "resolved product info", info);
          return info;
        })
        .catch(function (err) {
          console.error(LOG, "getProductInfo failed for handle", handle, err);
          throw err;
        });
      return productInfoCache[handle];
    }

    function applyDisabledState(btn) {
      if (hasActivePlan === false) {
        btn.disabled = true;
        btn.style.opacity = "0.35";
        btn.style.cursor = "not-allowed";
        console.log(LOG, "button disabled: no active plan", btn);
      }
    }

    function setupButton(btn) {
      if (btn.dataset.wlCustomInitialized) return;
      btn.dataset.wlCustomInitialized = "true";
      console.log(LOG, "setting up button", btn);

      var handle = btn.dataset.handle;
      if (!handle) { console.warn(LOG, "button has no data-handle, skipping", btn); return; }

      var addText = btn.dataset.textAdd || btn.textContent.trim() || "Add to Wishlist";
      var removeText = btn.dataset.textRemove || "In Wishlist";
      var isActive = false;
      var productId = null;
      var variantId = null;
      var ready = false;

      applyDisabledState(btn);

      function refreshState(silent) {
        if (!productId) return;
        var checkUrl = proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) +
          "&customerId=" + encodeURIComponent(customerId) +
          "&productId=" + encodeURIComponent(productId) + "&action=check";
        if (!silent) console.log(LOG, "checking wishlist state", checkUrl);
        return fetch(checkUrl)
          .then(function (r) { return r.json(); })
          .then(function (d) {
            isActive = !!d.inWishlist;
            btn.classList.toggle("active", isActive);
            btn.textContent = isActive ? removeText : addText;
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
        console.log(LOG, "click. ready =", ready, "disabled =", btn.disabled);
        if (!ready || btn.disabled) {
          console.warn(LOG, "click ignored: not ready yet or disabled");
          return;
        }
        var action = isActive ? "remove" : "add";
        btn.classList.add("loading");
        console.log(LOG, "sending action", action, "productId", productId, "variantId", variantId);

        fetch(proxyUrl + "/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop: shop,
            customerId: customerId,
            productId: productId,
            variantId: variantId,
            action: action
          })
        })
          .then(function (res) {
            console.log(LOG, "action response status", res.status);
            if (!res.ok) return res.text().then(function (t) { console.error(LOG, "action failed body", t); });
            isActive = !isActive;
            btn.classList.toggle("active", isActive);
            btn.textContent = isActive ? removeText : addText;
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

    function scan() {
      var found = document.querySelectorAll(selector);
      console.log(LOG, "scan found", found.length, "button(s) for selector", selector);
      found.forEach(setupButton);
    }

    var settingsUrl = proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&action=settings";
    console.log(LOG, "fetching settings", settingsUrl);
    fetch(settingsUrl)
      .then(function (r) {
        console.log(LOG, "settings response status", r.status);
        return r.json();
      })
      .then(function (d) {
        console.log(LOG, "settings response body", d);
        hasActivePlan = d.hasActivePlan !== false;
        if (hasActivePlan === false) {
          document.querySelectorAll(selector).forEach(applyDisabledState);
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
