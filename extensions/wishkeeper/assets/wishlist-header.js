(function () {
  function init() {
    var shop = window.__wlHeaderConfig && window.__wlHeaderConfig.shop;
    var proxyUrl = window.__wlHeaderConfig && window.__wlHeaderConfig.proxyUrl;
    var customerId = window.__wlHeaderConfig && window.__wlHeaderConfig.customerId;
    var activeColor = (window.__wlHeaderConfig && window.__wlHeaderConfig.activeColor) || "#e74c6f";
    var iconStyle = (window.__wlHeaderConfig && window.__wlHeaderConfig.iconStyle) || "heart";

    var GUEST_KEY = "wishlist_guest_id";
    if (!customerId) {
      try {
        customerId = localStorage.getItem(GUEST_KEY);
        if (!customerId) {
          var guestId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
          customerId = "guest_" + guestId;
          localStorage.setItem(GUEST_KEY, customerId);
        }
      } catch (_) {
        customerId = "guest_" + String(Date.now()) + Math.random().toString(36).slice(2);
      }
    }

    var svgPaths = {
      heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
      bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
      star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      gift: '<path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>'
    };

    var CACHE_KEY = "wl_header_icon_cache";
    var cachedSettings = null;
    try {
      var rawCache = localStorage.getItem(CACHE_KEY);
      if (rawCache) cachedSettings = JSON.parse(rawCache);
    } catch (_) {}

    var initialColor = (cachedSettings && (cachedSettings.customIconColor || cachedSettings.activeColor)) || activeColor;
    var initialIconStyle = (cachedSettings && cachedSettings.iconStyle) || iconStyle;
    var initialSvgInner = svgPaths[initialIconStyle] || svgPaths.heart;
    var initialCustomSvg = cachedSettings && cachedSettings.customIconSvg;
    var initialHeaderEnabled = !cachedSettings || cachedSettings.headerIconEnabled !== false;
    var disabledByMerchant = !initialHeaderEnabled;
    console.log("[WL DEBUG] init start. cachedSettings:", cachedSettings, "disabledByMerchant:", disabledByMerchant);

    function buildIconHtml() {
      if (initialCustomSvg && initialCustomSvg.trim()) {
        var div = document.createElement("div");
        div.innerHTML = initialCustomSvg.trim();
        var svgEl = div.querySelector("svg");
        if (svgEl) {
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.style.width = "22px";
          svgEl.style.height = "22px";
          svgEl.style.color = initialColor;
          svgEl.style.fill = "currentColor";
          return svgEl.outerHTML;
        }
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="' + initialColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block !important;visibility:visible !important;opacity:1 !important;stroke:' + initialColor + ' !important;fill:none !important;">' + initialSvgInner + '</svg>';
    }

    function createLink() {
      if (disabledByMerchant) return null;

      var link = document.createElement("a");
      link.href = "/apps/wishlist/page";
      link.id = "wl-header-link";
      link.className = "wl-header-icon-link header-actions__action";
      link.setAttribute("aria-label", "Wishlist");
      link.style.cssText = "position:relative;display:inline-flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;height:44px;color:" + initialColor + " !important;visibility:visible !important;opacity:1 !important;text-decoration:none;border:0 !important;outline:0 !important;box-shadow:none !important;transition:color 0.2s;z-index:2;margin:0 4px;";
      link.innerHTML =
        buildIconHtml() +
        '<span id="wl-hdr-badge" style="position:absolute;top:2px;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:' + initialColor + ';color:white;font-size:10px;font-weight:700;line-height:18px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:none;">0</span>';
      return link;
    }

    function insertIcon(forceFallback) {
      try {
        var result = doInsertIcon(forceFallback);
        var el = document.getElementById("wl-header-link");

        if (result && el && el.parentElement !== document.body) {
          var checkRect = el.getBoundingClientRect();
          if (checkRect.width === 0 && checkRect.height === 0) {
            el.remove();
            result = false;
          }
        }

        console.log("[WL DEBUG] insertIcon result:", result, "forceFallback:", !!forceFallback);
        return result;
      } catch (err) {
        console.log("[WL DEBUG] insertIcon threw:", err && err.message);
        return false;
      }
    }

    function doInsertIcon(forceFallback) {
      if (disabledByMerchant) return true;
      if (document.getElementById("wl-header-link")) return true;

      var selectors = [
        "header-actions",
        ".header__column--right",
        "header .header__icons",
        ".header__icons",
        "header .site-header__icons",
        ".site-header__icons",
        ".header-icons",
        ".header__icon-list",
        ".header__utilities",
        ".header__controls",
        "header .utility-bar",
        ".header-inner",
      ];

      var container = null;
      for (var i = 0; i < selectors.length; i++) {
        container = document.querySelector(selectors[i]);
        if (container) break;
      }

      if (!container) {
        var cartLink = document.querySelector('header a[href="/cart"], .header a[href="/cart"], header .cart-toggle, .header .cart-toggle');
        if (cartLink) container = cartLink.parentElement;
      }

      if (!container && forceFallback) {
        var anyCartLink = document.querySelector('a[href="/cart"], a[href*="/cart"], .cart-toggle, [data-cart-toggle], [data-cart-icon]');
        container = (anyCartLink && anyCartLink.parentElement) || document.body;
      }

      if (!container) return false;

      var link = createLink();
      if (!link) return true;

      if (container === document.body) {
        link.style.position = "fixed";
        link.style.top = "16px";
        link.style.right = "16px";
        link.style.zIndex = "9999";
        document.body.appendChild(link);
        return true;
      }

      var cartEl = container.querySelector('a[href="/cart"], .action__cart, .header__icon--cart, [data-cart-icon], .cart-toggle, [data-cart-toggle]');
      var positionTarget = (cartEl && cartEl.parentElement) || container;
      var positionTargetStyle = window.getComputedStyle(positionTarget).position;
      if (positionTargetStyle === "static") positionTarget.style.position = "relative";

      if (cartEl && cartEl.parentElement) {
        cartEl.parentElement.insertBefore(link, cartEl);
      } else {
        container.appendChild(link);
      }
      return true;
    }

    var inserted = false;

    var observer = new MutationObserver(function () {
      if (disabledByMerchant) return;
      if (!document.getElementById("wl-header-link")) {
        inserted = false;
      }
      if (!inserted) {
        inserted = insertIcon();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    inserted = insertIcon();

    setTimeout(function () {
      if (!disabledByMerchant && !document.getElementById("wl-header-link")) {
        insertIcon(true);
      }
    }, 4000);

    setTimeout(function () { observer.disconnect(); }, 10000);

    function applyIconAppearance(settings) {
      var link = document.getElementById("wl-header-link");
      if (!link) return;
      var svgEl = link.querySelector("svg");
      var badge = document.getElementById("wl-hdr-badge");
      var color = settings.customIconColor || settings.activeColor || activeColor;

      if (settings.customIconSvg && settings.customIconSvg.trim() && svgEl) {
        var div = document.createElement("div");
        div.innerHTML = settings.customIconSvg.trim();
        var newSvg = div.querySelector("svg");
        if (newSvg) {
          newSvg.removeAttribute("width");
          newSvg.removeAttribute("height");
          newSvg.style.width = "22px";
          newSvg.style.height = "22px";
          newSvg.style.color = color;
          newSvg.style.fill = "currentColor";
          link.replaceChild(newSvg, svgEl);
        }
      } else if (settings.iconStyle && svgPaths[settings.iconStyle] && svgEl) {
        svgEl.innerHTML = svgPaths[settings.iconStyle];
        svgEl.setAttribute("stroke", color);
        svgEl.style.stroke = color;
      }

      if (badge) badge.style.background = color;
    }

    if (proxyUrl && shop) {
      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&action=settings")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.settings) return;

          if (d.settings.customCss && !document.getElementById("wl-custom-css")) {
            var customStyle = document.createElement("style");
            customStyle.id = "wl-custom-css";
            customStyle.textContent = d.settings.customCss;
            document.head.appendChild(customStyle);
          }

          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              headerIconEnabled: d.settings.headerIconEnabled,
              iconStyle: d.settings.iconStyle,
              customIconSvg: d.settings.customIconSvg,
              customIconColor: d.settings.customIconColor,
              activeColor: d.settings.activeColor,
            }));
          } catch (_) {}

          if (d.settings.headerIconEnabled === false) {
            disabledByMerchant = true;
            var link = document.getElementById("wl-header-link");
            if (link) link.remove();
            observer.disconnect();
            return;
          }

          if (disabledByMerchant) {
            disabledByMerchant = false;
            inserted = insertIcon();
          }
          applyIconAppearance(d.settings);
        })
        .catch(function () {});
    }

    // Fetch badge count with localStorage cache
    if (customerId) {
      var cacheKey = "wl_count_" + customerId;
      var cached = localStorage.getItem(cacheKey);

      // Show cached count immediately
      if (cached) {
        var badge = document.getElementById("wl-hdr-badge");
        var cachedCount = parseInt(cached) || 0;
        if (cachedCount > 0 && badge) {
          badge.textContent = cachedCount > 99 ? "99+" : cachedCount;
          badge.style.display = "block";
        }
      }

      // Fetch fresh count in background
      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId) + "&action=count")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var badge = document.getElementById("wl-hdr-badge");
          if (badge) {
            var count = data.count || 0;
            localStorage.setItem(cacheKey, count);
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = count > 0 ? "block" : "none";
          }
        })
        .catch(function () { });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
