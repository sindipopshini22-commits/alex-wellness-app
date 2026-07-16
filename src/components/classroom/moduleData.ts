// Alex — Classroom module data.
// Replaced quizzes with evidence-based lecture articles and a First Aid Kit
// containing short interactive exercises for acute episodes.

export type LectureArticle = {
  title: string;
  source: string;
  sourceUrl: string;
  sections: { heading: string; body: string }[];
};

export type FirstAidExercise = {
  id: string;
  title: string;
  subtitle: string;
  steps: { instruction: string; duration?: number }[];
  color: string; // tailwind accent color
};

export const LECTURES: LectureArticle[] = [
  {
    title: "Anxiety, Fear & Panic",
    source: "NHS",
    sourceUrl:
      "https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anxiety-fear-panic/",
    sections: [
      {
        heading: "What is Anxiety?",
        body: "Anxiety is a common, natural response to pressure, danger, or feeling threatened. While some anxiety can help us focus or stay alert, it becomes a problem when it is intense, overwhelming, or persists for long periods, interfering with your daily life, relationships, and physical well-being."
      },
      {
        heading: "Physical Symptoms",
        body: "Racing or irregular heartbeat, chest pains, light-headedness, shortness of breath, nausea, sweating, shaking, headaches, or muscle pain. Your body is preparing to fight or flee — even when there is no real danger."
      },
      {
        heading: "Mental Symptoms",
        body: "Feeling tense, nervous, or unable to relax; constant worrying about the past or future; difficulty concentrating; obsessive thoughts; struggling with sleep."
      },
      {
        heading: "Panic Attacks",
        body: "A panic attack is a sudden surge of intense anxiety and fear. Symptoms include racing heart, feeling faint, sweating, trembling, shortness of breath, tingling in fingers or lips, and a feeling of losing control. Panic attacks are not dangerous — they typically last between 5 and 20 minutes."
      },
      {
        heading: "Common Causes",
        body: "Life events (work pressure, unemployment, financial problems), personal circumstances (relationship difficulties, bereavement), past experiences (bullying, abuse), and biological factors (stress hormones like adrenaline and cortisol)."
      },
      {
        heading: "Self-Help Strategies",
        body: "Regular exercise, breathing exercises, meditation, and mindfulness. Face fears gradually — avoidance makes anxiety worse. Try \"Worry Time\": set a specific 15-minute window each day for concerns. Keep a diary to identify patterns and triggers."
      },
      {
        heading: "When to Seek Help",
        body: "If self-help isn't working or anxiety is impacting daily life, speak to a GP. In England you can self-refer to NHS talking therapy services (like CBT) without a GP referral. In crisis, call 988 (US) or 116 123 (UK Samaritans)."
      }
    ]
  },
  {
    title: "ADHD — The Three Types",
    source: "Healthline",
    sourceUrl: "https://www.healthline.com/health/adhd/three-types-adhd",
    sections: [
      {
        heading: "What is ADHD?",
        body: "ADHD is a chronic neurodevelopmental condition affecting emotions, behaviors, and the ability to learn. It is categorized into three distinct types based on the primary symptoms exhibited. The type can change over time as symptoms evolve."
      },
      {
        heading: "Predominantly Inattentive",
        body: "Difficulty staying concentrated, organized, and focused. Becoming easily distracted, losing track of details, difficulty organizing tasks, frequently losing essential items, appearing to daydream, and struggling to follow instructions."
      },
      {
        heading: "Predominantly Hyperactive-Impulsive",
        body: "Persistent restlessness and impulsivity. Fidgeting, inability to sit still, constantly talking or feeling the need to be \"on the go,\" interrupting others, acting without considering consequences, and difficulty engaging in quiet activities."
      },
      {
        heading: "Combined Type",
        body: "A mix of both inattentive and hyperactive-impulsive symptoms. This is the most commonly diagnosed type, particularly in children."
      },
      {
        heading: "Root Cause",
        body: "ADHD involves lower baseline dopamine — a neurotransmitter that helps send signals between nerves, affecting movement, emotion, and attention. It is a structural neurological difference, not a willpower problem."
      },
      {
        heading: "Treatment Approaches",
        body: "Behavioral therapy (first line for children under 6), medication (stimulants like methylphenidate are most common and highly effective), lifestyle adjustments (exercise, sleep, mindfulness), and educational/work accommodations (extra time, structured routines)."
      }
    ]
  },
  {
    title: "OCD — The Doubt Loop",
    source: "NIMH / IOCDF / Cleveland Clinic",
    sourceUrl: "https://www.nimh.nih.gov/health/publications/obsessive-compulsive-disorder-when-unwanted-thoughts-or-repetitive-behaviors-take-over",
    sections: [
      {
        heading: "What is OCD?",
        body: "OCD is a chronic mental health condition characterized by uncontrollable, recurring thoughts (obsessions) and repetitive behaviors or mental rituals (compulsions). It is often called a \"silent struggle\" because symptoms are internal, highly stigmatized, and misunderstood."
      },
      {
        heading: "Obsessions",
        body: "Persistent, intrusive, and distressing thoughts, images, or urges. Common themes include contamination fears, harm intrusions, symmetry/order needs, forbidden/taboo thoughts, and persistent doubt or responsibility fears."
      },
      {
        heading: "Compulsions",
        body: "Repetitive behaviors performed to relieve the anxiety caused by obsessions. They provide only temporary relief. Common rituals include excessive handwashing, checking locks/stoves, counting, mental repetitions, and precise ordering."
      },
      {
        heading: "The Cycle",
        body: "Your brain flags a passing thought as dangerous, then demands a ritual to neutralize it. The ritual works for ten seconds, and the loop restarts. In OCD, these symptoms are time-consuming (often over one hour daily), uncontrollable, and significantly interfere with daily functioning."
      },
      {
        heading: "Causes",
        body: "A combination of biological factors (differences in brain chemistry, especially serotonin), genetics (OCD runs in families), and environmental triggers (childhood trauma or significant life stress)."
      },
      {
        heading: "Exposure & Response Prevention (ERP)",
        body: "The gold standard treatment. Sit with the uncertainty. Don't perform the ritual. The anxiety peaks and then drops. You teach your brain that the catastrophe never actually arrived. Combined with SSRIs, ERP gives the best outcomes."
      },
      {
        heading: "Breaking the Silence",
        body: "Education is the primary tool for change. When society stops using \"OCD\" as a casual adjective for being tidy, it creates space for those truly suffering to seek professional, compassionate treatment without shame."
      }
    ]
  },
  {
    title: "Depression — The Concealed Trap",
    source: "NHS / Clinical Literature",
    sourceUrl: "https://www.nhs.uk/mental-health/conditions/depression-in-adults/overview/",
    sections: [
      {
        heading: "What Depression Actually Looks Like",
        body: "Concealed depression often doesn't look like crying in bed. It shows up as hyper-productivity, emotional withdrawal behind high performance, or absolute numbness. It's an energy-saving defense your brain uses when it's completely overwhelmed."
      },
      {
        heading: "Core Symptoms",
        body: "Persistent low mood, loss of interest or pleasure (anhedonia), changes in appetite or weight, sleep disturbances (insomnia or hypersomnia), fatigue, feelings of worthlessness, difficulty concentrating, and recurrent thoughts of death."
      },
      {
        heading: "The Biological Reality",
        body: "Depression involves changes in brain chemistry (serotonin, norepinephrine, dopamine), brain structure (reduced hippocampal volume), and the stress response system (HPA axis dysregulation). It is a medical condition, not a character flaw."
      },
      {
        heading: "Behavioral Activation",
        body: "Depression thrives on inaction. When motivation is gone, waiting for it to return is a trap. The way out is behavioral activation: pick an action that takes less than 60 seconds — like opening a window — to disrupt the cycle. Action precedes motivation, not the other way around."
      },
      {
        heading: "Treatment",
        body: "A combination of psychotherapy (CBT, behavioral activation), medication (SSRIs, SNRIs), lifestyle changes (exercise, sleep hygiene, social connection), and in severe cases, more intensive interventions. Early intervention leads to better outcomes."
      }
    ]
  }
];

