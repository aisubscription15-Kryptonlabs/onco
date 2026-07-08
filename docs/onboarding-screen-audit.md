# OncoMotionRx Onboarding Screen Audit

This audit maps each onboarding screen against the intended design pattern:

- Big display headline using the OncoMotionRx display font.
- Calm, patient-friendly subtitle text.
- Cream background, sage primary actions, terracotta accent/kicker.
- Clear touch targets for mobile and iOS.
- No clinical pressure; patient can share only what they are comfortable with.

## 1. Start

Purpose: Lets the patient choose how to begin.

Current primary copy:

- "Movement, made for recovery."
- "A structured movement program built for life during and after cancer treatment - guided by Artie, your personal activity consultant."

Display notes:

- Uses large display headline.
- Uses brand mark and soft abstract illustration.
- Primary action is now "I have a care code."
- Secondary action is now "Start on my own."

Status: Updated to match the design direction.

## 2. Identity

Purpose: Collects basic self-start identity details before onboarding continues.

Current fields:

- First name
- Email or phone
- Birth year

Display notes:

- Appears in a modal rather than a full page.
- Uses standard OncoMotionRx input styling.
- Copy is functional, but less design-polished than the main onboarding pages.

Status: Present. Birth year is still optional and should be made required under the separate requirement.

## 3. Treatment

Purpose: Collects cancer and treatment background so Artie can design safely.

Current primary copy:

- "Tell us a bit about your treatment"
- "This shapes your plan. Share only what you're comfortable with - everything here is optional."

Display notes:

- Uses display heading and calm subtitle.
- Select controls use white rounded cards.
- Treatment chips use sage active state.

Status: Updated to match design-reference wording.

## 4. Baseline

Purpose: Understands previous activity, current capacity, and measurable starting point.

Current primary copy:

- "What did movement look like before cancer?"
- "Artie builds from wherever you are today."

Display notes:

- Uses radio-style choice cards.
- Selected activity choice can be tapped again to clear it.
- Current-capacity textarea captures patient free text.
- Starting-point section captures walking minutes, other movement minutes, and usual intensity.
- Optional steps and 6-minute walk fields are tucked under an expandable section to keep the screen patient-friendly.
- Estimated baseline card uses the sage-soft theme and explains MET-hours/week in plain language.
- Text aligns with the patient-friendly design pattern.

Status: Updated. Good balance between the original simple screen and the measurable baseline requirement.

## 5. Safety

Purpose: Checks for red-flag symptoms before plan creation.

Current primary copy:

- "Before we build your plan, a quick safety check"
- "Are you currently experiencing any of these? Be honest - this just helps us keep your plan safe."

Display notes:

- Uses checkbox-style safety cards.
- "None of these" clears red flags.
- Warning card appears if red flags are selected.

Status: Updated to match design-reference wording.

## 6. Preferences

Purpose: Lets patient choose movements that sound doable.

Current primary copy:

- "What kind of movement sounds doable?"
- "Pick anything that appeals - even a little. We'll start with one."

Display notes:

- Uses two-column activity cards.
- Sage background marks selected activities.
- Preference chips sit below the activity cards.

Status: Updated to match design-reference wording.

## 7. Barriers

Purpose: Captures barriers that may make movement difficult.

Current primary copy:

- "What's most likely to get in the way?"
- "These aren't excuses - they're planning information. Artie designs around them."

Display notes:

- Uses rounded chips for barriers.
- Active selections use sage.
- The wording is supportive and nonjudgmental.

Status: Updated to match design-reference wording.

## 8. Environment

Purpose: Understands where movement can safely happen.

Current primary copy:

- "Where will movement happen?"
- "Quick yes or no - this helps Artie suggest routes and backups that actually work for you."

Display notes:

- Uses white rounded toggle rows.
- Checkbox controls are iOS-safe but visually simpler than the original design's custom switches.
- Current requirement for ZIP code/trail lookup is not implemented yet.

Status: Copy updated. ZIP/trail functionality pending.

## 9. Support

Purpose: Lets patient optionally add a support person.

Current primary copy:

- "Who's in your corner?"
- "People who move with support tend to stick with it. Totally optional - going solo is fine too."

Display notes:

- Uses card surface for support-person state.
- "Add support person" opens modal.
- Modal uses standard input styling.

Status: Updated to match design-reference wording.

## 10. Goal

Purpose: Captures the patient’s personal reason for movement.

Current primary copy:

- "Last thing - what matters most to you?"
- "This becomes your anchor. Artie will bring it back to you on the hard days."

Display notes:

- Uses select control for goal anchor.
- The current app combines goal and tracking on one page.
- Design is readable and consistent, though goal choices could later become richer card choices.

Status: Updated to match design-reference wording.

## 11. Tracking

Purpose: Lets patient choose how activity will be tracked.

Current controls:

- Apple Health
- Google Fit
- Garmin
- Fitbit
- Manual

Display notes:

- Tracking currently appears on the same page as Goal.
- Wearable connection opens a simulated modal.
- Functional device connectivity screens are still pending under the separate requirement.

Status: Present, but functional device connectivity is pending.

## 12. Plan

Purpose: Shows Artie is ready to build the first plan and then reveals the prescription.

Current ready-state copy:

- "Ready to build your first plan."
- "Artie will adapt around your answers."

Plan reveal copy:

- "Sam, your first prescription is ready"
- "It's small on purpose. We're building a foundation, not chasing a finish line."

Display notes:

- Ready screen summarizes plan inputs in a sage card.
- Plan reveal now includes an Artie avatar and design-style intro.
- Prescription card shows activity, minutes, frequency, intensity, and MET-hours.
- Care code card appears for self-start users.

Status: Updated to follow the design-reference pattern.

## Summary

Completed:

- Screen-by-screen review for all 12 onboarding steps.
- Design-pattern copy updates for core onboarding screens.
- Shared onboarding title/subtitle styling updated.
- iOS compatibility improvements added.
- Step 4 baseline display simplified after adding measurable baseline fields.

Pending separate requirements:

- Make birth year/date required.
- Skip selected screens for care-code patients.
- Add functional device connectivity.
- Add ZIP code and nearby trail lookup.
- Add trail details such as weather, traffic, stretch, and time.
- Add AI agent icon wherever AI is actively working.
