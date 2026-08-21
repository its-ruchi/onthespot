# Refine the Topic Discovery Experience — Slot Machine Interaction

The existing frontend is already good. **Do not redesign the entire application.**

Keep the current visual language, typography, spacing, colors, navigation, and overall structure.

I want to significantly improve the **topic discovery interaction** so that it becomes the memorable part of the product.

The experience should feel inspired by the anticipation of a **physical slot machine / random draw**, where the user has no idea what topic will appear until the animation stops.

The user should feel:

> **“Okay... what am I going to get?”**

The flow should be:

**Choose a category → Spin → Watch the random topics → Topic lands → Decide → Start**

---

# 1. CATEGORY SELECTION

Before the user can spin, ask:

## What do you want to explore?

Show a simple grid of categories.

Examples:

* 🧠 Psychology
* 💪 Fitness
* 💼 Business
* 🤖 Technology
* 🌎 Culture
* 🔬 Science
* 📚 History
* 💰 Money
* 🎨 Creativity
* ❤️ Relationships
* 🧠 Philosophy
* 🎲 Anything

Keep the categories visually simple.

The user selects **one category**.

The selected category should have a clear active state.

Example:

**🧠 Psychology**

with a subtle border/accent and slight background change.

Then show:

**Continue →**

Do not show the topic yet.

---

# 2. SPIN SCREEN

After selecting a category, move into the main topic discovery experience.

The screen should become focused around a large **slot-machine-style topic selector**.

At the top:

**PSYCHOLOGY**

Small supporting text:

**Spin to discover your topic.**

---

# 3. THE SLOT MACHINE

This is the most important interaction.

Create a large visual slot/reel in the center of the screen.

It should contain many possible topics from the selected category.

For Psychology, examples could include:

* The Bystander Effect
* The Halo Effect
* The Dunning-Kruger Effect
* Confirmation Bias
* The Placebo Effect
* The Mere Exposure Effect
* The Zeigarnik Effect
* The Spotlight Effect
* Learned Helplessness
* The Paradox of Choice
* The Pygmalion Effect
* The Endowment Effect

Do not show all topics at once.

The topics should move rapidly through the slot/reel when the user spins.

The user should only be able to catch glimpses of what is passing by.

---

# 4. SPIN BUTTON

Place one large primary button directly below the reel:

# 🎰 SPIN

Make this the obvious action on the screen.

When the user clicks it, begin the animation immediately.

The button should change to:

**Spinning...**

and become temporarily disabled.

---

# 5. SPIN ANIMATION

The animation should NOT simply swap one piece of text for another.

Build a convincing physical slot-machine-style animation.

### Start

The selected topic is hidden.

The reel begins moving quickly.

Multiple topics rapidly pass through the center selection area.

The movement should initially be fast enough that the user cannot predict the result.

### Middle

After approximately 1 second, gradually reduce the speed.

Topics become easier to read.

The reel continues moving.

### Final stage

Slow the reel down progressively.

Create a sense that the result could be any of the visible topics.

Then:

**STOP**

The final topic should snap precisely into the center.

Use subtle physical motion:

* Small overshoot
* Tiny bounce
* Quick settle
* Slight scale-up of the winning topic

Do not use excessive effects.

The animation should feel premium, not cartoonish.

---

# 6. VISUAL SLOT DESIGN

Create a clear **selection window** in the center.

For example:

```text
────────────────────────

The Spotlight Effect

────────────────────────
```

The topic currently passing through the center should be:

* Largest
* Sharpest
* Highest contrast

Topics above and below should gradually become:

* Smaller
* More transparent
* Slightly blurred

This should create the visual feeling that the machine is moving through a long list.

The center position is the only selected position.

---

# 7. ANTICIPATION

The animation should be designed around **anticipation**, not speed alone.

The user should experience:

**Fast → Fast → Slowing → Slowing → Almost there → STOP**

Do not stop randomly after a fixed short fade.

Use realistic deceleration.

The final few topic changes should happen slowly enough that the user starts thinking:

> “Is it going to land there?”

Then stop.

Total animation duration:

