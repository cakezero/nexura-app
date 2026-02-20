import { useState, useEffect, useRef } from "react";
import { claims } from "./testing/claimsData";
import { useLocation } from "wouter";

export default function PortalClaims() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState("list");
  const [sortOption, setSortOption] = useState("highest");
  const [sortDirection, setSortDirection] = useState("desc");
  const [activeClaim, setActiveClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReviewRedeemModal, setShowReviewRedeemModal] = useState(false);
  const [transactionMode, setTransactionMode] = useState("redeem");
  const [opposeMode, setOpposeMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSupportClick = (claim) => {
  setActiveClaim(claim);
  setOpposeMode(false);
  setShowModal(true);
};

  const handleOpposeClick = (claim) => {
  setActiveClaim(claim);
  setTransactionMode("redeem");
  setActiveTab("deposit");
  setShowModal(true);
  setIsToggled(false);
  setOpposeMode(true);
};


  const handleCloseModal = () => {
  setActiveClaim(null);
  setShowModal(false);
  setOpposeMode(false);
};


  const PAGE_SIZE = 10;

  const [visibleClaims, setVisibleClaims] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("deposit");
  const [isToggled, setIsToggled] = useState(false);

  const getProcessedClaims = () => {
  let filtered = [...claims];

  // SEARCH
  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();

    filtered = filtered.filter(claim =>
      claim.subject.toLowerCase().includes(term) ||
      claim.verb.toLowerCase().includes(term) ||
      claim.object.toLowerCase().includes(term)
    );
  }

  // SORT
  if (sortOption) {
    const [field, direction] = sortOption.split("_");

    filtered.sort((a, b) => {
      let valueA;
      let valueB;

      switch (field) {
        case "totalMarketCap":
          valueA = a.supportLabel + a.opposeLabel;
          valueB = b.supportLabel + b.opposeLabel;
          break;

        case "supportMarketCap":
          valueA = a.supportLabel;
          valueB = b.supportLabel;
          break;

        case "opposeMarketCap":
          valueA = a.opposeLabel;
          valueB = b.opposeLabel;
          break;

        case "positions":
          valueA = a.support + a.oppose;
          valueB = b.support + b.oppose;
          break;

        case "createdAt":
          valueA = new Date(a.createdAt);
          valueB = new Date(b.createdAt);
          break;

        default:
          return 0;
      }

      if (direction === "asc") return valueA - valueB;
      return valueB - valueA;
    });
  }

  return filtered;
};


  const loadMore = () => {
  if (loading || !hasMore) return;

  setLoading(true);

  setTimeout(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE;

    const processed = getProcessedClaims();
    const newClaims = processed.slice(start, end);

    setVisibleClaims(prev => [...prev, ...newClaims]);
    setPage(prev => prev + 1);

    if (end >= processed.length) {
  setHasMore(false);
}

    setLoading(false);
  }, 500); // simulate API delay
};

useEffect(() => {
  setVisibleClaims([]);
  setPage(1);
  setHasMore(true);
}, [searchTerm, sortOption]);

const observerRef = useRef();

