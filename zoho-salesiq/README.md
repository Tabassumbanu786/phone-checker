# Zoho SalesIQ flow

Replicates the web page's flow inside a SalesIQ chat widget: ask for a phone
number, call the same `/api/phone/check` endpoint, show the same result.

This uses **SalesIQ Scripts 2.0** (Zoho's current Deluge-based Zobot
platform), which needs no separate hosting — the script runs inside Zoho's
infrastructure and calls your API server-to-server (no CORS/browser
restrictions apply).

## Setup

1. In your SalesIQ portal: **Settings > Bot > Zobot > Add**.
2. Choose platform **SalesIQ Scripts**, pick the brand/department this bot
   should answer for, and name it (e.g. "Phone Checker").
3. In the code builder, open the **Message Handler** section and paste in
   [`zobot-message-handler.dg`](./zobot-message-handler.dg).
4. Replace the `apiUrl` placeholder near the top with your deployed backend's
   URL, e.g. `https://phone-checker-api.onrender.com/api/phone/check`. Zoho's
   cloud cannot reach `localhost`, so this must be a public HTTPS URL.
5. Save, then **Publish** the bot and attach it to the widget/department you
   want it active on.
6. Open your site's chat widget (or the portal's test console) and send a
   message containing a phone number, e.g. `415-555-2671`.

## Expected behavior

| Visitor sends | Bot replies |
|---|---|
| `hi` (no digits) | Prompt asking for a phone number |
| `415-555-2671` (the seeded test row) | "Phone number already exists" |
| `650-555-0100` (any other valid number) | "Good to go" |
| `abcdef` (looks like a number attempt but isn't) | n/a — the digit-count check treats it as a non-number and re-prompts |
| Malformed number, e.g. `123` | The API's validation error, e.g. "Phone number is not a valid phone number." |

## Notes

- No visitor input is ever written back to the database — this bot only
  calls `/api/phone/check`, same as the web page, and that endpoint is
  read-only.
- The handler is intentionally single-turn (no multi-step "context" flow):
  any message that contains 6+ digits is treated as a phone-number check
  attempt. This keeps the script simple and avoids relying on SalesIQ's
  multi-step context/question schema, which isn't needed for a one-field
  form.
- If your portal doesn't have SalesIQ Scripts 2.0 enabled, the same flow can
  be built with SalesIQ's no-code **Bot Flow** builder instead: a "Get input"
  step to collect the phone number, an "API call" step pointed at the same
  endpoint, and a condition/message step to show the result.
