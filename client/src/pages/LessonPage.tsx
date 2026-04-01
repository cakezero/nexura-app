// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Loader2, Trophy } from "lucide-react";
import Confetti from "react-confetti";
import { useAuth } from "../lib/auth";
import { apiRequestV2 } from "../lib/queryClient";
import { useWallet } from "../hooks/use-wallet";

type LessonSummary = {
  _id: string;
  title: string;
  description: string;
  reward: number;
  noOfQuestions: number;
  done: boolean;
};

type MiniLesson = {
  _id: string;
  text: string;
  lesson: string;
};

type LessonQuestion = {
  _id: string;
  question: string;
  options: string[];
  lesson: string;
  done: boolean;
  answer?: string;
};

type LessonStep =
  | { kind: "mini"; key: string; text: string }
  | { kind: "question"; key: string; question: LessonQuestion }
  | { kind: "claim"; key: string };

const normalizeApiMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const getProgressStorageKey = (walletAddress?: string | null) =>
  `learn-progress-${walletAddress?.toLowerCase() || "guest"}`;

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const lessonId = params.id;
  const [location, setLocation] = useLocation();
  const { isConnected, connectWallet, address } = useWallet();
  const { user, loading: authLoading } = useAuth();

  const storageKey = useMemo(() => getProgressStorageKey(address), [address]);
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const isReview = searchParams.get("review") === "1";

  const [lesson, setLesson] = useState<LessonSummary | null>(null);
  const [miniLessons, setMiniLessons] = useState<MiniLesson[]>([]);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, "correct" | "wrong" | null>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [showXPModal, setShowXPModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [didInitStep, setDidInitStep] = useState(false);

  const lessonSteps = useMemo<LessonStep[]>(
    () => [
      ...miniLessons.map((entry) => ({ kind: "mini" as const, key: `mini-${entry._id}`, text: entry.text })),
      ...questions.map((entry) => ({ kind: "question" as const, key: `question-${entry._id}`, question: entry })),
      { kind: "claim" as const, key: "claim" },
    ],
    [miniLessons, questions]
  );

  const activeStep = lessonSteps[currentStep];
  const currentQuestion = activeStep?.kind === "question" ? activeStep.question : null;
  const currentSelection = currentQuestion ? selectedAnswers[currentQuestion._id] ?? currentQuestion.answer ?? "" : "";
  const currentFeedback = currentQuestion ? feedbackByQuestion[currentQuestion._id] : null;
  const completedQuestions = useMemo(() => questions.filter((question) => question.done).length, [questions]);
  const allQuestionsDone = questions.length > 0 && completedQuestions === questions.length;
  const progress = lessonSteps.length ? ((currentStep + 1) / lessonSteps.length) * 100 : 0;
  const currentStepLabel = lessonSteps.length ? `STEP ${currentStep + 1}/${lessonSteps.length}` : "STEP 0/0";

  useEffect(() => {
    const updateSize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const syncLocalProgress = (nextLesson: LessonSummary | null, nextQuestions: LessonQuestion[]) => {
    if (!lessonId) return;

    const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const maxStepIndex = Math.max(nextQuestions.length + miniLessons.length, 0);
    data[lessonId] = {
      ...(data[lessonId] || {}),
      progress: nextLesson?.done ? nextQuestions.length : nextQuestions.filter((entry) => entry.done).length,
      totalQuestions: nextQuestions.length,
      quizCompleted: Boolean(nextLesson?.done),
      claimedReward: Number(nextLesson?.reward || 0),
      stepIndex: Math.min(currentStep, maxStepIndex),
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    window.dispatchEvent(new Event("progress-update"));
  };

  const loadLesson = async () => {
    if (!lessonId) return;

    setLoading(true);
    setPageError("");

    try {
      const [lessonsResponse, detailsResponse] = await Promise.all([
        apiRequestV2("GET", "/api/lesson/get-lessons"),
        apiRequestV2("GET", `/api/lesson/get-lesson-details?id=${lessonId}`),
      ]);

      const lessonMatch =
        (lessonsResponse.lessons || []).find((entry: LessonSummary) => entry._id === lessonId) || null;
      const nextMiniLessons = detailsResponse.miniLessons || [];
      const nextQuestions = detailsResponse.questions || [];
      const nextSelectedAnswers = nextQuestions.reduce((acc: Record<string, string>, entry: LessonQuestion) => {
        acc[entry._id] = entry.answer || "";
        return acc;
      }, {});

      setLesson(lessonMatch);
      setMiniLessons(nextMiniLessons);
      setQuestions(nextQuestions);
      setSelectedAnswers((current) => ({ ...current, ...nextSelectedAnswers }));
      setFeedbackByQuestion((current) => {
        const next = { ...current };
        for (const entry of nextQuestions) {
          if (entry.done) next[entry._id] = "correct";
        }
        return next;
      });
      syncLocalProgress(lessonMatch, nextQuestions);
    } catch (error) {
      setPageError(normalizeApiMessage(error, "Failed to load lesson"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      void loadLesson();
    }
  }, [authLoading, lessonId]);

  useEffect(() => {
    if (!lessonSteps.length || didInitStep) return;

    const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const savedStepIndex = Number(data[lessonId]?.stepIndex || 0);
    const nextIndex = isReview ? 0 : Math.min(Math.max(savedStepIndex, 0), lessonSteps.length - 1);
    setCurrentStep(nextIndex);
    setDidInitStep(true);
  }, [didInitStep, isReview, lessonId, lessonSteps.length, storageKey]);

  useEffect(() => {
    if (!lessonId || !lessonSteps.length) return;
    const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
    data[lessonId] = {
      ...(data[lessonId] || {}),
      stepIndex: currentStep,
      progress: data[lessonId]?.progress || 0,
      totalQuestions: questions.length,
      quizCompleted: Boolean(lesson?.done),
      claimedReward: Number(lesson?.reward || 0),
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [currentStep, lesson?.done, lesson?.reward, lessonId, lessonSteps.length, questions.length, storageKey]);

  useEffect(() => {
    if (!showXPModal) return;
    setShowConfetti(true);
    const timeout = window.setTimeout(() => setShowConfetti(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showXPModal]);

  const ensureReadyForProtectedAction = async () => {
    if (!isConnected) {
      await connectWallet();
      return false;
    }

    if (!user) {
      setActionMessage("Sign in with your wallet before continuing this lesson.");
      return false;
    }

    return true;
  };

  const startLesson = async () => {
    if (!lessonId) return false;

    const canContinue = await ensureReadyForProtectedAction();
    if (!canContinue) return false;

    setStarting(true);
    setActionMessage("");

    try {
      await apiRequestV2("POST", `/api/lesson/start-lesson?lessonId=${lessonId}`);
      return true;
    } catch (error) {
      const message = normalizeApiMessage(error, "Unable to start lesson");
      if (!message.toLowerCase().includes("already started") && !message.toLowerCase().includes("already completed")) {
        setActionMessage(message);
        return false;
      }
      return true;
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !lessonId) return;
    const answer = currentSelection;
    if (!answer) return;

    const started = await startLesson();
    if (!started) return;

    setSubmittingQuestionId(currentQuestion._id);
    setActionMessage("");

    try {
      const response = await apiRequestV2("POST", "/api/lesson/answer-question", {
        question: currentQuestion._id,
        lesson: lessonId,
        answer,
      });

      setFeedbackByQuestion((current) => ({ ...current, [currentQuestion._id]: "correct" }));
      setActionMessage(response.message || "Correct answer saved.");
      await loadLesson();
    } catch (error) {
      const message = normalizeApiMessage(error, "Unable to submit answer");
      setFeedbackByQuestion((current) => ({ ...current, [currentQuestion._id]: "wrong" }));
      setActionMessage(message);
      if (
        message.toLowerCase().includes("wrong answer") ||
        message.toLowerCase().includes("correct answer") ||
        message.toLowerCase().includes("already answered")
      ) {
        await loadLesson();
      }
    } finally {
      setSubmittingQuestionId(null);
    }
  };

  const claimXp = async () => {
    if (!lessonId) return;

    const canContinue = await ensureReadyForProtectedAction();
    if (!canContinue) return;

    setClaiming(true);
    setActionMessage("");

    try {
      const response = await apiRequestV2("POST", `/api/lesson/reward-lesson-xp?id=${lessonId}`);
      setActionMessage(response.message || "XP reward claimed.");
      await loadLesson();
      setShowXPModal(true);
    } catch (error) {
      const message = normalizeApiMessage(error, "Unable to claim XP");
      setActionMessage(message);
      if (message.toLowerCase().includes("already")) {
        await loadLesson();
        setShowXPModal(true);
      }
    } finally {
      setClaiming(false);
    }
  };

  const goPrev = () => {
    if (currentStep <= 0) return;
    setActionMessage("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goNext = async () => {
    if (!activeStep) return;

    if (activeStep.kind === "question") {
      if (!activeStep.question.done) {
        if (!currentSelection) return;
        await submitAnswer();
        return;
      }

      if (currentStep < lessonSteps.length - 1) {
        setActionMessage("");
        setCurrentStep((prev) => Math.min(prev + 1, lessonSteps.length - 1));
      }
      return;
    }

    if (activeStep.kind === "claim") {
      if (!lesson?.done && allQuestionsDone) {
        await claimXp();
      }
      return;
    }

    if (currentStep < lessonSteps.length - 1) {
      setActionMessage("");
      setCurrentStep((prev) => Math.min(prev + 1, lessonSteps.length - 1));
    }
  };

  const resetLessonView = () => {
    setShowXPModal(false);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto max-w-3xl space-y-4">
          <button onClick={() => setLocation("/learn")} className="text-sm text-purple-300 hover:text-white">
            Back to lessons
          </button>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-red-300">{pageError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white space-y-3 flex flex-col items-center px-4 py-6">
      {showConfetti ? (
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={180} recycle={false} />
      ) : null}

      <div className="w-full max-w-3xl space-y-1">
        <button onClick={() => setLocation("/learn")} className="text-sm text-purple-300 hover:text-white">
          Back to lessons
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">Learn</span>
        </div>
      </div>

      <h1 className="w-full max-w-3xl text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
        {lesson?.title || "Lesson"}
      </h1>

      <div className="w-full max-w-3xl mt-1">
        <div className="w-full h-2 rounded-full overflow-hidden bg-white/20">
          <div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #94E2FF, #8A3FFC)",
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-white/60 mt-1">
          <span style={{ color: "#94E2FF" }}>{(lesson?.title || "LESSON").toUpperCase()}</span>
          <span>{currentStepLabel}</span>
        </div>
      </div>

      <div className="w-full max-w-3xl space-y-3">
        <div
          className="relative rounded-2xl min-h-[320px] flex items-center justify-between gap-4 px-2 py-6 sm:p-6 text-center"
          style={{
            background: "linear-gradient(135deg, #8B3EFE, #532598)",
          }}
        >
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="px-2 disabled:opacity-30 transition hover:scale-110"
          >
            <img src="/prev-arrow.png" alt="Previous" className="w-12 h-14 object-contain" />
          </button>

          <div className="flex-1 px-2 pb-12 sm:pb-10">
            {activeStep?.kind === "mini" ? (
              <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">{activeStep.text}</p>
            ) : activeStep?.kind === "question" ? (
              <div className="flex flex-col space-y-4 text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-center">
                  {activeStep.question.question.toUpperCase()}
                </h2>

                <div className="space-y-3">
                  {activeStep.question.options.map((option, index) => {
                    let style =
                      "flex justify-between items-center px-4 py-3 rounded-lg cursor-pointer border bg-[#181C2180]";

                    if (currentSelection === option) {
                      if (activeStep.question.done || currentFeedback === "correct") {
                        style =
                          "flex justify-between items-center px-4 py-3 rounded-lg border bg-[#00E1A233] border-[#00E1A2E5]";
                      } else if (currentFeedback === "wrong") {
                        style =
                          "flex justify-between items-center px-4 py-3 rounded-lg border bg-[#F43F5E33] border-[#F43F5E]";
                      }
                    }

                    return (
                      <div
                        key={`${activeStep.question._id}-${option}`}
                        onClick={() => {
                          if (activeStep.question.done) return;
                          setFeedbackByQuestion((current) => ({ ...current, [activeStep.question._id]: null }));
                          setSelectedAnswers((current) => ({
                            ...current,
                            [activeStep.question._id]: option,
                          }));
                        }}
                        className={style}
                      >
                        <span className="flex items-center gap-2">
                          <span className="bg-[#31353B] px-2 py-1 rounded text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="capitalize">{option}</span>
                        </span>

                        {currentSelection === option && (activeStep.question.done || currentFeedback === "correct") ? (
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#00E1A2] text-black font-bold">
                            ✓
                          </span>
                        ) : null}
                        {currentSelection === option && currentFeedback === "wrong" && !activeStep.question.done ? (
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#F43F5E] text-black font-bold">
                            ✕
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-sm text-white/70 mt-2">
                  Question {questions.findIndex((entry) => entry._id === activeStep.question._id) + 1} of {questions.length}
                </p>
              </div>
            ) : (
              <div className="relative flex flex-col items-center space-y-4 text-center">
                <img src="/nexura-gold.png" className="w-20 h-20 animate-bounce-slow" />
                <h2 className="text-xl sm:text-2xl font-bold">Lesson Completed</h2>
                <p className="text-sm sm:text-base text-white/80 max-w-sm text-center">
                  {allQuestionsDone
                    ? "You have reached the end of this lesson. Claim your XP reward to finish."
                    : "Finish every question to unlock the lesson reward."}
                </p>

                <button
                  onClick={() => void claimXp()}
                  disabled={!allQuestionsDone || claiming || lesson?.done}
                  className={`mt-3 px-5 py-2 rounded-md text-white ${
                    !allQuestionsDone || claiming || lesson?.done
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-[#8B3EFE] hover:bg-[#7A2FE0]"
                  }`}
                >
                  {lesson?.done ? "XP Claimed" : claiming ? "Claiming..." : `Claim +${lesson?.reward ?? 0} XP`}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => void goNext()}
            disabled={
              currentStep >= lessonSteps.length - 1 ||
              (activeStep?.kind === "question" && !activeStep.question.done && !currentSelection) ||
              submittingQuestionId === currentQuestion?._id
            }
            className="px-2 disabled:opacity-30 transition hover:scale-110"
          >
            <img src="/next-arrow.png" alt="Next" className="w-12 h-14 object-contain" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex max-w-[70%] flex-wrap justify-center gap-2">
            {lessonSteps.map((step, index) => (
              <button
                key={step.key}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition ${index === currentStep ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>

          {activeStep?.kind !== "claim" ? (
            <button
              onClick={() => void goNext()}
              disabled={
                (activeStep?.kind === "question" && !activeStep.question.done && !currentSelection) ||
                submittingQuestionId === currentQuestion?._id
              }
              className={`absolute bottom-4 right-4 px-4 py-1.5 rounded-3xl text-sm text-white transition-all duration-200 ${
                activeStep?.kind === "question" && !activeStep.question.done && !currentSelection
                  ? "bg-gray-500/50 blur-[1px] cursor-not-allowed opacity-60"
                  : "bg-[#8B3EFE] hover:bg-[#7A2FE0]"
              }`}
            >
              {activeStep?.kind === "question"
                ? activeStep.question.done
                  ? "Continue"
                  : submittingQuestionId === activeStep.question._id
                    ? "Checking..."
                    : "Submit"
                : "Continue"}
            </button>
          ) : null}
        </div>

        <button
          className="flex items-center gap-2 px-4 py-3 rounded-lg border"
          style={{
            background: "#1D182E80",
            borderColor: "#D4BBFF1A",
            borderWidth: "1px",
          }}
          type="button"
        >
          <img src="/xp-icon.png" alt="XP Icon" className="w-12 h-12 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold" style={{ color: "#94E2FF" }}>
              XP REWARDS
            </span>
            <span className="text-xl font-bold text-white">{lesson?.reward ?? 0}</span>
          </div>
        </button>

        {actionMessage ? <p className="text-sm text-center text-purple-200">{actionMessage}</p> : null}
      </div>

      {showXPModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#8B3EFE] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-white">Lesson Completed</h2>
            <p className="mt-2 text-sm text-white/80">You have successfully completed this lesson.</p>

            <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">XP Earned</p>
              <div className="mt-2 flex items-center justify-center gap-2 text-2xl font-extrabold text-white">
                <span>+{lesson?.reward ?? 0} XP</span>
                <img src="/claimed.png" className="h-5 w-12 object-contain" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setLocation("/learn")}
                className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Back to Lessons
              </button>
              <button
                type="button"
                onClick={resetLessonView}
                className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
              >
                Retake Lesson
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
