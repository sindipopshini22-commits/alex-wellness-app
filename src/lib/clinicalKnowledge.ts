// Alex — Clinical Knowledge Base for RAG retrieval.
//
// Structured, mhGAP-aligned clinical knowledge that the conversational model
// can retrieve during chat. Each entry is tagged by technique/modality and
// contains sourced, evidence-based protocol text.
//
// Sources: WHO mhGAP-IG v3 (2023), Beck Institute CBT protocols,
// ACT/Hayes acceptance protocols, IPT principles.

export interface KnowledgeEntry {
  id: string;
  title: string;
  modality: "CBT" | "ACT" | "IPT" | "mhGAP" | "mindfulness" | "crisis_intervention";
  category: string;
  tags: string[];
  source: string;
  content: string;
  /** Brief summary for displaying in UI */
  summary: string;
}

export const CLINICAL_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ── CBT: Cognitive Restructuring ─────────────────────────────────────
  {
    id: "cbt-thought-record",
    modality: "CBT",
    category: "cognitive_restructuring",
    title: "CBT Thought Record (5-Column)",
    tags: ["thought record", "cognitive distortion", "cognitive restructuring", "automatic thoughts"],
    source: "Beck Institute, Cognitive Therapy (1979); mhGAP-IG v3 Depression Module",
    summary: "Structured exercise to identify and reframe automatic negative thoughts.",
    content: `THE COGNITIVE BEHAVIORAL THOUGHT RECORD — 5 COLUMNS

This is a CBT technique for identifying and restructuring automatic negative thoughts.

Column 1 — Situation: What triggered the feeling? (Who, what, when, where)
Column 2 — Automatic Thought: What went through your mind right then? Rate belief 0-100%.
Column 3 — Emotion: What did you feel? Rate intensity 0-100%.
Column 4 — Evidence & Alternative: What evidence supports the automatic thought? What contradicts it? What's a more balanced perspective?
Column 5 — Outcome: Re-rate belief in the automatic thought (0-100%). Rate the emotion now (0-100%).

Key cognitive distortions to look for:
- All-or-nothing thinking: seeing things in black-and-white categories
- Catastrophizing: assuming the worst possible outcome
- Mind reading: assuming you know what others are thinking
- Emotional reasoning: believing something is true because it "feels" true
- Overgeneralization: taking one event as proof of a universal pattern
- Should statements: rigid rules about how things "should" be
- Labeling: attaching global labels to yourself or others

Therapist stance: Collaborative empiricism. Guide the user to examine their own evidence rather than telling them their thought is wrong.`,
  },
  {
    id: "cbt-behavioral-activation",
    modality: "CBT",
    category: "behavioral_activation",
    title: "Behavioral Activation for Depression",
    tags: ["depression", "behavioral activation", "activity scheduling", "anhedonia"],
    source: "Martell et al., Behavioral Activation for Depression (2010); mhGAP-IG v3",
    summary: "Use structured activity scheduling to break the depression-avoidance cycle.",
    content: `BEHAVIORAL ACTIVATION — DEPRESSION INTERVENTION

Core principle: Depression thrives on avoidance and withdrawal. Action precedes motivation, not the other way around.

Protocol steps:
1. TRACK: Ask the user to rate their mood daily and log activities for 1 week. This establishes baseline.
2. IDENTIFY VALUES: What matters to them? (Relationships, work, health, creativity, etc.)
3. SCHEDULE ACTIVITIES: Start with the smallest possible action (e.g., "stand outside for 60 seconds"). 
   - Use a hierarchy: Mastery (sense of achievement) + Pleasure (enjoyment).
   - Rate each activity 0-10 on both scales.
4. TROUBLESHOOT: If they didn't do it, no judgment — what got in the way? (Too hard, forgot, avoided?) Adjust.
5. GRADUATE: Gradually increase difficulty and duration.

Key insight from the literature: Even completing a very small activity improves self-efficacy more than waiting for motivation to return. The "5-minute rule" — commit to doing something for just 5 minutes — is highly effective for overcoming task paralysis.

Clinical note: Monitor for hopelessness preventing engagement. If the user says "nothing will help," validate the feeling first before challenging.`,
  },
  {
    id: "cbt-panic-hierarchy",
    modality: "CBT",
    category: "anxiety",
    title: "Panic & Anxiety — Exposure Hierarchy",
    tags: ["panic", "anxiety", "exposure", "CBT", "hierarchy", "avoidance"],
    source: "Barlow & Craske, Mastery of Your Anxiety and Panic (2007); mhGAP-IG v3 Anxiety Module",
    summary: "Build and work through a graded exposure hierarchy for panic and anxiety triggers.",
    content: `PANIC DISORDER — EXPOSURE HIERARCHY PROTOCOL

Panic attacks are false alarms. The body's fight-or-flight system activates without real danger. Treatment involves:

1. PSYCHOEDUCATION: Panic is not dangerous — it's uncomfortable but self-limiting. Panic attacks typically peak at 10 minutes and resolve within 20-30 minutes.

2. SENSATION INDUCTION (Interoceptive Exposure):
   - Spinning (30s) → dizziness/lightheadedness
   - Hyperventilation (60s) → breathlessness, tingling
   - Breathing through a straw → suffocation sensation
   - Jogging in place (60s) → racing heart

3. SITUATIONAL EXPOSURE HIERARCHY:
   Build a hierarchy from 0-100 (least to most feared). Example:
   - 20: Thinking about a panic attack
   - 40: Driving 5 minutes from home
   - 60: Going to a grocery store alone
   - 80: Taking public transit
   - 100: Being in an enclosed space for 30+ minutes

4. RESPONSE PREVENTION: Do NOT use safety behaviors (always having water, sitting near exits, having a phone ready). The goal is to learn that the catastrophe doesn't happen.

5. BREATHING RETRAINING: 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) activates the parasympathetic nervous system.

Crisis handling: During an active panic attack, use grounding (5-4-3-2-1 senses) before any cognitive work. The rational brain is offline during a panic attack.`,
  },

  // ── ACT: Acceptance & Commitment Therapy ──────────────────────────────
  {
    id: "act-defusion",
    modality: "ACT",
    category: "cognitive_defusion",
    title: "ACT — Cognitive Defusion Exercises",
    tags: ["ACT", "defusion", "intrusive thoughts", "acceptance", "observing self"],
    source: "Hayes et al., Acceptance and Commitment Therapy (2011); ACT-FM fidelity instrument",
    summary: "Techniques to observe thoughts without being controlled by them.",
    content: `ACCEPTANCE AND COMMITMENT THERAPY — COGNITIVE DEFUSION

Core principle: Thoughts are mental events, not commands. Fusion = getting caught up in the content of thoughts. Defusion = stepping back and observing thoughts as ongoing processes.

Key defusion techniques:

1. "LEAVES ON A STREAM": Imagine placing each thought on a leaf floating down a stream. Watch it appear, float by, and disappear. Don't grab the leaf. Don't push it away.

2. "THANK YOUR MIND": When a distressing thought appears, say "Thank you, mind, for that story" or "Interesting — my mind is doing that thing again."

3. "THE THOUGHT LABELING": Prefix the thought with "I'm having the thought that..." (e.g., "I'm having the thought that I'm worthless" instead of "I'm worthless").

4. "TRAIN OF THOUGHTS": Imagine sitting at a station. Thoughts are trains pulling in and out. You can watch them come and go without having to board any of them.

5. "PHYSICALIZE THE THOUGHT": Give the thought a shape, color, texture, weight. Describe it as an object. What happens to its power when you do this?

Key insight: The goal is NOT to stop or change the thought. The goal is to change your relationship with the thought. Resistance amplifies. Acceptance reduces.

The "observer self" is distinct from the "thinking self." You are the sky, not the weather.`,
  },
  {
    id: "act-values",
    modality: "ACT",
    category: "values_clarification",
    title: "ACT — Values Clarification & Committed Action",
    tags: ["ACT", "values", "committed action", "meaning", "existential"],
    source: "Hayes et al., ACT (2011); Wilson & DuFrene, Mindfulness for Two",
    summary: "Clarify personal values and commit to values-aligned action.",
    content: `ACCEPTANCE AND COMMITMENT THERAPY — VALUES & COMMITTED ACTION

Values are chosen qualities of being and doing. Unlike goals (which can be completed), values are ongoing directions.

Domain prompts:
- RELATIONSHIPS: What kind of partner, friend, family member do you want to be?
- WORK/EDUCATION: What does meaningful contribution look like for you?
- HEALTH: How do you want to care for your body and mind?
- LEISURE: What restores you? What absorbs you?
- COMMUNITY: What do you want to give back?
- GROWTH: What kind of person are you becoming?

Committed action is the behavioral counterpart to values. It means:
1. Choose a value domain
2. Set a specific, achievable action that moves toward that value
3. Anticipate barriers (internal: "I'll feel anxious" — external: "I'll be busy")
4. Commit to the action with a specific time and place
5. When barriers arise, defuse and recommit (not "I failed" but "I got hooked")

Key distinction: Values ≠ Feelings. You can act on your values even when you don't "feel like it." Depression says "I don't care" — but a value is something you choose, not something you feel.`,
  },

  // ── mhGAP: WHO guidelines ────────────────────────────────────────────
  {
    id: "mhgap-depression",
    modality: "mhGAP",
    category: "depression",
    title: "mhGAP-IG v3 — Depression Management",
    tags: ["mhGAP", "depression", "WHO", "assessment", "management"],
    source: "WHO mhGAP Intervention Guide v3 (2023), Depression Module",
    summary: "WHO evidence-based guidelines for depression assessment and psychosocial interventions.",
    content: `WHO mhGAP INTERVENTION GUIDE v3 — DEPRESSION

Assessment: For someone presenting with depressed mood, loss of interest, low energy, poor concentration, sleep/appetite changes, or feelings of worthlessness lasting ≥2 weeks.

RED FLAGS requiring immediate referral:
- Active suicidal plan or intent (C-SSRS Level 4-5)
- Psychotic symptoms (mood-incongruent delusions, command hallucinations)
- Severe self-neglect (not eating/drinking for days)

Psychosocial interventions (mhGAP-endorsed):
1. PSYCHOEDUCATION: Depression is a medical condition, not a personal failure. Explain treatment options. Address stigma.
2. BEHAVIORAL ACTIVATION: Support the person to gradually increase activity levels. Start with simple, achievable tasks.
3. PROBLEM-SOLVING THERAPY: Structured 6-step approach (define problem, brainstorm solutions, evaluate, choose, implement, review).
4. COGNITIVE RESTRUCTURING: Identify negative automatic thoughts. Examine evidence. Develop balanced alternatives.

Digital intervention note (mhGAP v3 update): Digital tools can support depression management as an adjunct to care, not a replacement. They are most effective when structured, evidence-based, and include human support or escalation paths.

When to refer: No improvement after 4-6 weeks of psychosocial intervention, suicidal risk, psychotic features, bipolar features, or substance use comorbidity.`,
  },
  {
    id: "mhgap-anxiety",
    modality: "mhGAP",
    category: "anxiety",
    title: "mhGAP-IG v3 — Anxiety Management",
    tags: ["mhGAP", "anxiety", "panic", "WHO", "assessment", "management"],
    source: "WHO mhGAP Intervention Guide v3 (2023), Anxiety Module",
    summary: "WHO evidence-based guidelines for anxiety and panic disorder assessment and intervention.",
    content: `WHO mhGAP INTERVENTION GUIDE v3 — ANXIETY DISORDERS

Assessment: Excessive anxiety and worry most days for ≥2 weeks (generalized anxiety), unexpected panic attacks (panic disorder), or avoidance of social situations (social anxiety).

Evidence-based interventions (mhGAP-endorsed):
1. PSYCHOEDUCATION: Anxiety is a normal response that has become excessive. The body's "false alarm" system is overly sensitive. Simple explanation of the fight-flight-freeze response.
2. BREATHING RETRAINING: Slow breathing (4-7-8 pattern) stimulates the vagus nerve and activates parasympathetic response.
3. GRADED EXPOSURE: Build a fear hierarchy and work through it systematically. Avoidance maintains anxiety — exposure reduces it.
4. COGNITIVE RESTRUCTURING: Identify catastrophic misinterpretations of bodily sensations ("I'm having a heart attack" → "This is a panic attack. It's uncomfortable but not dangerous.").

Panic attack protocol:
1. Ground: 5-4-3-2-1 senses (name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste)
2. Breathe: 4-7-8 breathing for 3-5 cycles
3. Reframe: "This is a false alarm. My body is reacting to perceived threat, not actual danger. It will pass."
4. Continue: Don't leave the situation until the panic subsides — leaving reinforces the fear.

For young people (age 13-17): Involve caregivers where safe. Behavioral therapy is first-line. Medication is second-line.`,
  },
  {
    id: "mhgap-psychosis",
    modality: "mhGAP",
    category: "psychosis",
    title: "mhGAP-IG v3 — Psychosis Management",
    tags: ["mhGAP", "psychosis", "schizophrenia", "delusions", "hallucinations"],
    source: "WHO mhGAP Intervention Guide v3 (2023), Psychosis Module",
    summary: "WHO guidelines for psychosis assessment — delusions, hallucinations, and reality-testing concerns.",
    content: `WHO mhGAP INTERVENTION GUIDE v3 — PSYCHOSIS

Assessment: Delusions (fixed false beliefs), hallucinations (sensory experiences without stimulus), disorganized thinking/speech, negative symptoms (social withdrawal, flat affect, apathy).

Digital intervention considerations (mhGAP v3): For psychosis, digital tools should NOT attempt to challenge delusional beliefs directly. The role is:
- Reality testing through gentle Socratic questioning
- Offering grounding techniques
- Encouraging professional help-seeking
- Monitoring for deterioration

Approach:
1. DO NOT directly challenge delusions ("That's not real"). This damages rapport and can reinforce the delusional belief.
2. DO express uncertainty about the user's experience while maintaining connection. "I can't fully understand what you're experiencing, but I'm here with you."
3. DO offer grounding: "What do you see/hear/feel in this room right now?"
4. DO gently reality-test: "Is there any other way to understand what's happening?"
5. DO encourage professional evaluation: "A psychiatrist would be able to help make sense of what you're experiencing."

RED FLAGS: Command hallucinations telling the person to harm themselves or others, disorganized behavior that puts the person at risk, severe paranoia preventing basic self-care, rapid deterioration. These require immediate professional referral.`,
  },
  {
    id: "mhgap-substance",
    modality: "mhGAP",
    category: "substance_use",
    title: "mhGAP-IG v3 — Hazardous Alcohol & Substance Use",
    tags: ["mhGAP", "substance", "alcohol", "addiction", "harm reduction"],
    source: "WHO mhGAP Intervention Guide v3 (2023), Substance Use Module",
    summary: "WHO guidelines for brief intervention and management of hazardous substance use.",
    content: `WHO mhGAP INTERVENTION GUIDE v3 — SUBSTANCE USE

Assessment: Quantity and frequency of use, dependence symptoms (tolerance, withdrawal, loss of control, neglect of activities), risky behaviors (driving under influence), and motivation to change.

Digital intervention scope (mhGAP v3): Digital tools for hazardous alcohol use should be framed as extending access but NOT replacing other interventions.

Brief intervention protocol (FRAMES):
1. FEEDBACK: Give objective feedback about their use (without judgment). "You mentioned drinking a bottle of wine most nights."
2. RESPONSIBILITY: Emphasize personal responsibility for change. "Only you can decide what's right for you."
3. ADVICE: Give clear advice to reduce or stop use. "Cutting back to 2-3 nights per week would significantly reduce health risks."
4. MENU: Offer options. "There are different ways to approach this. Which feels right to you?"
5. EMPATHY: Respond with warmth and understanding, not confrontation.
6. SELF-EFFICACY: Support their confidence in making a change.

RED FLAGS: Severe withdrawal symptoms (seizures, confusion, hallucinations — DT risk), overdose risk, acute intoxication requiring medical attention, suicidal ideation with substance use (highly dangerous combination). These require immediate medical referral.`,
  },

  // ── Crisis Intervention ──────────────────────────────────────────────
  {
    id: "crisis-c-ssrs",
    modality: "crisis_intervention",
    category: "suicide_risk",
    title: "C-SSRS — Columbia-Suicide Severity Rating Scale",
    tags: ["C-SSRS", "suicide", "risk assessment", "suicidal ideation", "crisis"],
    source: "Columbia Lighthouse Project; Posner et al., Am J Psychiatry (2011)",
    summary: "Validated framework for stratifying suicide risk into ideation and behavior categories.",
    content: `COLUMBIA-SUICIDE SEVERITY RATING SCALE (C-SSRS) — RISK STRATIFICATION

The C-SSRS separates suicidal ideation from suicidal behavior — they are distinct predictive factors.

SUICIDAL IDEATION (ask about worst point in past month):
1. Wish to be dead — "Have you wished you were dead or wished you could go to sleep and not wake up?"
2. Non-specific active suicidal thoughts — "Have you actually had any thoughts of killing yourself?"
3. Suicidal thoughts with methods — "Have you been thinking about how you might do this?"
4. Suicidal intent without specific plan — "Have you had these thoughts and had some intention of acting on them?"
5. Suicidal intent with specific plan — "Have you started to work out the details of how to kill yourself? Do you intend to carry out this plan?"

SUICIDAL BEHAVIOR:
- Actual attempt — potentially self-injurious act with some intent to die
- Interrupted attempt — person is interrupted by outside circumstance
- Aborted attempt — person begins but stops themselves
- Preparatory acts — preparing to die (writing notes, giving away possessions)
- Non-suicidal self-injury — self-harm without intent to die

RISK STRATIFICATION:
- Low (Levels 1-2, no behavior): Provide resources, encourage professional help
- Moderate (Levels 2-3, or preparatory acts): Refer for mental health evaluation, create safety plan
- High (Levels 4-5, or any attempt in past 3 months): Immediate mental health evaluation, crisis services
- Imminent (Current Level 4-5 with intent): Emergency services, do not leave person alone

Digital environment limitations: Do NOT attempt to assess C-SSRS questions conversationally through the LLM when risk is detected. Instead, escalate to human services. The C-SSRS framework informs the classifier's risk categories only.`,
  },
  {
    id: "crisis-safety-planning",
    modality: "crisis_intervention",
    category: "safety_planning",
    title: "Stanley & Brown — Safety Planning Intervention",
    tags: ["safety plan", "crisis", "suicide prevention", "coping", "resources"],
    source: "Stanley & Brown, Safety Planning Intervention (2012); VA/DoD Clinical Practice Guidelines",
    summary: "Structured 6-step safety plan for suicide risk management.",
    content: `SAFETY PLANNING INTERVENTION — STANLEY & BROWN (2012)

A safety plan is a prioritized list of coping strategies and resources for use during a suicidal crisis. It is NOT a no-suicide contract (which has no evidence base).

6-STEP SAFETY PLAN:

Step 1 — Warning Signs: "What signs tell you a crisis is developing?"
(e.g., "Isolating, not sleeping, drinking, thinking about death")

Step 2 — Internal Coping Strategies: "What can you do on your own to distract from suicidal thoughts?"
(e.g., "Deep breathing, going for a walk, playing guitar, watching a specific show")

Step 3 — Social Contacts as Distraction: "Who can you reach out to for a positive distraction?"
(e.g., "Call my sister, text my friend, go to the gym with my roommate")

Step 4 — Social Contacts for Crisis Support: "Who can you contact if you need help?"
(e.g., "My therapist, my sponsor, my partner")

Step 5 — Professional Resources: Crisis hotlines and emergency contacts.
(e.g., "988 Suicide & Crisis Lifeline, 116 123 Samaritans")

Step 6 — Lethal Means Safety: "Let's make the environment safer."
(e.g., "Give medications to a trusted person, remove firearms from the home")

In a digital context: Steps 1-4 can be explored conversationally when risk is moderate. Steps 5-6 are resources — the digital tool provides the numbers and encourages means safety but cannot directly intervene.`,
  },

  // ── Mindfulness ──────────────────────────────────────────────────────
  {
    id: "mindfulness-grounding",
    modality: "mindfulness",
    category: "grounding",
    title: "5-4-3-2-1 Sensory Grounding",
    tags: ["grounding", "panic", "anxiety", "sensory", "dissociation", "present moment"],
    source: "Linehan, DBT Skills Training Manual (2015); mhGAP-IG v3",
    summary: "Sensory grounding technique using 5-4-3-2-1 to anchor in the present moment.",
    content: `SENSORY GROUNDING — 5-4-3-2-1 TECHNIQUE

Used for: Panic attacks, dissociation, flashbacks, overwhelming emotions, racing thoughts.

The technique uses sensory input to anchor the person in the present moment, engaging the prefrontal cortex and calming the amygdala.

Steps (do each out loud or in your mind):
- 5 things you can SEE: Look around and name 5 things you can see. (e.g., "a blue lamp, a crack in the ceiling, my hands, a glass of water, a book")
- 4 things you can TOUCH: Notice 4 things you can physically feel. (e.g., "the fabric of my chair, the floor under my feet, the air on my skin, the edge of my phone")
- 3 things you can HEAR: Listen for 3 distinct sounds. (e.g., "a car outside, the hum of the fridge, my own breathing")
- 2 things you can SMELL: Notice 2 scents in your environment. (e.g., "coffee, the air after rain")
- 1 thing you can TASTE: Notice 1 taste. (e.g., "the taste of water, the last thing I ate")

Why it works: The task requires enough cognitive effort to shift attention away from the internal distress signal but is simple enough to do during high arousal. It also connects the person to their immediate environment, providing evidence that they are here, safe, and not in the threatened scenario their brain is generating.

Alternative: If the person can't access all senses (e.g., can't smell anything), focus on just one sense in detail — "Name 10 things you can see."`,
  },
  {
    id: "mindfulness-internal-coping",
    modality: "mindfulness",
    category: "emotional_regulation",
    title: "DBT-Based Distress Tolerance / TIPP Skills",
    tags: ["DBT", "distress tolerance", "emotional regulation", "crisis survival", "TIPP"],
    source: "Linehan, DBT Skills Training Manual (2015)",
    summary: "DBT TIPP skills for rapidly reducing emotional arousal during acute distress.",
    content: `DIALECTICAL BEHAVIOR THERAPY — TIPP SKILLS (Distress Tolerance)

Use when emotional arousal is too high to use other skills (8-10 on a 10-point distress scale).

T — Temperature: Change your body temperature with cold water. Splash cold water on your face, hold an ice cube, or (safely) take a cold shower. This activates the "mammalian dive reflex" — it slows your heart rate and calms your nervous system.
I — Intense Exercise: Do 20 jumping jacks, sprint for 30 seconds, or do wall push-ups. Intense exercise burns off adrenaline.
P — Paced Breathing: Exhale longer than you inhale. Breathe in for 4 counts, out for 6-8 counts. Slow breathing signals safety to your nervous system.
P — Paired Muscle Relaxation: Tense each muscle group for 5 seconds, then relax. Work from toes to forehead.

The goal of TIPP is to bring arousal down from 8-10 to a 5-6 so that other skills (cognitive, interpersonal) become accessible again.

When NOT to use TIPP: Physical health conditions affecting heart rate, blood pressure, or breathing (consult a doctor first).`,
  },

  // ── IPT: Interpersonal Therapy ───────────────────────────────────────
  {
    id: "ipt-interpersonal",
    modality: "IPT",
    category: "interpersonal_disputes",
    title: "IPT — Interpersonal Problem Areas",
    tags: ["IPT", "interpersonal", "grief", "role dispute", "role transition", "relationships"],
    source: "Weissman et al., Comprehensive Guide to IPT (2000); mhGAP-IG v3",
    summary: "IPT framework for understanding depression through four interpersonal problem areas.",
    content: `INTERPERSONAL THERAPY (IPT) — FOUR PROBLEM AREAS

IPT is based on the principle that depression occurs in an interpersonal context. Treatment focuses on one of four problem areas:

1. GRIEF (Complicated Bereavement): The loss of a significant person. Treatment: Facilitate mourning, help re-establish relationships and interests.

2. ROLE DISPUTES: Conflicts with a significant other (partner, family, work). Treatment: Identify the dispute, explore options, renegotiate expectations.

3. ROLE TRANSITION: Life changes (divorce, job loss, retirement, graduation). Treatment: Accept the loss of the old role, develop mastery of the new role.

4. INTERPERSONAL DEFICITS: Social isolation or chronically difficult relationships. Treatment: Build social skills, reduce social anxiety, increase social contacts.

Digital application: In a self-guided tool, the role of the AI is not to conduct IPT but to help the user identify which interpersonal area feels most relevant and offer structured reflection prompts. The four areas can help contextualize depression triggers.

Important boundary: IPT is a time-limited (12-16 session) therapy conducted by trained clinicians. Digital self-guided reflection on interpersonal themes is appropriate; delivering IPT protocol is not.`,
  },
];
