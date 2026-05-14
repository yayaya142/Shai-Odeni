---
title: "I Investigated a PS5 Pro Scam Campaign Impersonating Ivory: Here's What I Found"
date: 2026-05-14 09:00:00 +0300
category: research
subcategories:
  - osint
  - fraud-analysis
  - scam-investigation
tags:
  - OSINT
  - Scam Investigation
  - Burp Suite
  - Facebook
  - Affiliate Fraud
  - Ivory
type: technical-breakdown
summary: "Tracing a geo-targeted PS5 Pro scam impersonating Ivory from the Facebook bait through the redirect chain, checkout backend, and shared fraud infrastructure."
featured: false
pin: true
image:
  path: "https://lh3.googleusercontent.com/d/19Jszwj8C6KGzkgSaqefqVriYlZfqF0J1=w2000"
  alt: "Localized fake Ivory survey landing page"
---

<style>
.content figure.post-image {
  margin: 1.75rem auto;
}

.content figure.post-image img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto !important;
  object-fit: contain;
  margin: 0 auto;
  border-radius: 0.75rem;
}

.compact-bait-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 1.75rem 0;
  max-width: 460px;
  margin-left: auto;
  margin-right: auto;
}

.compact-bait-gallery .bait-thumb,
.compact-bait-gallery .popup {
  display: block;
  flex: 0 0 100%;
  max-width: 420px;
  width: 100%;
  padding: 0.25rem;
  border: 1px solid var(--main-border-color);
  border-radius: 0.75rem;
  background: var(--card-bg);
  box-sizing: border-box;
}

.compact-bait-gallery img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 420px;
  object-fit: contain;
  border-radius: 0.5rem;
}

@media (max-width: 767.98px) {
  .compact-bait-gallery .bait-thumb,
  .compact-bait-gallery .popup {
    width: 100%;
    max-width: 320px;
  }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.compact-bait-gallery img[data-fullsize]').forEach((img) => {
    const link = img.closest('a');
    if (link) {
      link.href = img.dataset.fullsize;
    }
  });

  document.querySelectorAll('.compact-bait-gallery a').forEach((link) => {
    link.addEventListener('click', (event) => {
      const img = link.querySelector('img[data-fullsize]');
      const target = img?.dataset.fullsize || img?.src || link.href;

      event.preventDefault();
      event.stopPropagation();

      window.open(target, '_blank', 'noopener');
    });
  });
});
</script>

Over the past few weeks, a wave of posts has been circulating on Facebook claiming you can get a PlayStation 5 Pro for around ₪30 through an "internal deal" at Ivory (a popular Israeli electronics retailer). The posts looked surprisingly convincing, so I decided to dig in and trace the whole thing from the Facebook post all the way down to the backend infrastructure.

---

## The Bait: A Convincing Facebook Post

The post followed a classic emotional story arc:

> *"I was fired from Ivory after 8 years because I ordered myself a PS5 Pro through their internal employee deal. One day later, I was out the door.*
> *What bothers me isn't the firing. It's that managers do this every year and nobody says a word. Every year, Ivory receives a stock of PS5 Pros they're required to distribute nearly for free in exchange for reviews. But the managers? They keep it all for themselves. Share it with friends. Sell it on Yad2 at full price. Regular customers? They don't even know it exists.*
> *The page is still active. Answer a few questions, pay a few shekels, and the PS5 Pro shows up at your door, sealed in the box.*
> *I put the link in the comments. Every time someone exposes this, they take it down within days.*
> *After what they did to me… I'll let you decide if I'm right or wrong."*

On the surface, it wasn't bad. The writing was natural, and the post had 250+ likes, 3 shares, and around 20 comments, including videos of people supposedly receiving a PS5.