useEffect(() => {
  if (!hasMore || loading) return;

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  });

  if (observerRef.current) {
    observer.observe(observerRef.current);
  }

  return () => {
    if (observerRef.current) {
      observer.unobserve(observerRef.current);
    }
  };
}, [loading, hasMore]);


  useEffect(() => {
  loadMore();
}, []);

  return (
    <div className="p-6 text-white">
      {/* Header */}
      <h1 className="text-2xl font-bold">Claims</h1>

      <p className="text-gray-400 mt-2 max-w-3xl">
        Semantic statements, allowing anyone to claim anything about anything
      </p>

      {/* Controls Section */}
      <div className="mt-6 flex flex-wrap items-center gap-4">

        {/* Search */}
        <div className="flex-1 min-w-[280px]">
        <input
  type="text"
  placeholder="Search claims by subject, predicate, or object.."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
        </div>

        {/* Grid/List Toggle */}
        <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 ${
              view === "list" ? "bg-gray-800" : ""
            }`}
          >
            <img src="/list.png" alt="List View" className="w-5 h-5" />
          </button>

          <button
            onClick={() => setView("grid")}
            className={`px-3 py-2 ${
              view === "grid" ? "bg-gray-800" : ""
            }`}
          >
            <img src="/grid.png" alt="Grid View" className="w-5 h-5" />
          </button>
        </div>

        {/* Market Cap Dropdown */}
<div className="relative">
  <select
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
    className="appearance-none bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 focus:outline-none"
  >
    <option value="totalMarketCap_desc">Highest Total Market Cap</option>
    <option value="totalMarketCap_asc">Lowest Total Market Cap</option>

    <option value="supportMarketCap_desc">Highest Support Market Cap</option>
    <option value="supportMarketCap_asc">Lowest Support Market Cap</option>

    <option value="opposeMarketCap_desc">Highest Oppose Market Cap</option>
    <option value="opposeMarketCap_asc">Lowest Oppose Market Cap</option>

    <option value="positions_desc">Most Positions</option>
    <option value="positions_asc">Fewest Positions</option>

    <option value="createdAt_desc">Newest</option>
    <option value="createdAt_asc">Oldest</option>
  </select>

  <img
    src="/up-down.png"
    alt="Sort"
    className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"
  />
</div>

      </div>

      {/* Claims Table */}
<div className="mt-8 overflow-x-auto">
<div className="mt-8">
  {view === "list" ? (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left border-collapse border border-gray-700">
            <thead>
      <tr className="bg-gray-800 text-gray-300">
        <th className="px-4 py-2 w-[50%] border border-gray-700">Claim</th>
        <th className="px-4 py-2 w-[15%] border border-gray-700">Support</th>
        <th className="px-4 py-2 w-[15%] border border-gray-700">Oppose</th>
        <th className="px-4 py-2 w-[20%] border border-gray-700">Portal Claims</th>
      </tr>
    </thead>
<tbody>
  {visibleClaims.map((claim) => (
    <tr
  key={claim.id}
  className="bg-[#060210] cursor-pointer hover:bg-[#1a0f2e]"
  onClick={() => setLocation(`/portal-claims/${claim.id}`)}
>

      {/* Claim */}
      <td className="px-4 py-2 border border-gray-700">
        <div className="flex flex-wrap items-center gap-1">
          {/* Subject with Icon */}
          <span className="bg-gray-700 px-1 rounded flex items-center gap-1">
            <img src={claim.icon} alt="Claim Icon" className="w-5 h-5" />
            {claim.subject}
          </span>

          {/* Verb */}
          <span>{claim.verb}</span>

          {/* Object/Predicate */}
          <span className="bg-gray-700 px-1 rounded">{claim.object}</span>
        </div>
      </td>

      {/* Support */}
      <td className="px-4 py-2 border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-semibold">{claim.support}</span>
          <img src="/user.png" alt="User Icon" className="w-4 h-4" />
          <div className="bg-[#41289E80] text-white text-xs font-semibold px-1 py-1 rounded-md ml-2">
            {claim.supportLabel}K TRUST
          </div>
        </div>
      </td>

      {/* Oppose */}
      <td className="px-4 py-2 border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-[#F19C03] font-semibold">{claim.oppose}</span>
          <img src="/user-red.png" alt="User Icon" className="w-4 h-4" />
          <div className="bg-[#41289E80] text-white text-xs font-semibold px-1 py-1 rounded-md ml-2">
            {claim.opposeLabel}K TRUST
          </div>
        </div>
      </td>

      {/* Portal Claims */}
      <td className="px-4 py-2 border border-gray-700 flex gap-2 justify-center items-center">
  <div
    className="p-1 rounded-md cursor-pointer"
    onClick={(e) => {
  e.stopPropagation();
  handleSupportClick(claim);
}}
  >
    <img src="/support.png" alt="Support" className="w-max h-7" />
  </div>
  <div
    className="p-1 rounded-md cursor-pointer"
    onClick={(e) => {
  e.stopPropagation();
  handleOpposeClick(claim);
}}
  >
    <img src="/oppose.png" alt="Oppose" className="w-max h-7" />
  </div>
</td>

    </tr>
  ))}
</tbody>
      </table>
    </div>
  ) : (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {visibleClaims.map((claim) => {
      const total = claim.support + claim.oppose;
      const supportPercent = total ? (claim.support / total) * 100 : 0;
      const opposePercent = total ? (claim.oppose / total) * 100 : 0;

      return (
        <div
  key={claim.id}
  className="bg-[#060210] border border-gray-700 rounded-xl p-5 hover:bg-[#2c0738] transition"
>

          {/* Statement */}
<div className="text-gray-300 mb-4 flex flex-wrap items-center gap-2">
  {/* Subject + Icon */}
  <span className="font-bold text-xl bg-gray-700 px-2 py-1 rounded inline-flex items-center gap-2">
    <img src={claim.icon} alt="Claim Icon" className="w-5 h-5 object-contain" />
    {claim.subject}
  </span>

  {/* Verb */}
  <span>{claim.verb}</span>

  {/* Object */}
  <span className="bg-gray-700 px-2 py-1 rounded">{claim.object}</span>
</div>


          {/* Stats Section */}
          <div className="flex overflow-hidden rounded-md">
            {/* Support */}
            <div className="flex-1 flex flex-col p-2 gap-1">
              <span className="text-blue-400 font-semibold">Support</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{claim.supportLabel}K TRUST</span>
                <div className="flex items-center gap-1 text-blue-400 font-semibold">
                  <span>{claim.support}</span>
                  <img src="/user.png" alt="User Icon" className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="w-px bg-white"></div>

            {/* Oppose */}
            <div className="flex-1 flex flex-col p-2 gap-1">
              <span className="text-[#FI9C03] font-semibold">Oppose</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#FI9C03]">{claim.opposeLabel}K TRUST</span>
                <div className="flex items-center gap-1 text-[#F19C03] font-semibold">
                  <span>{claim.oppose}</span>
                  <img
                    src="/user-red.png"
                    alt="User Icon"
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
<div className="w-full h-5 bg-gray-700 rounded-lg overflow-hidden mt-2 relative">
  <div className="flex h-full text-white text-xs font-semibold">
    {/* Support */}
    <div
      className="bg-blue-600 flex items-center justify-center transition-all duration-500"
      style={{ width: `${supportPercent}%` }}
    >
      {supportPercent.toFixed(0)}%
    </div>

    {/* Oppose */}
    <div
      className="bg-[#F19C03] flex items-center justify-center transition-all duration-500"
      style={{ width: `${opposePercent}%` }}
    >
      {opposePercent.toFixed(0)}%
    </div>
  </div>
</div>


{/* Actions + Total MarketCap */}
<div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-700">
  {/* Buttons */}
<div className="flex gap-2">
  <button
    className="bg-blue-600 px-4 py-2 rounded-3xl text-sm"
    onClick={(e) => {
  e.stopPropagation();
  handleSupportClick(claim);
}}

  >
    Support
  </button>
  <button
  className="bg-[#F19C03] px-4 py-2 rounded-3xl text-sm"
  onClick={(e) => {
  e.stopPropagation();
  handleOpposeClick(claim);
}}

>
  Oppose
</button>
</div>


  {/* Total MarketCap */}
  <div className="flex flex-col items-end text-gray-300 text-sm">
    <span className="font-semibold">Total Market Cap</span>
    <span className="font-bold text-2xl text-white">
      {claim.supportLabel + claim.opposeLabel}K TRUST
    </span>
  </div>
</div>
        </div>
      );
    })}
  </div>
  </>
  )}

    {/* Modal */}
  {showModal && activeClaim && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
<div
  className="bg-[#070315] max-w-2xl w-full mx-4 p-6 rounded-xl relative border-2"
  style={{ borderColor: "#8B3EFE" }}
>


      {/* Title + Support Tag */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-white font-bold text-lg">Claim</h2>
        <span className="bg-[#0A2D4D] border border-white text-white px-3 py-1 rounded-full text-sm font-semibold">
  {opposeMode ? "Oppose" : "Support"}
</span>
      </div>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm mb-4">
        Supporting or Opposing a triple enhances its discoverability in the intuition system
      </p>

      {/* Statement */}
      <div className="text-gray-300 mb-6 px-6 flex flex-wrap items-center gap-2">
        <span className="font-bold bg-gray-700 px-2 py-1 rounded inline-flex items-center gap-2">
          <img src={activeClaim.icon} alt="Claim Icon" className="w-5 h-5 object-contain" />
          {activeClaim.subject}
        </span>
        <span>{activeClaim.verb}</span>
        <span className="bg-gray-700 px-2 py-1 rounded">{activeClaim.object}</span>
      </div>

{/* Tabs */}
<div className="flex justify-center mb-4">
  <div className="flex gap-20 relative">
    <button
      className={`relative px-4 py-2 font-semibold ${
        activeTab === "deposit" ? "text-white" : "text-gray-400"
      }`}
      onClick={() => setActiveTab("deposit")}
    >
      Deposit
      {activeTab === "deposit" && (
        <span className="absolute left-1/2 bottom-0 w-40 transform -translate-x-1/2 h-1 bg-blue-500 rounded-full"></span>
      )}
    </button>
    <button
      className={`relative px-4 py-2 font-semibold ${
        activeTab === "redeem" ? "text-white" : "text-gray-400"
      }`}
      onClick={() => setActiveTab("redeem")}
    >
      Redeem
      {activeTab === "redeem" && (
        <span className="absolute left-1/2 bottom-0 w-40 transform -translate-x-1/2 h-1 bg-blue-500 rounded-full"></span>
      )}
    </button>
  </div>
</div>


{/* Tab Content */}
{activeTab === "deposit" && (
  <div className="px-4 md:px-12">
    {/* Main Card: Active Position */}
    <div className="bg-[#110A2B] border-2 border-[#393B60] p-4 rounded-xl min-h-[120px] flex flex-col justify-between mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-300 text-sm font-semibold">Your Active Position</span>
        <span className="bg-[#0A2D4D] border border-white text-white px-2 py-1 rounded-full text-sm font-semibold">
  {opposeMode ? "Oppose" : "Support"}
</span>
      </div>
      <p className="text-white font-bold text-xl">0.0954 TRUST</p>
    </div>

    {/* Wallet Div */}
    <div className="mt-2 ml-auto bg-[#110A2B] border-2 border-[#393B60] rounded-3xl px-3 py-1.5 flex items-center gap-2 w-max mb-4 text-sm">
      <img src="/wallet.png" alt="Wallet Icon" className="w-4 h-4" />
      <span className="text-white font-semibold">0.80 TRUST</span>
    </div>

    {/* Center Big Zero */}
    <div className="flex flex-col items-center my-4">
      <span className="text-white font-bold text-6xl">0</span>
      <span className="text-gray-300 text-xs mt-1">TRUST</span>
    </div>

    {/* New Card: Exponential Curve */}
    <div className="bg-[#110A2B] border-2 border-[#393B60] p-3 rounded-xl flex flex-col gap-3">
      {/* Top Row: Title and High Risk, High Reward */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-white font-bold text-base">Exponential Curve</span>
          <span className="text-gray-300 text-xs mt-0.5">High Risk, High Reward</span>
        </div>

        {/* Toggle Button */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isToggled}           // state variable
            onChange={() => setIsToggled(!isToggled)}
          />
          <div className="w-10 h-5 bg-white rounded-full peer peer-checked:bg-[#FFF] transition-colors"></div>
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-black rounded-full shadow-md peer-checked:translate-x-5 transition-transform"></div>
        </label>
      </div>
    </div>

    {/* Review Deposit Button */}
    <button className="w-full bg-white text-black py-2.5 rounded-3xl font-semibold mt-3 text-sm">
      Review Deposit
    </button>
  </div>
)}


{activeTab === "redeem" && (
  <div className="px-4 md:px-12"> {/* Container padding for left/right */}
    {/* Main Card: Active Position */}
    <div className="bg-[#110A2B] border-2 border-[#393B60] p-4 rounded-xl min-h-[120px] flex flex-col justify-between mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-300 text-sm font-semibold">Your Active Position</span>
        <span className="bg-[#0A2D4D] border border-white text-white px-2 py-1 rounded-full text-sm font-semibold">
  {opposeMode ? "Oppose" : "Support"}
</span>
      </div>
      <p className="text-white font-bold text-xl">0.0954 TRUST</p>
    </div>

    {/* Wallet Div */}
    <div className="mt-2 ml-auto bg-[#110A2B] border-2 border-[#393B60] rounded-3xl px-3 py-1.5 flex items-center gap-2 w-max mb-4 text-sm">
      <img src="/wallet.png" alt="Wallet Icon" className="w-4 h-4" />
      <span className="text-white font-semibold">0.80 TRUST</span>
    </div>

    {/* Center Big Zero */}
    <div className="flex flex-col items-center my-4">
      <span className="text-white font-bold text-6xl">0</span>
      <span className="text-gray-300 text-xs mt-1">TRUST</span>
    </div>

    {/* New Card: Exponential Curve */}
    <div className="bg-[#110A2B] border-2 border-[#393B60] p-3 rounded-xl flex flex-col gap-3">
      {/* Top Row: Title and High Risk, High Reward */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-white font-bold text-base">Exponential Curve</span>
          <span className="text-gray-300 text-xs mt-0.5">High Risk, High Reward</span>
        </div>

        {/* Toggle Button */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isToggled}           // state variable
            onChange={() => setIsToggled(!isToggled)}
          />
          <div className="w-10 h-5 bg-white rounded-full peer peer-checked:bg-[#FFF] transition-colors"></div>
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-black rounded-full shadow-md peer-checked:translate-x-5 transition-transform"></div>
        </label>
      </div>
    </div>

    {/* Review Deposit Button */}
<button
  className="w-full bg-white text-black py-2.5 rounded-3xl font-semibold mt-3 text-sm"
  onClick={() => setShowReviewRedeemModal(true)}
>
  Review Redeem
</button>

  </div>
)}
      {/* Close Button */}
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={handleCloseModal}
      >
        ×
      </button>
    </div>
  </div>
)}

{showReviewRedeemModal && activeClaim && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-[#070315] w-full max-w-md mx-4 p-6 rounded-xl relative border-2 border-[#8B3EFE]">

      {/* Close Button */}
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl font-bold"
        onClick={() => setShowReviewRedeemModal(false)}
      >
        ×
      </button>

      {/* Title + Support Tag */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-white font-bold text-lg">Claim</h2>
        <span className="bg-[#0A2D4D] border border-white text-white px-3 py-1 rounded-full text-sm font-semibold">
          Support
        </span>
      </div>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm mb-6">
        Supporting or Opposing a triple enhances its discoverability in the intuition system
      </p>

      {/* Centered Spinner + Label */}
      <div className="flex flex-col items-center my-6">
        <img src="/spinner.png" alt="Spinner" className="w-16 h-16 mb-2 animate-spin" />
        <span className="text-white font-semibold">Review...</span>
      </div>

{/* Total Cost */}
<div className="bg-[#110A2B] border-2 border-[#393B60] rounded-3xl flex justify-between items-center px-4 py-2 mb-3 mx-4">
  <span className="text-gray-300 text-sm font-semibold">Total Cost</span>
  <span className="text-white font-bold">0.0954</span>
</div>

      {/* Redeem TRUST Label */}
      <span className="text-gray-300 font-semibold mb-2 block">Redeem TRUST from Claim</span>

      {/* Statement */}
      <div className="text-gray-300 mb-6 px-6 flex flex-wrap items-center gap-2">
        <span className="font-bold bg-gray-700 px-2 py-1 rounded inline-flex items-center gap-2">
          <img src={activeClaim.icon} alt="Claim Icon" className="w-5 h-5 object-contain" />
          {activeClaim.subject}
        </span>
        <span>{activeClaim.verb}</span>
        <span className="bg-gray-700 px-2 py-1 rounded">{activeClaim.object}</span>
      </div>

{/* Redeem / Deposit Button */}
<button
  className="w-full bg-white text-black py-2.5 rounded-3xl font-semibold text-sm"
  onClick={() => {
    if (transactionMode === "redeem") {
      // User clicked Redeem → switch to Deposit
      setTransactionMode("deposit");
    } else {
      // User clicked Deposit → alert success and close all modals
      alert("Transaction successful!");
      setTransactionMode("redeem");
      setShowReviewRedeemModal(false);
      setShowModal(false);
      setActiveClaim(null);
    }
  }}
>
  {transactionMode === "redeem" ? "Redeem" : "Deposit"}
</button>
    </div>
  </div>
)}


  {loading && (
    <div className="flex justify-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
    </div>
  )}

  <div ref={observerRef} className="h-10"></div>
</div>

</div>
    </div>
  );
}