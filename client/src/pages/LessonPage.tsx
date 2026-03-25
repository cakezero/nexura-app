import { useParams } from "wouter";
import { useState } from "react";
import { quiz } from "./quiz";
import { quiz as quiz2 } from "./quiz2";
import { useEffect } from "react";
import { useLocation } from "wouter";


export default function LessonPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const walletAddress = "0x123";
const storageKey = `learn-progress-${walletAddress}`;

  const title = "Introduction to Web3";

  const steps = [
    "The internet has evolved through three main stages: Web1 (read-only), Web2 (read-write), and now Web3 (read, write, and own).",
    "Web3 is a decentralized web powered by blockchain technology, where users control their data, identities, and assets instead of centralized platforms.",
    "While blockchain secures “what happened,” Web3 also needs a trust layer to verify “who and what can be trusted.” This is where Intuition comes in.",
    "It ensures credibility, transparency, and a more intelligent digital ecosystem.",

    "QUIZ_STEP",

    "Blockchain is a decentralized digital ledger where every participant holds the same record.",
    "Each block contains verified transactions and is permanently linked to previous blocks, ensuring transparency and immutability.",
    "Blockchain empowers individuals by removing intermediaries and allowing them to verify truth themselves.",
    "Tokens and wallets give users control over value and identity."
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null); // "correct" | "wrong"
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showCompletionSlide, setShowCompletionSlide] = useState(false);
  const [showBronze, setShowBronze] = useState(true);
  const [completionType, setCompletionType] = useState(null); // "silver" | "gold"
  const [activeQuiz, setActiveQuiz] = useState(1);
//   const isQuizStep = currentStep === 4;
const isQuiz1Step = currentStep === 4;
const isQuiz2Step = currentStep === 8;
const isQuizStep = isQuiz1Step || isQuiz2Step;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const [showXPModal, setShowXPModal] = useState(false);

useEffect(() => {
  const data = JSON.parse(localStorage.getItem(storageKey)) || {};

  data[id] = {
    progress: currentStep + 1,
    completed: showXPModal === true, 
  };

  localStorage.setItem(storageKey, JSON.stringify(data));
  window.dispatchEvent(new Event("progress-update"));
}, [currentStep, showXPModal]);


  ///////////////// local storage
  const handleClaimXP = () => {
  const data = JSON.parse(localStorage.getItem(storageKey)) || {};

  data[id] = {
    completed: true,
    progress: steps.length - 1, // keep it consistent with your system
  };

  localStorage.setItem(storageKey, JSON.stringify(data));

  window.dispatchEvent(new Event("progress-update"));

  setShowXPModal(true);
};

const goNext = () => {
  // Step 1: entering quiz → show bronze first
  if (isQuizStep && showBronze) {
    setShowBronze(false);
    return;
  }

  // Step 2: block leaving quiz until completion
  if (isQuizStep && !showCompletionSlide) return;

  // Step 3: leaving completion
  if (showCompletionSlide) {
    setShowCompletionSlide(false);
    setShowBronze(true); // reset for next quiz

    if (completionType === "silver") {
  setActiveQuiz(2);

  setCurrentQuizIndex(0);
  setSelected(null);
  setStatus(null);
  setShowBronze(true);
  setShowCompletionSlide(false);

  setCurrentStep((prev) => prev + 1);
}

    return;
  }

  // normal navigation
  if (currentStep < steps.length - 1) {
    setCurrentStep((prev) => prev + 1);
  }
};

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

