"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FirstAidExercise } from "./moduleData";

export default function FirstAidKit({ exercise }: { exercise: FirstAidExercise }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = exercise.steps[currentStep];
  const isLast = currentStep === exercise.steps.length - 1;
  const totalDuration = exercise.steps.reduce((a, s) => a + (s.duration ?? 10), 0);

  useEffect(() => {
    if (isRunning && step?.duration) {
      setTimer(step.duration);
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentStep]);

  function startStep() {
    setIsRunning(true);
    setTimer(step?.duration ?? 10);
  }

  function nextStep() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    if (isLast) {
      setIsComplete(true);
    } else {
      setCurrentStep((c) => c + 1);
      setTimer(0);
    }
  }

  function prevStep() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentStep((c) => Math.max(0, c - 1));
    setTimer(0);
  }

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => router.push("/classroom?tab=first-aid")}
        className="mb-6 text-xs text-zinc-500 hover:text-zinc-300"
      >
        ← Back to First Aid Kit
      </button>

      <div
        className={`rounded-2xl border bg-gradient-to-br p-8 ${exercise.color}`}
      >
        <div className="mb-2 text-lg font-bold text-zinc-100">{exercise.title}</div>
        <div className="text-xs text-zinc-400">{exercise.subtitle}</div>

        {/* Progress */}
        <div className="mt-6 flex gap-1">
          {exercise.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= currentStep ? "bg-zinc-300" : "bg-zinc-700/50"
              }`}
            />
          ))}
        </div>

        {isComplete ? (
          <div className="mt-10 text-center">
            <div className="text-3xl">✓</div>
            <p className="mt-4 text-sm text-zinc-200">
              You completed the exercise. You&apos;re doing the work.
            </p>
            <button
              onClick={() => router.push("/dashboard?initContext=closure&module=first-aid-kit")}
              className="mt-6 rounded-xl bg-zinc-100 px-6 py-2 text-xs font-semibold text-zinc-950"
            >
              Discuss with Alex
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 min-h-[120px]">
              <p className="text-base leading-relaxed text-zinc-100">{step.instruction}</p>
            </div>

            {/* Timer display */}
            {step.duration && (
              <div className="mt-4 flex items-center gap-3">
                <div className="text-3xl font-mono font-bold text-zinc-200">
                  {timer > 0 ? `${timer}s` : "✓"}
                </div>
                {!isRunning && timer === 0 && (
                  <button
                    onClick={startStep}
                    className="rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    Start Timer
                  </button>
                )}
                {isRunning && (
                  <button
                    onClick={() => {
                      clearInterval(intervalRef.current!);
                      setIsRunning(false);
                    }}
                    className="rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    Pause
                  </button>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                disabled={currentStep === 0}
                onClick={prevStep}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs text-zinc-400 disabled:opacity-30"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="rounded-xl bg-zinc-100 px-6 py-2 text-xs font-semibold text-zinc-950"
              >
                {isLast ? "Finish" : "Next Step"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
