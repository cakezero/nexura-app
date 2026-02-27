import { useState, useEffect, useRef } from "react";
import { Address, formatEther } from "viem";
import { buyShares, sellShares } from "../services/web3";
import { apiRequestV2 } from "../lib/queryClient";
import type { Term } from "../types/types";
import { useToast } from "../hooks/use-toast";
import { formatNumber } from "../lib/utils";
import { useLocation } from "wouter";

interface Claim {
  term_id: Address;
  counter_term_id: Address;
  total_market_cap: string;
  total_position_count: string;
  total_assets: string;
  term: Term;
  counter_term: Term;
}



export const toFixed = (num: string) => {
  const localeString = parseFloat(num).toLocaleString();
  return parseFloat(localeString).toFixed(1);
}

export default function PortalClaims() {
  const [_, setLocation] = useLocation();
  const [view, setView] = useState("list");
  const [sortOption, setSortOption] = useState('{"total_market_cap":"desc"}');
  const [sortDirection, setSortDirection] = useState("desc");

  const [visibleClaims, setVisibleClaims] = useState<Claim[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { toast } = useToast();

  const LIMIT = 50;

  const loadMore = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const { claims } = await apiRequestV2("POST", `/api/get-claims?filter=${sortOption}&offset=${offset}`);

      if (claims.length < LIMIT) setHasMore(false);

      setVisibleClaims((prev) => [...prev, ...claims]);
      setOffset((prev) => prev + LIMIT);
    } catch (err: any) {
      console.error("Failed to fetch claims:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const observerRef = useRef<HTMLDivElement | null>(null);

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
  }, [loading, hasMore, sortOption]);

  useEffect(() => {
    loadMore();
  }, [sortOption]);

  const handleClaimAction = async (claimId: Address, action = "support") => {
    try {
      await buyShares("0.01", claimId); // example amount
      toast({ title: "Sucesss", description: `Successfully ${action ? "opposed" : "supported"} a claim!` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err, variant: "destructive" });
    }
  };

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
    <th className="px-4 py-2 w-[40%] border border-gray-700">Claim</th>
    <th className="px-4 py-2 w-[15%] border border-gray-700">Total Market Cap</th>
    <th className="px-4 py-2 w-[15%] border border-gray-700">Support</th>
    <th className="px-4 py-2 w-[15%] border border-gray-700">Oppose</th>
    <th className="px-4 py-2 w-[15%] border border-gray-700">Portal Claims</th>
  </tr>
</thead>
              <tbody>
                  {visibleClaims.map((claim, index) => (                  
                  <tr
                    key={index}
                    className="bg-[#060210] cursor-pointer hover:bg-[#1a0f2e]"
                    onClick={() => setLocation(`/portal-claims/${claim.term_id}`)}
                  >
                    {/* Claim */}
                    <td className="px-4 py-2 border border-gray-700">
                      <div className="flex flex-wrap items-center gap-1">
                      {/* Subject with Icon */}
                      <span className="bg-gray-700 px-1 rounded flex items-center gap-1">
                        <img src={claim.term.triple.subject.image} alt="Subject Icon" className="w-5 h-5" />
                        {claim.term.triple.subject.label}
                      </span>

                        {/* Verb */}
                        <span>{claim.term.triple.predicate.label}</span>

                        {/* Object/Predicate */}
                        <span className="bg-gray-700 px-1 rounded">{claim.term.triple.object.label}</span>
                      </div>
                    </td>

                    {/* Total Market Cap */}
<td className="px-4 py-2 border border-gray-700">
  <div className="font-semibold text-white">
    {toFixed(
      formatEther(
        BigInt(claim.total_market_cap)
      )
    )} TRUST
  </div>
</td>

                    {/* Support */}
                    <td className="px-4 py-2 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-semibold">{formatNumber(claim.term.positions_aggregate.aggregate.count)}</span>
                        <img src="/user.png" alt="User Icon" className="w-4 h-4" />
                        <div className="bg-[#41289E80] text-white text-xs font-semibold px-1 py-1 rounded-md ml-2">
                          {toFixed(formatEther(BigInt(claim.term.total_assets)))} TRUST
                        </div>
                      </div>
                    </td>

                    {/* Oppose */}
                    <td className="px-4 py-2 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-[#F19C03] font-semibold">{formatNumber(claim.counter_term.positions_aggregate.aggregate.count)}</span>
                        <img src="/user-red.png" alt="User Icon" className="w-4 h-4" />
                        <div className="bg-[#41289E80] text-white text-xs font-semibold px-1 py-1 rounded-md ml-2">
                          {toFixed(formatEther(BigInt(claim.counter_term.total_assets)))} TRUST
                        </div>
                      </div>
                    </td>

                    {/* Portal Claims */}
                    <td className="px-4 py-2 border border-gray-700 flex gap-2 justify-center items-center">
                      <div className="p-1 rounded-md">
                        <img src="/support.png" alt="Support" className="w-max h-7" />
                      </div>
                      <div className="p-1 rounded-md">
                        <img src="/oppose.png" alt="Oppose" className="w-max h-7" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleClaims.map((claim) => {
              const supportCount = Number(claim.term.positions_aggregate.aggregate.count);
const opposeCount = Number(claim.counter_term.positions_aggregate.aggregate.count);

const total = supportCount + opposeCount;

const supportPercent = total > 0 ? (supportCount / total) * 100 : 0;
const opposePercent = total > 0 ? (opposeCount / total) * 100 : 0;
                return (
                  <div
                    key={claim.term_id}
                    className="bg-[#060210] border border-gray-700 rounded-xl p-5 hover:bg-[#2c0738] transition"
                  >
                    {/* Statement */}
                    <div className="text-gray-300 mb-4 flex flex-wrap items-center gap-2">
                      <span className=" font-bold text-xl bg-gray-700 px-2 py-1 rounded mr-2">
                        {claim.term.triple.subject.label}
                      </span>
                      {claim.term.triple.predicate.label}
                      <span className="bg-gray-700 px-2 py-1 rounded ml-2">
                        {claim.term.triple.object.label}
                      </span>
                    </div>
                    {/* Stats Section */}
                    <div className="flex overflow-hidden rounded-md">
  
                    {/* Support */}
                    <div className="flex-1 flex flex-col p-2 gap-1">
                      <span className="text-blue-400 font-semibold">Support</span>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{toFixed(formatEther(BigInt(claim.term.total_assets)))} TRUST</span>
                        <div className="flex items-center gap-1 text-blue-400 font-semibold">
                          <span>{formatNumber(claim.term.positions_aggregate.aggregate.count)}</span>
                          <img src="/user.png" alt="User Icon" className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
    
                    {/* Vertical Separator */}
                    <div className="w-px bg-white"></div>
  
                    {/* Oppose */}
                    <div className="flex-1 flex flex-col p-2 gap-1">
                      <span className="text-[#F19C03] font-semibold">Oppose</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F19C03]">{toFixed(formatEther(BigInt(claim.counter_term.total_assets)))} TRUST</span>
                        <div className="flex items-center gap-1 text-[#F19C03] font-semibold">
                          <span>{formatNumber(claim.counter_term.positions_aggregate.aggregate.count)}</span>
                          <img
                            src="/user-red.png"
                            alt="User Icon"
                            className="w-4 h-4"
                            style={{ filter: "invert(51%) sepia(90%) saturate(4515%) hue-rotate(2deg) brightness(97%) contrast(96%)" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
    
                  <div className="w-full h-5 bg-gray-700 rounded-lg overflow-hidden mt-2 relative">
                    <div className="flex h-full text-white text-xs font-semibold">
                  
                      {supportPercent > 0 && (
                        <div
                          className="bg-blue-600 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${supportPercent}%` }}
                        >
                          {supportPercent > 8 && `${supportPercent.toFixed(1)}%`}
                        </div>
                      )}
    
                      {opposePercent > 0 && (
                        <div
                          className="bg-[#F19C03] flex items-center justify-center transition-all duration-500"
                          style={{ width: `${opposePercent}%` }}
                        >
                          {opposePercent > 8 && `${opposePercent.toFixed(1)}%`}
                        </div>
                      )}
                    </div>
                  </div>
                  
    
                  {/* Actions */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-700">
                  
                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button onClick={() => handleClaimAction(claim.term_id)} className="bg-blue-600 px-4 py-2 rounded-lg text-sm">
                      Support
                    </button>
                    <button onClick={() => handleClaimAction(claim.term_id, "oppose")} className="bg-[#f19c03] px-4 py-2 rounded-lg text-sm">
                      Oppose
                    </button>
                  </div>
    
                    {/* Total MarketCap */}
                    <div className="flex flex-col items-end text-gray-300 text-sm">
                      <span className="font-semibold">Total Market Cap</span>
                      <span className="font-bold text-2xl text-white">
                    {toFixed(
                      formatEther(
                        BigInt(claim.total_market_cap)
                      )
                    )} TRUST
                  </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
