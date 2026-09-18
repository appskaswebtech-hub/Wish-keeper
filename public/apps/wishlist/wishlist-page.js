(function () {
  var shop = window.__wlPageConfig && window.__wlPageConfig.shop;
  var proxyUrl = window.__wlPageConfig && window.__wlPageConfig.proxyUrl;
  var customerId = window.__wlPageConfig && window.__wlPageConfig.customerId;
  var locale = (window.__wlPageConfig && window.__wlPageConfig.locale) || 'en';

  var translations = {
    de: {
      title: "Wunschliste", loading: "Lädt...", loadingList: "Wunschliste wird geladen...",
      share: "Teilen", addToCart: "IN DEN WARENKORB", soldOut: "AUSVERKAUFT",
      adding: "Wird hinzugefügt...", added: "Hinzugefügt!", error: "Fehler",
      removed: "Von der Wunschliste entfernt", addedToCart: "In den Warenkorb gelegt",
      emptyTitle: "Deine Wunschliste ist leer",
      emptyText: "Stöbere in unserer Kollektion und tippe auf das Herz-Symbol bei Produkten, die du liebst.",
      startShopping: "Jetzt einkaufen", couldNotLoad: "Wunschliste konnte nicht geladen werden. Bitte versuche es erneut.",
      items: function(n) { return n + " Artikel"; }
    },
    es: {
      title: "Lista de deseos", loading: "Cargando...", loadingList: "Cargando tu lista de deseos...",
      share: "Compartir", addToCart: "AÑADIR AL CARRITO", soldOut: "AGOTADO",
      adding: "Añadiendo...", added: "¡Añadido!", error: "Error",
      removed: "Eliminado de la lista de deseos", addedToCart: "Añadido al carrito",
      emptyTitle: "Tu lista de deseos está vacía",
      emptyText: "Navega por nuestra colección y toca el icono del corazón en los productos que te gusten.",
      startShopping: "Empezar a comprar", couldNotLoad: "No se pudo cargar tu lista de deseos. Inténtalo de nuevo.",
      items: function(n) { return n + " artículo" + (n !== 1 ? "s" : ""); }
    },
    it: {
      title: "Lista dei desideri", loading: "Caricamento...", loadingList: "Caricamento della lista dei desideri...",
      share: "Condividi", addToCart: "AGGIUNGI AL CARRELLO", soldOut: "ESAURITO",
      adding: "Aggiunta in corso...", added: "Aggiunto!", error: "Errore",
      removed: "Rimosso dalla lista dei desideri", addedToCart: "Aggiunto al carrello",
      emptyTitle: "La tua lista dei desideri è vuota",
      emptyText: "Sfoglia la nostra collezione e tocca l'icona del cuore sui prodotti che ami.",
      startShopping: "Inizia lo shopping", couldNotLoad: "Impossibile caricare la lista dei desideri. Riprova.",
      items: function(n) { return n + " articol" + (n !== 1 ? "i" : "o"); }
    },
    en: {
      title: "My Wishlist", loading: "Loading...", loadingList: "Loading your wishlist...",
      share: "Share", addToCart: "ADD TO CART", soldOut: "SOLD OUT",
      adding: "Adding...", added: "Added!", error: "Error",
      removed: "Removed from Wishlist", addedToCart: "Added to Cart",
      emptyTitle: "Your wishlist is empty",
      emptyText: "Browse our collection and tap the heart icon on products you love to save them here.",
      startShopping: "Start Shopping", couldNotLoad: "Could not load your wishlist. Please try again.",
      items: function(n) { return n + " item" + (n !== 1 ? "s" : ""); }
    }
  };
  var T = translations[locale] || translations.en;

  var titleEl = document.getElementById("wl-title");
  if (titleEl) titleEl.textContent = T.title;

  if (!customerId) { showEmpty(); return; }

  var allItems = [];
  var shownCount = 0;
  var itemsPerPage = 10;
  var storeSettings = {};

  // ─── Toast ───────────────────────────────────────────────────────
  function showToast(title, message, imgUrl) {
    var container = document.getElementById("wl-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "wl-toast-container";
      document.body.appendChild(container);
    }
    var t = document.createElement("div");
    t.className = "wl-toast";
    t.innerHTML =
      (imgUrl ? '<img class="wl-toast-img" src="' + imgUrl + '" alt="" />' : '<div class="wl-toast-img-placeholder"></div>') +
      '<div class="wl-toast-body"><div class="wl-toast-title">' + title + '</div><div class="wl-toast-msg">' + message + '</div></div>' +
      '<button class="wl-toast-close">✕</button>';
    container.appendChild(t);
    t.querySelector(".wl-toast-close").addEventListener("click", function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 400);
    });
    setTimeout(function () { t.classList.add("show"); }, 10);
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 400);
    }, 3000);
  }

  // ─── Load wishlist ────────────────────────────────────────────────
  fetch(proxyUrl + "/api/products?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var items = data.items || [];
      var s = data.settings || {};

      if (s.gridColumns) document.documentElement.style.setProperty("--wl-columns", s.gridColumns);
      if (s.activeColor) document.documentElement.style.setProperty("--wl-primary", s.activeColor);
      if (s.customCss && !document.getElementById("wl-custom-css")) {
        var style = document.createElement("style");
        style.id = "wl-custom-css";
        style.textContent = s.customCss;
        document.head.appendChild(style);
      }

      if (s.showShareButton) document.getElementById("wl-share").style.display = "inline-flex";

      if (s.showItemCount !== false) {
        document.getElementById("wl-count").textContent = T.items(items.length);
      } else {
        document.getElementById("wl-count").style.display = "none";
      }

      if (items.length === 0) { showEmpty(); return; }

      storeSettings = s;
      allItems = items;
      hideLoader();
      appendItems(itemsPerPage);
    })
    .catch(function () {
      hideLoader();
      document.getElementById("wl-grid").innerHTML =
        '<div class="wl-empty"><p>' + T.couldNotLoad + '</p></div>';
    });

  // ─── Append items (Load More) ─────────────────────────────────────
  function appendItems(count) {
    var s = storeSettings;
    var batch = allItems.slice(shownCount, shownCount + count);
    if (batch.length === 0) return;

    var grid = document.getElementById("wl-grid");
    var html = "";

    batch.forEach(function (item) {
      var p = item.product;
      if (!p) return;

      html += '<div class="wl-card" data-product-id="' + item.productId + '">';
      html += '<div class="wl-card-img-wrap">';

      if (p.image) {
        html += '<img src="' + p.image + '" alt="' + esc(p.imageAlt || p.title) + '" loading="lazy" />';
      } else {
        html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f3f4f6">' +
          '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">' +
          '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>' +
          '</svg></div>';
      }

      html += '<button class="wl-card-remove" onclick="window.__wlRemove(\'' + item.productId + '\',\'' + (item.variantId || '') + '\')" title="Remove">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
        '</svg></button>';

      if (!p.available) html += '<span class="wl-badge-oos">' + T.soldOut + '</span>';

      html += '</div><div class="wl-card-info">';

      if (s.showVendor && p.vendor) html += '<div class="wl-card-vendor">' + esc(p.vendor) + '</div>';
      if (s.showTitle !== false) html += '<div class="wl-card-title"><a href="/products/' + p.handle + '">' + esc(p.title) + '</a></div>';
      if (s.showPrice !== false) html += '<div class="wl-card-price">' + money(p.price, p.currency) + '</div>';

      if (s.showAddToCart !== false) {
        var atcDisabled = !p.available ? ' disabled' : '';
        var varId = item.variantId || '';
        html += '<button class="wl-card-atc"' + atcDisabled + ' onclick="window.__wlAddCart(this,\'' + item.productId + '\',\'' + varId + '\',\'' + p.handle + '\')">' +
          (p.available ? T.addToCart : T.soldOut) + '</button>';
      }

      html += '</div></div>';
    });

    grid.insertAdjacentHTML("beforeend", html);
    shownCount += batch.length;
    updateLoadMore();
  }

  function updateLoadMore() {
    var lm = document.getElementById("wl-load-more");
    var counter = document.getElementById("wl-shown-count");
    if (!lm) return;
    if (shownCount >= allItems.length) {
      lm.style.display = "none";
    } else {
      lm.style.display = "";
      if (counter) counter.textContent = "Showing " + shownCount + " of " + allItems.length + " items";
    }
  }

  window.__wlLoadMore = function () {
    appendItems(itemsPerPage);
  };

  function hideLoader() {
    var loader = document.getElementById("wl-page-loader");
    if (loader) loader.style.display = "none";
    var grid = document.getElementById("wl-grid");
    if (grid) grid.style.display = "";
    setTimeout(function () {
      var deco = document.getElementById("wl-title-deco");
      if (deco) deco.classList.add("wl-loaded");
    }, 120);
  }

  // ─── Empty state ──────────────────────────────────────────────────
  function showEmpty() {
    hideLoader();
    var countEl = document.getElementById("wl-count");
    if (countEl) countEl.textContent = T.items(0);
    document.getElementById("wl-grid").innerHTML =
      '<div class="wl-empty">' +
      '<svg class="wl-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
      '</svg>' +
      '<h2>' + T.emptyTitle + '</h2>' +
      '<p>' + T.emptyText + '</p>' +
      '<a href="/collections/all" class="wl-empty-cta">' + T.startShopping + '</a>' +
      '</div>';
  }

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function money(a, c) {
    return new Intl.NumberFormat(navigator.language || "en-US", { style: "currency", currency: c || "USD" }).format(parseFloat(a));
  }

  // ─── Remove ───────────────────────────────────────────────────────
  window.__wlRemove = function (pid, vid, fromCart) {
    var card = document.querySelector('[data-product-id="' + pid + '"]');
    var imgEl = card ? card.querySelector("img") : null;
    var titleEl = card ? card.querySelector(".wl-card-title a") : null;
    var imgSrc = imgEl ? imgEl.src : null;
    var title = titleEl ? titleEl.textContent : "Product";

    if (card) card.classList.add("removing");

    fetch(proxyUrl + "/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: shop, customerId: customerId, productId: pid, variantId: vid || null, action: "remove" })
    }).then(function () {
      setTimeout(function () {
        var wasVisible = allItems.slice(0, shownCount).some(function (i) { return i.productId === pid; });
        allItems = allItems.filter(function (i) { return i.productId !== pid; });
        if (wasVisible && shownCount > 0) shownCount--;
        var rem = allItems.length;
        document.getElementById("wl-count").textContent = T.items(rem);
        if (card) card.remove();
        if (rem === 0) {
          showEmpty();
        } else {
          updateLoadMore();
        }
      }, 300);

      if (!fromCart) showToast(title, T.removed, imgSrc);

      fetch(proxyUrl + "/api/wishlist?shop=" + encodeURIComponent(shop) + "&customerId=" + encodeURIComponent(customerId))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var count = (data.wishlist && data.wishlist.items) ? data.wishlist.items.length : 0;
          var badge = document.getElementById("wl-hdr-badge");
          if (badge) {
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = count > 0 ? "block" : "none";
          }
        });
    });
  };

  // ─── Add to Cart ──────────────────────────────────────────────────
  window.__wlAddCart = function (btnEl, pid, vid, handle) {
    if (btnEl.disabled) return;
    btnEl.disabled = true;
    btnEl.textContent = T.adding;

    function getVariantId(callback) {
      if (vid && vid !== "null" && vid !== "undefined" && vid !== "") {
        callback(vid);
        return;
      }
      fetch("/products/" + handle + ".json")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.product || !data.product.variants || !data.product.variants.length) throw new Error("No variants");
          var variant = null;
          for (var i = 0; i < data.product.variants.length; i++) {
            if (data.product.variants[i].available) { variant = data.product.variants[i]; break; }
          }
          if (!variant) variant = data.product.variants[0];
          callback(variant.id);
        })
        .catch(function () { btnEl.disabled = false; btnEl.textContent = T.addToCart; });
    }

    function syncCartBubble() {
      fetch("/cart.js")
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          var count = cart.item_count;

          // Alpine.js store update (Horizon and other Alpine themes)
          if (window.Alpine) {
            ['cart', 'miniCart', 'cartCount', 'header'].forEach(function (name) {
              try {
                var s = Alpine.store(name);
                if (!s) return;
                if ('itemCount' in s) s.itemCount = count;
                if ('item_count' in s) s.item_count = count;
                if ('count' in s) s.count = count;
              } catch (e) {}
            });
          }

          // Dispatch on window AND document — Alpine listens on window
          ['cart:refresh', 'cart:updated', 'cart:change'].forEach(function (name) {
            window.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { cart: cart } }));
            document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { cart: cart } }));
          });

          // Horizon theme: <cart-icon> with .cart-bubble__text-count
          var horizonCount = document.querySelector('.cart-bubble__text-count');
          if (horizonCount) horizonCount.textContent = count;
          var horizonIcon = document.querySelector('cart-icon');
          if (horizonIcon) horizonIcon.classList.toggle('header-actions__cart-icon--has-cart', count > 0);

          // Other themes — broad selector DOM update
          var els = document.querySelectorAll(
            '.cart-count-bubble, [data-cart-count], .cart-count, .CartCount, #cart-count, .cart__count, [data-header-cart-count], .header__cart-count, .cart-item-count'
          );
          els.forEach(function (el) {
            el.style.display = count > 0 ? '' : 'none';
            var span = el.querySelector('span[aria-hidden="true"], span');
            if (span) span.textContent = count;
            else el.textContent = count;
            el.setAttribute('data-count', count);
          });
        }).catch(function () { });
    }

    function openCartDrawer() {
      // Skip if drawer is already open (avoids toggling it closed)
      var closeBtn = document.querySelector('.cart-drawer__close-button, [class*="cart-drawer"][class*="close"]');
      if (closeBtn) {
        var r = closeBtn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return;
      }

      // Horizon theme — plain button[aria-label="Cart"] in header
      var horizonBtn = document.querySelector('button[aria-label="Cart"]');
      if (horizonBtn) { horizonBtn.click(); return; }

      // Alpine.js store (other Alpine themes)
      if (window.Alpine) {
        try { Alpine.store('cart').open(); return; } catch(e) {}
        try { Alpine.store('cartDrawer').open(); return; } catch(e) {}
        try { Alpine.store('cart').isOpen = true; return; } catch(e) {}
      }

      // Window events (Alpine @event.window listeners)
      window.dispatchEvent(new CustomEvent('open-cart', { bubbles: true }));
      window.dispatchEvent(new CustomEvent('open-cart-drawer', { bubbles: true }));

      // Dawn <cart-drawer> web component
      var drawer = document.querySelector('cart-drawer');
      if (drawer) {
        if (typeof drawer.show === 'function') { drawer.show(); return; }
        if (typeof drawer.open === 'function') { drawer.open(); return; }
        var summary = drawer.querySelector('summary');
        if (summary && !drawer.hasAttribute('open')) { summary.click(); return; }
      }

      // Document-level events + generic button fallbacks
      ['cart:open', 'theme:cart:open', 'cart:open-drawer'].forEach(function (name) {
        document.dispatchEvent(new CustomEvent(name, { bubbles: true }));
      });
      var btnSelectors = [
        '#cart-icon-bubble', '[data-cart-toggle]', '[data-open-cart]',
        '[data-target="cart-drawer"]', 'button[aria-controls*="cart" i]',
        '.cart-toggle', '.js-cart-open', '.cart__toggle'
      ];
      for (var i = 0; i < btnSelectors.length; i++) {
        var el = document.querySelector(btnSelectors[i]);
        if (el) { el.click(); return; }
      }
    }

    function addToCart(variantId) {
      var card = document.querySelector('[data-product-id="' + pid + '"]');
      var imgEl = card ? card.querySelector("img") : null;
      var titleEl = card ? card.querySelector(".wl-card-title a") : null;
      var imgSrc = imgEl ? imgEl.src : null;
      var title = titleEl ? titleEl.textContent : "Product";

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: parseInt(variantId), quantity: 1 }] })
      })
        .then(function (res) { if (!res.ok) throw new Error("Add failed"); return res.json(); })
        .then(function () {
          syncCartBubble();
          openCartDrawer();
          document.dispatchEvent(new CustomEvent("cart:refresh"));

          showToast(title, T.addedToCart, imgSrc);
          window.__wlRemove(pid, vid, true);

          btnEl.textContent = T.added;
          btnEl.classList.add("added");
        })
        .catch(function (err) { console.error(err); btnEl.textContent = T.error; })
        .finally(function () {
          setTimeout(function () {
            if (document.contains(btnEl)) {
              btnEl.disabled = false;
              btnEl.textContent = T.addToCart;
              btnEl.classList.remove("added");
            }
          }, 1500);
        });
    }

    getVariantId(addToCart);
  };

  // ─── Share ────────────────────────────────────────────────────────
  window.__wlShare = function () {
    if (navigator.share) navigator.share({ title: "My Wishlist", url: location.href });
    else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); }
  };

})();
