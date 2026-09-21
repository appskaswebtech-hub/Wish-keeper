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

  var SHOP = window.__wlCollectionConfig && window.__wlCollectionConfig.shop;
  var PROXY = window.__wlCollectionConfig && window.__wlCollectionConfig.proxyUrl;
  var CUSTOMER_ID = window.__wlCollectionConfig && window.__wlCollectionConfig.customerId;
  var ACTIVE_COLOR = (window.__wlCollectionConfig && window.__wlCollectionConfig.activeColor) || "#e74c6f";
  var ICON_STYLE = (window.__wlCollectionConfig && window.__wlCollectionConfig.iconStyle) || "heart";
  var ICON_SIZE = (window.__wlCollectionConfig && window.__wlCollectionConfig.iconSize) || 36;
  var TEXT_ADD = (window.__wlCollectionConfig && window.__wlCollectionConfig.textAdd) || "Add to wishlist";
  var TEXT_REMOVE = (window.__wlCollectionConfig && window.__wlCollectionConfig.textRemove) || "Remove from wishlist";
  var TEXT_ADDED_TOAST = (window.__wlCollectionConfig && window.__wlCollectionConfig.textAddedToast) || "Added to Wishlist";
  var TEXT_REMOVED_TOAST = (window.__wlCollectionConfig && window.__wlCollectionConfig.textRemovedToast) || "Removed from Wishlist";

  var collI18n = {
    de: { add: "Zur Wunschliste hinzufügen", remove: "Von der Wunschliste entfernen", addedToast: "Zur Wunschliste hinzugefügt", removedToast: "Von der Wunschliste entfernt" },
    es: { add: "Añadir a la lista de deseos", remove: "Eliminar de la lista de deseos", addedToast: "Añadido a la lista de deseos", removedToast: "Eliminado de la lista de deseos" },
    fr: { add: "Ajouter à la liste de souhaits", remove: "Retirer de la liste de souhaits", addedToast: "Ajouté à la liste de souhaits", removedToast: "Retiré de la liste de souhaits" },
    it: { add: "Aggiungi alla lista dei desideri", remove: "Rimuovi dalla lista dei desideri", addedToast: "Aggiunto alla lista dei desideri", removedToast: "Rimosso dalla lista dei desideri" }
  };
  if (PROXY && SHOP) {
    fetch(PROXY + "/api/wishlist?shop=" + encodeURIComponent(SHOP) + "&action=settings")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var lang = ((d.settings && d.settings.language) || '').split('-')[0].toLowerCase();
        if (collI18n[lang]) {
          TEXT_ADD = collI18n[lang].add;
          TEXT_REMOVE = collI18n[lang].remove;
          TEXT_ADDED_TOAST = collI18n[lang].addedToast;
          TEXT_REMOVED_TOAST = collI18n[lang].removedToast;
        }
      })
      .catch(function () {});
  }
  var TEXT_SUBSCRIBE = (window.__wlCollectionConfig && window.__wlCollectionConfig.textSubscribe) || "Subscribe to WishKeeper to enable wishlists";
  var GUEST_KEY = "wishlist_guest_id";

  if (!CUSTOMER_ID) {
    try {
      CUSTOMER_ID = localStorage.getItem(GUEST_KEY);
      if (!CUSTOMER_ID) {
        var guestId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
        CUSTOMER_ID = "guest_" + guestId;
        localStorage.setItem(GUEST_KEY, CUSTOMER_ID);
      }
    } catch (_) {
      CUSTOMER_ID = "guest_" + String(Date.now()) + Math.random().toString(36).slice(2);
    }
  }

  var wishlistedIds = new Set();
  var productIdCache = {};

  if (!document.getElementById("wl-coll-anim")) {
    var animStyle = document.createElement("style");
    animStyle.id = "wl-coll-anim";
    animStyle.textContent =
      "@keyframes wl-chb{0%{transform:scale(1)}15%{transform:scale(1.7)}35%{transform:scale(0.85)}55%{transform:scale(1.25)}75%{transform:scale(0.95)}100%{transform:scale(1)}}" +
      "@keyframes wl-crp{0%{transform:translate(-50%,-50%) scale(0.4);opacity:0.9}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}" +
      "@keyframes wl-crp2{0%{transform:translate(-50%,-50%) scale(0.4);opacity:0.9}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}" +
      "@keyframes wl-cfh{0%{transform:translateX(-50%) translateY(0) scale(1);opacity:1}100%{transform:translateX(-50%) translateY(-36px) scale(0.5);opacity:0}}" +
      ".wl-heart-btn.wl-c-clicked svg{animation:wl-chb 0.65s cubic-bezier(.4,0,.2,1)}" +
      ".wl-c-ripple{position:absolute;top:50%;left:50%;width:100%;height:100%;border-radius:50%;pointer-events:none;border:2px solid " + ACTIVE_COLOR + ";animation:wl-crp 0.6s ease-out forwards}" +
      ".wl-c-ripple2{position:absolute;top:50%;left:50%;width:100%;height:100%;border-radius:50%;pointer-events:none;border:2px solid " + ACTIVE_COLOR + ";animation:wl-crp2 0.6s ease-out 0.15s forwards;opacity:0}" +
      ".wl-c-float{position:absolute;top:-2px;left:50%;font-size:13px;pointer-events:none;animation:wl-cfh 0.7s ease-out forwards;z-index:999999}";
    document.head.appendChild(animStyle);
  }

  var svgPaths = {
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2'
  };
  var iconPath = svgPaths[ICON_STYLE] || svgPaths.heart;

  var ICON_PATHS = {
    "heart-filled":  { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: true, sw: 2 },
    "heart-outline": { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: false, sw: 2 },
    "heart-bold":    { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: true, sw: 3 },
    "heart-thin":    { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: false, sw: 1 },
    "heart-medium":  { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: false, sw: 1.5 },
    "heart-light":   { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: false, sw: 1.5 },
    "heart-stroke":  { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: false, sw: 2.5 },
    "heart-small":   { path: "M16 4.5a4 4 0 0 1 0 5.66L12 14l-4-3.84A4 4 0 0 1 8 4.5a4 4 0 0 1 5.66 0L12 3.83l-.34-.34A4 4 0 0 1 16 4.5z", filled: false, sw: 2 },
    "gift":          { path: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z", filled: false, sw: 1.5 },
    "bell":          { path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0", filled: false, sw: 1.5 },
    "gift-alt":      { path: "M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3zM12 6V22M2 12h20", filled: false, sw: 1.5 },
    "star-outline":  { path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", filled: false, sw: 1.5 },
    "star-filled":   { path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", filled: true, sw: 1.5 },
    "heart-fancy":   { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: true, sw: 1.5 },
    "heart-open":    { path: "M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z", filled: false, sw: 1.5 },
    "heart-ring":    { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", filled: false, sw: 2 },
    "lock":          { path: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4", filled: false, sw: 1.5 },
    "bookmark-outline": { path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", filled: false, sw: 2 },
    "bookmark-filled":  { path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", filled: true, sw: 2 },
  };

  var wlIconSettings = { notAddedIcon: "heart-outline", addedIcon: "heart-filled", customIconSvg: "", customIconColor: "" };

  function getIconSvg(key, isActive, size) {
    var color = wlIconSettings.customIconColor || ACTIVE_COLOR;
    if (wlIconSettings.customIconSvg && wlIconSettings.customIconSvg.trim()) {
      var div = document.createElement("div");
      div.innerHTML = wlIconSettings.customIconSvg.trim();
      var svgEl = div.querySelector("svg");
      if (svgEl) {
        svgEl.setAttribute("width", size);
        svgEl.setAttribute("height", size);
        svgEl.style.color = color;
        svgEl.style.fill = "currentColor";
        svgEl.style.pointerEvents = "none";
        return svgEl.outerHTML;
      }
    }
    var ico = ICON_PATHS[key] || ICON_PATHS["heart-outline"];
    var fill = isActive ? color : "none";
    var stroke = color;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><path d="' + ico.path + '"/></svg>';
  }

  function findProductCards() {
    var cards = [];
    var linkSelectors = [
      '.product-card a[href*="/products/"]',
      '.card-wrapper a[href*="/products/"]',
      '.grid-product a[href*="/products/"]',
      '.product-item a[href*="/products/"]',
      '.collection-product-card a[href*="/products/"]',
      '.product-card-wrapper a[href*="/products/"]',
      'a.product-card[href*="/products/"]',
      '.card a[href*="/products/"]',
      '.product-thumbnail a[href*="/products/"]',
    ];

    var seenContainers = new Set();

    for (var i = 0; i < linkSelectors.length; i++) {
      var links = document.querySelectorAll(linkSelectors[i]);
      for (var j = 0; j < links.length; j++) {
        var link = links[j];
        var href = link.getAttribute("href") || "";
        var match = href.match(/\/products\/([a-zA-Z0-9_-]+)/);
        if (!match) continue;

        var handle = match[1];
        var container = link.closest('.product-card-wrapper, .card-wrapper, .grid-product, .product-item, .collection-product-card, .product-card, .card, .grid__item, .product-thumbnail');
        if (!container) container = link.parentElement;

        if (seenContainers.has(container)) continue;
        seenContainers.add(container);

        if (container.querySelector('.wl-heart-wrap')) continue;

        var imgWrap = container.querySelector('.card__media, .card__inner, .product-card__image-wrapper, .card-media, .grid-product__image-wrap, .media, .card__image-wrapper, .product-thumbnail-media');
        if (!imgWrap) imgWrap = container.querySelector('img') ? container.querySelector('img').parentElement : null;
        if (!imgWrap) imgWrap = container;

        container.style.position = "relative";
        if (imgWrap !== container) {
          imgWrap.style.position = "relative";
          imgWrap.style.overflow = "visible";
        }

        cards.push({ handle: handle, container: container, imgWrap: imgWrap });
      }
    }
    return cards;
  }

  function fixOverlayLinks() {
    var fullLinks = document.querySelectorAll('a.full-unstyled-link');
    for (var k = 0; k < fullLinks.length; k++) {
      fullLinks[k].style.zIndex = "1";
    }
    var cardLinks = document.querySelectorAll('.card__link');
    for (var l = 0; l < cardLinks.length; l++) {
      cardLinks[l].style.zIndex = "1";
    }
  }

  function getProductId(handle, callback) {
    if (productIdCache[handle]) {
      callback(productIdCache[handle]);
      return;
    }
    fetch("/products/" + handle + ".json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.product && data.product.id) {
          productIdCache[handle] = String(data.product.id);
          callback(String(data.product.id));
        } else {
          callback(null);
        }
      })
      .catch(function () { callback(null); });
  }

  function createHeartButton(productId, isActive) {
    var wrap = document.createElement("div");
    wrap.className = "wl-heart-wrap";
    wrap.style.cssText = "position:absolute;top:8px;right:8px;z-index:99999;pointer-events:auto;isolation:isolate;display:block;";

    var btn = document.createElement("button");
    btn.className = "wl-heart-btn" + (isActive ? " active" : "");
    btn.type = "button";
    btn.setAttribute("aria-label", isActive ? TEXT_REMOVE : TEXT_ADD);
    btn.setAttribute("data-wl-product", productId);
    btn.style.cssText = "width:" + ICON_SIZE + "px;height:" + ICON_SIZE + "px;border:none;background:rgba(255,255,255,0.92);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:0;position:relative;z-index:99999;isolation:isolate;";

    var svgSize = Math.round(ICON_SIZE * 0.5);
    var iconKey = isActive ? wlIconSettings.addedIcon : wlIconSettings.notAddedIcon;
    btn.innerHTML = getIconSvg(iconKey, isActive, svgSize);

    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(btn, productId);
      return false;
    };

    wrap.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    wrap.appendChild(btn);
    return wrap;
  }

  function toggleWishlist(btn, productId) {
    var isActive = btn.classList.contains("active");
    var action = isActive ? "remove" : "add";

    if (action === "add") {
      btn.classList.add("wl-c-clicked");

      var rp1 = document.createElement("span");
      rp1.className = "wl-c-ripple";
      btn.appendChild(rp1);
      rp1.addEventListener("animationend", function () { rp1.remove(); });

      var rp2 = document.createElement("span");
      rp2.className = "wl-c-ripple2";
      btn.appendChild(rp2);
      rp2.addEventListener("animationend", function () { rp2.remove(); });

      var fh = document.createElement("span");
      fh.className = "wl-c-float";
      fh.textContent = "♥";
      fh.style.color = ACTIVE_COLOR;
      btn.appendChild(fh);
      fh.addEventListener("animationend", function () { fh.remove(); });

      setTimeout(function () { btn.classList.remove("wl-c-clicked"); }, 750);
    }

    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    fetch(PROXY + "/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: SHOP, customerId: CUSTOMER_ID, productId: productId, action: action })
    })
      .then(function (res) {
        if (res.ok) {
          if (action === "add") wishlistedIds.add(productId);
          else wishlistedIds.delete(productId);
          syncButtons(productId, action === "add");
          updateHeaderBadge();
          var cardContainer = btn.closest('.product-card-wrapper, .card-wrapper, .grid-product, .product-item, .product-card, .card, .grid__item');
          var imgEl = cardContainer ? cardContainer.querySelector('img') : null;
          var titleEl = cardContainer ? cardContainer.querySelector('[class*="card__heading"] a, [class*="card__name"], [class*="product-title"], h3, h2, .card__heading') : null;
          var imgSrc = imgEl ? imgEl.src : null;
          var productName = titleEl ? titleEl.textContent.trim() : null;
          wlToast(action === "add" ? TEXT_ADDED_TOAST : TEXT_REMOVED_TOAST, action, imgSrc, productName);
        }
      })
      .catch(function () { })
      .finally(function () {
        btn.style.opacity = "";
        btn.style.pointerEvents = "";
      });
  }

  function syncButtons(productId, isActive) {
    var btns = document.querySelectorAll('[data-wl-product="' + productId + '"]');
    var svgSize = Math.round(ICON_SIZE * 0.5);
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("active", isActive);
      var iconKey = isActive ? wlIconSettings.addedIcon : wlIconSettings.notAddedIcon;
      btns[i].innerHTML = getIconSvg(iconKey, isActive, svgSize);
    }
  }

  function updateHeaderBadge() {
    if (window.__wlRefreshBadge) {
      window.__wlRefreshBadge();
      return;
    }
    var badge = document.getElementById("wl-hdr-badge");
    if (badge) {
      var count = wishlistedIds.size;
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = count > 0 ? "block" : "none";
    }
  }

  window.__wlWishlistedIds = wishlistedIds;
  window.__wlUpdateHeaderBadge = updateHeaderBadge;

  function init() {
    var cards = findProductCards();
    fixOverlayLinks();

    if (cards.length === 0) return;

    fetch(PROXY + "/api/wishlist?shop=" + encodeURIComponent(SHOP) + "&customerId=" + encodeURIComponent(CUSTOMER_ID))
      .then(function (r) { return r.json(); })
      .catch(function () { return { wishlist: { items: [] }, hasActivePlan: true }; })
      .then(function (data) {
        var items = (data.wishlist && data.wishlist.items) || [];
        items.forEach(function (item) { wishlistedIds.add(item.productId); });

        var planActive = data.hasActivePlan !== false;

        if (data.settings) {
          if (data.settings.customCss && !document.getElementById("wl-custom-css")) {
            var style = document.createElement("style");
            style.id = "wl-custom-css";
            style.textContent = data.settings.customCss;
            document.head.appendChild(style);
          }
          if (data.settings.notAddedIcon) wlIconSettings.notAddedIcon = data.settings.notAddedIcon;
          if (data.settings.addedIcon) wlIconSettings.addedIcon = data.settings.addedIcon;
          if (data.settings.customIconSvg) wlIconSettings.customIconSvg = data.settings.customIconSvg;
          if (data.settings.customIconColor) {
            wlIconSettings.customIconColor = data.settings.customIconColor;
            var animColor = document.getElementById("wl-anim-color");
            if (!animColor) {
              animColor = document.createElement("style");
              animColor.id = "wl-anim-color";
              document.head.appendChild(animColor);
            }
            animColor.textContent = '.wl-c-ripple,.wl-c-ripple2{border-color:' + data.settings.customIconColor + '!important}.wl-c-float{color:' + data.settings.customIconColor + '!important}';
          }
        }

        cards.forEach(function (card) {
          getProductId(card.handle, function (productId) {
            if (productId) {
              var isActive = wishlistedIds.has(productId);
              var heart = createHeartButton(productId, isActive);
              if (!planActive) {
                var btn = heart.querySelector('.wl-heart-btn');
                if (btn) {
                  btn.disabled = true;
                  btn.style.opacity = '0.35';
                  btn.style.cursor = 'not-allowed';
                  btn.title = TEXT_SUBSCRIBE;
                  btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); return false; };
                }
              }
              card.container.appendChild(heart);
            }
          });
        });

        updateHeaderBadge();
      })
      .catch(function () { });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function resyncFromServer() {
    fetch(PROXY + "/api/wishlist?shop=" + encodeURIComponent(SHOP) + "&customerId=" + encodeURIComponent(CUSTOMER_ID))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = (data.wishlist && data.wishlist.items) || [];
        var freshIds = new Set();
        items.forEach(function (item) { freshIds.add(item.productId); });
        wishlistedIds = freshIds;
        window.__wlWishlistedIds = wishlistedIds;

        var allBtns = document.querySelectorAll("[data-wl-product]");
        var seen = {};
        for (var i = 0; i < allBtns.length; i++) {
          var pid = allBtns[i].getAttribute("data-wl-product");
          if (seen[pid]) continue;
          seen[pid] = true;
          syncButtons(pid, freshIds.has(pid));
        }
        updateHeaderBadge();
      })
      .catch(function () { });
  }

  window.addEventListener("pageshow", function () {
    resyncFromServer();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") resyncFromServer();
  });

  // Keep hearts genuinely live: re-check the real wishlist state every few
  // seconds while this tab is open and visible, so changes made elsewhere
  // (another tab, the popup drawer, the product page) show up here without
  // requiring a manual refresh or navigation.
  setInterval(function () {
    if (document.visibilityState === "visible") resyncFromServer();
  }, 6000);

  var observer = new MutationObserver(function (mutations) {
    var hasNew = false;
    mutations.forEach(function (m) { if (m.addedNodes.length > 0) hasNew = true; });
    if (hasNew) {
      clearTimeout(window.__wlObserverTimer);
      window.__wlObserverTimer = setTimeout(init, 500);
    }
  });

  var productGrid = document.querySelector('.collection, .product-grid, #product-grid, main');
  if (productGrid) observer.observe(productGrid, { childList: true, subtree: true });

})();

