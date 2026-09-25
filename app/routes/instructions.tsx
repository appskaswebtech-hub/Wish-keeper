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
    <title>Setup Guide | WishKeeper</title>
    <meta name="description" content="Step-by-step instructions to install and set up WishKeeper on your Shopify store. No coding required."/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
    <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --gold:#b8922a;--gold-light:#d4a843;--gold-pale:rgba(184,146,42,0.12);
      --bg:#0d0c0a;--bg2:#13110e;--surface:#1a1714;
      --border:rgba(255,255,255,0.08);--text:#f0ece4;--muted:#8a8278;--muted2:#b0a89e;
      --radius:16px;
    }
    html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
    body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.7}

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
    .hero{padding:140px 48px 80px;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 0%,rgba(184,146,42,.12) 0%,transparent 70%);pointer-events:none}
    .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);background:var(--gold-pale);border:1px solid rgba(184,146,42,.25);padding:6px 16px;border-radius:100px;margin-bottom:28px}
    .hero-title{font-family:'Playfair Display',serif;font-size:clamp(36px,5vw,64px);font-weight:700;line-height:1.15;color:var(--text);max-width:760px;margin:0 auto 20px}
    .hero-title em{font-style:italic;color:var(--gold)}
    .hero-sub{font-size:17px;color:var(--muted2);max-width:520px;margin:0 auto 40px;line-height:1.75}
    .hero-cta{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#fff;padding:13px 30px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;transition:background .2s,transform .15s,box-shadow .2s;box-shadow:0 4px 24px rgba(184,146,42,.3)}
    .hero-cta:hover{background:var(--gold-light);transform:translateY(-2px)}

    /* ── Progress Bar ── */
    .progress-wrap{background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:28px 48px;position:sticky;top:0;z-index:50;backdrop-filter:blur(12px)}
    .progress-inner{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px}
    .prog-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;text-align:center;cursor:pointer;text-decoration:none}
    .prog-dot{width:32px;height:32px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);transition:all .3s;background:var(--surface)}
    .prog-dot.active{border-color:var(--gold);background:var(--gold);color:#fff}
    .prog-dot.done{border-color:var(--gold);background:var(--gold-pale);color:var(--gold)}
    .prog-label{font-size:11px;color:var(--muted);font-weight:500;white-space:nowrap}
    .prog-line{flex:1;height:1px;background:var(--border);margin-bottom:18px}

    /* ── Main content ── */
    .guide-wrap{max-width:900px;margin:0 auto;padding:64px 48px 120px}

    /* ── Step card ── */
    .step-card{margin-bottom:32px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:border-color .3s}
    .step-card:hover{border-color:rgba(184,146,42,.3)}
    .step-header{display:flex;align-items:center;gap:20px;padding:28px 32px;cursor:pointer;user-select:none}
    .step-num-badge{width:48px;height:48px;border-radius:12px;background:var(--gold-pale);border:1px solid rgba(184,146,42,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .step-num-badge span{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold)}
    .step-title-wrap{flex:1}
    .step-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:4px}
    .step-subtitle{font-size:13px;color:var(--muted)}
    .step-chevron{color:var(--muted);font-size:18px;transition:transform .3s}
    .step-body{padding:0 32px 32px;border-top:1px solid var(--border);margin-top:0}
    .step-body.hidden{display:none}

    /* ── Step body content ── */
    .step-intro{font-size:14px;color:var(--muted2);line-height:1.8;margin:24px 0 20px}
    .instruction-list{list-style:none;display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
    .instruction-list li{display:flex;gap:14px;font-size:14px;color:var(--muted2);line-height:1.7}
    .instr-icon{width:28px;height:28px;border-radius:8px;background:var(--gold-pale);border:1px solid rgba(184,146,42,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
    .instr-icon svg{display:block}
    .instr-text strong{color:var(--text);font-weight:600}

    /* ── Tip box ── */
    .tip-box{display:flex;gap:14px;background:rgba(184,146,42,.06);border:1px solid rgba(184,146,42,.2);border-radius:12px;padding:18px 20px;margin-top:20px}
    .tip-icon{width:22px;height:22px;flex-shrink:0;margin-top:2px}
    .tip-text{font-size:13px;color:var(--muted2);line-height:1.7}
    .tip-text strong{color:var(--gold)}

    /* ── Quick links widget ── */
    .ql-card{background:linear-gradient(135deg,rgba(184,146,42,.1),rgba(184,146,42,.04));border:1px solid rgba(184,146,42,.3);border-radius:var(--radius);padding:32px;margin-bottom:32px}
    .ql-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:6px}
    .ql-sub{font-size:13px;color:var(--muted);margin-bottom:20px}
    .ql-input-row{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap}
    .ql-input{flex:1;min-width:200px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-size:14px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
    .ql-input:focus{border-color:var(--gold)}
    .ql-input::placeholder{color:var(--muted)}
    .ql-generate{background:var(--gold);color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s}
    .ql-generate:hover{background:var(--gold-light)}
    .ql-buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
    .ql-btn{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;text-decoration:none;color:var(--text);font-size:13px;font-weight:600;transition:border-color .2s,color .2s;cursor:pointer}
    .ql-btn:hover{border-color:var(--gold);color:var(--gold)}
    .ql-btn-icon{width:32px;height:32px;border-radius:8px;background:var(--gold-pale);border:1px solid rgba(184,146,42,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .ql-btn[disabled]{opacity:.4;pointer-events:none}
    .ql-hint{font-size:12px;color:var(--muted);margin-top:14px}

    /* ── Open-in-editor inline btn ── */
    .editor-btn{display:inline-flex;align-items:center;gap:7px;background:var(--gold-pale);border:1px solid rgba(184,146,42,.25);color:var(--gold);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;text-decoration:none;margin-top:16px;transition:background .2s,border-color .2s;cursor:pointer}
    .editor-btn:hover{background:rgba(184,146,42,.2);border-color:rgba(184,146,42,.45)}
    .editor-btn[disabled]{opacity:.4;pointer-events:none}

    /* ── Done banner ── */
    .done-banner{background:linear-gradient(135deg,rgba(184,146,42,.12),rgba(184,146,42,.06));border:1px solid rgba(184,146,42,.3);border-radius:var(--radius);padding:48px 40px;text-align:center;margin-top:48px}
    .done-banner h2{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--text);margin-bottom:12px}
    .done-banner h2 em{font-style:italic;color:var(--gold)}
    .done-banner p{font-size:15px;color:var(--muted2);margin-bottom:28px;line-height:1.7}
    .done-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#fff;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s,transform .15s;box-shadow:0 4px 20px rgba(184,146,42,.3)}
    .btn-primary:hover{background:var(--gold-light);transform:translateY(-2px)}
    .btn-secondary{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:13px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;transition:border-color .2s,color .2s}
    .btn-secondary:hover{border-color:var(--gold);color:var(--gold)}

    /* ── FAQ ── */
    .faq-wrap{max-width:900px;margin:0 auto;padding:0 48px 80px}
    .faq-title{font-family:'Playfair Display',serif;font-size:clamp(24px,3vw,36px);font-weight:700;color:var(--text);margin-bottom:32px}
    .faq-title em{font-style:italic;color:var(--gold)}
    .faq-item{border-bottom:1px solid var(--border);padding:20px 0}
    .faq-q{font-size:15px;font-weight:600;color:var(--text);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px}
    .faq-q::after{content:'＋';color:var(--gold);font-size:18px;flex-shrink:0;transition:transform .3s}
    .faq-q.open::after{transform:rotate(45deg)}
    .faq-a{font-size:14px;color:var(--muted2);line-height:1.8;padding-top:12px;display:none}
    .faq-a.open{display:block}

    /* ── Footer ── */
    .footer{padding:40px 48px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
    .footer-logo{display:flex;align-items:center;gap:8px;font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:var(--text);text-decoration:none}
    .footer-links{display:flex;gap:24px}
    .footer-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s}
    .footer-links a:hover{color:var(--text)}
    .footer-copy{font-size:12px;color:var(--muted)}

    @media(max-width:768px){
      .nav{padding:16px 20px}.nav.scrolled{padding:12px 20px}.nav-links{display:none}
      .hero{padding:100px 20px 56px}
      .progress-wrap{padding:20px}
      .prog-label{display:none}
      .guide-wrap,.faq-wrap{padding-left:20px;padding-right:20px}
      .step-header{padding:20px}
      .step-body{padding:0 20px 24px}
      .done-actions{flex-direction:column;align-items:center}
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
        <li><a href="/home#features">Features</a></li>
        <li><a href="/home#how-it-works">How it works</a></li>
        <li><a href="/instructions">Setup Guide</a></li>
        <li><a href="/privacy-policy">Privacy Policy</a></li>
      </ul>
      <a href="${SHOPIFY_URL}" class="nav-cta" target="_blank" rel="noopener">Add to Shopify &rarr;</a>
    </nav>

    <!-- Hero -->
    <section class="hero" id="hero">
      <div class="hero-eyebrow">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
        Complete Setup Guide
      </div>
      <h1 class="hero-title">Get WishKeeper up and running in <em>minutes</em></h1>
      <p class="hero-sub">No technical knowledge needed. Follow these simple steps and your customers will be saving wishlists in no time.</p>
      <a href="${SHOPIFY_URL}" class="hero-cta" target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg>
        Install WishKeeper Free
      </a>
    </section>

    <!-- Progress Steps -->
    <div class="progress-wrap">
      <div class="progress-inner">
        <a href="#step1" class="prog-step">
          <div class="prog-dot active">1</div>
          <span class="prog-label">Install</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step2" class="prog-step">
          <div class="prog-dot">2</div>
          <span class="prog-label">Activate Plan</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step3" class="prog-step">
          <div class="prog-dot">3</div>
          <span class="prog-label">Heart Button</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step4" class="prog-step">
          <div class="prog-dot">4</div>
          <span class="prog-label">Header Icon</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step5" class="prog-step">
          <div class="prog-dot">5</div>
          <span class="prog-label">Wishlist Page</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step6" class="prog-step">
          <div class="prog-dot">6</div>
          <span class="prog-label">Customise</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step7" class="prog-step">
          <div class="prog-dot">7</div>
          <span class="prog-label">Email Alerts</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step8" class="prog-step">
          <div class="prog-dot">8</div>
          <span class="prog-label">Custom Placement</span>
        </a>
        <div class="prog-line"></div>
        <a href="#step9" class="prog-step">
          <div class="prog-dot">9</div>
          <span class="prog-label">Test it</span>
        </a>
      </div>
    </div>

    <!-- Guide -->
    <div class="guide-wrap">

      <!-- Quick Links Widget -->
      <div class="ql-card">
        <div class="ql-title">&#9889; Open Theme Editor directly</div>
        <p class="ql-sub">Enter your store domain below and click a button to jump straight to the right place in your theme editor, no searching required.</p>
        <div class="ql-input-row">
          <input class="ql-input" id="shopInput" type="text" placeholder="your-store-name (e.g. my-shop)" oninput="updateLinks()" />
          <span style="display:flex;align-items:center;font-size:14px;color:var(--muted);white-space:nowrap">.myshopify.com</span>
        </div>
        <div class="ql-buttons">
          <a class="ql-btn" id="ql-product" href="#" target="_blank" rel="noopener" disabled>
            <div class="ql-btn-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg></div>
            Enable Heart Button<br/><span style="font-size:11px;font-weight:400;color:var(--muted)">Product pages</span>
          </a>
          <a class="ql-btn" id="ql-header" href="#" target="_blank" rel="noopener" disabled>
            <div class="ql-btn-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg></div>
            Enable Header Icon<br/><span style="font-size:11px;font-weight:400;color:var(--muted)">Store header</span>
          </a>
          <a class="ql-btn" id="ql-collection" href="#" target="_blank" rel="noopener" disabled>
            <div class="ql-btn-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
            Enable Collection Hearts<br/><span style="font-size:11px;font-weight:400;color:var(--muted)">Collection pages</span>
          </a>
          <a class="ql-btn" id="ql-admin" href="#" target="_blank" rel="noopener" disabled>
            <div class="ql-btn-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>
            Open WishKeeper App<br/><span style="font-size:11px;font-weight:400;color:var(--muted)">Dashboard &amp; settings</span>
          </a>
        </div>
        <p class="ql-hint">&#128274; Your store name stays in your browser, it is never sent to us.</p>
      </div>

      <!-- Step 1 -->
      <div class="step-card" id="step1">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>1</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Install WishKeeper from the Shopify App Store</div>
            <div class="step-subtitle">Takes about 1 minute, no coding required</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body">
          <p class="step-intro">WishKeeper is available on the Shopify App Store. Installing it is exactly like installing any other app, just a few clicks.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
              <div class="instr-text"><strong>Go to the Shopify App Store</strong>: click the button below or search "WishKeeper" in your Shopify admin under <em>Apps &rarr; Shopify App Store</em>.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
              <div class="instr-text"><strong>Click "Add app"</strong> on the WishKeeper listing page. Shopify will ask you to confirm the installation.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div class="instr-text"><strong>Click "Install"</strong> to approve the permissions. WishKeeper only asks for what it needs to run your wishlists, nothing else.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
              <div class="instr-text"><strong>You'll land on the WishKeeper Dashboard</strong> inside your Shopify admin. That means the installation was successful!</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p class="tip-text"><strong>Tip:</strong> You can always find WishKeeper in your Shopify admin under <strong>Apps &rarr; WishKeeper</strong> in the left sidebar.</p>
          </div>
          <div style="margin-top:20px">
            <a href="${SHOPIFY_URL}" class="btn-primary" target="_blank" rel="noopener" style="font-size:13px;padding:10px 20px">Open Shopify App Store &rarr;</a>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-card" id="step2">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>2</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Activate your plan</div>
            <div class="step-subtitle">Start your 7-day free trial, cancel anytime</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">WishKeeper offers a 7-day free trial. You need an active plan for your customers to use the wishlist features.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>
              <div class="instr-text"><strong>In your Shopify admin, go to Apps &rarr; WishKeeper &rarr; Billing</strong> from the left navigation menu inside the app.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
              <div class="instr-text"><strong>Choose your plan</strong>: Basic ($9.99/mo) for up to 50 saved items per customer, or Pro ($14.99/mo) for unlimited items and analytics.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
              <div class="instr-text"><strong>Click "Start free trial"</strong>. Shopify handles the billing securely, you won't be charged until after the 7-day trial ends.</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p class="tip-text"><strong>Note:</strong> Without an active plan, the heart button and wishlist page will still appear on your store but will be disabled for customers. Activate your plan to make them fully functional.</p>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-card" id="step3">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>3</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Enable the heart button on product pages</div>
            <div class="step-subtitle">Let customers save products with one tap</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">The heart button appears on every product page so customers can save items to their wishlist. It's added through your Shopify theme editor, no coding needed.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>
              <div class="instr-text"><strong>In Shopify admin, go to Online Store &rarr; Themes</strong>. You'll see your current theme listed at the top.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
              <div class="instr-text"><strong>Click "Customise"</strong> next to your theme. This opens the visual theme editor.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
              <div class="instr-text"><strong>Navigate to a product page</strong> using the page selector at the top of the editor (click the dropdown that says "Home page" and choose "Products &rarr; Default product").</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
              <div class="instr-text"><strong>In the left panel, click "Add block"</strong> inside the product section. Search for <strong>"WishKeeper"</strong> or <strong>"Wishlist Button"</strong> and click to add it.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></div>
              <div class="instr-text"><strong>Click "Save"</strong> in the top right corner. The heart button will now appear on all product pages across your store.</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p class="tip-text"><strong>Can't find the block?</strong> If WishKeeper doesn't show up in the block list, look for an <strong>"App blocks"</strong> section or try searching for "wishlist". Some themes use a slightly different layout in the editor.</p>
          </div>
          <a class="editor-btn" id="step3-btn" href="#" target="_blank" rel="noopener" disabled>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Open Theme Editor &rarr; Product Page
          </a>
        </div>
      </div>

      <!-- Step 3b: Collection Hearts -->
      <div class="step-card" id="step3b">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span style="font-size:14px">3b</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Enable heart icons on collection pages <span style="font-size:12px;background:var(--gold-pale);color:var(--gold);border:1px solid rgba(184,146,42,.25);border-radius:100px;padding:2px 10px;vertical-align:middle;font-weight:500">Optional</span></div>
            <div class="step-subtitle">Show save buttons directly on product grids, no need to open each product</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">This adds a small heart icon on top of each product card in your collection pages so customers can wishlist items without even visiting the product page. If a product has more than one variant (for example a size or a colour), the heart opens a small popup where the customer picks the exact variant before it is saved. Products with a single variant are saved instantly.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>
              <div class="instr-text"><strong>Go to Online Store &rarr; Themes &rarr; Customise</strong> and switch the page to a <strong>Collection page</strong> using the dropdown at the top.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
              <div class="instr-text"><strong>Click on the product grid section</strong> in the left panel, then click <strong>"Add block"</strong> and search for <strong>"WishKeeper Collection"</strong> or <strong>"Collection Hearts"</strong>.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/></svg></div>
              <div class="instr-text"><strong>Click "Save"</strong>. Hearts will now appear on product cards across all your collection pages.</div>
            </li>
          </ul>
          <a class="editor-btn" id="step3b-btn" href="#" target="_blank" rel="noopener" disabled>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Open Theme Editor &rarr; Collection Page
          </a>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step-card" id="step4">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>4</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Add the wishlist icon to your store header</div>
            <div class="step-subtitle">Give customers quick access from anywhere in your store</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">The header icon is a small heart icon that appears in your store's top navigation bar, next to the cart. It shows customers how many items they've saved and links to their wishlist page.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>
              <div class="instr-text"><strong>Go to Online Store &rarr; Themes &rarr; Customise</strong> to open your theme editor.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg></div>
              <div class="instr-text"><strong>Click on "Header"</strong> in the left panel (or click directly on the header area in the preview). This shows the header settings.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
              <div class="instr-text"><strong>Look for "Add block" inside the header section</strong> and search for <strong>"WishKeeper Header"</strong> or <strong>"Wishlist Icon"</strong>. Click to add it.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg></div>
              <div class="instr-text"><strong>Click "Save"</strong>. The heart icon will now appear in your header, automatically positioning itself next to the cart icon.</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p class="tip-text"><strong>Icon not appearing in the right place?</strong> The icon position is automatic and works with most themes. If it looks out of place, you can adjust its appearance from <strong>WishKeeper &rarr; Settings</strong> in your admin.</p>
          </div>
          <a class="editor-btn" id="step4-btn" href="#" target="_blank" rel="noopener" disabled>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Open Theme Editor &rarr; Header
          </a>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="step-card" id="step5">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>5</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Set up the customer wishlist page</div>
            <div class="step-subtitle">Where customers view and manage their saved products</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">WishKeeper automatically creates a dedicated wishlist page for your customers at <strong>yourstore.com/apps/wishlist/page</strong>. You can optionally add a link to this page in your store's navigation menu so it's easy to find.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
              <div class="instr-text"><strong>The wishlist page URL is:</strong> <code style="background:rgba(184,146,42,.1);color:var(--gold);padding:2px 8px;border-radius:4px;font-size:12px">https://yourstore.myshopify.com/apps/wishlist/page</code><br/>Replace "yourstore" with your actual store name.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h7"/></svg></div>
              <div class="instr-text"><strong>To add it to your navigation</strong>, go to <strong>Online Store &rarr; Navigation</strong>. Click on your main menu (usually called "Main menu").</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
              <div class="instr-text"><strong>Click "Add menu item"</strong>. For the name type <strong>"My Wishlist"</strong>. For the link, paste the wishlist URL above and click "Add".</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/></svg></div>
              <div class="instr-text"><strong>Click "Save menu"</strong>. A "My Wishlist" link will now appear in your store's navigation so customers can easily find their saved items.</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p class="tip-text"><strong>Good news:</strong> The wishlist page is automatically set up, you don't need to create or design it. It matches your store's style and shows all saved products with an Add to Cart button on each one.</p>
          </div>
        </div>
      </div>

      <!-- Step 6 -->
      <div class="step-card" id="step6">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>6</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Customise the look and feel</div>
            <div class="step-subtitle">Match WishKeeper perfectly to your brand</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">From the WishKeeper Settings page you can personalise the icon style, colours, and language so everything feels like a natural part of your store.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg></div>
              <div class="instr-text"><strong>In your Shopify admin, go to Apps &rarr; WishKeeper &rarr; Settings</strong> from the app navigation.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg></div>
              <div class="instr-text"><strong>Icon Style</strong>: Choose between Heart, Star, Bookmark, Gift, or Bell icon shapes for the wishlist buttons throughout your store.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/></svg></div>
              <div class="instr-text"><strong>Active Colour</strong>: Pick the colour that shows when a customer has saved a product. Match it to your brand colour using the colour picker.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
              <div class="instr-text"><strong>Language</strong>: Select the language for all WishKeeper text visible to customers (button labels, empty state messages, etc.).</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg></div>
              <div class="instr-text"><strong>Wishlist opens as</strong>: Choose <strong>Full Page</strong> to send customers to a dedicated wishlist page, or <strong>Popup Drawer</strong> to slide the wishlist over whatever page they are on.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
              <div class="instr-text"><strong>Grid columns</strong>: When the wishlist opens as a Full Page, choose how many products sit side by side (2 to 10). The layout still adapts automatically on tablets and phones.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
              <div class="instr-text"><strong>Custom icon and colour</strong>: Upload your own SVG icon and pick its colour. The icon takes that colour only while a product is saved, and returns to normal when it is removed.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/></svg></div>
              <div class="instr-text"><strong>Click "Save Settings"</strong> when done. Changes go live on your store immediately.</div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Step 7: Email alerts -->
      <div class="step-card" id="step7">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>7</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Set up email alerts</div>
            <div class="step-subtitle">Bring shoppers back when a price or stock level changes</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">WishKeeper can email a customer when something they saved changes. Every email shows the product with its image and price, plus a few other items from that customer's wishlist. Alerts go only to customers who are logged in, because guests have no email address.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg></div>
              <div class="instr-text"><strong>Go to Apps &rarr; WishKeeper &rarr; Settings</strong>, find the <strong>Email Alerts</strong> card, and switch on <strong>Enable email alerts</strong>.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
              <div class="instr-text"><strong>Price changes</strong>: customers get an email when a saved product gets cheaper, and another when its price goes up.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
              <div class="instr-text"><strong>Stock changes</strong>: set the <strong>Low stock threshold</strong>, and customers are told when a saved product falls to that number of units or fewer. If a product was out of stock when it was saved, they are told when it is back in stock.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
              <div class="instr-text"><strong>Sender email</strong>: leave it on <strong>WishKeeper Default</strong> for no setup, or send from your own Gmail or custom domain address if you prefer.</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p class="tip-text"><strong>Good to know:</strong> a customer gets at most one email of each type per product every 24 hours, so nobody is flooded. To test, log in as a customer, save a product, then change its price or stock in your Shopify admin.</p>
          </div>
        </div>
      </div>

      <!-- Step 8: Custom placement -->
      <div class="step-card" id="step8">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>8</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Place the icon or button exactly where you want <span style="font-size:12px;background:var(--gold-pale);color:var(--gold);border:1px solid rgba(184,146,42,.25);border-radius:100px;padding:2px 10px;vertical-align:middle;font-weight:500">Optional</span></div>
            <div class="step-subtitle">Use your own theme code, or your own button</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">Every theme is built differently. If the wishlist icon or button does not land where you want it, you can place it yourself with a small piece of code copied from the WishKeeper Settings page.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg></div>
              <div class="instr-text"><strong>Header icon</strong>: in Settings &rarr; Icon &amp; Appearance, open <strong>Manual icon placement</strong> and click <strong>Copy</strong>. In the theme editor, add a <strong>Custom Liquid</strong> block where you want the icon and paste the code in. The icon, with its counter, appears exactly there.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
              <div class="instr-text"><strong>Add to Wishlist button</strong>: in Settings, open <strong>Add to Wishlist Button (Manual Placement)</strong> and click <strong>Copy</strong>. On a product page in the theme editor, add a <strong>Custom Liquid</strong> block where you want the button and paste the code. Make sure the <strong>Wishlist Btn Connector</strong> app embed is switched on under App embeds.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/></svg></div>
              <div class="instr-text"><strong>Your own button</strong>: if your theme already has a wishlist button, paste its HTML into <strong>Custom Wishlist Button</strong> in Settings (right-click your button on the store, choose Inspect, then copy the element's HTML). WishKeeper connects to it automatically, with the Wishlist Btn Connector embed switched on. An optional icon CSS snippet is included there to give your button a heart that takes your chosen colour while a product is saved.</div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Step 9 -->
      <div class="step-card" id="step9">
        <div class="step-header" onclick="toggleStep(this)">
          <div class="step-num-badge"><span>9</span></div>
          <div class="step-title-wrap">
            <div class="step-title">Test everything is working</div>
            <div class="step-subtitle">A quick check before your customers start using it</div>
          </div>
          <span class="step-chevron">&#8964;</span>
        </div>
        <div class="step-body hidden">
          <p class="step-intro">Before going live, do a quick test to make sure everything is working correctly from a customer's point of view.</p>
          <ul class="instruction-list">
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>
              <div class="instr-text"><strong>Visit your store</strong> by clicking "View your store" from your Shopify admin home page. This opens your store as a customer would see it.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/></svg></div>
              <div class="instr-text"><strong>Go to any product page</strong> and click the heart icon. It should change colour to show the product has been saved. A small counter should also appear on the header icon.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h7"/></svg></div>
              <div class="instr-text"><strong>Click the heart icon in the header</strong> to go to the wishlist page. You should see the product you just saved with an "Add to Cart" button.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
              <div class="instr-text"><strong>Click "Add to Cart"</strong> from the wishlist page to confirm the full flow works end to end. Your cart drawer should open and show the item straight away.</div>
            </li>
            <li>
              <div class="instr-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
              <div class="instr-text"><strong>If you enabled collection hearts</strong>, open a collection page and click the heart on a product that has sizes or colours. A popup should ask which one to save.</div>
            </li>
          </ul>
          <div class="tip-box">
            <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p class="tip-text"><strong>Everything working?</strong> You're all set! Your customers can now save products and build wishlists on your store. Check your WishKeeper <strong>Dashboard</strong> to see activity as customers start using it.</p>
          </div>
        </div>
      </div>

      <!-- Done Banner -->
      <div class="done-banner">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--gold-pale);border:1.5px solid rgba(184,146,42,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b8922a" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2>You're all set, <em>good luck!</em></h2>
        <p>WishKeeper is now live on your store. Customers can start saving their favourite products and returning to buy. Check your dashboard to track wishlist activity and see which products are most popular.</p>
        <div class="done-actions">
          <a href="${SHOPIFY_URL}" class="btn-primary" target="_blank" rel="noopener">Install WishKeeper Free</a>
          <a href="mailto:${SUPPORT_EMAIL}" class="btn-secondary">Contact Support</a>
        </div>
      </div>

    </div>

    <!-- FAQ -->
    <div class="faq-wrap">
      <h2 class="faq-title">Frequently asked <em>questions</em></h2>

      <div class="faq-item">
        <div class="faq-q">Do customers need an account to use the wishlist?</div>
        <div class="faq-a">No. Customers can save products to their wishlist without creating an account or logging in. For guest customers, the wishlist is stored in their browser so it persists across visits on the same device. If they log in to their account, their wishlist is saved to their profile.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Will WishKeeper work with my theme?</div>
        <div class="faq-a">Yes. WishKeeper is designed to work with all Shopify themes, including popular ones like Dawn, Debut, Horizon, Impulse, and more. The buttons and icons automatically adapt to match your store's style.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">What happens to wishlists if a customer uninstalls and reinstalls the app?</div>
        <div class="faq-a">Wishlists for logged-in customers are stored in WishKeeper's database and are safe. Guest wishlists are stored in the customer's browser and are not affected by app reinstalls.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Can I change the language of the wishlist buttons?</div>
        <div class="faq-a">Yes. Go to Apps &rarr; WishKeeper &rarr; Settings and choose your preferred language from the Language dropdown. All customer-facing text will update immediately.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">How do I see which products customers are wishlisting?</div>
        <div class="faq-a">Go to Apps &rarr; WishKeeper &rarr; Dashboard. You'll see total wishlist items, active wishlists, unique customers, and your top wishlisted products. The Wishlists tab shows individual customer wishlists.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Can customers save a specific size or colour?</div>
        <div class="faq-a">Yes. Each variant is saved as its own wishlist entry. On a product page the heart follows the variant the customer has selected. On a collection page, the heart opens a small popup to choose the exact variant first. The wishlist page then shows each saved variant with its own price and image.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">When do customers receive emails?</div>
        <div class="faq-a">When email alerts are switched on in Settings, logged-in customers are emailed if a saved product's price goes down or up, if its stock falls to your low stock threshold, or if it comes back in stock. Each customer gets at most one email of each type per product every 24 hours.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Do email alerts work for guests?</div>
        <div class="faq-a">No. Guests are not logged in, so we have no email address for them. Alerts go to customers who are logged in to their store account.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Can I use my own wishlist button or place the icon somewhere specific?</div>
        <div class="faq-a">Yes. In Settings you can paste the HTML of your existing button under Custom Wishlist Button, or copy a ready-made snippet for the header icon or the Add to Wishlist button and paste it into a Custom Liquid block wherever you like. See step 8 above.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Can I cancel my plan at any time?</div>
        <div class="faq-a">Yes, you can cancel anytime from Apps &rarr; WishKeeper &rarr; Billing or directly from your Shopify admin billing settings. There are no cancellation fees or commitments.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">I need help. How do I contact support?</div>
        <div class="faq-a">Email us at <a href="mailto:${SUPPORT_EMAIL}" style="color:var(--gold)">${SUPPORT_EMAIL}</a> and we'll get back to you as quickly as possible. We're here to help!</div>
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
    var EXT_UID = 'e0f6ced2-4e4b-f2fe-d2ed-b75dd5fecb95f2bd6b3b';

    function updateLinks() {
      var raw = document.getElementById('shopInput').value.trim().replace(/\\.myshopify\\.com.*$/, '');
      var ids = ['ql-product','ql-header','ql-collection','ql-admin','step3-btn','step3b-btn','step4-btn'];
      if (!raw) {
        ids.forEach(function(id){ var el=document.getElementById(id); if(el){el.setAttribute('disabled','');el.setAttribute('href','#');} });
        return;
      }
      var base = 'https://' + raw + '.myshopify.com/admin';
      var links = {
        'ql-product':   base + '/themes/current/editor?template=product&addAppBlockId=' + EXT_UID + '/wishlist-button&target=newAppsSection',
        'ql-header':    base + '/themes/current/editor?addAppBlockId=' + EXT_UID + '/wishlist-header-icon&target=header',
        'ql-collection':base + '/themes/current/editor?template=collection&addAppBlockId=' + EXT_UID + '/wishlist-collection-hearts&target=newAppsSection',
        'ql-admin':     base + '/apps',
        'step3-btn':    base + '/themes/current/editor?template=product&addAppBlockId=' + EXT_UID + '/wishlist-button&target=newAppsSection',
        'step3b-btn':   base + '/themes/current/editor?template=collection&addAppBlockId=' + EXT_UID + '/wishlist-collection-hearts&target=newAppsSection',
        'step4-btn':    base + '/themes/current/editor?addAppBlockId=' + EXT_UID + '/wishlist-header-icon&target=header'
      };
      ids.forEach(function(id){
        var el = document.getElementById(id);
        if (el) { el.setAttribute('href', links[id]); el.removeAttribute('disabled'); }
      });
    }

    function toggleStep(header) {
      var body = header.nextElementSibling;
      var chevron = header.querySelector('.step-chevron');
      var isOpen = !body.classList.contains('hidden');
      body.classList.toggle('hidden', isOpen);
      chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    }

    document.addEventListener('DOMContentLoaded', function () {
      gsap.registerPlugin(ScrollTrigger);

      // Navbar scroll
      ScrollTrigger.create({
        start: 'top -60px',
        onEnter: function () { document.getElementById('navbar').classList.add('scrolled'); },
        onLeaveBack: function () { document.getElementById('navbar').classList.remove('scrolled'); }
      });

      // Hero fade in
      gsap.from('.hero-eyebrow, .hero-title, .hero-sub, .hero-cta', {
        opacity: 0, y: 30, duration: 0.7, ease: 'power2.out', stagger: 0.12, delay: 0.2
      });

      // Step cards
      document.querySelectorAll('.step-card').forEach(function (card, i) {
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' }
          }
        );
      });

      // FAQ toggle
      document.querySelectorAll('.faq-q').forEach(function (q) {
        q.addEventListener('click', function () {
          var a = q.nextElementSibling;
          var isOpen = a.classList.contains('open');
          document.querySelectorAll('.faq-a').forEach(function (el) { el.classList.remove('open'); });
          document.querySelectorAll('.faq-q').forEach(function (el) { el.classList.remove('open'); });
          if (!isOpen) { a.classList.add('open'); q.classList.add('open'); }
        });
      });

      // Open step 1 by default
      var first = document.querySelector('.step-body');
      if (first) first.classList.remove('hidden');
    });
    </script>
    </body>
    </html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    };