**approximately 3–4 seconds**

It should be exciting but not annoying.

---

# 8. FINAL TOPIC REVEAL

Once the reel stops, transform the winning topic into a clean topic card.

Example:

### YOUR TOPIC

# The Spotlight Effect

Then a very short description:

> Why do we often overestimate how much other people notice us?

Keep this explanation short.

Do not immediately give the user the answer or a long Wikipedia-style explanation.

The point is to make them curious.

---

# 9. ACTIONS AFTER THE SPIN

Under the topic show two choices.

Primary:

**Start Challenge →**

Secondary:

**Spin Again**

The user can spin again if they genuinely don't like the topic.

If they click **Spin Again**, return to the exact same slot-machine animation.

Do not instantly replace the topic.

Make every spin feel like a new draw.

---

# 10. IMPORTANT: RANDOMNESS

The result must genuinely feel unpredictable.

Before each spin, select a random topic from the chosen category.

However, do not reveal which topic has already been selected.

The animation should cycle through many decoy topics before landing on the predetermined result.

Avoid immediately showing the winning topic at the beginning of the animation.

The user should not be able to predict the outcome.

---

# 11. "ANYTHING" CATEGORY

If the user chooses:

### 🎲 Anything

Mix topics from all categories.

The reel can contain:

* Psychology
* Fitness
* Science
* History
* Technology
* Business
* Philosophy
* Culture
* Relationships
* Creativity
* Weird/Unexpected topics

This should be the most unpredictable mode.

---

# 12. TOPIC QUALITY

The topics should NOT be generic prompts such as:

❌ "What is your favorite food?"

❌ "What are your goals?"

❌ "Why is exercise important?"

Instead, favor topics that make the user think:

✅ "The Bystander Effect"

✅ "Why expensive things feel more valuable"

✅ "The Cobra Effect"

✅ "Why people defend decisions they regret"

✅ "The Ship of Theseus"

✅ "Why some habits become easier when you stop trying"

The topics should create the reaction:

> **“I've never heard of that.”**

or:

> **“Wait... I actually have something to say about this.”**

---

# 13. AFTER ACCEPTING THE TOPIC

When the user clicks:

**Start Challenge →**

transition into the existing practice experience.

Do not change the existing speaking/writing functionality.

The selected topic should simply become the challenge.

For example:

**Topic: The Spotlight Effect**

Then the user can choose:

🎤 **Speak**

or

✍️ **Write**

and proceed with the existing timer/challenge flow.

---

# 14. MICRO-INTERACTIONS

Add subtle interactions:

### Category selection

Small scale/border transition.

### Spin button

Slight press animation.

### Reel

Fast movement → realistic deceleration.

### Winning topic

Small scale-up + settle animation.

### Spin Again

Return smoothly to the reel state.

### Start Challenge

Smooth transition into the challenge screen.

Keep everything subtle and premium.

---

# 15. Do Not Add

Do NOT add:

* Leaderboards
* Social sharing
* Complex statistics
* Achievement systems
* Multiple levels
* Coins
* Virtual currency
* Confetti
* Excessive sound
* Gamified badges
* A huge topic library UI
* Complex settings

The slot-machine interaction itself is the delight.

---

# FINAL EXPERIENCE

The user should experience this:

### Step 1

**What do you want to explore?**

Choose:

**Psychology**

↓

### Step 2

Large empty slot/reel.

**🎰 SPIN**

↓

### Step 3

Topics fly past rapidly.

**Bystander Effect → Halo Effect → Placebo Effect → Dunning-Kruger → ...**

↓

### Step 4

The reel slows.

**... → ... → ...**

↓

### Step 5

**STOP**

# The Zeigarnik Effect

↓

### Step 6

> *Why unfinished tasks stay in our minds.*

**Start Challenge →**

**Spin Again**

↓

### Step 7

User starts thinking, speaking, or writing.

---

## The single most important requirement

Do not make the random topic feel like a normal randomizer.

It should feel like the user is **pulling a lever on a machine and waiting to discover what fate gives them.**

The anticipation is the feature.

The topic is the reward.
