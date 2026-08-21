# Build a Minimal AI Practice App — Senior Product Designer + Frontend Engineer Brief

Design and build a polished, minimal web app called **Unscripted**.

The product is a personal daily practice tool for improving **speaking, English communication, storytelling, thinking on the spot, and writing**.

The core philosophy is:

> **Don't consume. Practice.**

The user opens the app, gets a challenge, completes it under a time constraint, receives feedback, and maintains a daily streak.

The product should feel like a **beautiful personal practice tool**, not an LMS, AI chatbot, or complicated SaaS dashboard.

---

## 1. Core User Loop

The entire product should revolve around this loop:

**Open app → Choose practice → Get prompt → Prepare → Perform → Get feedback → Maintain streak**

The user should understand this within 5 seconds.

Do not introduce unnecessary features.

---

# 2. Primary Navigation

Keep navigation extremely minimal.

Top-left:

**Unscripted**

Top-right:

**🔥 7**

and a small profile/settings icon.

No sidebar.

No complex navigation.

The primary screen should be the practice screen.

---

# 3. Home Screen

Create a calm, minimal home screen.

At the top:

**🔥 7 day streak**

Small supporting text:

**Keep showing up.**

Main headline:

# What do you want to practice today?

Below, show two large selectable cards.

### SPEAK

Icon: microphone

**Think for 10 minutes. Speak for 2.**

Small label:

**Speaking · English · Communication**

CTA:

**Start →**

---

### WRITE

Icon: pen

**Get a prompt. Write under pressure.**

Small label:

**Writing · Storytelling · Ideas**

CTA:

**Start →**

---

Below the two cards:

### Feeling spontaneous?

A simple outlined button:

**🎲 Surprise Me**

This randomly selects a challenge.

Do not add more sections to the homepage.

---

# 4. Speak Flow

When the user selects Speak, transition smoothly into a focused challenge screen.

## Step 1 — Topic

Header:

**SPEAK**

Small text:

**10 min preparation · 2 min speaking**

Large prompt:

> **Should AI make important decisions for us?**

Below:

**Think about your answer. Don't use AI. Just think.**

Large countdown:

# 09:42

Below the timer, provide a simple notes field:

**Jot down a few thoughts...**

Keep the notes area optional.

Bottom primary button:

**I'm Ready →**

---

# 5. Speaking Screen

After clicking "I'm Ready", transition into a distraction-free recording experience.

Remove unnecessary navigation.

At the top:

**SPEAKING**

Prompt remains visible but smaller.

Large timer:

# 01:58

Center:

Large circular microphone button.

When recording:

**● Recording**

Display a subtle animated waveform.

Keep the animation elegant and restrained.

Bottom:

**Finish**

The user should immediately understand:

**I'm recording → I have 2 minutes → I need to speak.**

---

# 6. Speaking Feedback

After finishing, show a simple results screen.

Headline:

# You showed up.

Large score:

**82**

Small label:

**Overall score**

Then four simple metrics:

**Clarity** 8/10
**Fluency** 7/10
**Structure** 8/10
**Vocabulary** 8/10

Then two feedback sections.

### What went well

> Your answer had a clear opinion and your example made the argument easy to understand.

### One thing to improve

> Your ideas were strong, but you jumped between points. Try using a simple Point → Example → Conclusion structure.

Keep feedback concise.

Do not create a giant AI analysis page.

At the bottom:

**Try Again**

and

**Done →**

When the user clicks Done, their daily streak is updated.

---

# 7. Write Flow

Clicking Write opens a format selection screen.

Headline:

# What do you want to write?

Show four simple options:

**LinkedIn Post**

**Newsletter**

**Short Story**

**Opinion**

Also include:

**🎲 Random**

Keep these as clean selectable pills/cards rather than large complicated cards.

After selecting a format:

**Continue →**

---

# 8. Writing Challenge

Create a distraction-free writing interface.

Top:

**WRITE**

Right side:

**49:32**

Prompt:

> **Write about a time you completely changed your mind about something.**

Small label:

**Format: LinkedIn Post**

Large clean writing editor:

**Start writing...**

Show a small word counter:

**0 words**

Do NOT provide AI suggestions while the user writes.

The challenge should test the user's own ability.

Primary button:

**Submit →**

---

# 9. Writing Feedback

Use the same visual language as speaking feedback.

Headline:

# Nice work.

Score:

**84 / 100**

Metrics:

**Clarity** 9/10
**Structure** 8/10
**Originality** 8/10
**Engagement** 8/10

