import { useState } from "react";
import DocsSidebar from "../components/DocsSidebar";
import DocsHeader from "../components/DocsHeader";
import Introduction from "../components/docs/content/Introduction";
import KeyFeatures from "../components/docs/content/KeyFeatures";
import NexonSystem from "../components/docs/content/TheNexonSystem";
import GettingStarted from "../components/docs/content/GettingStartedOnNexura";
import TechnicalOverview from "../components/docs/content/TechnicalOverview";
import ArchitecturalLayer from "../components/docs/content/ArchitecturalLayer";
import FAQs from "../components/docs/content/FAQs";
import Legal from "../components/docs/content/Legal";

const docsContentMap = {
  introduction: Introduction,
  features: KeyFeatures,
  gettingstarted: GettingStarted,
  nexonsystem: NexonSystem,
  technicaloverview: TechnicalOverview,
  architecturallayer: ArchitecturalLayer,
  faqs: FAQs,
  legal: Legal,
};

const docsMap = {
  introduction: {
    topic: "INTRODUCTION",
    subtopic: "Introduction",
  },
  features: {
    topic: "CORE CONCEPTS",
    subtopic: "Key Features",
  },
  gettingstarted: {
    topic: "USING NEXURA",
    subtopic: "Getting Started",
  },
  nexonsystem: {
    topic: "USING NEXURA",
    subtopic: "The Nexon System",
  },
  technicaloverview: {
    topic: "TECHNICAL OVERVIEW",
    subtopic: "Nexura Technical Overview",
  },
  architecturallayer: {
    topic: "TECHNICAL OVERVIEW",
    subtopic: "Architectural Layer",
  },

  faqs: {
    topic: "SUPPORT",
    subtopic: "FAQs",
  },
  legal: {
    topic: "LEGAL",
    subtopic: "Legal",
  },
};

const Docs = () => {
  const [active, setActive] = useState("introduction");
  const [sections, setSections] = useState([]);

  const current = docsMap[active];
  const ActiveContent = docsContentMap[active];

  const docsOrder = [
  "introduction",
  "features",
  "gettingstarted",
  "nexonsystem",
  "technicaloverview",
  "architecturallayer",
  "faqs",
  "legal"
];

const currentIndex = docsOrder.indexOf(active);

const handleNext = () => {
  if (currentIndex < docsOrder.length - 1) {
    setActive(docsOrder[currentIndex + 1]);
  }
};

const handlePrev = () => {
  if (currentIndex > 0) {
    setActive(docsOrder[currentIndex - 1]);
  }
};

  return (
    <div className="flex">
      <DocsSidebar active={active} setActive={setActive} />

      <div className="flex-1 p-6 text-white">
        {/* Header */}
<DocsHeader topic={current.topic} sections={sections} />

{/* Content */}
<div>
  {/* Main Heading */}
  <h1
    className="text-3xl font-bold mb-4"
    style={{
      background: "linear-gradient(90deg, #FFFFFF, #C287FC)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    {current.subtopic}
  </h1>

{/* Dynamic Content */}
  <ActiveContent
  onNext={handleNext}
  onPrev={handlePrev}
  setSections={setSections}
/>
</div>
      </div>
    </div>
  );
};

export default Docs;