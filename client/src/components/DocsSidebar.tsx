import { useState } from "react";
import AnimatedBackground from "./AnimatedBackground";

const DocsSidebar = ({ active, setActive }: any) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const renderItem = (id: string, text: string) => {
    const isActive = active === id;

    return (
      <li
        key={id}
        className={`cursor-pointer flex items-center gap-2 px-2 py-2 ${
          isActive ? "bg-[#0C0A18]" : ""
        }`}
        onClick={() => setActive(id)}
      >
        {/* Dot */}
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isActive ? "#7C5CE4" : "#8C78D21F",
          }}
        />

        {/* Text */}
        <span className="text-gray-300">{text}</span>
      </li>
    );
  };

  const Header = ({
    title,
    id,
    hasDropdown = true,
  }: {
    title: string;
    id?: string;
    hasDropdown?: boolean;
  }) => {
    const isOpen = openSection === id;

    return (
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => {
          if (!hasDropdown) return;
          setOpenSection(isOpen ? null : id || null);
        }}
      >
        <h2
          style={{
            color: "#5A5275",
            fontWeight: 700,
            fontSize: "13.08px",
            lineHeight: "22.23px",
            letterSpacing: "1.83px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h2>

        {hasDropdown && (
          <img
            src="/dropdown.png"
            alt=""
            className={`w-3 h-2 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
    );
  };

  // 🔥 reusable dropdown wrapper
  const Dropdown = ({ id, children }: any) => {
    const isOpen = openSection === id;

    return (
      <div
        className={`ml-2 overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        <div
          className={`space-y-2 text-sm transition-all duration-300 ease-out ${
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1"
          }`}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <AnimatedBackground />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Sidebar */}
      <aside className="relative z-20 w-64 text-white p-4 overflow-y-auto sticky top-0">
        {/* INTRODUCTION */}
        <div className="mb-6">
          <Header title="INTRODUCTION" id="intro" />

          <Dropdown id="intro">
            {renderItem("introduction", "Introduction")}
          </Dropdown>
        </div>

        {/* CORE CONCEPT */}
        <div className="mb-6">
          <Header title="CORE CONCEPTS" id="core" />

          <Dropdown id="core">
            {renderItem("features", "Key Features")}
          </Dropdown>
        </div>

        {/* USING NEXURA */}
        <div className="mb-6">
          <Header title="USING NEXURA" id="using" />

          <Dropdown id="using">
            {renderItem("gettingstarted", "Getting Started")}
            {renderItem("nexonsystem", "The Nexon System")}
          </Dropdown>
        </div>

        {/* TECHNICAL OVERVIEW */}
        <div className="mb-6">
          <Header title="TECHNICAL OVERVIEW" id="technical" />

          <Dropdown id="technical">
            {renderItem("technicaloverview", "Nexura Technical Overview")}
            {renderItem("architecturallayer", "Architectural Layer")}
          </Dropdown>
        </div>

        {/* FAQs */}
<div className="mb-6">
  <div
    onClick={() => setActive("faqs")}
    className="cursor-pointer"
  >
    <Header title="FAQs" hasDropdown={false} />
  </div>
</div>

{/* LEGAL */}
<div>
  <div
    onClick={() => setActive("legal")}
    className="cursor-pointer"
  >
    <Header title="LEGAL" hasDropdown={false} />
  </div>
</div>
      </aside>
    </div>
  );
};

export default DocsSidebar;