# Customer renewals

Entry: the public website's **Renew now** buttons open `/renew`. Customer pages
are native Next.js/React. The existing admin stays at `/dashboard`.

## Account and vehicle flow

1. Choose Personal or Organization, create an account or sign in with Firebase.
2. New Google users complete their full name and phone. Email/password buyers
   receive a verification link automatically on the verification screen.
3. Verified buyers follow vehicle welcome/lookup, brand, details, document
   selection, reminders and plate/state steps. The existing plate provider is
   called through the authenticated Worker; manual entry remains available.
4. Contacts use `users/{uid}` and the app's firstName/lastName/fullName/email/
   phone/phoneNumber/agentId/role/onboarding fields. Account type is additive.
5. Vehicles/documents use the app's `cars/{uid}/carDetails/{carId}` hierarchy.
   Expiry saves and the same two reminder dirty markers commit atomically.

Vehicles and Renewals are separate routes. Organization V1 uses the shared
customer flow with multiple vehicles; additional organization tools are deferred.

## Checkout

- The existing delivery Worker prices the owned selections using the assigned
  agent's `AgentPrices` and `management/autoDriveCharges`. Delivery is charged once.
- Signed quotes expire after 20 minutes. Startup revalidates prices, ownership,
  registration, saved delivery address/date and private R2 evidence metadata.
- The Worker creates `PendingOrders/WebRenew...`, then opens Flutterwave hosted
  checkout. Existing webhooks verify payment and continue existing assignment
  and payout rules. The return page opens Ongoing while confirmation arrives.
- Browser callback status is not permission to mark an order paid. Firestore
  rules prevent clients changing the new website payment-order snapshots.
- Existing payout configuration is reused. The website does not select a new
  payout method or destination.

## Configuration and deployment

Use the existing Vercel project and existing Firebase `NEXT_PUBLIC_FIREBASE_*`
variables. Never commit `.env.local`. Production must authorize
`www.autodrive.com.ng` in Firebase Authentication for Google popup sign-in.
The Worker uses its existing service-account/Flutterwave secrets, with
`CUSTOMER_WEB_BASE_URL=https://www.autodrive.com.ng`; R2 CORS checks allow the
same website origin. No new package is required.

## Verification

- `npm run build`
- `node --test test/customer-contract.test.cjs`
- Worker: `npm run check` and `npm test` (includes mocked Flutterwave tests).
- Manual acceptance: email signup auto-sends verification, refresh unlocks
  onboarding; Google asks for missing phone; save a lookup/manual vehicle and
  see it in the app; single/multiple document quotes match agent/add-on prices;
  upload evidence and confirm address/date; user completes a real payment;
  return opens Ongoing and webhook-confirmed order reaches the assigned agent.

Production payments and real-account creation must be tested by the owner.
