# Baseline Mapping With Requirement

This document maps the Baseline onboarding screen to the product requirement:

> The patient fills health, lifestyle, and exercise comfort details. Artie uses those answers to customize a movement plan. The doctor or care team can later review and modify the suggested routine.

## Screen

Baseline screen:

- Header: "BASELINE"
- Step: "Step 4 of 12"
- Title: "What did movement look like before cancer?"
- Subtitle: "Artie builds from wherever you are today."

## Requirement Mapping

| Requirement | How this screen supports it | Current status |
|---|---|---|
| Capture patient's previous activity level | Patient chooses "Very active", "Some movement", or "Not very active" | Present |
| Capture patient's current functional capacity | Patient writes current ability in free text under "And right now?" | Present |
| Understand exercise comfort level | Selection helps Artie know whether to start gently or progress faster | Present |
| Personalize plan around patient goals | Free text mentions meaningful activity, such as gardening | Present |
| Avoid unsafe or unrealistic prescriptions | Low baseline tells Artie not to suggest long or intense exercise at first | Present |
| Feed AI plan customization | Baseline value and current-capacity text are stored in onboarding state | Present |
| Support doctor review later | Baseline answers can be shown in patient summary/doctor summary | Partially present |
| Set measurable CHALLENGE-style targets | Program goals are based on MET-hours/week above baseline, so the app needs a numeric starting point | Present in UI / demo estimate |
| Compare future fitness against baseline | Later sessions need to compare current fitness with baseline fitness | Partially present |
| Assign later adoption/maintenance track | Phase II tracks depend on whether the patient is able, willing, interested, safe, and adherent | Missing |

## Data Captured

The screen captures:

- Previous activity level:
  - Very active
  - Some movement
  - Not very active
- Current capacity / patient explanation:
  - Example: "Walking to the mailbox wipes me out some days. I used to garden a lot and I miss it."
- Usual week baseline:
  - Walking minutes per week
  - Other activity minutes per week
  - Usual intensity
  - Average daily steps
  - 6-minute walk distance, if available
  - Permission to use first 7 tracking days to refine baseline

## Additional Baseline Requirements From CHALLENGE Document

The shared CHALLENGE-style requirement makes baseline more important than a single onboarding question. Baseline should become the patient's starting measurement for the 3-year program.

Additional baseline items to capture or calculate:

- Current weekly physical activity:
  - Walking minutes per week
  - Other recreational activity minutes per week
  - Light / moderate / vigorous intensity split
  - Estimated MET-hours/week baseline
- Starting step/activity data:
  - Apple Watch or manual log baseline
  - Average daily steps, if available
  - Exercise steps separated from total daily steps, if available
- Fitness starting point:
  - 6-minute walk result, if available
  - Resting heart rate, if device data exists
  - VO2 max estimate, if device data exists
  - Patient-friendly capacity note
- Safety and symptom baseline:
  - Chest pain, severe shortness of breath, dizziness, fever, weakness, dehydration, uncontrolled pain
  - Fatigue, diarrhea/bathroom access, neuropathy, nausea, musculoskeletal limitations
- Barrier baseline:
  - Motivation, time, weather, safe place to walk, bathroom access, fear of overdoing it
- Environment baseline:
  - Home setup
  - Neighborhood walking safety
  - Gym/equipment access
  - Indoor backup option
  - Nearby parks, malls, gyms, or trails
- Support baseline:
  - Support person availability
  - Solo vs with others preference
- Goal baseline:
  - Short-term FITT goal
  - Long-term survivorship goal
  - Meaningful "why" or anchor

## Recommended Product Change

Keep the current Baseline screen simple, but add one more baseline measurement step or section before the first prescription:

- "About how much movement do you do in a usual week?"
- "How many minutes do you walk on a typical day?"
- "Do you use Apple Health, Google Fit, Garmin, Fitbit, or manual tracking?"
- "Can we use your first 7 days as your baseline?"
- "Any fitness result from your clinic, like a 6-minute walk test?"

This lets Artie generate a first plan like:

```text
Baseline: about 4 MET-hours/week.
Phase I target: gradually build toward +10 MET-hours/week above baseline.
First 2-week plan: short, easy-to-moderate sessions based on symptoms and barriers.
```

## How Artie Should Use This

If the patient selects "Not very active" and says walking to the mailbox is tiring, Artie should:

- Start with short sessions.
- Avoid intense or long-duration activity.
- Use easy-to-moderate intensity.
- Treat gardening as a meaningful goal or activity.
- Build confidence slowly.
- Recommend gradual progression only after adherence improves.
- Calculate or estimate baseline MET-hours/week before setting +5, +10, or +20 MET-hour goals.
- Save the baseline so later progress can compare against the starting point.

Example output:

```text
Start with 5-10 minutes of easy walking or light gardening, 3 days per week.
Keep sessions short and stop if symptoms appear.
Progress slowly once this feels manageable.
```

## Current App Behavior

Current app behavior:

- The screen collects baseline activity and current-capacity text.
- The generated demo plan uses onboarding answers to choose activity and adaptations.
- If gardening is selected/preferred, the plan may include gardening.
- If barriers like fatigue are selected later, the plan becomes shorter and gentler.

## Gap

The app currently does not strongly show the baseline answers to the doctor as a formal "baseline assessment" section before plan approval.

Current gaps:

- Numeric baseline MET-hours/week is estimated in the UI, but not yet clinically validated.
- Baseline step average is captured manually, but not yet imported from a real device.
- 6-minute walk is captured manually, but resting heart rate and VO2 estimate are not yet imported.
- Phase I target is shown as +10 MET-hours/week above baseline, but long-term progression logic is still demo-level.
- No later Phase II track assignment criteria connected back to baseline.
- Doctor-facing baseline summary is present, but not yet backed by a clinical approval workflow.

Recommended improvements:

- Add a baseline section to doctor/care-team review:
  - Previous movement level
  - Current capacity note
  - Meaningful goal/activity
  - Weekly activity estimate
  - Baseline MET-hours/week
  - Device/manual tracking source
  - Safety and symptom baseline
  - Barrier and environment baseline
  - Artie interpretation
  - Suggested starting intensity
  - First Phase I target

## Acceptance Criteria

This requirement is satisfied when:

- Patient can enter previous movement level.
- Patient can describe current capacity.
- Patient can enter or import weekly activity data.
- App calculates or estimates baseline MET-hours/week.
- Artie uses that information to adjust the plan.
- App uses baseline to set Phase I, Phase II, and Phase III goals.
- Doctor/care team can view the baseline details before approving or modifying the plan.

Current status:

```text
Patient capture: Complete
AI demo usage: Present in demo logic
Doctor review visibility: Partial/Present in doctor summary
Numeric CHALLENGE baseline: Present as demo estimate
Full requirement: Partially complete
```
