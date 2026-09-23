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
      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId) + "&action=count")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var badge = document.getElementById("wl-hdr-badge");
          if (badge) {
            var count = data.count || 0;
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = count > 0 ? "block" : "none";
          }
        })
        .catch(function () { });
    }

    // Instant, no-network badge nudge: called right after an add/remove
    // succeeds so the count reflects the change immediately instead of
    // waiting on a second round-trip. refreshBadge() still runs afterward
    // (via the callers) to reconcile with the server.
    window.__wlBumpBadge = function (delta) {
      var badge = document.getElementById("wl-hdr-badge");
      if (!badge) return;
      var current = parseInt(badge.textContent, 10);
      if (isNaN(current)) current = 0;
      var next = Math.max(0, current + delta);
      badge.textContent = next > 99 ? "99+" : next;
      badge.style.display = next > 0 ? "block" : "none";
    };

    window.__wlRefreshBadge = refreshBadge;
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
    if (document.visibilityState === "visible") init();
  });

  // Keep the badge genuinely live without re-running the full init (which
  // would re-create the icon-insertion MutationObserver every time).
  setInterval(function () {
    if (document.visibilityState === "visible" && window.__wlRefreshBadge) {
      window.__wlRefreshBadge();
    }
  }, 6000);
})();