export const FIRST_AID_KIT: FirstAidExercise[] = [
  {
    id: "panic-calm",
    title: "Calm a Panic Attack",
    subtitle: "5-minute grounding & breathing exercise",
    color: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30",
    steps: [
      { instruction: "Plant both feet flat on the floor. Press them down hard. Notice the ground beneath you.", duration: 10 },
      { instruction: "Breathe in slowly through your nose for 4 seconds.", duration: 4 },
      { instruction: "Hold your breath gently for 4 seconds.", duration: 4 },
      { instruction: "Exhale slowly through your mouth for 6 seconds. Let your shoulders drop.", duration: 6 },
      { instruction: "Repeat the 4-4-6 breathing cycle.", duration: 30 },
      { instruction: "Name 5 things you can see right now. Say them out loud.", duration: 15 },
      { instruction: "Name 4 things you can touch. Touch them.", duration: 15 },
      { instruction: "Name 3 things you can hear.", duration: 10 },
      { instruction: "Place a hand on your chest. Feel your heartbeat slowing down.", duration: 15 },
      { instruction: "You are safe. This will pass. The peak has already happened.", duration: 10 }
    ]
  },
  {
    id: "existential-crisis",
    title: "Navigate Existential Crisis",
    subtitle: "Re-anchor when everything feels meaningless",
    color: "from-purple-500/20 to-violet-500/20 border-violet-500/30",
    steps: [
      { instruction: "Stop. Acknowledge the feeling: \"I'm having an existential moment. That's okay.\"", duration: 10 },
      { instruction: "Place both hands in cold water or hold an ice cube. Let the physical sensation pull you back.", duration: 20 },
      { instruction: "Write down one small thing that matters to you right now — even if it's just \"coffee\" or \"my cat\".", duration: 30 },
      { instruction: "Ask yourself: \"What would I do in the next 10 minutes if meaning existed?\" Do that thing.", duration: 30 },
      { instruction: "Move your body. Walk to another room. Go outside. Change your physical state.", duration: 60 },
      { instruction: "Call someone you trust. You don't have to explain. Just hear a human voice.", duration: 60 },
      { instruction: "Remember: The question itself proves you care about meaning. That's not emptiness — it's depth.", duration: 15 }
    ]
  },
  {
    id: "depression-episode",
    title: "Get Through a Depressive Episode",
    subtitle: "Micro-actions to break the freeze",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    steps: [
      { instruction: "Name what you're feeling. \"I'm in a depressive freeze right now.\" No judgment.", duration: 10 },
      { instruction: "Set a timer for 2 minutes. Do nothing else until it goes off. Just breathe.", duration: 120 },
      { instruction: "Do ONE thing that takes less than 30 seconds: open a window, splash water on your face, stand up.", duration: 30 },
      { instruction: "Put on shoes. You don't have to go anywhere — just put them on.", duration: 15 },
      { instruction: "Step outside for 60 seconds. Feel air on your skin. You are a body in the world.", duration: 60 },
      { instruction: "Text someone: \"Hey, thinking of you.\" You don't need to explain anything.", duration: 30 },
      { instruction: "Write down one thing you did today, no matter how small. \"I got out of bed.\" That counts.", duration: 20 },
      { instruction: "Action precedes motivation. You don't need to feel like it. You just need to start.", duration: 10 }
    ]
  },
  {
    id: "adhd-episode",
    title: "Handle an ADHD Episode",
    subtitle: "Break task paralysis & reclaim focus",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    steps: [
      { instruction: "Recognize the freeze: \"My brain is overwhelmed. This is dopamine, not laziness.\"", duration: 10 },
      { instruction: "Pick ONE task. Not the biggest one — the smallest, easiest one.", duration: 15 },
      { instruction: "Set a timer for 5 minutes. Tell yourself: \"I only have to do this for 5 minutes.\"", duration: 15 },
      { instruction: "Remove friction: close all tabs except the one you need. Put your phone in another room.", duration: 30 },
      { instruction: "Body double: work alongside someone (even virtually). The social presence helps regulate focus.", duration: 60 },
      { instruction: "Move for 2 minutes: jumping jacks, walk around, stretch. Reset your dopamine baseline.", duration: 120 },
      { instruction: "Use the \"2-minute rule\": if something takes less than 2 minutes, do it now. Build momentum.", duration: 30 },
      { instruction: "Externalize your memory: write the next step on a sticky note and put it where you'll see it.", duration: 20 }
    ]
  },
  {
    id: "ocd-episode",
    title: "Manage an OCD Spike",
    subtitle: "Resist the urge to ritualize",
    color: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
    steps: [
      { instruction: "Name it: \"This is an OCD spike. It feels real, but it's a false alarm.\"", duration: 10 },
      { instruction: "Rate the anxiety from 1-10. Write it down. You'll check again in 10 minutes.", duration: 15 },
      { instruction: "Do NOT perform the ritual. Sit with the discomfort. This is Exposure & Response Prevention.", duration: 30 },
      { instruction: "Breathe slowly. The anxiety will peak and then drop on its own — it always does.", duration: 60 },
      { instruction: "Redirect your attention: engage in something absorbing (music, a game, a conversation).", duration: 120 },
      { instruction: "Check the anxiety rating again. Notice: it went down without the ritual.", duration: 15 },
      { instruction: "Repeat the mantra: \"I don't need certainty. I can handle uncertainty.\"", duration: 15 },
      { instruction: "You just taught your brain that the catastrophe never arrives. That's how you break the loop.", duration: 10 }
    ]
  }
];