<div class="compact-bait-gallery" style="display: block; max-width: 520px; margin: 1.75rem auto;">
  <div class="bait-thumb" style="max-width: 420px; width: 100%; margin: 0 auto 0.85rem;">
    <img src="https://lh3.googleusercontent.com/d/1Rpqq8Uq9sbUsRXXlwyhheVReNVmvrMol=w1200" data-fullsize="https://lh3.googleusercontent.com/d/1Rpqq8Uq9sbUsRXXlwyhheVReNVmvrMol=w2000" alt="Facebook post 1 used in the scam campaign" loading="lazy" style="display: block; width: 100%; height: auto; max-height: none; object-fit: contain; border-radius: 0.5rem;">
  </div>

  <div class="bait-thumb" style="max-width: 420px; width: 100%; margin: 0 auto 0.85rem;">
    <img src="https://lh3.googleusercontent.com/d/1eBqbBczXrdeLPqtAw-Fc0zuo6ZoJzJ1x=w1200" data-fullsize="https://lh3.googleusercontent.com/d/1eBqbBczXrdeLPqtAw-Fc0zuo6ZoJzJ1x=w2000" alt="Comment section for Facebook post 1 in the scam campaign" loading="lazy" style="display: block; width: 100%; height: auto; max-height: none; object-fit: contain; border-radius: 0.5rem;">
  </div>

  <div class="bait-thumb" style="max-width: 420px; width: 100%; margin: 0 auto 0.85rem;">
    <img src="https://lh3.googleusercontent.com/d/1LwU28n7y2U_BCETYOyiNrvNbMgBRX4Oo=w1200" data-fullsize="https://lh3.googleusercontent.com/d/1LwU28n7y2U_BCETYOyiNrvNbMgBRX4Oo=w2000" alt="Facebook post 2 used in the scam campaign" loading="lazy" style="display: block; width: 100%; height: auto; max-height: none; object-fit: contain; border-radius: 0.5rem;">
  </div>

  <div class="bait-thumb" style="max-width: 420px; width: 100%; margin: 0 auto 0.85rem;">
    <img src="https://lh3.googleusercontent.com/d/1JCXnQJcMN4RGM7hrd8wtGNM7EtWH1Hh7=w1200" data-fullsize="https://lh3.googleusercontent.com/d/1JCXnQJcMN4RGM7hrd8wtGNM7EtWH1Hh7=w2000" alt="Comment section for Facebook post 2 in the scam campaign" loading="lazy" style="display: block; width: 100%; height: auto; max-height: none; object-fit: contain; border-radius: 0.5rem;">
  </div>
</div>

---

## Step 1: The Landing Page

I decided to investigate and follow the link to see where it really leads.

First I opened it through a VPN set to a non-Israeli location. The page looked clean and generic.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1acW6Yl-6OPwapZHC0ZuTfyoWFOogUCbm=w2000" alt="Landing page shown from a non-Israeli IP address">
</figure>

Then I switched to an Israeli VPN and got a completely different, localized page. That alone was a red flag: the site was geo-targeting users and serving different content based on IP address.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/19Jszwj8C6KGzkgSaqefqVriYlZfqF0J1=w2000" alt="Localized fake Ivory survey landing page shown from an Israeli IP address">
</figure>

The Israeli version presented what looked like an Ivory customer satisfaction survey. Answer a few questions, and you could "win" a PS5 Pro.

---

## Step 2: Fake Social Proof

Below the survey, the comments section was filled with users asking whether it was real, with replies confirming it worked. "Ivory support" accounts were even responding to help users confirm their shipping details.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1apALQM37gqaOnE1EEziLbJGn82XKV8ZW=w2000" alt="Fake comments and support replies used as social proof on the landing page">
</figure>

---

## Step 3: Opening Burp Suite: What's the Server?

I fired up Burp Suite to see what was actually happening under the hood.

Right away I could see the site's IP address: **96.9.124.148**

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1Dk3g_dgQYzuwEIt9HPfiqK8wToq_1g82=w2000" alt="Burp Suite showing the landing page host resolving to 96.9.124.148">
</figure>

I looked it up on AbuseIPDB:

<p>🇷🇴 Romania</p>
<p>Datacenter / Hosting</p>
<p>Clearly not Ivory's infrastructure</p>
<p>Looks like a cheap VPS</p>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1Rq0P4YSG7XxP1a5s5-EFE8eUioGEJLws=w2000" alt="AbuseIPDB lookup for 96.9.124.148 showing Romanian hosting infrastructure">
</figure>

Also worth noting from the Burp Suite traffic: the site was pulling dynamic JSON files on load, fake review text, product info, survey questions, all loaded externally. This revealed the page was a **template**, built to be adapted for different countries, brands, and products. The JSON contained placeholders like `product_name`, `market_name`, and `country_phone`.

The reviews shown to users? Also loaded from a static JSON file. Not real user comments at all, they're baked into the landing page script itself.

---

## Step 4: Going Through the Survey

I kept going and clicked through the survey.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1jo24i4K7boJFh3DpI4K9dZm-XUvUeTE6=w2000" alt="First survey step in the fake Ivory campaign flow">
</figure>

