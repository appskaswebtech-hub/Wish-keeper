import type { LoaderFunctionArgs } from "react-router";

const SHOPIFY_URL =
  "https://apps.shopify.com/wishkeeper?search_id=da395d58-d591-4828-83b8-0fc5e7afdef6&surface_detail=wishkeeper&surface_inter_position=1&surface_intra_position=1&surface_type=search";
const SUPPORT_EMAIL = "apps.kaswebtech@gmail.com";

export const loader = async (_: LoaderFunctionArgs) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>WishKeeper – The Wishlist App for Shopify</title>
<meta name="description" content="Add powerful wishlists to your Shopify store in minutes. Let customers save products and come back to buy."/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#b8922a;--gold-light:#d4a843;--gold-pale:rgba(184,146,42,0.12);
  --bg:#0d0c0a;--bg2:#13110e;--surface:#1a1714;
  --border:rgba(255,255,255,0.08);--text:#f0ece4;--muted:#8a8278;
  --radius:16px;
}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;-webkit-overflow-scrolling:touch}

/* ── Navbar ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 48px;display:flex;align-items:center;justify-content:space-between;transition:all .3s ease}
.nav.scrolled{background:rgba(13,12,10,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--border);padding:14px 48px}
.nav-logo{display:flex;align-items:center;gap:10px;font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text);text-decoration:none}
.nav-logo-icon{width:34px;height:34px;background:var(--gold);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nav-links{display:flex;align-items:center;gap:32px;list-style:none}
.nav-links a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--text)}
.nav-cta{display:flex;align-items:center;gap:8px;background:var(--gold);color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s,transform .15s}
.nav-cta:hover{background:var(--gold-light);transform:translateY(-1px)}

/* ── Hero ── */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 48px 80px;text-align:center;position:relative;overflow:hidden;will-change:transform,opacity,filter;transform-origin:top center;transform-style:preserve-3d;background-image:url('/hero-banner.jpg.png');background-size:cover;background-position:center center;background-repeat:no-repeat}
.hero::before{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.75) 0%,rgba(13,12,10,.68) 45%,rgba(13,12,10,.88) 100%);pointer-events:none;z-index:0}
.hero::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 30%,rgba(184,146,42,.10) 0%,transparent 65%);pointer-events:none;z-index:0}
.hero-content{position:relative;z-index:1}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);background:var(--gold-pale);border:1px solid rgba(184,146,42,.25);padding:6px 16px;border-radius:100px;margin-bottom:28px}
.hero-title{font-family:'Playfair Display',serif;font-size:clamp(40px,6vw,76px);font-weight:700;line-height:1.15;color:#fff;max-width:860px;margin:0 auto 24px;text-shadow:0 2px 24px rgba(0,0,0,0.9),0 0 60px rgba(0,0,0,0.6)}
.hero-title em{font-style:italic;color:var(--gold);text-shadow:0 0 30px rgba(184,146,42,0.6)}
.hero-sub{font-size:18px;color:#d8d0c4;max-width:540px;margin:0 auto 40px;line-height:1.7;text-shadow:0 1px 8px rgba(0,0,0,0.8)}
.hero-ctas{display:flex;align-items:center;gap:16px;justify-content:center;flex-wrap:wrap}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#fff;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;transition:background .2s,transform .15s,box-shadow .2s;box-shadow:0 4px 24px rgba(184,146,42,.30);will-change:transform}
.btn-primary:hover{background:var(--gold-light);transform:translateY(-2px);box-shadow:0 8px 32px rgba(184,146,42,.40)}
.hero-support{font-size:13px;color:var(--muted)}
.hero-support a{color:var(--gold);text-decoration:none}
.hero-support a:hover{text-decoration:underline}


/* ── Trusted ── */
.trusted{padding:44px 48px 56px;text-align:center;overflow:visible}
.trusted-label{font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:24px}
.logo-slider-wrapper{overflow-x:hidden;overflow-y:visible;width:100%;padding:16px 0;-webkit-mask-image:linear-gradient(to right,transparent,black 8%,black 92%,transparent);mask-image:linear-gradient(to right,transparent,black 8%,black 92%,transparent)}
.logo-slider-track{display:flex;align-items:center;gap:56px;width:max-content;animation:logoScroll 32s linear infinite}
.logo-slider-wrapper:hover .logo-slider-track{animation-play-state:paused}
.logo-img{height:90px;width:160px;object-fit:cover;opacity:.6;filter:brightness(0.85);border-radius:16px;border:1px solid rgba(184,146,42,0.25);box-shadow:0 4px 20px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05);transition:opacity .3s,filter .3s,transform .3s,box-shadow .3s;flex-shrink:0;background:var(--surface)}
.logo-img:hover{opacity:1;filter:brightness(1.1);transform:scale(1.05);box-shadow:0 8px 30px rgba(184,146,42,0.2),0 4px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08);border-color:rgba(184,146,42,0.5)}
@keyframes logoScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ── Section ── */
.section{padding:96px 48px;max-width:1200px;margin:0 auto}
.section-eyebrow{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
.section-title{font-family:'Playfair Display',serif;font-size:clamp(26px,4vw,44px);font-weight:700;color:var(--text);margin-bottom:16px;max-width:600px}
.section-title em{font-style:italic;color:var(--gold)}
.section-sub{font-size:16px;color:var(--muted);max-width:520px;line-height:1.7;margin-bottom:52px}

/* ── Feature Cards ── */
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;perspective:1200px;perspective-origin:50% 50%}
.feature-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px 28px;will-change:transform,opacity,filter;transform-style:preserve-3d;backface-visibility:hidden;transition:border-color .3s}
.feature-card:hover{border-color:rgba(184,146,42,.35)}
.feature-icon{width:48px;height:48px;background:var(--gold-pale);border:1px solid rgba(184,146,42,.2);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.feature-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:var(--text);margin-bottom:12px}
.feature-desc{font-size:14px;color:var(--muted);line-height:1.7}