const handleAnswer = (option) => {
  const currentQuiz = activeQuiz === 1 ? quiz : quiz2;
  const currentQuestion = currentQuiz[currentQuizIndex];

  setSelected(option);

  if (option === currentQuestion.answer) {
    setStatus("correct");

    setTimeout(() => {
      if (currentQuizIndex < currentQuiz.length - 1) {
        setCurrentQuizIndex((prev) => prev + 1);
        setSelected(null);
        setStatus(null);
      } else {
        // QUIZ FINISHED

        if (activeQuiz === 1) {
  setCompletionType("silver");
  setShowCompletionSlide(true);

  setSelected(null);
  setStatus(null);
  setCurrentQuizIndex(0);
} else {
          // FINAL COMPLETION
          setCompletionType("gold");
          setShowCompletionSlide(true);
        }
      }
    }, 600);
  } else {
    setStatus("wrong");
  }
};

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-3xl space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">
            Learn
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="w-full max-w-3xl text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
        {title}
      </h1>

      {/* Progress */}
      <div className="w-full max-w-3xl">
        <div className="w-full h-2 rounded-full overflow-hidden bg-white/20">
          <div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #94E2FF, #8A3FFC)",
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-white/60 mt-2">
          <span style={{ color: "#94E2FF" }}>
            {title.toUpperCase()}
          </span>
          <span>STEP {currentStep + 1}/{steps.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-3xl space-y-3">

        <div
          className="relative p-8 rounded-2xl min-h-[380px] flex items-center justify-between gap-4 text-center"
          style={{
            background: "linear-gradient(135deg, #8B3EFE, #532598)",
          }}
        >

          {/* Left Arrow */}
          <button
            onClick={goPrev}
            className="text-white text-2xl font-bold px-2 disabled:opacity-30"
            disabled={currentStep === 0}
          >
            ←
          </button>

          {/* Content */}
          <div className="flex-1 px-2">
            {!isQuizStep ? (
  <p className="text-lg sm:text-xl leading-relaxed">
    {steps[currentStep]}
  </p>
) : showCompletionSlide ? (
  completionType === "silver" ? (
    <div className="flex flex-col items-center space-y-4 text-center">
      <img src="/nexura-silver.png" className="w-20 h-20" />
      <h2 className="text-xl sm:text-2xl font-bold">
        You nailed this section!
      </h2>
      <p className="text-sm sm:text-base text-white/80 max-w-sm">
        You’ve finished this part. Continue your learning with Understanding Blockchain.
      </p>
    </div>
  ) : (
    <div className="flex flex-col items-center space-y-4 text-center">
      <img src="/nexura-gold.png" className="w-20 h-20" />
      <h2 className="text-xl sm:text-2xl font-bold">
        Congratulations
      </h2>
      <p className="text-sm sm:text-base text-white/80 max-w-sm">
        You have mastered the basics of Web3 and blockchain. Your XP rewards are ready to be claimed.
      </p>
      <button
      onClick={handleClaimXP}
  className="mt-3 bg-[#8B3EFE] text-white px-5 py-2 rounded-md"
>
  Claim XP
</button>
    </div>
  )
) : showBronze ? (
  // ✅ BRONZE SCREEN (this was missing)
  <div className="flex flex-col items-center space-y-4 text-center">
    <img src="/nexura-bronze.png" className="w-20 h-20" />

    <h2 className="text-xl sm:text-2xl font-bold">
      Test Your Knowledge
    </h2>

    <p className="text-sm sm:text-base text-white/80 max-w-sm">
      Take a quiz to see how much you understand{" "}
      {activeQuiz === 1 ? "Web3" : "Blockchain"}
    </p>
  </div>
) : (
  // QUIZ
  <div className="flex flex-col space-y-4 text-left">

    <h2 className="text-xl sm:text-2xl font-bold text-center">
      {(activeQuiz === 1 ? quiz : quiz2)[currentQuizIndex].question.toUpperCase()}
    </h2>

    <div className="space-y-3">
      {(activeQuiz === 1 ? quiz : quiz2)[currentQuizIndex].options.map((opt, i) => {
        let style =
          "flex justify-between items-center px-4 py-3 rounded-lg cursor-pointer border bg-[#181C2180]";

        if (selected === opt) {
          if (status === "correct") {
            style =
              "flex justify-between items-center px-4 py-3 rounded-lg border bg-[#00E1A233] border-[#00E1A2E5]";
          } else if (status === "wrong") {
            style =
              "flex justify-between items-center px-4 py-3 rounded-lg border bg-[#F43F5E33] border-[#F43F5E]";
          }
        }

        return (
          <div
            key={i}
            onClick={() => handleAnswer(opt)}
            className={style}
          >
            <span className="flex items-center gap-2">
              <span className="bg-[#31353B] px-2 py-1 rounded text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="capitalize">{opt}</span>
            </span>

            {selected === opt && status === "correct" && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#00E1A2] text-black font-bold">
                ✓
              </span>
            )}

            {selected === opt && status === "wrong" && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#F43F5E] text-black font-bold">
                ✕
              </span>
            )}
          </div>
        );
      })}
    </div>

    <p className="text-center text-sm text-white/70 mt-2">
      Question {currentQuizIndex + 1} of {(activeQuiz === 1 ? quiz : quiz2).length}
    </p>

  </div>
)}
          </div>

          {/* Right Arrow */}
          <button
            onClick={goNext}
            className="text-white text-2xl font-bold px-2 disabled:opacity-30"
            disabled={currentStep === steps.length - 1}
          >
            →
          </button>

          {/* Ticker */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentStep ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Continue */}
          {!(showCompletionSlide && completionType === "gold") && (
  <button
    onClick={goNext}
    className="absolute bottom-4 right-4 border border-white/40 text-white bg-transparent px-4 py-1.5 rounded-md text-sm hover:bg-white/10 transition"
  >
    Continue
  </button>
)}
        </div>

        {/* Reward */}
        <div className="flex justify-start">
          <img src="/xp500.png" alt="XP Reward" className="w-32 h-auto" />
        </div>
      </div>

      {showXPModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

    <div
      className="w-[80%] max-w-md rounded-2xl p-6 text-center space-y-4"
      style={{
        background: "linear-gradient(135deg, #8B3EFE, #532598)",
      }}
    >
      {/* Icon */}
      <img src="/claim500.png" className="w-20 h-20 mx-auto" />

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold">
        Lesson Complete!
      </h2>

      {/* Text */}
      <p className="text-sm text-white/80">
        You've successfully mastered the basics of web3 and blockchain
      </p>

      {/* XP */}
      <div className="flex items-center justify-center gap-2 text-xl font-extrabold">
        <span>+500 XP</span>
        <img src="/claimed.png" className="w-14 h-6" />
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-4">

        <button
  onClick={() => {
    setLocation("/learn");
    window.location.reload();
  }}
  className="w-full py-2 rounded-md text-white"
  style={{ background: "#8A3FFC66" }}
>
  RETURN TO LESSONS
</button>

        <button
  className="w-full py-2 px-1 rounded-md text-white border border-white bg-transparent"
>
  TAKE LESSON AGAIN
</button>

      </div>
    </div>
  </div>
)}

    </div>
  );
}