I answered a few questions about Ivory and their service.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/169u2lQTfx9_SpX9zysRG8_HlIW-8aZrb=w2000" alt="Survey question screen asking for user interaction before checkout">
</figure>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1FiNvZIigzHRnRNOYP402NH_uVKV-RxDR=w2000" alt="Later survey screen continuing the fake qualification flow">
</figure>

And eventually reached the payment page.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1wFTkzdEPh16LsGQVflJnef_cD98yFOqD=w2000" alt="Payment page offering the PS5 Pro for a small shipping fee">
</figure>

I entered fake personal details.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1zwYA1OEiYI90D9vsmmq0e3ZYgdrtMThj=w2000" alt="Form where fake personal details were entered during testing">
</figure>

Then fake credit card details.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1U7NQG_hCBUQ1887P2A9P31h224lDOwdd=w2000" alt="Credit card entry step in the fake checkout flow">
</figure>

The transaction failed, as expected, the details weren't real.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1bSNWbrk7YF8A7sVS0DrciqEEf-7JVf5F=w2000" alt="Declined transaction result after submitting fake credit card details">
</figure>

That path hit a dead end since I wasn't going to enter real card details. But now it was time to go back to Burp Suite and look at what was actually happening in the background.

---

## Step 5: The Checkout and Where Data Was Actually Going

In Burp Suite, I could see that when I reached the payment page and submitted the form, the site was sending a POST request to `/api/checkout` on a completely different domain: **login.corelinkvault.com**.

The request looked like a fully real checkout system. It included:

<p>Full user details</p>
<p>Complete address</p>
<p>Phone and email</p>
<p>Credit card details</p>
<p>Browser and device fingerprint (user agent, language, timezone, screen size, JavaScript capabilities)</p>
<p>Affiliate and campaign tracking IDs</p>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1FM1WGVx-OjybW2kqBWHRNuWuNiUk3rWt=w2000" alt="Burp Suite request showing checkout data being posted to login.corelinkvault.com">
</figure>

The critical detail: **credit card data was sent in plain JSON directly to the server**, not to any recognized payment processor. The server responded with `Transaction Declined: invalid card`, which confirms this isn't just a fake HTML form. There's a real backend receiving and attempting to process payment data.

---

## Step 6: The Redirect Chain

The most interesting part came after the checkout step. Looking at the HTTP history in Burp Suite, I noticed the system wasn't talking to a single domain at all. There was a full redirect chain passing the user silently through multiple systems:

```text
promoffers.shop
  → trafficjet.trk2afse.com
  → t.trklinkx.com
  → login.corelinkvault.com
```

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/157nOjoNffjw3piEwfIPKaEi5rbDDc_jY=w2000" alt="Burp Suite history showing the multi-domain redirect chain">
</figure>

Along the way, **personal data was being passed inside the URL itself**: name, email, phone, address, campaign IDs. Cookies like `afclick` were also being set to track the user across the entire flow and associate them with a specific affiliate or traffic source.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/10obRWW7hn9DttFnTBJbBcnO6ygbPy7Cu=w2000" alt="Request data showing personal details embedded directly in redirected URLs">
</figure>

The Facebook page is just the front door. Behind it sits a multi-layered tracking, lead distribution, and checkout pipeline.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/13dPIqJ8om7nv0a4o18GE87nplVfV4ErX=w2000" alt="Traffic flow view showing the Facebook bait leading into the backend infrastructure">
</figure>

---

## Step 7: Infrastructure OSINT: This Isn't Just an Israeli Campaign

At this point I decided to check whether this was an isolated Israeli campaign or something much larger.

Using URLScan, I looked up `login.corelinkvault.com` and found the same backend being used for campaigns in **multiple other countries**.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/17l1mR8tPcVvne3HMyz-i--1YhqgSXt19=w2000" alt="URLScan results showing login.corelinkvault.com used across multiple campaigns">
</figure>

I found:

<p>An Italian campaign (`promoIdentifier=itcrd`)</p>
<p>A UK campaign (`promoIdentifier=ukcard`)</p>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1zvc7GaZMo3ijYNV8adN1uCXVbDeVtcR2=w2000" alt="Evidence of campaign variants targeting Italy and the UK">
</figure>

In the UK case, users were arriving through a completely different tracking domain: `clicks2scale.com`.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/148nclbDP20CPWS7BCkPQTpp-dIPcX2w3=w2000" alt="Tracking flow showing a UK campaign routed through clicks2scale.com">
</figure>

Same checkout backend. Multiple countries. Multiple campaigns. This is a **reusable fraud infrastructure**, not a one off phishing page.

