# H&H Mechanical website

A lightweight, responsive single-page website for H&H Mechanical mobile auto and diesel repair.

## Preview locally

From this directory, run:

```bash
./launch.sh
```

Then open <http://localhost:8080> in a browser. Pass a different port as the first argument if needed, for example `./launch.sh 8000`.

## Configure the phone number

The official phone is configured once in `app.js` as the dialing-safe value `+12052437867`. Every phone action and SMS request uses that value, while customer-facing number displays are formatted as `205-243-7867`.

The service request form is intentionally front-end only in version 1.

## Quick Diagnostic

The homepage includes an accessible guided symptom checker. Its decision data and summary generation live in `diagnostic.js`; dialog rendering and form integration live in `app.js`. Results describe possible inspection areas only and do not claim to provide a definitive diagnosis.

Run the diagnostic regression tests with:

```bash
./test.sh
```

## Dashboard startup

Each page load begins with a lightweight automotive instrument-cluster sequence. It automatically clears after about 2.4 seconds including its exit fade, can be skipped by clicking, tapping, or pressing Escape, and uses a short static fade when the visitor prefers reduced motion.

## Vehicle service map

The homepage includes an original inline-SVG pickup/SUV service map with eight keyboard-accessible vehicle areas. Selecting an area displays related services, can append that area to the existing request form, and can enter the existing Quick Diagnostic at a relevant question.

## Service area checker

All confirmed geography belongs in the single `serviceAreas` object near the top of `service-area.js`:

```js
const serviceAreas = {
  cities: [],
  zipCodes: [],
  counties: [],
  notes: "",
};
```

The default lists are intentionally empty. Until confirmed locations are added, valid searches ask the customer to call or request service for availability confirmation.

## SMS service requests

The existing service form validates and formats a complete text-message request. On supported mobile devices it opens the native SMS composer for the customer to review and send; desktop and unconfigured-phone states show a copyable request instead. No message is automatically sent and no API credentials are used.

The SMS link uses `?body=` for Android and other mobile handlers, and `&body=` for iPhone/iPad compatibility. The request scripts carry a small deployment version query so phones do not retain an obsolete cached submit handler after an update.

## My Garage

My Garage is a six-step, session-only guided request builder. Its state and workflow data live in `garage.js`; no sensitive request information is stored in local storage. Final review synchronizes into the existing service form and invokes that form's established SMS/mobile or desktop fallback delivery path.

The one `BUSINESS_PHONE` constant at the top of `app.js` enables both telephone links and SMS delivery:

```js
const BUSINESS_PHONE = "+12052437867";
```