Then:

### What went well

> Your opening immediately creates curiosity and establishes a clear point of view.

### One thing to improve

> Your middle section becomes repetitive. Try adding one specific personal example.

Bottom:

**Try Again**

**Done →**

Completing the challenge updates the streak.

---

# 10. Streak System

The streak is important but should NOT dominate the product.

Show:

**🔥 7**

When the user completes their first challenge of the day:

Show a subtle success animation:

**🔥 Streak maintained**

**8 days**

Do not use confetti or childish gamification.

Use a subtle satisfying animation.

If the user misses a day, don't make the experience feel punishing.

---

# 11. History

Keep history extremely simple.

Accessible from the top-right.

Headline:

# Your practice

Show a chronological list.

Example:

**Today**

🎤 AI & important decisions
**82/100**

✍️ Changed my mind
**84/100**

**Yesterday**

🎤 Remote work
**76/100**

Each item can be opened to view the previous feedback.

No charts.

No complicated analytics.

---

# 12. Visual Design

The visual identity should be:

**Minimal · Editorial · Calm · Premium · Focused**

Think of a modern independent internet product rather than a corporate SaaS application.

Use:

* Warm/off-white background
* Near-black typography
* One restrained accent color
* Large typography
* Generous whitespace
* Thin borders
* Soft rounded corners
* Subtle shadows only where necessary

Avoid:

* Excessive gradients
* Glassmorphism
* Neon colors
* Huge illustrations
* Excessive icons
* Dense dashboards
* Decorative UI
* Gamified badges
* Fake complexity

---

# 13. Typography

Typography should be one of the main visual elements.

Use a modern sans-serif.

Large headlines should feel confident and editorial.

Example hierarchy:

**What do you want to practice today?**

Large.

Supporting text should be quiet and secondary.

Buttons should be short and obvious.

Avoid long paragraphs inside the UI.

---

# 14. Motion & Animation

Animations should communicate state, not decorate the interface.

Use subtle transitions:

### Page transitions

Smooth fade + slight vertical movement.

### Timer

Subtle visual change as time decreases.

### Recording

Small pulsing microphone state.

### Submit

Short transition into feedback.

### Streak

Small satisfying flame animation when streak increases.

### Hover

Cards slightly lift or change border.

Do NOT use excessive animations.

The interface should still feel fast.

---

# 15. Responsive Design

Design mobile-first but make the desktop experience excellent.

On mobile:

* Full-width cards
* Large touch targets
* Sticky primary CTA where appropriate
* Minimal navigation
* Large readable timer

On desktop:

* Center the practice experience
* Keep the content width constrained
* Do not stretch everything across the screen
* Use whitespace intentionally

The practice screen should feel like a focused workspace.

---

# 16. Component Structure

Create reusable components:

* Header
* PracticeCard
* ChallengePrompt
* Timer
* NotesInput
* RecordingButton
* WritingEditor
* ScoreCard
* FeedbackSection
* StreakIndicator
* HistoryItem
* Button
* Modal

Use consistent spacing, typography, borders, radius, and interaction states.

---

# 17. Product Constraints

This is an MVP.

Do NOT add:

* Authentication
* Social profiles
* Leaderboards
* Friends
* Payments
* Subscription screens
* Complex analytics
* AI chat
* Notifications
* Communities
* Achievement systems
* Multiple dashboards

The product has only three meaningful outcomes:

**Practice → Feedback → Streak**

---

# 18. Prototype Behaviour

Make the prototype feel functional.

Implement:

* Speak/Write selection
* Challenge selection
* Random prompt generation
* Countdown timers
* Start/finish states
* Writing word count
* Recording state
* Feedback screen
* Streak increment
* History
* Smooth transitions

Use realistic mock data for AI feedback.

The UI should be designed so a real AI backend can be connected later.

---

# 19. Important Product Principle

Do not design this as an AI product where AI does the work.

Design it as a **practice product where AI is the coach**.

The user's job is to:

**Think. Speak. Write.**

The AI's job is to:

**Evaluate. Explain. Improve.**

That distinction should be visible throughout the product.

---

# Final Design Goal

When someone opens the app, they should immediately understand:

> **I get a challenge.**
>
> **I have limited time.**
>
> **I do the work.**
>
> **AI tells me how I did.**
>
> **I come back tomorrow.**

Make the experience feel **simple enough to use every day and polished enough that someone would want to keep it open as a personal practice tool.**

Do not add anything that makes the core loop harder to understand.