---

## Step 8: Mapping the Broader Ecosystem

Continuing to trace the domains from the tracking chain, a clear pattern emerged.

Through URLScan I found more domains running nearly identical flows:

<p>`happyprizes.store`</p>
<p>`perdemnd.com`</p>
<p>`verifiedpayportal.com`</p>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1C1gC4xsS9pGkL-hJvMLFVk9O1HKH8bX8=w2000" alt="Related campaign infrastructure tied to happyprizes.store">
</figure>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1U40QDQc-YcvsS0pcR_GStE9jEedk-yuy=w2000" alt="Related campaign infrastructure tied to perdemnd.com">
</figure>

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1IGsAYO99GtBhNdlVK83tdchO7fvr-RS9=w2000" alt="Related campaign infrastructure tied to verifiedpayportal.com">
</figure>

All of them followed the same pattern:

```text
Landing page → tracking redirect → clicks2scale.com → checkout/signup
```

And nearly all of them shared the same characteristics:

<p>Affiliate parameters</p>
<p>Tracking IDs</p>
<p>Redirect chains</p>
<p>Fake checkout pages</p>
<p>Cloudflare infrastructure</p>

---

## Step 9: Are the Tracking Domains Themselves Malicious?

I also checked the tracking domains themselves, specifically `trk2afse.com`, to understand whether they were built for this campaign or are general purpose infrastructure being abused.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1nQL2Z_1hc_NzHudvBgv8UxUrQ84SylYb=w2000" alt="URLScan results showing broad usage of trk2afse.com across campaigns">
</figure>

URLScan showed `trk2afse.com` appearing across a huge variety of different campaigns:

<p>VPN campaigns</p>
<p>Shopping sites</p>
<p>Affiliate redirects</p>
<p>Gambling / betting traffic</p>
<p>Signup and subscription pages</p>

So `trk2afse.com` itself isn't a scam domain. It's a general affiliate/tracking platform used to manage traffic, attribute conversions, and route users. It can serve both legitimate and illegitimate campaigns alike.

<figure class="post-image">
  <img src="https://lh3.googleusercontent.com/d/1hRFz3HjKEqS1PQnrwJgMYWsstcYKGAgD=w2000" alt="Additional infrastructure view for trk2afse.com campaign usage">
</figure>

That said, this specific campaign was using that infrastructure to run something clearly deceptive, impersonating a real brand, collecting card data through an external backend, and routing users through a multi-domain chain they'd never knowingly agree to.

---

## Summary

The investigation started from a Facebook post claiming you could get a PlayStation 5 Pro for around ₪30 through an "internal deal" at Ivory. The post was fairly convincing: natural writing, a personal emotional story, user comments claiming they received the product, videos of people unboxing it, and even responses from what appeared to be official Ivory support.

Here's what was actually happening at each layer:

| Layer | What's happening |
|---|---|
| Facebook post | Social engineering via emotional story + manufactured social proof |
| Landing page | Geo-targeted template impersonating Ivory, different content per country |
| JSON-loaded reviews | Fake comments baked into the page script, not real users |
| Survey flow | Fake brand survey gradually leading the user toward checkout |
| Redirect chain | Multi-domain tracking and affiliate attribution chain |
| Checkout backend | Real backend at login.corelinkvault.com collecting and attempting to process card data |
| Fingerprinting | Browser and device fingerprint collected alongside card details |
| Scale | Active in Israel, Italy, UK, same backend, multiple brands |

This isn't just a phishing page. It's a full affiliate fraud pipeline using existing tracking infrastructure to run coordinated campaigns across multiple countries and brands simultaneously.

**Conclusion:** this campaign appears to be a highly deceptive operation using existing affiliate and tracking infrastructure to route users through multiple layers before reaching a checkout that collects personal details and payment data.

---

## What You Should Watch For

If you see posts like this, here are the questions to ask before clicking anything:

- Does the link go to the brand's official domain?
- Are you being asked for credit card details just to "cover shipping" on an expensive product?
- Is there artificial urgency ("this offer expires in 2 minutes")?
- Are there multiple redirects through unfamiliar domains?
- Do the comments feel too uniform or too positive?
- Is the price simply too good to be true?

When in doubt, go directly to the company's official website by typing the URL yourself, never through a link in a post or comment.

---

## If You've Already Entered Your Details

If you went through a flow like this and entered real information:

1. **Contact your bank or card issuer immediately**
2. **Block or replace the card if needed**
3. **Monitor for unauthorized charges**
