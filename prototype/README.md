# 18 and Up · Sax Institute clickable prototype

Interactive mobile prototype modelled on the EvoDental WeGuide demo, rebranded for the **Sax Institute / 18 and Up** study.

UI follows **WeGuide frontend** patterns from [`weguide-medical-frontend`](file:///Users/dikshakathayat/Documents/GitHub/weguide-medical-frontend) (same shell as the EvoDental prototype): landing, auth, welcome/terms/disclaimer, tabs, journey tasks, questionnaires, program-info accordions, goals tab, settings, and contact modal.

## Live

[https://diksha-kathayat.github.io/sax-18andup-prototype/](https://diksha-kathayat.github.io/sax-18andup-prototype/)

The live site asks for access details before the prototype loads. Username and password are not stored in the page source. Local `npm start` stays unlocked for development.

## Run locally

```bash
cd /Users/dikshakathayat/.cursor/SaxInstitute/prototype
npm start
```

Then open [http://localhost:4173](http://localhost:4173).

Or:

```bash
python3 -m http.server 4173
```

## What it covers

The prototype **starts on the onboarding screen**, then walks through:

1. Create account / Login → magic-link verification  
2. Welcome letter → Terms → Important information  
3. App home is **Your Journey** (WeGuide your-actions): logo, greeting, today’s date, scheduled tasks with **Start**, then **Completed Entries** with timestamp + **View**  
4. Tabs: **Your Journey** · **Information** · **Your participation** · **Settings**  
   - Journey: only scheduled forms appear (Introduction → eConsent → Demographics)  
   - Information: three accordion sections (About, Taking part, Privacy and support)  
   - Your participation: Goals-tab style overview card  
5. Contact opens as a **modal/overlay** from Settings, not as a tab  

## Intentionally not included

These are not productized in WeGuide frontend:

- WhatsApp / chat CTAs  
- Floating booking CTA  
- Contact as a primary tab  
- Custom UI outside existing WeGuide/EvoDental prototype components  

## Branding

- Navy `#0C2340`, sky `#71C5E8`, lime `#8EDD65`, pale yellow `#F3EFA1`
- 18 and Up + Sax Institute logos
- Contact: 18andUp@saxinstitute.org.au · 1300 45 11 45

## Deep links

`?start=onboarding` (default) · `login` · `journey` (app home) · `program` · `goals` · `splash` · `ios-home` · `website`