/* ── Steps ── */
.steps-wrap{padding:96px 48px;background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.steps-inner{max-width:1200px;margin:0 auto}
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
.step-card{will-change:transform,opacity}
.step-num{font-family:'Playfair Display',serif;font-size:64px;font-weight:700;color:rgba(184,146,42,.15);line-height:1;margin-bottom:16px}
.step-title{font-size:18px;font-weight:600;color:var(--text);margin-bottom:10px}
.step-desc{font-size:14px;color:var(--muted);line-height:1.7}

/* ── Testimonials ── */
.testimonials-wrap{padding:96px 48px;max-width:1200px;margin:0 auto}
.testimonials-grid{position:relative;min-height:200px}
.testimonial-slide{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;will-change:transform,opacity;position:absolute;top:0;left:0;width:100%}
.testimonial-slide:first-child{position:relative}
.t-controls{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:32px}
.t-btn{width:38px;height:38px;border-radius:50%;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .2s,color .2s}
.t-btn:hover{border-color:var(--gold);color:var(--gold)}
.t-dots{display:flex;gap:8px;align-items:center}
.t-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);cursor:pointer;transition:opacity .3s,transform .3s}
.testimonial-stars{color:var(--gold);font-size:14px;letter-spacing:2px;margin-bottom:16px}
.testimonial-text{font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:20px;font-style:italic}
.testimonial-author{display:flex;align-items:center;gap:12px}
.testimonial-avatar{width:36px;height:36px;border-radius:50%;background:var(--gold-pale);border:1px solid rgba(184,146,42,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--gold);flex-shrink:0}
.testimonial-name{font-size:13px;font-weight:600;color:var(--text)}
.testimonial-shop{font-size:11px;color:var(--muted)}

