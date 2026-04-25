# Gather UX Audit: First-Time Trip Planning Flow

Date: 2026-04-22
Environment: local app at `http://127.0.0.1:3000`
Persona: first-time user with no prior product knowledge, using the built-in anonymous sign-in flow

## Scenario Covered
- Anonymous sign-in
- Empty-state onboarding
- Create first trip
- Find where to add a hotel or stay option
- Find where to add expenses, including a stay expense
- Find how to invite friends
- Review people, settings, and overall trip navigation
- Short exploratory pass for friction and unclear affordances

## Findings

### 1. Blocker: create-trip submit can fall outside the usable viewport
- Repro:
  1. Sign in anonymously.
  2. Click `Create your first trip`.
  3. Fill title, destination, and dates on a shorter desktop viewport.
  4. Try to click the submit button.
- Expected: the primary action stays visible or the modal scrolls safely.
- Actual: the CTA can end up below the visible area, which blocks the first critical action.
- Recommendation: make the modal height-bounded, keep the footer reachable, and allow the form body to scroll independently.

### 2. The first create-trip step assumes the user already knows what belongs here
- Repro:
  1. Open the create-trip modal from the empty state.
  2. Read the form without prior product context.
- Expected: it should be obvious what is required now and what can be filled later.
- Actual: the form presents several inputs at once without clarifying that only the basics are needed.
- Recommendation: add a short primer explaining required fields and explicitly say that stays, expenses, and invites happen after creation.

### 3. Trip navigation relies too heavily on icon memory
- Repro:
  1. Open a trip page.
  2. Try to infer where `board`, `people`, `calendar`, and `settings` live without exploring every icon.
- Expected: labels should make section switching self-evident.
- Actual: the header leaned on icon-only controls, especially for the main board route.
- Recommendation: use labeled navigation pills instead of expecting users to decode icons.

### 4. Invite flow is present but not obvious where users expect it
- Repro:
  1. Create a trip.
  2. Try to figure out how to bring friends in.
- Expected: inviting should be clearly named and easy to find from the people context.
- Actual: the action existed, but the wording was generic and the people screen did not reinforce it.
- Recommendation: rename the action around “invite”, show it prominently in people management, and explain what invitees can do once they join.

### 5. “Proposal” and “budget drawer” are implementation-shaped labels, not user-shaped ones
- Repro:
  1. Open the new trip board.
  2. Try to find where to add a hotel and where to add the first cost.
- Expected: users should immediately see language like “stay”, “hotel”, “cost”, or “expense”.
- Actual: the key flows were present but not introduced in the language a first-time traveler naturally uses.
- Recommendation: add first-run guidance, rename visible affordances toward “stay/place” and “costs/expenses”, and point users to the exact surfaces.

## Implemented In This Pass
- Made the create-trip modal height-bounded with an independently scrollable body and persistent footer CTA.
- Added explicit first-run guidance inside the create-trip modal about what is required now versus later.
- Clarified the home empty-state copy so users know the trip notebook opens first and details come after.
- Reworked the trip header into labeled section navigation.
- Changed the share affordance to explicit invite language and reused it where the user expects to manage people.
- Added a quick-start panel on the trip board to direct users toward stays, costs, and invites.
- Added clearer explanatory copy in the places and budget surfaces, especially around “Stay” and first expense entry.

## Remaining Opportunities
- Add a post-create success state or lightweight walkthrough that highlights the next best action automatically.
- Add lightweight confirmation or toast feedback after copying an invite link beyond button text alone.
- Consider splitting the trip board into more obviously titled subsections if the notebook grows denser over time.
