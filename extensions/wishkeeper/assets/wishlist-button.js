(function () {

  // ─── Toast ───────────────────────────────────────────────────────────────
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

  var wrappers = document.querySelectorAll(".wl-btn-wrapper");

  wrappers.forEach(function (wrapper) {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = "true";

    var btn = wrapper.querySelector(".wl-btn");
    var textEl = wrapper.querySelector(".wl-btn-text");
    var productId = wrapper.dataset.productId;
    var variantId = wrapper.dataset.variantId;
    var shop = wrapper.dataset.shop;
    var proxyUrl = wrapper.dataset.proxyUrl;
    var customerId = wrapper.dataset.customerId;
    var isActive = false;

    var textAdd = wrapper.dataset.textAdd || "Add to Wishlist";
    var textRemove = wrapper.dataset.textRemove || "Remove from Wishlist";
    var textAdded = wrapper.dataset.textAdded || "In Wishlist";
    var textAddedToast = wrapper.dataset.textAddedToast || "Added to Wishlist";
    var textRemovedToast = wrapper.dataset.textRemovedToast || "Removed from Wishlist";
    var textSubscribe = wrapper.dataset.textSubscribe || "Subscribe to WishKeeper to enable wishlists";

    var GUEST_KEY = "wishlist_guest_id";

    function getGuestId() {
      var id = localStorage.getItem(GUEST_KEY);
      if (!id) {
        id = "guest_" + crypto.randomUUID();
        localStorage.setItem(GUEST_KEY, id);
      }
      return id;
    }

    if (!customerId) {
      customerId = getGuestId();
    } else {
      var guestId = localStorage.getItem(GUEST_KEY);
      if (guestId) {
        fetch(proxyUrl + "/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop: shop, customerId: customerId, guestId: guestId, action: "merge" })
        }).then(function () { localStorage.removeItem(GUEST_KEY); });
      }
    }

    function setActive(active) {
      isActive = active;
      btn.classList.toggle("active", active);
      if (textEl) textEl.textContent = active ? textAdded : textAdd;
      btn.setAttribute("aria-label", active ? textRemove : textAdd);
      applyIcon(active);
    }

    var ICON_PATHS = {
      "heart-filled":  { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "currentColor", sw: 2 },
      "heart-outline": { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "none", sw: 2 },
      "heart-bold":    { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "currentColor", sw: 3 },
      "heart-thin":    { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "none", sw: 1 },
      "heart-medium":  { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "none", sw: 1.5 },
      "heart-light":   { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "rgba(255,255,255,0.3)", sw: 1.5 },
      "heart-stroke":  { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "none", sw: 2.5 },
      "heart-small":   { path: "M16 4.5a4 4 0 0 1 0 5.66L12 14l-4-3.84A4 4 0 0 1 8 4.5a4 4 0 0 1 5.66 0L12 3.83l-.34-.34A4 4 0 0 1 16 4.5z", fill: "none", sw: 2 },
      "gift":          { path: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z", fill: "none", sw: 1.5 },
      "bell":          { path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0", fill: "none", sw: 1.5 },
      "gift-alt":      { path: "M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3zM12 6V22M2 12h20", fill: "none", sw: 1.5 },
      "star-outline":  { path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", fill: "none", sw: 1.5 },
      "star-filled":   { path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", fill: "currentColor", sw: 1.5 },
      "heart-fancy":   { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "currentColor", sw: 1.5 },
      "heart-open":    { path: "M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z", fill: "none", sw: 1.5 },
      "heart-ring":    { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill: "none", sw: 2 },
      "lock":          { path: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4", fill: "none", sw: 1.5 },
      "bookmark-outline": { path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", fill: "none", sw: 2 },
      "bookmark-filled":  { path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", fill: "currentColor", sw: 2 },
    };

    var LOADING_PATHS = {
      "ring":        '<circle cx="12" cy="12" r="9" stroke-dasharray="14 42"/>',
      "half-ring":   '<path d="M12 3a9 9 0 0 1 9 9"/>',
      "arc":         '<path d="M12 3a9 9 0 0 1 6.36 2.64"/>',
      "dotted-ring": '<circle cx="12" cy="3" r="1"/><circle cx="19.8" cy="7.5" r="1"/><circle cx="21" cy="12" r="1" opacity=".5"/><circle cx="16.5" cy="20.8" r="1" opacity=".3"/>',
      "square-spin": '<rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="20 52"/>',
      "refresh":     '<path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>',
      "dots":        '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2" opacity=".5"/><circle cx="19" cy="12" r="2" opacity=".25"/>',
      "cloud":       '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
      "clock":       '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
      "circle-dots": '<circle cx="12" cy="12" r="9" stroke-dasharray="3 6"/>',
      "gear":        '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>',
      "pulse":       '<path d="M2 12h4l3-9 4 18 3-9h6"/>',
    };

    var wlSettings = { loadingIcon: "ring", notAddedIcon: "heart-outline", addedIcon: "heart-filled", loadingIconColor: "#6b7280" };

    var HEART_PATH = "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

    // Icon-only style: the saved color only shows while the product is in the
    // wishlist; otherwise the icon falls back to the button's neutral grey.
    var isIconOnlyBtn = btn.classList.contains("wl-btn--icon");

    function applyIcon(active) {
      var svgEl = btn.querySelector("svg");
      if (!svgEl) return;
      if (wlSettings.customIconSvg && wlSettings.customIconSvg.trim()) return;
      var color = wlSettings.customIconColor || "#e74c6f";
      svgEl.setAttribute("fill", active ? color : "none");
      svgEl.setAttribute("stroke", isIconOnlyBtn && !active ? "currentColor" : color);
      svgEl.setAttribute("stroke-width", "2");
      var pathEl = svgEl.querySelector("path");
      if (!pathEl) { pathEl = document.createElementNS("http://www.w3.org/2000/svg","path"); svgEl.appendChild(pathEl); }
      var iconKey = active ? wlSettings.addedIcon : wlSettings.notAddedIcon;
      var iconDef = ICON_PATHS[iconKey];
      pathEl.setAttribute("d", iconDef ? iconDef.path : HEART_PATH);
      wrapper.style.setProperty("--wl-active", color);
    }

    if (!document.getElementById("wl-custom-css")) {
      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&action=settings")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.hasActivePlan === false) {
            btn.disabled = true;
            btn.style.opacity = "0.35";
            btn.style.cursor = "not-allowed";
            btn.title = textSubscribe;
            return;
          }
          if (d.settings) {
            if (d.settings.customCss) {
              var style = document.createElement("style");
              style.id = "wl-custom-css";
              style.textContent = d.settings.customCss;
              document.head.appendChild(style);
            }
            wlSettings.loadingIcon = d.settings.loadingIcon || "ring";
            wlSettings.notAddedIcon = d.settings.notAddedIcon || "heart-outline";
            wlSettings.addedIcon = d.settings.addedIcon || "heart-filled";
            wlSettings.loadingIconColor = d.settings.loadingIconColor || "#6b7280";
            wlSettings.customIconSvg = d.settings.customIconSvg || "";
            wlSettings.customIconColor = d.settings.customIconColor || d.settings.activeColor || "#e74c6f";
            wrapper.style.setProperty("--wl-active", wlSettings.customIconColor);

            var btnI18n = {
              de: { add: "Zur Wunschliste hinzufügen", remove: "Von der Wunschliste entfernen", added: "Auf der Wunschliste", addedToast: "Zur Wunschliste hinzugefügt", removedToast: "Von der Wunschliste entfernt" },
              es: { add: "Añadir a la lista de deseos", remove: "Eliminar de la lista de deseos", added: "En la lista de deseos", addedToast: "Añadido a la lista de deseos", removedToast: "Eliminado de la lista de deseos" },
              fr: { add: "Ajouter à la liste de souhaits", remove: "Retirer de la liste de souhaits", added: "Dans la liste de souhaits", addedToast: "Ajouté à la liste de souhaits", removedToast: "Retiré de la liste de souhaits" },
              it: { add: "Aggiungi alla lista dei desideri", remove: "Rimuovi dalla lista dei desideri", added: "Nella lista dei desideri", addedToast: "Aggiunto alla lista dei desideri", removedToast: "Rimosso dalla lista dei desideri" }
            };
            var lang = ((d.settings.language || '') + '').split('-')[0].toLowerCase();
            if (btnI18n[lang]) {
              textAdd = btnI18n[lang].add;
              textRemove = btnI18n[lang].remove;
              textAdded = btnI18n[lang].added;
              textAddedToast = btnI18n[lang].addedToast;
              textRemovedToast = btnI18n[lang].removedToast;
              if (textEl) textEl.textContent = isActive ? textAdded : textAdd;
              btn.setAttribute("aria-label", isActive ? textRemove : textAdd);
            }

            if (wlSettings.customIconSvg.trim()) {
              var div = document.createElement("div");
              div.innerHTML = wlSettings.customIconSvg.trim();
              var newSvg = div.querySelector("svg");
              if (newSvg) {
                newSvg.removeAttribute("width");
                newSvg.removeAttribute("height");
                newSvg.style.width = "1em";
                newSvg.style.height = "1em";
                if (!isIconOnlyBtn) newSvg.style.color = wlSettings.customIconColor;
                newSvg.style.fill = "currentColor";
                var oldSvg = btn.querySelector("svg");
                if (oldSvg) btn.replaceChild(newSvg, oldSvg);
              }
            } else {
              applyIcon(isActive);
            }
          }
        })
        .catch(function () {});
    }

    var initialCheckDone = false;
    var checkSeq = 0;

    function refreshActiveState(silent) {
      if (!silent) btn.classList.add("loading");
      var seq = ++checkSeq;
      var url = proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId) + "&productId=" + encodeURIComponent(productId) + "&action=check";
      if (variantId) url += "&variantId=" + encodeURIComponent(variantId);
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) { if (seq === checkSeq) setActive(!!data.inWishlist); })
        .catch(function () { })
        .finally(function () { initialCheckDone = true; if (!silent) btn.classList.remove("loading"); });
    }

    refreshActiveState();

    function handleVariantChange(newVariantId) {
      newVariantId = newVariantId ? String(newVariantId) : null;
      if (!newVariantId || newVariantId === variantId) return;
      variantId = newVariantId;
      wrapper.dataset.variantId = variantId;
      initialCheckDone = false;
      refreshActiveState();
    }

    function readVariantFromUrl() {
      try {
        return new URLSearchParams(window.location.search).get("variant");
      } catch (e) {
        return null;
      }
    }

    document.addEventListener("change", function (e) {
      var t = e.target;
      if (t && t.name === "id" && t.value && t.closest('form[action*="/cart/add"]')) {
        handleVariantChange(t.value);
      }
    });

    document.addEventListener("variant:change", function (e) {
      var v = e.detail && e.detail.variant;
      if (v && v.id) handleVariantChange(v.id);
    });

    if (!window.__wlHistoryPatched) {
      window.__wlHistoryPatched = true;
      ["pushState", "replaceState"].forEach(function (method) {
        var original = history[method];
        history[method] = function () {
          var ret = original.apply(this, arguments);
          window.dispatchEvent(new Event("wl:urlchange"));
          return ret;
        };
      });
    }

    window.addEventListener("wl:urlchange", function () {
      var v = readVariantFromUrl();
      if (v) handleVariantChange(v);
    });

    // Fallback for themes that swap the variant without firing any event at
    // all (custom/legacy variant pickers): poll the hidden cart-form field
    // directly so the button still catches up.
    function isPlausibleVariantId(v) {
      return !!v && /^\d{5,}$/.test(String(v));
    }

    function pollVariantFromDom() {
      var field = document.querySelector('form[action*="/cart/add"] [name="id"]');
      if (field && isPlausibleVariantId(field.value)) {
        handleVariantChange(field.value);
        return;
      }
      var urlVariant = readVariantFromUrl();
      if (isPlausibleVariantId(urlVariant)) handleVariantChange(urlVariant);
    }

    setInterval(function () {
      if (document.visibilityState === "visible") pollVariantFromDom();
    }, 400);

    window.addEventListener("pageshow", function () {
      refreshActiveState(true);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") refreshActiveState(true);
    });

    setInterval(function () {
      if (document.visibilityState === "visible") refreshActiveState(true);
    }, 6000);

    btn.addEventListener("click", function () {
      if (!initialCheckDone) return;
      checkSeq++;
      btn.classList.add("loading");
      var action = isActive ? "remove" : "add";
      setActive(!isActive);

      if (action === "add") {
        btn.classList.add("wl-clicked");

        var r1 = document.createElement("span");
        r1.className = "wl-ripple-ring";
        btn.appendChild(r1);
        r1.addEventListener("animationend", function () { r1.remove(); });

        var r2 = document.createElement("span");
        r2.className = "wl-ripple-ring wl-ripple-ring--2";
        btn.appendChild(r2);
        r2.addEventListener("animationend", function () { r2.remove(); });

        setTimeout(function () { btn.classList.remove("wl-clicked"); }, 750);
      }

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
          if (!res.ok) { setActive(isActive); return; }
          var imgEl = document.querySelector('.product__media img, .product-media img, .product__photo img, .product-featured-media img, [class*="product"] .media img');
          var titleEl = document.querySelector('h1.product__title, h1[class*="product"], .product__title h1, h1');
          var imgSrc = imgEl ? imgEl.src : null;
          var productName = titleEl ? titleEl.textContent.trim() : null;
          wlToast(action === "add" ? textAddedToast : textRemovedToast, action === "add" ? "add" : "remove", imgSrc, productName);
          if (window.__wlBumpBadge) window.__wlBumpBadge(action === "add" ? 1 : -1);
          if (window.__wlRefreshBadge) window.__wlRefreshBadge();
        })
        .catch(function () { setActive(isActive); })
        .finally(function () { btn.classList.remove("loading"); });
    });
  });
})();
















