/* ── Shared WishKeeper runtime ─────────────────────────────────────────────
   Identical in every block script; the first one to load installs it and the
   rest reuse it. Before this existed each block fetched settings itself and
   ran its own setInterval, so a theme with four blocks enabled made four
   settings requests on load and ran four independent poll timers against the
   app proxy. Everything here is per-page-load state only. */
(function () {
  if (window.__wlCore) return;
  var core = {
    // Background polling is OFF by default. Everything the merchant actually
    // sees is already event-driven: add/remove updates the badge and every
    // heart in this tab directly, and visibilitychange/pageshow re-sync from
    // the server whenever the tab is focused again -- which covers changes
    // made on another device. The only case a timer adds is two tabs visible
    // side by side, which does not justify a request on every page forever.
    // A store that wants it can set window.__wlPollMs (ms, 5s floor) before
    // the block scripts load.
    pollMs: Number(window.__wlPollMs) > 0 ? Math.max(5000, Number(window.__wlPollMs)) : 0,
    _ticks: [],
    _timer: null,
    _settings: null,
    _once: {},
  };

  // One settings request per page, shared by every block. Resolves to {} on
  // failure, which each caller already handles (they all guard on d.settings).
  core.settings = function (proxyUrl, shop) {
    if (!core._settings) {
      core._settings = fetch(
        proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&action=settings"
      )
        .then(function (r) { return r.json(); })
        .catch(function () { return {}; });
    }
    return core._settings;
  };

  // One timer for every block. Callbacks run only while the tab is visible,
  // which is what each block's own interval used to check for itself.
  core.onTick = function (fn) {
    core._ticks.push(fn);
    if (!core.pollMs) return; // polling disabled: focus/visibility only
    if (core._timer) return;
    core._timer = setInterval(function () {
      if (document.visibilityState !== "visible") return;
      for (var i = 0; i < core._ticks.length; i++) {
        try { core._ticks[i](); } catch (e) {}
      }
    }, core.pollMs);
  };

  // Throttle for refocus re-syncs. Every block listens for visibilitychange,
  // so one alt-tab used to cost a request from each of them, and rapid
  // switching produced a burst. A shared window means the first block through
  // refreshes and the rest -- and any switch within the window -- are no-ops.
  core.refocusMs = 15000;
  core._lastSync = 0;
  core.shouldResync = function () {
    var now = Date.now();
    if (now - core._lastSync < core.refocusMs) return false;
    core._lastSync = now;
    return true;
  };

  // Which language the widget should speak. The shopper browsing /es/ is the
  // authority, not the store-wide setting: a store using Shopify Markets
  // translations has many locales but only one setting value, so following
  // the setting alone left Spanish shoppers reading English toasts. Order:
  // the locale Liquid passed in, then the <html lang> the theme rendered,
  // then the merchant setting, then English.
  core.lang = function (settingsLanguage) {
    var fromConfig =
      (window.__wlCollectionConfig && window.__wlCollectionConfig.locale) ||
      (window.__wlHeaderConfig && window.__wlHeaderConfig.locale) ||
      (window.__wlCustomBtnConfig && window.__wlCustomBtnConfig.locale) ||
      (window.__wlBtnConfig && window.__wlBtnConfig.locale) || "";
    var fromHtml = "";
    try { fromHtml = document.documentElement.getAttribute("lang") || ""; } catch (e) {}
    var pick = fromConfig || fromHtml || settingsLanguage || "";
    return String(pick).split("-")[0].toLowerCase();
  };

  // Small localStorage cache so the hearts and the badge can paint with the
  // rest of the page instead of popping in after a proxy round trip. Values
  // are painted immediately and then reconciled when the real response lands,
  // so a stale entry is corrected within the same second. Never throws:
  // private mode and blocked storage just mean no cache.
  core.cacheGet = function (key, maxAgeMs) {
    try {
      var raw = localStorage.getItem("wl.c." + key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (maxAgeMs && Date.now() - o.t > maxAgeMs) return null;
      return o.v;
    } catch (e) { return null; }
  };
  core.cacheSet = function (key, value) {
    try {
      localStorage.setItem("wl.c." + key, JSON.stringify({ t: Date.now(), v: value }));
    } catch (e) {}
  };

  // Guard for work that must happen once per page even when a theme loads the
  // same block twice (a desktop and a mobile header, typically).
  core.once = function (key) {
    if (core._once[key]) return false;
    core._once[key] = true;
    return true;
  };

  window.__wlCore = core;
})();

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
    var displayMode = (cachedSettings && cachedSettings.wishlistDisplayMode) || "page";

    function openWishlistDrawer() {
      var existing = document.getElementById("wl-drawer-overlay");
      if (existing) {
        existing.style.opacity = "1"; existing.style.pointerEvents = "auto";
        var existingPanel = existing.querySelector("#wl-drawer-panel");
        if (existingPanel) { existingPanel.style.transform = "scale(1)"; existingPanel.style.opacity = "1"; }
        return;
      }

      var overlay = document.createElement("div");
      overlay.id = "wl-drawer-overlay";
      overlay.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,0.45);opacity:0;transition:opacity 0.25s ease;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;";

      var panel = document.createElement("div");
      panel.id = "wl-drawer-panel";
      panel.style.cssText = "position:relative;width:min(760px,94vw);max-height:min(680px,90vh);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.25);transform:scale(0.94);opacity:0;transition:transform 0.25s ease,opacity 0.25s ease;display:flex;flex-direction:column;overflow:hidden;";

      var closeBtn = document.createElement("button");
      closeBtn.setAttribute("type", "button");
      closeBtn.setAttribute("aria-label", "Close wishlist");
      closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      closeBtn.style.cssText = "position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;border-radius:50%;border:none;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#1a1612;";
      closeBtn.onclick = closeWishlistDrawer;

      var content = document.createElement("div");
      content.id = "wl-drawer-content";
      content.style.cssText = "flex:1;width:100%;height:100%;overflow-y:auto;";
      content.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:280px;">' +
          '<div style="position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;">' +
            '<span style="font-family:Georgia,serif;font-weight:700;font-size:26px;color:#b8922a;opacity:0.85;">W</span>' +
            '<span style="position:absolute;inset:0;animation:wl-drawer-orbit 1s linear infinite;">' +
              '<span style="position:absolute;top:-2px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#b8922a;box-shadow:0 0 8px rgba(184,146,42,0.55);"></span>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<style>@keyframes wl-drawer-orbit{to{transform:rotate(360deg)}}</style>';

      panel.appendChild(closeBtn);
      panel.appendChild(content);
      overlay.appendChild(panel);
      overlay.onclick = function (e) { if (e.target === overlay) closeWishlistDrawer(); };
      document.body.appendChild(overlay);

      requestAnimationFrame(function () {
        overlay.style.opacity = "1";
        panel.style.transform = "scale(1)";
        panel.style.opacity = "1";
      });

      fetch("/apps/wishlist/page?embed=1")
        .then(function (r) { return r.text(); })
        .then(function (html) {
          content.innerHTML = html;
          var scripts = content.querySelectorAll("script");
          for (var i = 0; i < scripts.length; i++) {
            var old = scripts[i];
            var fresh = document.createElement("script");
            for (var a = 0; a < old.attributes.length; a++) {
              fresh.setAttribute(old.attributes[a].name, old.attributes[a].value);
            }
            fresh.textContent = old.textContent;
            old.parentNode.replaceChild(fresh, old);
          }
        })
        .catch(function () {
          content.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:13px;">Could not load your wishlist. Please try again.</div>';
        });
    }

    function closeWishlistDrawer() {
      var overlay = document.getElementById("wl-drawer-overlay");
      if (!overlay) return;
      overlay.style.opacity = "0";
      var panel = document.getElementById("wl-drawer-panel");
      if (panel) { panel.style.transform = "scale(0.94)"; panel.style.opacity = "0"; }
      setTimeout(function () { if (overlay.parentElement) overlay.remove(); }, 250);
    }

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
      link.addEventListener("click", function (e) {
        if (displayMode === "popup") {
          e.preventDefault();
          if (window.location.pathname.indexOf("/apps/wishlist/page") === 0) {
            // Already on the standalone wishlist page itself — opening the
            // popup on top of it is redundant, so send the shopper home
            // and open the popup there instead.
            try { sessionStorage.setItem("wl_open_popup_on_load", "1"); } catch (_) {}
            window.location.href = "/";
            return;
          }
          openWishlistDrawer();
        }
      });
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

        return result;
      } catch (err) {
        console.error("[WishKeeper] header icon insertion failed:", err && err.message);
        return false;
      }
    }

    function doInsertIcon(forceFallback) {
      if (disabledByMerchant) return true;
      if (document.getElementById("wl-header-link")) return true;

      var manualSlot = document.getElementById("wl-manual-icon-slot");
      if (manualSlot) {
        var manualLink = createLink();
        if (!manualLink) return true;
        manualSlot.appendChild(manualLink);
        return true;
      }

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
        ".site-nav__icons",
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

    try {
      if (sessionStorage.getItem("wl_open_popup_on_load") === "1") {
        sessionStorage.removeItem("wl_open_popup_on_load");
        setTimeout(openWishlistDrawer, 200);
      }
    } catch (_) {}

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
      window.__wlCore.settings(proxyUrl, shop)
        .then(function (d) {
          if (!d.settings) return;

          if (d.settings.customCss && !document.getElementById("wl-custom-css")) {
            var customStyle = document.createElement("style");
            customStyle.id = "wl-custom-css";
            customStyle.textContent = d.settings.customCss;
            document.head.appendChild(customStyle);
          }

          displayMode = d.settings.wishlistDisplayMode || "page";

          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              headerIconEnabled: d.settings.headerIconEnabled,
              iconStyle: d.settings.iconStyle,
              customIconSvg: d.settings.customIconSvg,
              customIconColor: d.settings.customIconColor,
              activeColor: d.settings.activeColor,
              wishlistDisplayMode: d.settings.wishlistDisplayMode,
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

    // Live badge count, fetched fresh from the server every time. No
    // optimistic cache, no local increment/decrement math: any script on the
    // page can call window.__wlRefreshBadge() after an add/remove and the
    // badge will show the real, current, server-confirmed count.
    function refreshBadge() {
      if (!customerId) return;

      // Paint the last known count straight away so the badge arrives with
      // the header instead of appearing a round trip later. The server
      // response below overwrites it a moment afterwards either way.
      var cachedCount = window.__wlCore.cacheGet("count." + customerId);
      if (typeof cachedCount === "number") paintBadgeCount(cachedCount);

      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId) + "&action=count")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var count = data.count || 0;
          window.__wlCore.cacheSet("count." + customerId, count);
          paintBadgeCount(count);
        })
        .catch(function () { });
    }

    function paintBadgeCount(count) {
      var badge = document.getElementById("wl-hdr-badge");
      if (!badge) return;
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = count > 0 ? "block" : "none";
    }

    // An optimistic bump followed immediately by a server refresh could
    // show two different numbers a moment apart (a visible flicker) if the
    // guess didn't match reality. Instead, show a small spinner on the
    // badge itself for at least 1.5s and only ever reveal the real,
    // server-confirmed count once -- no intermediate guess is ever shown.
    var BADGE_LOADER_MS = 1500;
    var badgeLoaderStartedAt = null;
    if (!document.getElementById("wl-hdr-badge-spin-style")) {
      var spinStyle = document.createElement("style");
      spinStyle.id = "wl-hdr-badge-spin-style";
      spinStyle.textContent = "@keyframes wl-hdr-spin{to{transform:rotate(360deg)}}.wl-hdr-badge-spinner{display:inline-block;width:9px;height:9px;border:1.5px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:wl-hdr-spin 0.6s linear infinite;vertical-align:middle;}";
      document.head.appendChild(spinStyle);
    }

    window.__wlBumpBadge = function () {
      var badge = document.getElementById("wl-hdr-badge");
      if (!badge) return;
      badgeLoaderStartedAt = Date.now();
      badge.innerHTML = '<span class="wl-hdr-badge-spinner"></span>';
      badge.style.display = "block";
    };

    window.__wlRefreshBadge = function () {
      if (!customerId) return;
      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId) + "&action=count")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var count = data.count || 0;
          window.__wlCore.cacheSet("count." + customerId, count);
          var elapsed = badgeLoaderStartedAt ? Date.now() - badgeLoaderStartedAt : BADGE_LOADER_MS;
          var wait = Math.max(0, BADGE_LOADER_MS - elapsed);
          setTimeout(function () {
            badgeLoaderStartedAt = null;
            var badge = document.getElementById("wl-hdr-badge");
            if (!badge) return;
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = count > 0 ? "block" : "none";
          }, wait);
        })
        .catch(function () { badgeLoaderStartedAt = null; });
    };

    refreshBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("pageshow", function () {
    init();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && window.__wlCore.shouldResync()) init();
  });

  // Keep the badge genuinely live without re-running the full init (which
  // would re-create the icon-insertion MutationObserver every time). Runs on
  // the shared timer, and only once per page: a theme with a desktop and a
  // mobile header loads this script twice, which used to mean two timers
  // both refreshing the same badge.
  if (window.__wlCore.once("headerBadgeTick")) {
    window.__wlCore.onTick(function () {
      if (window.__wlRefreshBadge) window.__wlRefreshBadge();
    });
  }
})();
