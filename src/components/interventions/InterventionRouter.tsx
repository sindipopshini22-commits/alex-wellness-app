"use client";
import PanicCard from "./PanicCard";
import DepressionCard from "./DepressionCard";
import DefusionCanvas from "./DefusionCanvas";
import MacroZoomCard from "./MacroZoomCard";
import IntrusiveThoughtsCard from "./IntrusiveThoughtsCard";

export default function InterventionRouter({ subType, rawText }: { subType: string; rawText?: string }) {
  switch (subType) {
    case "PANIC_SOS_CARD": return <PanicCard />;
    case "DEPRESSION_MICRO_WIN": return <DepressionCard />;
    case "THOUGHT_DEFUSION_CANVAS": return <DefusionCanvas thought={rawText ?? "this thought"} />;
    case "INTRUSIVE_THOUGHTS_RELEASE": return <IntrusiveThoughtsCard />;
    case "MACRO_TO_MICRO_ZOOM": return <MacroZoomCard />;
    default: return null;
  }
}
