  import type { LoaderFunctionArgs } from "react-router";
  import { getStoreByShop, getStoreSettingsByShop } from "../services/wishlist.server";

  export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const isEmbed = url.searchParams.get("embed") === "1";

    console.log("PAGE LOADER - full URL:", request.url);
    console.log("PAGE LOADER - shop param:", shop);

    if (!shop) return new Response("Missing shop", { status: 400 });

    const store = await getStoreByShop(shop);

    console.log("PAGE LOADER - store found:", store);

    if (!store) return new Response("Store not found", { status: 404 });

    const settings = await getStoreSettingsByShop(shop);
    const customCss = settings?.customCss?.replace(/<\/style>/gi, "") || "";
    const language = settings?.language || null;
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id") || null;

    const liquid = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
    .wl-page{width:100%;max-width:1200px;margin:0 auto;padding:28px 24px;box-sizing:border-box;container-type:inline-size;font-family:'DM Sans',sans-serif;background:#faf8f4}
    .wl-header{position:relative!important;text-align:center!important;margin-bottom:8px!important;padding-bottom:20px!important}
    .wl-header-center{display:flex!important;flex-direction:column!important;align-items:center!important;gap:8px!important}
    #wl-title{font-family:'Playfair Display',serif!important;font-size:28px!important;font-weight:600!important;color:#1a1612!important;letter-spacing:1px!important;line-height:1.15!important;margin:0!important;text-align:center!important;position:relative!important;display:inline-block!important}
    .wl-title-deco{display:flex;align-items:center;gap:10px;opacity:0;transform:scaleX(0.3);transition:opacity 0.5s ease,transform 0.5s ease}
    .wl-title-deco.wl-loaded{opacity:1;transform:scaleX(1)}
    .wl-deco-line{height:1.5px;width:44px;background:linear-gradient(90deg,transparent,#b8922a);opacity:0.5;border-radius:2px}
    .wl-deco-line--right{background:linear-gradient(90deg,#b8922a,transparent)}
    .wl-deco-heart{width:14px;height:14px;color:#b8922a}
    .wl-count{font-size:12.5px;color:#a39a8e;margin-top:2px;letter-spacing:0.03em}
    .wl-share-btn{position:absolute!important;right:0!important;top:6px!important;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid rgba(184,146,42,0.28);border-radius:100px;background:#fff;cursor:pointer;font-size:12.5px;font-weight:500;color:#4a4238;transition:border-color 0.2s,color 0.2s}
    .wl-share-btn:hover{border-color:#b8922a;color:#b8922a}
    .wl-actionbar{display:none;align-items:center;justify-content:center;gap:12px;padding:14px 0 22px;margin-bottom:20px;border-bottom:1px solid rgba(0,0,0,0.06);flex-wrap:wrap}
    .wl-actionbar-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(184,146,42,0.28);background:#fff;cursor:pointer;font-size:12.5px;font-weight:600;color:#4a4238;padding:8px 16px;border-radius:100px;transition:border-color 0.2s,color 0.2s,background 0.2s}
    .wl-actionbar-btn:hover{border-color:#b8922a;color:#b8922a;background:#f9f1e1;text-decoration:none}
    .wl-actionbar-btn--danger{color:#b45454;border-color:rgba(180,84,84,0.28)}
    .wl-actionbar-btn--danger:hover{border-color:#dc2626;color:#dc2626;background:#fef2f2}
    .wl-actionbar-btn:disabled{opacity:0.5;cursor:not-allowed;text-decoration:none}
    .wl-empty-signin{font-size:13px;color:#64748b;max-width:480px;margin:0 auto 8px}
    .wl-empty-signin a{color:#2563eb;text-decoration:none}
    .wl-empty-signin a:hover{text-decoration:underline}
    .wl-page-loader{display:flex;align-items:center;justify-content:center;min-height:200px}
    .wl-loader-text{font-size:12px;font-weight:700;letter-spacing:8px;color:#cbd5e1;position:relative;overflow:hidden}
    .wl-loader-text::after{content:'';position:absolute;left:-100%;top:0;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent);animation:wl-shimmer 1.4s infinite}
    @keyframes wl-shimmer{to{left:200%}}
    .wl-grid{display:grid;grid-template-columns:repeat(var(--wl-columns,3),1fr);gap:20px}
    @container(max-width:900px){.wl-grid{grid-template-columns:repeat(3,1fr)}}
    @container(max-width:600px){.wl-grid{grid-template-columns:repeat(2,1fr)}}
    @container(max-width:360px){.wl-grid{grid-template-columns:1fr}}
    @media(max-width:768px){.wl-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:480px){.wl-grid{grid-template-columns:1fr}}
    .wl-card{border:1px solid rgba(0,0,0,0.07);border-radius:14px;overflow:hidden;background:#fff;transition:transform 0.25s ease,box-shadow 0.25s ease,border-color 0.25s ease;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
    .wl-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(0,0,0,0.08);border-color:rgba(184,146,42,0.25)}
    .wl-card.removing{opacity:0;transform:scale(0.9);transition:opacity 0.3s,transform 0.3s}
    .wl-card-img-wrap{position:relative;aspect-ratio:1;overflow:hidden;background:#f8f6f0}
    .wl-card-img-wrap img{width:100%;height:100%;object-fit:cover}
    .wl-card-remove{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;border:none;background:rgba(255,255,255,0.95);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s,transform 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.15);color:#4a4238}
    .wl-card-remove:hover{color:#dc2626;transform:scale(1.08)}
    .wl-card-remove svg{width:14px;height:14px}
    .wl-card-img-wrap:hover .wl-card-remove,.wl-card-remove:focus{opacity:1}
    .wl-badge-oos{position:absolute;bottom:8px;left:8px;background:#1a1612;color:#f0e6cc;font-size:9.5px;font-weight:700;padding:4px 9px;border-radius:100px;letter-spacing:1.2px}
    .wl-card-info{padding:16px}
    .wl-card-vendor{font-size:10.5px;color:#a39a8e;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
    .wl-card-title{font-size:14px;font-weight:600;margin-bottom:6px;line-height:1.35;color:#1a1612}
    .wl-card-title a{color:inherit;text-decoration:none}
    .wl-card-title a:hover{color:#b8922a}
    .wl-card-price{font-size:15px;font-weight:700;color:var(--wl-primary,#b8922a);margin-bottom:14px}
    .wl-card-atc{width:100%;padding:11px;background:var(--wl-primary,#b8922a);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.8px;cursor:pointer;transition:opacity 0.2s,transform 0.15s}
    .wl-card-atc:hover:not(:disabled){opacity:0.88}
    .wl-card-atc:active:not(:disabled){transform:scale(0.98)}
    .wl-card-atc:disabled{opacity:0.4;cursor:not-allowed}
    .wl-card-atc.added{background:#16a34a}
    .wl-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;grid-column:1/-1;width:100%}
    .wl-empty-icon{width:56px;height:56px;color:#d9cfa9;margin-bottom:18px}
    .wl-empty h2{font-family:'Playfair Display',serif;font-size:21px;font-weight:600;color:#1a1612;margin-bottom:8px}
    .wl-empty p{color:#8a8175;max-width:380px;margin-bottom:22px;font-size:13.5px;line-height:1.6}
    .wl-empty-cta{display:inline-block;padding:12px 26px;background:var(--wl-primary,#b8922a);color:#fff;border-radius:100px;text-decoration:none;font-weight:600;font-size:13px}
    .wl-load-more{text-align:center;padding:28px 0 8px}
    .wl-shown-count{font-size:12.5px;color:#a39a8e;margin-bottom:14px}
    .wl-load-more-btn{padding:11px 30px;border:1px solid rgba(184,146,42,0.3);border-radius:100px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#4a4238;transition:border-color 0.2s,color 0.2s,background 0.2s}
    .wl-load-more-btn:hover{border-color:#b8922a;color:#b8922a;background:#f9f1e1}
    #wl-toast-container{position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px}
    .wl-toast{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.12);min-width:280px;max-width:360px;opacity:0;transform:translateX(110%);transition:opacity 0.35s,transform 0.35s}
    .wl-toast.show{opacity:1;transform:translateX(0)}
    .wl-toast-img{width:44px;height:44px;border-radius:6px;object-fit:cover;flex-shrink:0}
    .wl-toast-img-placeholder{width:44px;height:44px;border-radius:6px;background:#f1f5f9;flex-shrink:0}
    .wl-toast-body{flex:1;min-width:0}
    .wl-toast-title{font-size:13px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .wl-toast-msg{font-size:12px;color:#64748b;margin-top:2px}
    .wl-toast-close{background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;flex-shrink:0;line-height:1}
  </style>
  ${customCss ? `<style id="wl-custom-css">${customCss}</style>` : ""}

  <div class="wl-page">
    <div class="wl-header">
      <div class="wl-header-center">
        <h1 id="wl-title" style="font-size:30px;font-weight:800;color:#0f172a;letter-spacing:4px;line-height:1.1;margin:0;text-align:center;position:relative;display:inline-block">My Wishlist</h1>
        <div class="wl-title-deco" id="wl-title-deco">
          <span class="wl-deco-line wl-deco-line--left"></span>
          <svg class="wl-deco-heart" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span class="wl-deco-line wl-deco-line--right"></span>
        </div>
        <span class="wl-count" id="wl-count"></span>
      </div>
      <button type="button" class="wl-share-btn" id="wl-share" style="display:none" onclick="window.__wlShare()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        <span id="wl-share-label">Share</span>
      </button>
    </div>
    <div class="wl-actionbar" id="wl-actionbar">
      <button type="button" class="wl-actionbar-btn" id="wl-addall-btn" onclick="window.__wlAddAllToCart()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span id="wl-addall-label">Add wishlist to cart</span>
      </button>
      <button type="button" class="wl-actionbar-btn wl-actionbar-btn--danger" id="wl-clear-btn" onclick="window.__wlClearWishlist()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        <span id="wl-clear-label">Clear wishlist</span>
      </button>
    </div>
    <div class="wl-page-loader" id="wl-page-loader">
      <span class="wl-loader-text" id="wl-loader-text">YOUR WISHLIST</span>
    </div>
    <div class="wl-grid" id="wl-grid" style="display:none"></div>
    <div class="wl-load-more" id="wl-load-more" style="display:none">
      <p class="wl-shown-count" id="wl-shown-count"></p>
      <button type="button" class="wl-load-more-btn" id="wl-load-more-btn" onclick="window.__wlLoadMore()">Load More</button>
    </div>
  </div>

  <script>
    window.__wlPageConfig = {
      shop: ${JSON.stringify(shop)},
      proxyUrl: ${JSON.stringify("https://" + shop)} + "/apps/wishlist",
      customerId: ${JSON.stringify(loggedInCustomerId)} || localStorage.getItem("wishlist_guest_id"),
      locale: "en",
      language: ${JSON.stringify(language)}
    };
  </script>
  <script>
  (function () {
    var shop = window.__wlPageConfig && window.__wlPageConfig.shop;
    var proxyUrl = window.__wlPageConfig && window.__wlPageConfig.proxyUrl;
    var customerId = window.__wlPageConfig && window.__wlPageConfig.customerId;
    var merchantLanguage = window.__wlPageConfig && window.__wlPageConfig.language;
    var detectedLocale = (window.__wlPageConfig && window.__wlPageConfig.locale) || 'en';
    var locale = ((merchantLanguage || detectedLocale) + '').split('-')[0].toLowerCase();

    var translations = {
      de: {
        title: "Wunschliste", loading: "Lädt...", loadingList: "Wunschliste wird geladen...",
        share: "Teilen", addToCart: "IN DEN WARENKORB", soldOut: "AUSVERKAUFT",
        adding: "Wird hinzugefügt...", added: "Hinzugefügt!", error: "Fehler",
        removed: "Von der Wunschliste entfernt", addedToCart: "In den Warenkorb gelegt",
        emptyTitle: "Deine Wunschliste ist leer",
        emptyText: "Stöbere in unserer Kollektion und tippe auf das Herz-Symbol bei Produkten, die du liebst.",
        startShopping: "Jetzt einkaufen", couldNotLoad: "Wunschliste konnte nicht geladen werden. Bitte versuche es erneut.",
        items: function(n) { return n + " Artikel"; },
        loaderText: "DEINE WUNSCHLISTE", loadMore: "Mehr laden", removeLabel: "Entfernen",
        shownCount: function(s, t) { return "Anzeige " + s + " von " + t + " Artikeln"; },
        addAllToCart: "Wunschliste in den Warenkorb", clearWishlist: "Wunschliste leeren", addingAll: "Wird hinzugefügt...",
        confirmClear: "Alle Artikel aus deiner Wunschliste entfernen? Dies kann nicht rückgängig gemacht werden.",
        clearedToast: "Wunschliste geleert",
        signInHint: "Melde dich an, um auf deine Wunschliste auf allen Geräten zuzugreifen und Benachrichtigungen bei niedrigem Bestand, Wiederverfügbarkeit und Preisrückgängen zu erhalten."
      },
      es: {
        title: "Lista de deseos", loading: "Cargando...", loadingList: "Cargando tu lista de deseos...",
        share: "Compartir", addToCart: "AÑADIR AL CARRITO", soldOut: "AGOTADO",
        adding: "Añadiendo...", added: "¡Añadido!", error: "Error",
        removed: "Eliminado de la lista de deseos", addedToCart: "Añadido al carrito",
        emptyTitle: "Tu lista de deseos está vacía",
        emptyText: "Navega por nuestra colección y toca el icono del corazón en los productos que te gusten.",
        startShopping: "Empezar a comprar", couldNotLoad: "No se pudo cargar tu lista de deseos. Inténtalo de nuevo.",
        items: function(n) { return n + " artículo" + (n !== 1 ? "s" : ""); },
        loaderText: "TU LISTA DE DESEOS", loadMore: "Cargar más", removeLabel: "Eliminar",
        shownCount: function(s, t) { return "Mostrando " + s + " de " + t + " artículos"; },
        addAllToCart: "Añadir lista al carrito", clearWishlist: "Vaciar lista de deseos", addingAll: "Añadiendo todo...",
        confirmClear: "¿Eliminar todos los artículos de tu lista de deseos? Esto no se puede deshacer.",
        clearedToast: "Lista de deseos vaciada",
        signInHint: "Inicia sesión para acceder a tu lista de deseos en todos tus dispositivos y recibir alertas de stock bajo, disponibilidad y bajadas de precio."
      },
      it: {
        title: "Lista dei desideri", loading: "Caricamento...", loadingList: "Caricamento della lista dei desideri...",
        share: "Condividi", addToCart: "AGGIUNGI AL CARRELLO", soldOut: "ESAURITO",
        adding: "Aggiunta in corso...", added: "Aggiunto!", error: "Errore",
        removed: "Rimosso dalla lista dei desideri", addedToCart: "Aggiunto al carrello",
        emptyTitle: "La tua lista dei desideri è vuota",
        emptyText: "Sfoglia la nostra collezione e tocca l'icona del cuore sui prodotti che ami.",
        startShopping: "Inizia lo shopping", couldNotLoad: "Impossibile caricare la lista dei desideri. Riprova.",
        items: function(n) { return n + " articol" + (n !== 1 ? "i" : "o"); },
        loaderText: "LA TUA LISTA DEI DESIDERI", loadMore: "Carica altro", removeLabel: "Rimuovi",
        shownCount: function(s, t) { return "Visualizzazione di " + s + " su " + t + " articoli"; },
        addAllToCart: "Aggiungi lista al carrello", clearWishlist: "Svuota lista dei desideri", addingAll: "Aggiunta di tutto...",
        confirmClear: "Rimuovere tutti gli articoli dalla tua lista dei desideri? Questa azione non può essere annullata.",
        clearedToast: "Lista dei desideri svuotata",
        signInHint: "Accedi per visualizzare la tua lista dei desideri su tutti i dispositivi e ricevere avvisi su scorte basse, disponibilità e ribassi di prezzo."
      },
      fr: {
        title: "Ma liste de souhaits", loading: "Chargement...", loadingList: "Chargement de votre liste de souhaits...",
        share: "Partager", addToCart: "AJOUTER AU PANIER", soldOut: "ÉPUISÉ",
        adding: "Ajout en cours...", added: "Ajouté !", error: "Erreur",
        removed: "Retiré de la liste de souhaits", addedToCart: "Ajouté au panier",
        emptyTitle: "Votre liste de souhaits est vide",
        emptyText: "Parcourez notre collection et appuyez sur l'icône en forme de cœur sur les produits que vous aimez pour les enregistrer ici.",
        startShopping: "Commencer vos achats", couldNotLoad: "Impossible de charger votre liste de souhaits. Veuillez réessayer.",
        items: function(n) { return n + " article" + (n !== 1 ? "s" : ""); },
        loaderText: "VOTRE LISTE DE SOUHAITS", loadMore: "Charger plus", removeLabel: "Retirer",
        shownCount: function(s, t) { return "Affichage de " + s + " sur " + t + " articles"; },
        addAllToCart: "Ajouter la liste au panier", clearWishlist: "Vider la liste de souhaits", addingAll: "Ajout en cours...",
        confirmClear: "Retirer tous les articles de votre liste de souhaits ? Cette action est irréversible.",
        clearedToast: "Liste de souhaits vidée",
        signInHint: "Connectez-vous pour accéder à votre liste de souhaits sur tous vos appareils et recevoir des alertes de stock faible, de réapprovisionnement et de baisse de prix."
      },
      en: {
        title: "My Wishlist", loading: "Loading...", loadingList: "Loading your wishlist...",
        share: "Share", addToCart: "ADD TO CART", soldOut: "SOLD OUT",
        adding: "Adding...", added: "Added!", error: "Error",
        removed: "Removed from Wishlist", addedToCart: "Added to Cart",
        emptyTitle: "Your wishlist is empty",
        emptyText: "Browse our collection and tap the heart icon on products you love to save them here.",
        startShopping: "Start Shopping", couldNotLoad: "Could not load your wishlist. Please try again.",
        items: function(n) { return n + " item" + (n !== 1 ? "s" : ""); },
        loaderText: "YOUR WISHLIST", loadMore: "Load More", removeLabel: "Remove",
        shownCount: function(s, t) { return "Showing " + s + " of " + t + " items"; },
        addAllToCart: "Add wishlist to cart", clearWishlist: "Clear wishlist", addingAll: "Adding all...",
        confirmClear: "Remove all items from your wishlist? This cannot be undone.",
        clearedToast: "Wishlist cleared",
        signInHint: "Sign in to access your wishlist across all your devices and receive low stock, back in stock and price drop alerts."
      }
    };
    var T = translations[locale] || translations.en;

    var titleEl = document.getElementById("wl-title");
    if (titleEl) titleEl.textContent = T.title;
    var shareLabelEl = document.getElementById("wl-share-label");
    if (shareLabelEl) shareLabelEl.textContent = T.share;
    var loaderTextEl = document.getElementById("wl-loader-text");
    if (loaderTextEl) loaderTextEl.textContent = T.loaderText;
    var loadMoreBtnEl = document.getElementById("wl-load-more-btn");
    if (loadMoreBtnEl) loadMoreBtnEl.textContent = T.loadMore;
    var addAllLabelEl = document.getElementById("wl-addall-label");
    if (addAllLabelEl) addAllLabelEl.textContent = T.addAllToCart;
    var clearLabelEl = document.getElementById("wl-clear-label");
    if (clearLabelEl) clearLabelEl.textContent = T.clearWishlist;

    var isGuestCustomer = !customerId || String(customerId).indexOf("guest_") === 0;

    if (!customerId) { showEmpty(); return; }

    var allItems = [];
    var shownCount = 0;
    var itemsPerPage = 10;
    var storeSettings = {};

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
        '<button type="button" class="wl-toast-close">✕</button>';
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

        document.getElementById("wl-actionbar").style.display = "flex";
        if (s.showAddToCart === false) document.getElementById("wl-addall-btn").style.display = "none";

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

        html += '<button type="button" class="wl-card-remove" onclick="window.__wlRemove(\\'' + item.productId + '\\',\\'' + (item.variantId || '') + '\\')" title="' + esc(T.removeLabel) + '">' +
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
          html += '<button type="button" class="wl-card-atc"' + atcDisabled + ' onclick="window.__wlAddCart(this,\\'' + item.productId + '\\',\\'' + varId + '\\',\\'' + p.handle + '\\')">' +
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
        if (counter) counter.textContent = T.shownCount(shownCount, allItems.length);
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

    function showEmpty() {
      hideLoader();
      var grid = document.getElementById("wl-grid");
      if (grid) grid.style.display = "block";
      var countEl = document.getElementById("wl-count");
      if (countEl) countEl.textContent = T.items(0);
      var actionbar = document.getElementById("wl-actionbar");
      if (actionbar) actionbar.style.display = "none";
      document.getElementById("wl-grid").innerHTML =
        '<div class="wl-empty">' +
        '<h2>' + T.emptyTitle + '</h2>' +
        '<p>' + T.emptyText + '</p>' +
        (isGuestCustomer ? '<p class="wl-empty-signin">' + T.signInHint + '</p>' : '') +
        '<a href="/collections/all" class="wl-empty-cta">' + T.startShopping + '</a>' +
        '</div>';
    }

    function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function money(a, c) {
      return new Intl.NumberFormat(navigator.language || "en-US", { style: "currency", currency: c || "USD" }).format(parseFloat(a));
    }

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

        if (window.__wlRefreshBadge) {
          window.__wlRefreshBadge();
        } else {
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
        }
      });
    };

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
        var cxhr = new XMLHttpRequest();
        cxhr.open('GET', '/cart.js', true);
        cxhr.onreadystatechange = function () {
          if (cxhr.readyState !== 4 || cxhr.status !== 200) return;
          var cart;
          try { cart = JSON.parse(cxhr.responseText); } catch (e) { return; }
          var count = cart.item_count;

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

          var horizonCount = document.querySelector('.cart-bubble__text-count');
          if (horizonCount) horizonCount.textContent = count;
          var horizonIcon = document.querySelector('cart-icon');
          if (horizonIcon) horizonIcon.classList.toggle('header-actions__cart-icon--has-cart', count > 0);

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
        };
        cxhr.send();
      }

      function openCartDrawer() {
        var cartPageLink = document.querySelector(
          'header a[href="/cart"], #shopify-section-header a[href="/cart"], .header a[href="/cart"], a#cart-icon-bubble'
        );
        if (cartPageLink) return;

        var hasDrawer = !!(
          document.querySelector('cart-drawer') ||
          document.querySelector('[id="cart-drawer"]') ||
          document.querySelector('[id="CartDrawer"]') ||
          document.querySelector('[id="ajax-cart"]') ||
          document.querySelector('.cart-drawer__inner') ||
          document.querySelector('[data-cart-drawer]')
        );
        if (!hasDrawer) return;

        var closeBtn = document.querySelector('.cart-drawer__close-button, [class*="cart-drawer"][class*="close"]');
        if (closeBtn) {
          var r = closeBtn.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return;
        }

        var horizonBtn = document.querySelector('button[aria-label="Cart"]');
        if (horizonBtn) { horizonBtn.click(); return; }

        if (window.Alpine) {
          try { Alpine.store('cart').open(); return; } catch(e) {}
          try { Alpine.store('cartDrawer').open(); return; } catch(e) {}
          try { Alpine.store('cart').isOpen = true; return; } catch(e) {}
        }

        window.dispatchEvent(new CustomEvent('open-cart', { bubbles: true }));
        window.dispatchEvent(new CustomEvent('open-cart-drawer', { bubbles: true }));

        var drawer = document.querySelector('cart-drawer');
        if (drawer) {
          if (typeof drawer.show === 'function') { drawer.show(); return; }
          if (typeof drawer.open === 'function') { drawer.open(); return; }
          var summary = drawer.querySelector('summary');
          if (summary && !drawer.hasAttribute('open')) { summary.click(); return; }
        }

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

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/cart/add.js', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) return;
          if (xhr.status >= 200 && xhr.status < 300) {
            syncCartBubble();
            openCartDrawer();
            showToast(title, T.addedToCart, imgSrc);
            window.__wlRemove(pid, vid, true);
            btnEl.textContent = T.added;
            btnEl.classList.add('added');
          } else {
            console.error('Cart add failed', xhr.status);
            btnEl.textContent = T.error;
          }
          setTimeout(function () {
            if (document.contains(btnEl)) {
              btnEl.disabled = false;
              btnEl.textContent = T.addToCart;
              btnEl.classList.remove('added');
            }
          }, 1500);
        };
        xhr.send(JSON.stringify({ items: [{ id: parseInt(variantId), quantity: 1 }] }));
      }

      getVariantId(addToCart);
    };

    window.__wlShare = function () {
      if (navigator.share) navigator.share({ title: T.title, url: location.href });
      else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); }
    };

    function showClearConfirm(onConfirm) {
      var overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:20px;";

      var panel = document.createElement("div");
      panel.style.cssText = "background:#fff;border-radius:14px;padding:28px 26px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.25);text-align:center;font-family:'DM Sans',sans-serif;";
      panel.innerHTML =
        '<div style="width:48px;height:48px;border-radius:50%;background:#fef2f2;border:1.5px solid rgba(220,38,38,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>' +
        '</div>' +
        '<p style="font-size:15px;font-weight:700;color:#1a1612;margin:0 0 8px;">' + esc(T.confirmClear) + '</p>' +
        '<div style="display:flex;gap:10px;margin-top:18px;">' +
          '<button type="button" id="wl-cc-cancel" style="flex:1;padding:10px 14px;background:#f4f1eb;color:#4a4238;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;">' + esc(T.cancelLabel || "Cancel") + '</button>' +
          '<button type="button" id="wl-cc-confirm" style="flex:1;padding:10px 14px;background:#dc2626;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;">' + esc(T.clearWishlist || "Clear") + '</button>' +
        '</div>';

      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      function close() { overlay.remove(); }
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      panel.querySelector("#wl-cc-cancel").addEventListener("click", close);
      panel.querySelector("#wl-cc-confirm").addEventListener("click", function () { close(); onConfirm(); });
    }

    window.__wlClearWishlist = function () {
      if (allItems.length === 0) return;
      showClearConfirm(function () {
      var btn = document.getElementById("wl-clear-btn");
      if (btn) btn.disabled = true;

      fetch(proxyUrl + "/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: shop, customerId: customerId, action: "clear" })
      }).then(function () {
        allItems = [];
        shownCount = 0;
        showToast(T.title, T.clearedToast, null);
        showEmpty();
        var badge = document.getElementById("wl-hdr-badge");
        if (badge) { badge.textContent = "0"; badge.style.display = "none"; }
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
      });
    };

    window.__wlAddAllToCart = function () {
      if (allItems.length === 0) return;
      var btn = document.getElementById("wl-addall-btn");
      var labelEl = document.getElementById("wl-addall-label");
      if (btn.disabled) return;
      btn.disabled = true;
      var originalLabel = labelEl.textContent;
      labelEl.textContent = T.addingAll;

      function resolveVariant(item) {
        return new Promise(function (resolve) {
          if (item.variantId && item.variantId !== "null" && item.variantId !== "undefined" && item.variantId !== "") {
            resolve(item.variantId);
            return;
          }
          var handle = item.product && item.product.handle;
          if (!handle) { resolve(null); return; }
          fetch("/products/" + handle + ".json")
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (!data || !data.product || !data.product.variants || !data.product.variants.length) { resolve(null); return; }
              var variant = null;
              for (var i = 0; i < data.product.variants.length; i++) {
                if (data.product.variants[i].available) { variant = data.product.variants[i]; break; }
              }
              if (!variant) variant = data.product.variants[0];
              resolve(variant.id);
            })
            .catch(function () { resolve(null); });
        });
      }

      var availableItems = allItems.filter(function (item) { return item.product && item.product.available !== false; });

      if (availableItems.length === 0) {
        labelEl.textContent = originalLabel;
        btn.disabled = false;
        return;
      }

      Promise.all(availableItems.map(resolveVariant)).then(function (variantIds) {
        var cartItems = [];
        for (var i = 0; i < variantIds.length; i++) {
          if (variantIds[i]) cartItems.push({ id: parseInt(variantIds[i]), quantity: 1 });
        }
        if (cartItems.length === 0) {
          labelEl.textContent = originalLabel;
          btn.disabled = false;
          return;
        }
        fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cartItems })
        }).then(function (res) {
          if (!res.ok) throw new Error("add failed");
          showToast(T.title, T.addedToCart, null);
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "/cart.js", true);
          xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4 || xhr.status !== 200) return;
            try {
              var cart = JSON.parse(xhr.responseText);
              var els = document.querySelectorAll(
                ".cart-count-bubble, [data-cart-count], .cart-count, .CartCount, #cart-count, .cart__count, [data-header-cart-count], .header__cart-count, .cart-item-count"
              );
              els.forEach(function (el) {
                el.style.display = cart.item_count > 0 ? "" : "none";
                var span = el.querySelector('span[aria-hidden="true"], span');
                if (span) span.textContent = cart.item_count;
                else el.textContent = cart.item_count;
              });
            } catch (e) {}
          };
          xhr.send();
        }).catch(function () {
          labelEl.textContent = T.error;
        }).finally(function () {
          setTimeout(function () {
            labelEl.textContent = originalLabel;
            btn.disabled = false;
          }, 1200);
        });
      });
    };

  })();
  </script>
  `;

    return new Response(liquid, {
      headers: {
        "Content-Type": isEmbed ? "text/html" : "application/liquid",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  };

    