/* ── CTA ── */
.cta-wrap{padding:96px 48px;text-align:center;background:var(--bg2);border-top:1px solid var(--border)}
.cta-inner{max-width:600px;margin:0 auto}
.cta-title{font-family:'Playfair Display',serif;font-size:clamp(30px,4vw,48px);font-weight:700;color:var(--text);margin-bottom:16px}
.cta-title em{font-style:italic;color:var(--gold)}
.cta-sub{font-size:16px;color:var(--muted);margin-bottom:36px;line-height:1.7}
.cta-support{margin-top:20px;font-size:13px;color:var(--muted)}
.cta-support a{color:var(--gold);text-decoration:none}
.cta-support a:hover{text-decoration:underline}

/* ── Footer ── */
.footer{padding:40px 48px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.footer-logo{display:flex;align-items:center;gap:8px;font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:var(--text);text-decoration:none}
.footer-links{display:flex;gap:24px}
.footer-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s}
.footer-links a:hover{color:var(--text)}
.footer-copy{font-size:12px;color:var(--muted)}

/* ── Pricing ── */
.pricing-wrap{background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:800px;margin:0 auto}
.pricing-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:36px 32px;position:relative;display:flex;flex-direction:column;gap:24px;will-change:transform,opacity,filter;transition:border-color .3s}
.pricing-card:hover{border-color:rgba(184,146,42,.3)}
.pricing-card--pro{border-color:rgba(184,146,42,.4);background:linear-gradient(135deg,#1a1714 0%,rgba(184,146,42,.06) 100%)}
.pricing-popular{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:#fff;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 16px;border-radius:100px;white-space:nowrap}
.pricing-label{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text);margin-bottom:12px}
.pricing-price-row{display:flex;align-items:flex-end;gap:2px;margin-bottom:6px}
.pricing-currency{font-size:20px;font-weight:600;color:var(--gold);line-height:1.8}
.pricing-amount{font-family:'Playfair Display',serif;font-size:52px;font-weight:700;color:var(--gold);line-height:1}
.pricing-period{font-size:14px;color:var(--muted);margin-bottom:8px}
.pricing-trial{font-size:12px;color:var(--muted);background:rgba(184,146,42,.08);border:1px solid rgba(184,146,42,.18);border-radius:100px;padding:3px 12px;display:inline-block}
.pricing-features{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;flex:1}
.pricing-features li{font-size:14px;color:var(--muted);display:flex;align-items:flex-start;gap:10px;line-height:1.5}
.pricing-check{color:var(--gold);font-size:13px;font-weight:700;flex-shrink:0;margin-top:1px}
.pricing-btn{display:block;text-align:center;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s,transform .15s,box-shadow .2s}
.pricing-btn--basic{background:var(--surface);border:1px solid var(--border);color:var(--text)}
.pricing-btn--basic:hover{border-color:var(--gold);color:var(--gold)}
.pricing-btn--pro{background:var(--gold);color:#fff;box-shadow:0 4px 20px rgba(184,146,42,.3)}
.pricing-btn--pro:hover{background:var(--gold-light);transform:translateY(-2px);box-shadow:0 8px 28px rgba(184,146,42,.4)}

/* ── Stats Banner ── */
.stats-banner{padding:48px;background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.stats-inner{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:center}
.stat-item{flex:1;text-align:center;padding:16px 24px}
.stat-num{font-family:'Playfair Display',serif;font-size:42px;font-weight:700;color:var(--gold);margin-bottom:6px;line-height:1}
.stat-label{font-size:13px;color:var(--muted);font-weight:500;letter-spacing:.04em}
.stat-divider{width:1px;height:56px;background:var(--border);flex-shrink:0}

/* ── Animated chars ── */
.char{display:inline-block;will-change:transform,opacity}
.animated-element{will-change:transform,opacity,filter;transform-style:preserve-3d}

/* ── Responsive ── */
@media(max-width:768px){
  .nav{padding:16px 20px}.nav.scrolled{padding:12px 20px}.nav-links{display:none}
  .hero{padding:96px 20px 56px}
  .section,.testimonials-wrap{padding:64px 20px}
  .features-grid,.steps-grid,.testimonials-grid,.pricing-grid{grid-template-columns:1fr}

  .steps-wrap,.cta-wrap{padding:64px 20px}
  .trusted{padding:36px 20px}
  .footer{padding:32px 20px;flex-direction:column;text-align:center}
}
</style>
</head>
<body>

<!-- Navbar -->
<nav class="nav" id="navbar">
  <a href="/home" class="nav-logo">
    <div class="nav-logo-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
    </div>
    WishKeeper
  </a>
  <ul class="nav-links">
    <li><a href="#features">Features</a></li>
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#testimonials">Reviews</a></li>
    <li><a href="/instructions">Setup Guide</a></li>
    <li><a href="/privacy-policy">Privacy Policy</a></li>
  </ul>
  <a href="${SHOPIFY_URL}" class="nav-cta" target="_blank" rel="noopener">Add to Shopify &rarr;</a>
</nav>

<!-- Hero -->
<section class="hero" id="hero">
  <div class="hero-content animated-element">
    <div class="hero-eyebrow">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
      The #1 Wishlist App for Shopify
    </div>
    <h1 class="hero-title animation-text">The Wishlist App Your Customers <em>Will Love</em></h1>
    <p class="hero-sub">Let shoppers save their favourite products and return to buy. Boost engagement, reduce bounce, and turn browsers into loyal buyers.</p>
    <div class="hero-ctas">
      <a href="${SHOPIFY_URL}" class="btn-primary" target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
        Add to Shopify, Free
      </a>
      <a href="/instructions" style="display:inline-flex;align-items:center;gap:8px;color:#f0ece4;font-size:15px;font-weight:500;text-decoration:none;padding:13px 24px;border:1px solid rgba(255,255,255,0.18);border-radius:10px;backdrop-filter:blur(6px);transition:border-color .2s,color .2s" onmouseover="this.style.borderColor='#b8922a';this.style.color='#b8922a'" onmouseout="this.style.borderColor='rgba(255,255,255,0.18)';this.style.color='#f0ece4'">
        Setup Guide &rarr;
      </a>
      <span class="hero-support">Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></span>
    </div>
  </div>

</section>

<!-- Stats Banner -->
<div class="stats-banner">
  <div class="stats-inner">
    <div class="stat-item">
      <div class="stat-num" id="s1">500+</div>
      <div class="stat-label">Shopify Stores</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-num" id="s2">50K+</div>
      <div class="stat-label">Wishlists Created</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-num" id="s3">4.9&#9733;</div>
      <div class="stat-label">Average Rating</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-num" id="s4">Free</div>
      <div class="stat-label">To Install</div>
    </div>
  </div>
</div>

<!-- Trusted By -->
<div class="trusted">
  <div class="trusted-label">Trusted by Shopify merchants worldwide</div>
  <div class="logo-slider-wrapper">
    <div class="logo-slider-track">
      <!-- Set 1 — replace src with your image paths in /public/ -->
      <img class="logo-img" src="/store-logo-1.png" alt="Store 1" />
      <img class="logo-img" src="/store-logo-2.png" alt="Store 2" />
      <img class="logo-img" src="/store-logo-3.png" alt="Store 3" />
      <img class="logo-img" src="/store-logo-4.png" alt="Store 4" />
      <img class="logo-img" src="/store-logo-5.png" alt="Store 5" />
      <img class="logo-img" src="/store-logo-6.png" alt="Store 6" />
      <img class="logo-img" src="/store-logo-7.png" alt="Store 7" />
      <img class="logo-img" src="/store-logo-8.png" alt="Store 8" />
      <!-- Set 2 — exact duplicate for seamless infinite loop -->
      <img class="logo-img" src="/store-logo-1.png" alt="Store 1" />
      <img class="logo-img" src="/store-logo-2.png" alt="Store 2" />
      <img class="logo-img" src="/store-logo-3.png" alt="Store 3" />
      <img class="logo-img" src="/store-logo-4.png" alt="Store 4" />
      <img class="logo-img" src="/store-logo-5.png" alt="Store 5" />
      <img class="logo-img" src="/store-logo-6.png" alt="Store 6" />
      <img class="logo-img" src="/store-logo-7.png" alt="Store 7" />
      <img class="logo-img" src="/store-logo-8.png" alt="Store 8" />
    </div>
  </div>
</div>

<!-- Features -->
<div id="features">
  <div class="section">
    <div class="section-eyebrow">Features</div>
    <h2 class="section-title">Everything you need in a <em>wishlist app</em></h2>
    <p class="section-sub">Simple to set up, powerful to use. WishKeeper works out of the box with any Shopify theme, no coding required.</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#b8922a"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
        </div>
        <div class="feature-title">Heart Button</div>
        <p class="feature-desc">A beautiful heart icon appears on every product. One tap saves it to the wishlist, no account needed for guest shoppers.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </div>
        <div class="feature-title">Wishlist Page</div>
        <p class="feature-desc">A dedicated wishlist page where customers view saved products, add to cart, and share their list with friends and family.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="feature-title">Analytics Dashboard</div>
        <p class="feature-desc">See which products are being wishlisted most. Understand demand, plan campaigns, and act on real customer intent data.</p>
      </div>
    </div>
  </div>
</div>

<!-- How It Works -->
<div class="steps-wrap" id="how-it-works">
  <div class="steps-inner">
    <div class="section-eyebrow">How it works</div>
    <h2 class="section-title" style="margin-bottom:48px">Up and running in <em>minutes</em></h2>
    <div class="steps-grid">
      <div class="step-card">
        <div class="step-num">01</div>
        <div class="step-title">Install WishKeeper</div>
        <p class="step-desc">Add WishKeeper to your Shopify store from the app store. No coding required, it works instantly with any theme.</p>
      </div>
      <div class="step-card">
        <div class="step-num">02</div>
        <div class="step-title">Customise the look</div>
        <p class="step-desc">Choose your icon style, active colour, and grid layout. Match WishKeeper perfectly to your brand in a few clicks.</p>
      </div>
      <div class="step-card">
        <div class="step-num">03</div>
        <div class="step-title">Watch sales grow</div>
        <p class="step-desc">Customers save products and return to buy. Track the most-wishlisted items and turn intent into revenue.</p>
      </div>
    </div>
  </div>
</div>

<!-- Testimonials -->
<div class="testimonials-wrap" id="testimonials">
  <div class="section-eyebrow">Reviews</div>
  <h2 class="section-title" style="margin-bottom:40px">Loved by <em>store owners</em></h2>
  <div class="testimonials-grid">
    <div class="testimonial-slide">
      <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p class="testimonial-text">&ldquo;WishKeeper has been a game changer for our store. Our customers love saving items and we&apos;ve seen a real boost in return visits. Setup took literally 5 minutes.&rdquo;</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">S</div>
        <div><div class="testimonial-name">Sarah M.</div><div class="testimonial-shop">Fashion Boutique</div></div>
      </div>
    </div>
    <div class="testimonial-slide">
      <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p class="testimonial-text">&ldquo;The analytics alone make this worth it. I can now see exactly which products customers are eyeing, which helps me plan restocks and promotions perfectly.&rdquo;</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">J</div>
        <div><div class="testimonial-name">James K.</div><div class="testimonial-shop">Home &amp; Living Store</div></div>
      </div>
    </div>
    <div class="testimonial-slide">
      <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p class="testimonial-text">&ldquo;Clean design, works perfectly on mobile, and the support team is incredibly responsive. Exactly what I was looking for in a wishlist app for my Shopify store.&rdquo;</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">P</div>
        <div><div class="testimonial-name">Priya N.</div><div class="testimonial-shop">Beauty &amp; Wellness</div></div>
      </div>
    </div>
  </div>
  <div class="t-controls">
    <button class="t-btn" id="t-prev">&#8592;</button>
    <div class="t-dots">
      <div class="t-dot"></div>
      <div class="t-dot"></div>
      <div class="t-dot"></div>
    </div>
    <button class="t-btn" id="t-next">&#8594;</button>
  </div>
</div>

<!-- Pricing -->
<div class="pricing-wrap" id="pricing">
  <div class="section">
    <div class="section-eyebrow">Pricing</div>
    <h2 class="section-title">Simple, transparent <em>pricing</em></h2>
    <p class="section-sub">Try any plan free for 7 days, cancel anytime, no strings attached.</p>
    <div class="pricing-grid">

      <div class="pricing-card">
        <div class="pricing-card__head">
          <div class="pricing-label">Basic</div>
          <div class="pricing-price-row">
            <span class="pricing-currency">$</span>
            <span class="pricing-amount">9.99</span>
            <span class="pricing-period">/ month</span>
          </div>
          <div class="pricing-trial">7-day free trial</div>
        </div>
        <ul class="pricing-features">
          <li><span class="pricing-check">&#10003;</span>Wishlist page for your customers</li>
          <li><span class="pricing-check">&#10003;</span>Up to 50 saved items per customer</li>
          <li><span class="pricing-check">&#10003;</span>Heart button on all product pages</li>
          <li><span class="pricing-check">&#10003;</span>Works with any Shopify theme</li>
          <li><span class="pricing-check">&#10003;</span>Easy one-click setup</li>
          <li><span class="pricing-check">&#10003;</span>Email alerts for price changes</li>
          <li><span class="pricing-check">&#10003;</span>Email alerts for stock changes</li>
          <li><span class="pricing-check">&#10003;</span>Custom button configuration</li>
        </ul>
      </div>

      <div class="pricing-card pricing-card--pro">
        <div class="pricing-popular">Most Popular</div>
        <div class="pricing-card__head">
          <div class="pricing-label">Pro</div>
          <div class="pricing-price-row">
            <span class="pricing-currency">$</span>
            <span class="pricing-amount">14.99</span>
            <span class="pricing-period">/ month</span>
          </div>
          <div class="pricing-trial">7-day free trial</div>
        </div>
        <ul class="pricing-features">
          <li><span class="pricing-check">&#10003;</span>Unlimited saved items per customer</li>
          <li><span class="pricing-check">&#10003;</span>Wishlist page for your customers</li>
          <li><span class="pricing-check">&#10003;</span>Heart button on all product pages</li>
          <li><span class="pricing-check">&#10003;</span>Analytics dashboard &amp; top products</li>
          <li><span class="pricing-check">&#10003;</span>Works with any Shopify theme</li>
          <li><span class="pricing-check">&#10003;</span>Easy one-click setup</li>
          <li><span class="pricing-check">&#10003;</span>Email alerts for price changes</li>
          <li><span class="pricing-check">&#10003;</span>Email alerts for stock changes</li>
          <li><span class="pricing-check">&#10003;</span>Custom button configuration</li>
        </ul>
      </div>

    </div>
  </div>
</div>

<!-- Final CTA -->
<div class="cta-wrap">
  <div class="cta-inner">
    <h2 class="cta-title">Start for <em>free</em> today</h2>
    <p class="cta-sub">Join hundreds of Shopify merchants already using WishKeeper to boost customer engagement and drive repeat purchases.</p>
    <a href="${SHOPIFY_URL}" class="btn-primary" target="_blank" rel="noopener" style="display:inline-flex;font-size:16px;padding:16px 40px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
      Add WishKeeper to Shopify
    </a>
    <p class="cta-support">Need help? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
  </div>
</div>

<!-- Footer -->
<footer class="footer">
  <a href="/home" class="footer-logo">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#b8922a"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
    WishKeeper
  </a>
  <div class="footer-links">
    <a href="/home">Home</a>
    <a href="/instructions">Setup Guide</a>
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="mailto:${SUPPORT_EMAIL}">Support</a>
  </div>
  <div class="footer-copy">&copy; 2026 KAS Web Tech Solutions. All rights reserved.</div>
</footer>

<script>
document.addEventListener('DOMContentLoaded', function() {
  gsap.registerPlugin(ScrollTrigger);


  // ── 1: Page load timeline ─────────────────────────────────────────────────
  gsap.set('#hero',         { opacity:0, filter:'blur(10px)', scale:1.1 });
  gsap.set('.hero-content', { opacity:0, filter:'blur(10px)', scale:1.1 });
  gsap.set('#navbar',       { opacity:0, filter:'blur(4px)' });
  var tl = gsap.timeline();
  tl.to('#navbar',         { opacity:1, filter:'blur(0px)', duration:0.5, ease:'power2.inOut', delay:0.25 })
    .to('#hero',           { opacity:1, filter:'blur(0px)', scale:1, duration:1.0, ease:'power2.inOut' }, '-=0.3')
    .to('.hero-content',   { opacity:1, filter:'blur(0px)', scale:1, duration:0.6, ease:'power2.inOut' }, '-=0.7');

  // ── 2: Hero card shrinks on scroll (scrubbed) ─────────────────────────────
  gsap.to('#hero', {
    scale:0.92, ease:'none',
    scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:1.2 }
  });

  // Background parallax
  gsap.to('#hero', {
    backgroundPositionY:'30%', ease:'none',
    scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:true }
  });

  // ── 3: Character-by-character headline glow ───────────────────────────────
  function splitTextNodes(node) {
    if (node.nodeType === 3) {
      var frag = document.createDocumentFragment();
      var words = node.textContent.split(' ');
      words.forEach(function(word, wi) {
        if (word.length === 0) { frag.appendChild(document.createTextNode(' ')); return; }
        var wordWrap = document.createElement('span');
        wordWrap.style.cssText = 'white-space:nowrap;display:inline';
        word.split('').forEach(function(ch) {
          var s = document.createElement('span');
          s.className = 'char';
          s.style.cssText = 'display:inline-block;opacity:0;transform:scale(0.5)';
          s.textContent = ch;
          wordWrap.appendChild(s);
        });
        frag.appendChild(wordWrap);
        if (wi < words.length - 1) frag.appendChild(document.createTextNode(' '));
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1) {
      Array.from(node.childNodes).forEach(splitTextNodes);
    }
  }
  document.querySelectorAll('.animation-text').forEach(function(el) {
    splitTextNodes(el);
    var isHero = !!el.closest('#hero');
    if (isHero) {
      gsap.fromTo(el.querySelectorAll('.char'),
        { opacity:0, scale:0.5 },
        { opacity:1, scale:1, color:'#d4a843', filter:'drop-shadow(0 0 8px rgba(184,146,42,.6))',
          duration:0.5, ease:'power1.out', stagger:0.03, delay:0.95 }
      );
    } else {
      gsap.to(el.querySelectorAll('.char'), {
        opacity:1, scale:1, color:'#d4a843',
        filter:'drop-shadow(0 0 10px rgba(184,146,42,.5))',
        duration:0.5, ease:'power1.out', stagger:0.06,
        scrollTrigger:{ trigger:el, start:'top 80%', end:'top 20%', toggleActions:'play reverse play reverse' }
      });
    }
  });

  // ── 4: Feature cards 3D fly-in (scrubbed) ────────────────────────────────
  if (window.innerWidth > 768) {
    var cardStates = [
      { x:-100, y:50, rotateY:-23, rotateZ:12,  scale:1.25, filter:'blur(10px)', opacity:0 },
      { x:100,  y:50, rotateY:30,  rotateZ:-26, scale:1.25, filter:'blur(10px)', opacity:0 },
      { x:0,    y:55, rotateY:0,   rotateZ:0,   scale:1.25, filter:'blur(10px)', opacity:0 }
    ];
    document.querySelectorAll('.feature-card').forEach(function(card, i) {
      var from = cardStates[i] || cardStates[2];
      gsap.set(card, from);
      gsap.to(card, {
        x:0, y:0, rotateY:0, rotateZ:0, scale:1, filter:'blur(0px)', opacity:1,
        ease:'power2.out',
        scrollTrigger:{ trigger:'.features-grid', start:'top 85%', end:'top 15%', scrub:0.4 }
      });
    });
  }

  // ── 5: Feature card hover lift ────────────────────────────────────────────
  document.querySelectorAll('.feature-card').forEach(function(card) {
    card.addEventListener('mouseenter', function() { gsap.to(card,{ scale:1.03, duration:0.3, ease:'power2.out' }); });
    card.addEventListener('mouseleave', function() { gsap.to(card,{ scale:1,    duration:0.3, ease:'power2.out' }); });
  });

  // ── 6: Stats banner ───────────────────────────────────────────────────────
  gsap.utils.toArray('.stat-item').forEach(function(item, i) {
    gsap.fromTo(item,
      { opacity:0, y:30 },
      { opacity:1, y:0, duration:0.55, delay:i*0.1, ease:'power2.out',
        scrollTrigger:{ trigger:item, start:'top 88%', toggleActions:'play none none reverse' } }
    );
  });

  // ── 7: Steps slide in from sides (scrubbed) ───────────────────────────────
  document.querySelectorAll('.step-card').forEach(function(card, i) {
    var fromX = i === 0 ? -80 : i === 2 ? 80 : 0;
    gsap.fromTo(card,
      { x:fromX, opacity:0, filter:'blur(8px)' },
      { x:0, opacity:1, filter:'blur(0px)',
        scrollTrigger:{ trigger:card, start:'top 85%', end:'top 25%', scrub:0.8 } }
    );
  });

  // ── 8: Testimonial carousel with autoplay ────────────────────────────────
  var slides  = document.querySelectorAll('.testimonial-slide');
  var dots    = document.querySelectorAll('.t-dot');
  var current = 0;
  function activateDot(n) {
    dots.forEach(function(d,i){ d.style.opacity=i===n?'1':'0.3'; d.style.transform=i===n?'scale(1.4)':'scale(1)'; });
  }
  function goTo(n) {
    gsap.to(slides[current], { opacity:0, y:-16, duration:0.4, ease:'power2.in' });
    current = (n + slides.length) % slides.length;
    gsap.fromTo(slides[current], { opacity:0, y:20 }, { opacity:1, y:0, duration:0.5, ease:'power2.out', delay:0.25 });
    activateDot(current);
  }
  slides.forEach(function(s,i){ gsap.set(s,{ opacity: i===0?1:0 }); });
  activateDot(0);
  var autoPlay = setInterval(function(){ goTo(current+1); }, 4000);
  var tw = document.querySelector('.testimonials-wrap');
  if (tw) {
    tw.addEventListener('mouseenter', function(){ clearInterval(autoPlay); });
    tw.addEventListener('mouseleave', function(){ autoPlay=setInterval(function(){ goTo(current+1); },4000); });
  }
  var pb = document.getElementById('t-prev'), nb = document.getElementById('t-next');
  if (pb) pb.addEventListener('click', function(){ goTo(current-1); });
  if (nb) nb.addEventListener('click', function(){ goTo(current+1); });

  // ── 9: Sticky navbar ──────────────────────────────────────────────────────
  ScrollTrigger.create({
    start:'top -60px',
    onEnter:    function(){ document.getElementById('navbar').classList.add('scrolled'); },
    onLeaveBack:function(){ document.getElementById('navbar').classList.remove('scrolled'); }
  });
});
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
