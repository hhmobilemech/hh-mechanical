# H&H Mechanical website

A lightweight, responsive single-page website for H&H Mechanical mobile auto and diesel repair.

## Preview locally

From this directory, run:

```bash
./launch.sh
```

Then open <http://localhost:8080> in a browser. Pass a different port as the first argument if needed, for example `./launch.sh 8000`.

## Configure the phone number

Open `app.js` and set the single `BUSINESS_PHONE` value near the top. Use a dialing-safe value such as `+15551234567`. Every **Call Now** action will automatically become a telephone link.

The service request form is intentionally front-end only in version 1.

## Quick Diagnostic

The homepage includes an accessible guided symptom checker. Its decision data and summary generation live in `diagnostic.js`; dialog rendering and form integration live in `app.js`. Results describe possible inspection areas only and do not claim to provide a definitive diagnosis.

Run the diagnostic regression tests with:

```bash
./test.sh
```
