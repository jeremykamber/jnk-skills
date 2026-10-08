# Feature Map

The feature map is what makes a generated `verify-<app>` skill reusable. It is the index of what the app does, told from the user's side, with the harness commands to reach each feature and the end state that proves it works. Without it, an agent verifies the one path it happened to think of.

It is not the acceptance spec. `features/<feature>.feature` at the project root states required behavior in the language of the problem, and the `acceptance` gate parses it. The feature map is operational: where a feature lives, how to drive it, and what to look at when you do. A map entry can be perfectly accurate and still prove nothing if it stops at the screen instead of the state behind it, so keep the two files' claims separate.

## Where it lives

The generated skill carries the map next to it:

```
<project>/.agents/skills/verify-<app>/
  SKILL.md
  features/
    README.md           the index
    <feature-slug>.md   one file per user-facing feature
```

Slugs name the feature the way a user would (`checkout`, `password-reset`), not the module that implements it (`payment-service`).

## The index: README.md

One table, one row per feature. It exists so an agent can pick what to drive without reading every file.

```md
# <app> feature map

| Feature | Reach it by | Harness | Proves | File |
| --- | --- | --- | --- | --- |
| Checkout | Search, add to cart, pay | Playwright | Order confirmation with one new order row | [checkout.md](checkout.md) |
| Password reset | Request a link, set a new password | Playwright | Sign-in with the new password, old one rejected | [password-reset.md](password-reset.md) |
```

## One file per feature

An intro line under the H1 says what the feature is in the user's words. Four H2s answer the rest: what it is made of, how a user reaches it, how the harness drives it, and what tends to go wrong.

### Worked file shape

````markdown
# Checkout

A shopper searches, adds items to a cart, applies a discount, and pays; the feature is the path from a product page to an order confirmation.

## Sub-features

- Add an item to the cart
- Change quantity or remove a line
- Apply a discount code
- Pay and receive an order confirmation

## How to get to it (user POV)

1. Open http://localhost:5173/ and sign in as the seeded test user (Launch, in SKILL.md).
2. Search for any in-stock product and open its detail page.
3. Press "Add to cart", then open the cart from the header.

## Driving it with <harness>

Replace `<harness>` with the real one (Playwright, expect, curl). Each step is an action and the state it should produce.

1. On a product page, `page.getByRole('button', { name: 'Add to cart' })`. The header cart count goes from `0` to `1`.
2. `page.getByRole('link', { name: 'Cart' })` opens the drawer. It lists the product name and the price from the product page.
3. `page.getByLabel('Discount code')` filled with `SAVE10`, then `page.getByRole('button', { name: 'Apply' })`. The total drops by ten percent.
4. `page.getByRole('button', { name: 'Pay' })` with the test card. The page lands on `/orders/<id>`.

**End state:** the confirmation shows an order number, and the `orders` table has exactly one new row for the test user with the discounted total. Evidence is a screenshot of the confirmation plus the query result.

## Gotchas

- A fresh database is seeded with no products; run the seed script before the first drive.
- The discount code is single-use per user, so a second run in the same session silently keeps the first price. Reset the user or use a new one.
- The confirmation route is client-rendered, so wait for the order number rather than the navigation event.
````

## Keeping it honest

- One feature per file. A sub-feature is a step the harness can drive, not a heading for hope.
- The end state is observable from outside: a URL, a rendered string, a response body, a row, an exit code. "The cart looks right" is not an end state.
- The harness named in the heading is the tool the project actually uses, so the next agent runs the commands instead of inventing them.
- A `Gotchas` entry comes from a real failed run, not from reading the code.
- Seed the top three to five features, not the whole app. The maintenance pass grows the map from there.

## Maintenance outcomes

The periodic pass reads this directory and returns exactly one of three verdicts:

- `clean`: every entry matches the app, and every mapped feature drove green.
- `changed`: one change set of proven corrections, confined to the verification skill's own directory. Missing, extra, duplicate, and dead entries are added, removed, merged, or archived here.
- `blocked`: the pass could not run, or the app itself is broken. Name the blocker. A product regression is reported, never written over in the map.
