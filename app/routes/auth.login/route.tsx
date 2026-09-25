import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}
body{margin:0}
.lg-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(1200px 500px at 50% -10%,rgba(184,146,42,.16),transparent 60%),#12100d;font-family:'DM Sans',sans-serif;color:#f0ece4}
.lg-card{width:100%;max-width:440px;background:linear-gradient(160deg,#1c1915,#15130f);border:1px solid rgba(184,146,42,.28);border-radius:20px;padding:40px 34px;box-shadow:0 24px 60px rgba(0,0,0,.45);text-align:center;animation:lgUp .5s ease both}
@keyframes lgUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.lg-logo{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:#b8922a;margin-bottom:18px}
.lg-title{font-family:'Playfair Display',serif;font-size:30px;font-weight:600;margin:0 0 8px}
.lg-title em{font-style:italic;color:#b8922a}
.lg-sub{font-size:14px;line-height:1.6;color:#a89f90;margin:0 0 26px}
.lg-form{text-align:left}
.lg-label{display:block;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#b8922a;margin-bottom:8px}
.lg-input{width:100%;padding:14px 16px;background:#0e0c09;border:1px solid rgba(255,255,255,.14);border-radius:12px;color:#f0ece4;font:inherit;font-size:15px;outline:none;transition:border-color .2s,box-shadow .2s}
.lg-input:focus{border-color:#b8922a;box-shadow:0 0 0 3px rgba(184,146,42,.18)}
.lg-input--error{border-color:#e0605a}
.lg-hint{font-size:12.5px;color:#7d7566;margin:8px 0 0}
.lg-error{font-size:13px;color:#ff8a84;margin:8px 0 0}
.lg-btn{width:100%;margin-top:22px;padding:14px 20px;border:0;border-radius:100px;background:#b8922a;color:#12100d;font:inherit;font-weight:700;font-size:14px;letter-spacing:.02em;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s}
.lg-btn:hover{transform:translateY(-2px);background:#c9a23a;box-shadow:0 10px 24px rgba(184,146,42,.3)}
.lg-foot{margin-top:22px;font-size:12.5px;color:#7d7566;text-align:center}
.lg-foot a{color:#b8922a;text-decoration:none}
`}</style>
      <div className="lg-wrap">
        <div className="lg-card">
          <div className="lg-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#12100d"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" /></svg>
          </div>
          <h1 className="lg-title">Wish<em>Keeper</em></h1>
          <p className="lg-sub">Log in with your Shopify store to open your wishlist dashboard.</p>
          <Form method="post" className="lg-form">
            <label className="lg-label" htmlFor="lg-shop">Shop domain</label>
            <input
              id="lg-shop"
              className={`lg-input${errors.shop ? " lg-input--error" : ""}`}
              type="text"
              name="shop"
              placeholder="your-store.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.currentTarget.value)}
              autoComplete="on"
              autoFocus
            />
            {errors.shop ? <p className="lg-error">{errors.shop}</p> : <p className="lg-hint">example.myshopify.com</p>}
            <button type="submit" className="lg-btn">Log in</button>
          </Form>
          <p className="lg-foot"><a href="/home">Learn more about WishKeeper</a></p>
        </div>
      </div>
    </>
  );
}
