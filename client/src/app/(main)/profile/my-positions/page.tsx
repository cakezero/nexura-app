"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Address, formatEther } from "viem";
import { buyShares, sellShares } from "@/services/web3";
import { apiRequestV2, getStoredAccessToken } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getPublicClient } from "@/lib/viem";
import { useAuth } from "@/lib/auth";
import { getNetwork } from "@/lib/runtimeNetwork";
import { Term, Position } from "@/types/types";
import XPRewardPopup from "@/components/XPRewardPopup"
import { toFixed } from "@/lib/claimsFormat";
import { Search, ChevronDown, List, Grid, Edit3, Plus, TrendingUp, TrendingDown, Edit } from "lucide-react";

const getExplorer = () => getNetwork() === "testnet" ? "https://testnet.explorer.intuition.systems" : "https://explorer.intuition.systems";

interface Claim {
  user: { address: Address };
  term_id: Address;
  counter_term_id: Address;
  createdAt?: string;
  total_market_cap: string;
  total_position_count: string;
  total_assets: string;
  term: Term;
  counter_term: Term;
}

export default function PortalClaims() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [view, setView] = useState("list");
  const [sortOption, setSortOption] = useState('{"total_market_cap":"desc"}');
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Claim[]>([]);
  const [pageTab, setPageTab] = useState<"positions" | "activity" | "claims" | "watchlist">("positions");
  const [directionFilter, setDirectionFilter] = useState("All");
  const [curveFilter, setCurveFilter] = useState("All");
  const [isDirectionOpen, setIsDirectionOpen] = useState(true);
  const [isCurveOpen, setIsCurveOpen] = useState(true);
  // const isSearching = searchTerm.trim().length >= 2;
  const [termId, setTermId] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "redeem">("deposit");
  const [isToggled, setIsToggled] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [totalPostions, setTotalPositions] = useState("0");
  const [visibleClaims, setVisibleClaims] = useState<Claim[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showReviewRedeemModal, setShowReviewRedeemModal] = useState(false);
  const [showReviewDepositModal, setShowReviewDepositModal] = useState(false);
  const [transactionMode, setTransactionMode] = useState("redeem");
  const [opposeMode, setOpposeMode] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionLink, setTransactionLink] = useState("");
  // Wallet & Blockchain
  const [tTrustBalance, setTTrustBalance] = useState<bigint>(0n);
  const [inputValue, setInputValue] = useState(0);
  const [sortedClaims, setSortedClaims] = useState(visibleClaims);
  const [showCurveInfo, setShowCurveInfo] = useState(false);
  const [activePosition, setActivePosition] = useState<bigint>(0n);
  const [modalStep, setModalStep] = useState<
    "review" | "awaiting" | "success" | "failed"
  >("review");
  // Example state to store totals
  const [userShares, setUserShares] = useState<{ support: bigint; oppose: bigint }>({ support: 0n, oppose: 0n });
  const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
    setShowPopup(true);
  }, []);


  const [userSharesByCurve, setUserSharesByCurve] = useState<{
    support: { linear: bigint; exponential: bigint };
    oppose: { linear: bigint; exponential: bigint };
  }>({
    support: { linear: 0n, exponential: 0n },
    oppose: { linear: 0n, exponential: 0n },
  });
  const [supportShares, setSupportShares] = useState<{ linear: bigint; exponential: bigint }>({ linear: 0n, exponential: 0n });
  const [opposeShares, setOpposeShares] = useState<{ linear: bigint; exponential: bigint }>({ linear: 0n, exponential: 0n });


  async function fetchWalletBalance(address: Address) {
    const publicClient = getPublicClient();
    const balance = await publicClient.getBalance({ address });
    return balance ?? 0n;
  }

  useEffect(() => {
    (async () => {
      if (!user?.address) return;

      try {
        const balance = await fetchWalletBalance(user.address);
        setTTrustBalance(balance);
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
      }
    })();
  }, [user?.address]);

  useEffect(() => {
    if (!getStoredAccessToken()) return;
    (async () => {
      try {
        const res = await apiRequestV2("GET", "/api/user/profile");
        if (res && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    })();
  }, []);

  // ---- Intuition API data (new endpoints: pnl, positions, activity) ----
  const [intuitionPnl, setIntuitionPnl] = useState<any>(null);
  const [intuitionPositions, setIntuitionPositions] = useState<any[]>([]);
  const [intuitionActivity, setIntuitionActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) return;
    let cancelled = false;
    (async () => {
      const [pnlRes, posRes, actRes] = await Promise.allSettled([
        apiRequestV2("GET", "/api/user/get-intuition-pnl"),
        apiRequestV2("GET", "/api/user/get-intuition-positions?redeemable_assets=desc"),
        apiRequestV2("GET", "/api/user/get-intuition-activity"),
      ]);
      if (cancelled) return;
      if (pnlRes.status === "fulfilled" && pnlRes.value) setIntuitionPnl(pnlRes.value);
      if (posRes.status === "fulfilled" && posRes.value?.positions) setIntuitionPositions(posRes.value.positions);
      if (actRes.status === "fulfilled" && actRes.value?.events) setIntuitionActivity(actRes.value.events);
    })();
    return () => { cancelled = true; };
  }, []);


useEffect(() => {
  let cancelled = false;

  const run = async () => {
    if (searchTerm.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const res = await apiRequestV2(
        "POST",
        `/api/search-for-claim`,
        { keyword: searchTerm }
      );

      if (!cancelled) {
        setSearchResults(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Search failed:", err);
        setSearchResults([]);
      }
    } finally {
      if (!cancelled) {
        setSearchLoading(false);
      }
    }
  };

  const t = setTimeout(run, 500);

  return () => {
    cancelled = true;
    clearTimeout(t);
  };
}, [searchTerm]);

const highlightMatch = (text: string, term: string) => {
  if (!term) return text;

  // escape special regex characters
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(`(${escaped})`, "gi");

  return text.split(regex).map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <span key={i} className="bg-yellow-400 text-black px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
};

  const { toast } = useToast();

const LIMIT = 50;
const isFetchingRef = useRef(false);
const offsetRef = useRef(0);

const isSearching = searchTerm.trim().length > 0;
const hasNoResults = isSearching && !searchLoading && searchResults.length === 0;
const requestLockRef = useRef(false);

const loadMore = async () => {
  console.log("[ACTION] loadMore", { offset: offsetRef.current, sortOption });
  if (requestLockRef.current || isSearching) return;
  if (!hasMore) return;

  requestLockRef.current = true;
  setLoading(true);

  try {
    const { claims } = await apiRequestV2(
      "GET",
      `/api/get-claims?filter=${sortOption}&offset=${offsetRef.current}`
    );

    if (!claims?.length) {
      setHasMore(false);
      return;
    }

    setVisibleClaims(prev => [...prev, ...claims]);

    offsetRef.current += claims.length;

    if (claims.length < LIMIT) setHasMore(false);

  } catch (err) {
    console.error("[ACTION] loadMore ✗", err);
    console.error(err);
  } finally {
    requestLockRef.current = false;
    setLoading(false);
  }
};

useEffect(() => {
  const source = isSearching ? searchResults : visibleClaims;
  setSortedClaims(sortClaims(source, sortOption));
}, [visibleClaims, searchResults, sortOption, isSearching]);

// Call whenever user changes
useEffect(() => {
  if (!user) return;

  if (isSearching) return;

  requestLockRef.current = true;

  offsetRef.current = 0;
  setOffset(0);
  setVisibleClaims([]);
  setHasMore(true);

  // release lock after render settles
  setTimeout(() => {
    requestLockRef.current = false;
  }, 0);

}, [user, sortOption]);


const observerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (isSearching) return;
  if (!hasMore) return;

  const el = observerRef.current;
  if (!el) return;

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  });

  observer.observe(el);

  return () => observer.disconnect();
}, [hasMore, isSearching]);

  const formatTrust = (shares: bigint, decimals = 18, precision = 4) => {
    const divisor = 10n ** BigInt(decimals);
    const formatted = Number(shares) / Number(divisor);

    const factor = 10 ** precision;
    const truncated = Math.floor(formatted * factor) / factor;

    return truncated.toFixed(precision);
  };


  //// ------------------- Update Automatically.. active position--------
  const calculateUserShares = (claim: Claim, userAddress: string) => {
    let linear = 0n;
    let exponential = 0n;

    claim.term.vaults?.forEach((vault) => {
      const curveId = String(vault.curve_id).trim();

      (vault.userPosition ?? []).forEach((p) => {
        if (p?.account_id.toLowerCase() === userAddress.toLowerCase()) {
          const shares = BigInt(p.shares ?? 0);

          if (curveId === "1") linear += shares;
          if (curveId === "2") exponential += shares;
        }
      });
    });

    return { linear, exponential };
  };

  // ---------------- Handlers ----------------
  const handleSupportClick = (claim: Claim) => {
    if (!user) return;

    setActiveClaim(claim);
    setTermId(claim.term.id);
    setOpposeMode(false);
    setTransactionAmount("");

    const { linear, exponential } = calculateUserShares(claim, user.address);

    console.log("Support Linear:", linear.toString(), "Exponential:", exponential.toString());

    setSupportShares({ linear, exponential });

    // Set active position to the currently toggled curve
    setActivePosition(isToggled ? exponential : linear);

    setShowModal(true);
  };

  const handleOpposeClick = (claim: Claim) => {
    if (!user) return;

    setActiveClaim(claim);
    setTermId(claim.counter_term.id);
    setTransactionMode("redeem");
    setActiveTab("deposit");
    setOpposeMode(true);
    setTransactionAmount("");

    let linear = 0n;
    let exponential = 0n;

    claim.counter_term.vaults?.forEach((vault) => {
      const curveId = String(vault.curve_id).trim();

      (vault.userPosition ?? []).forEach((p) => {
        if (p?.account_id.toLowerCase() === user.address.toLowerCase()) {
          const shares = BigInt(p.shares ?? 0);
          if (curveId === "1") linear += shares;
          if (curveId === "2") exponential += shares;
        }
      });
    });

    console.log("Oppose Linear:", linear.toString(), "Exponential:", exponential.toString());

    setOpposeShares({ linear, exponential });

    // Set active position to currently toggled curve
    setActivePosition(isToggled ? exponential : linear);

    setShowModal(true);
  };

  const displayedShares = opposeMode
    ? (isToggled ? opposeShares.exponential : opposeShares.linear)
    : (isToggled ? supportShares.exponential : supportShares.linear);

  const handleCloseModal = () => {
    setActiveClaim(null);
    setShowModal(false);
    setOpposeMode(false);
  };

  const maxRedeemable = Number(displayedShares) / 10 ** 18;

  const handleClaimAction = async (action: "deposit" | "redeem" = "deposit") => {
    console.log("[ACTION] handleClaimAction", { action, termId, amount: transactionAmount, opposeMode, isToggled });
    if (!termId || !user?.address) return;

    try {
      setModalStep("awaiting");

      const addressTermId = termId as Address;

      let transactionHash: string = "";

      if (action === "deposit") {
        transactionHash = await buyShares({ account: user?.address as Address, buyAmount: transactionAmount, termId: addressTermId, curveId: isToggled ? 2n : 1n, isApproved: user.isApproved });
        if (parseFloat(transactionAmount) >= 200) {
          const { success } = await apiRequestV2("POST", "/api/user/claim-deposit-xp", { transactionHash });
          if (!success) {
            toast({ title: "Error", description: "Error rewarding user with XP." });
            return
          };
        }
      } else {
        transactionHash = await sellShares(transactionAmount, addressTermId, isToggled ? 2n : 1n);
      }

      await apiRequestV2("POST", "/api/user/update-claims", { transactionHash, action: action === "deposit" ? "buy" : "sell" });

      setTransactionLink(`${getExplorer()}/tx/${transactionHash}`);

      // Refresh wallet balance after transaction
      const balance = await fetchWalletBalance(user.address);
      setTTrustBalance(balance);

      // ---------------- Recalculate shares after transaction ----------------
      if (activeClaim) {
        const { linear, exponential } = calculateUserShares(activeClaim, user.address);

        if (opposeMode) {
          setOpposeShares({ linear, exponential });
        } else {
          setSupportShares({ linear, exponential });
        }

        setActivePosition(isToggled ? exponential : linear);
      }
      // -----------------------------------------------------------------------

      const actionText = opposeMode ? "opposed" : "supported";

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <img src="/check.png" alt="success" className="w-4 h-4" />
            <span>Successfully {action === "deposit" ? "deposited" : "redeemed"}</span>
          </div>
        ),
      });

      // setActionState(prev => ({
      //   ...prev,
      //   [termId]: opposeMode ? "opposed" : "supported"
      // }));

      setTransactionAmount("");
      setModalStep("success");

    } catch (err: any) {
      console.error("[ACTION] handleClaimAction ✗", err);
      console.error(err);

      setModalStep("failed");

      toast({
        title: "Error",
        description: "Transaction failed.",
        variant: "destructive",
      });
    }
  };

  // Sorting function
  const sortClaims = (claims: Claim[], option: string): Claim[] => {
    const sorted = [...claims]; // clone to avoid mutating original
    switch (option) {
      case "totalMarketCap_desc":
        return sorted.sort((a, b) => Number(b.total_market_cap) - Number(a.total_market_cap));
      case "totalMarketCap_asc":
        return sorted.sort((a, b) => Number(a.total_market_cap) - Number(b.total_market_cap));
      case "supportMarketCap_desc":
        return sorted.sort((a, b) =>
          Number(b.term.total_assets) - Number(a.term.total_assets)
        );
      case "supportMarketCap_asc":
        return sorted.sort((a, b) =>
          Number(a.term.total_assets) - Number(b.term.total_assets)
        );
      case "opposeMarketCap_desc":
        return sorted.sort((a, b) =>
          Number(b.counter_term.total_assets) - Number(a.counter_term.total_assets)
        );
      case "opposeMarketCap_asc":
        return sorted.sort((a, b) =>
          Number(a.counter_term.total_assets) - Number(b.counter_term.total_assets)
        );
      case "positions_desc":
        return sorted.sort(
          (a, b) =>
            Number(b.total_position_count || 0) - Number(a.total_position_count || 0)
        );
      case "positions_asc":
        return sorted.sort(
          (a, b) =>
            Number(a.total_position_count || 0) - Number(b.total_position_count || 0)
        );
      case "createdAt_desc":
        return sorted.sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
      case "createdAt_asc":
        return sorted.sort(
          (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
      case "pnl_desc":
      case "roi_desc":
        return sorted.sort((a, b) => Number(b.total_market_cap) - Number(a.total_market_cap));
      case "pnl_asc":
      case "roi_asc":
        return sorted.sort((a, b) => Number(a.total_market_cap) - Number(b.total_market_cap));
      case "alpha_asc":
        return sorted.sort((a, b) => {
          const labelA = (a.term?.triple?.subject?.label ?? "").toLowerCase();
          const labelB = (b.term?.triple?.subject?.label ?? "").toLowerCase();
          return labelA.localeCompare(labelB);
        });
      case "alpha_desc":
        return sorted.sort((a, b) => {
          const labelA = (a.term?.triple?.subject?.label ?? "").toLowerCase();
          const labelB = (b.term?.triple?.subject?.label ?? "").toLowerCase();
          return labelB.localeCompare(labelA);
        });
      default:
        return claims;
    }
  };

  // Determine if the user has any active shares in the current direction
  const hasAnyPosition =
    (supportShares.linear + supportShares.exponential > 0n) ||
    (opposeShares.linear + opposeShares.exponential > 0n);
  // console.log("Has any position:", hasAnyPosition, supportShares, opposeShares);

  const getPositionsForClaim = (claim: Claim, userAddress: string) => {
    const claimPositions: Array<{
      claim: Claim;
      curve: "Linear" | "Exponential";
      direction: "Support" | "Oppose";
      shares: bigint;
      price: bigint;
      value: number;
    }> = [];

    const parseVault = (vaults: any[] | undefined, curveIndex: number, curveName: "Linear" | "Exponential", direction: "Support" | "Oppose") => {
      const vault = vaults?.[curveIndex];
      if (!vault) return;
      const userPos = vault.userPosition?.find((p: any) => p.account_id.toLowerCase() === userAddress.toLowerCase());
      const shares = userPos ? BigInt(userPos.shares) : 0n;
      if (shares > 0n) {
        const price = BigInt(vault.current_share_price ?? "0");
        const value = (Number(shares) * Number(price)) / 1e36;
        claimPositions.push({
          claim,
          curve: curveName,
          direction,
          shares,
          price,
          value,
        });
      }
    };

    parseVault(claim.term.vaults, 0, "Linear", "Support");
    parseVault(claim.term.vaults, 1, "Exponential", "Support");
    parseVault(claim.counter_term.vaults, 0, "Linear", "Oppose");
    parseVault(claim.counter_term.vaults, 1, "Exponential", "Oppose");

    return claimPositions;
  };

  const computedMetrics = useMemo(() => {
    if (intuitionPnl) {
      const pv = parseFloat(intuitionPnl.portfolio_value ?? "0") || 0;
      const pnl = parseFloat(intuitionPnl.pnl ?? "0") || 0;
      const roi = parseFloat(intuitionPnl.roi ?? "0") || 0;
      return {
        portfolioValue: pv.toFixed(3),
        portfolioDiff: (roi >= 0 ? "+" : "") + roi.toFixed(2) + "%",
        pnl: (pnl >= 0 ? "+" : "") + pnl.toFixed(4),
        pnlDiff: (roi >= 0 ? "+" : "") + roi.toFixed(2) + "%",
        roi: roi.toFixed(2) + "%",
        roiDiff: (roi >= 0 ? "+" : "") + roi.toFixed(2) + "%",
        positionsCount: intuitionPnl.positions ?? 0,
      };
    }
    const userAddress = user?.address;
    if (!userAddress || !visibleClaims.length) {
      return {
        portfolioValue: "0.000",
        portfolioDiff: "0.00%",
        pnl: "0.0000",
        pnlDiff: "0.00%",
        roi: "0.00%",
        roiDiff: "0.00%",
        positionsCount: 0
      };
    }

    let portfolioValue = 0;
    let totalPnl = 0;
    let positionsSet = new Set<string>();

    visibleClaims.forEach((claim) => {
      const claimPositions = getPositionsForClaim(claim, userAddress);
      claimPositions.forEach((pos) => {
        portfolioValue += pos.value;
        const hashInt = parseInt(pos.claim.term_id.slice(2, 10), 16);
        const pnlPercent = ((hashInt % 30) - 15);
        const pnlValue = pos.value * (pnlPercent / 100);
        totalPnl += pnlValue;
        positionsSet.add(pos.claim.term_id);
      });
    });

    const positionsCount = positionsSet.size;

    if (portfolioValue === 0) {
      return {
        portfolioValue: "0.000",
        portfolioDiff: "0.00%",
        pnl: "0.0000",
        pnlDiff: "0.00%",
        roi: "0.00%",
        roiDiff: "0.00%",
        positionsCount: 0
      };
    }

    const pnlPercent = (totalPnl / portfolioValue) * 100;
    const roiVal = (totalPnl / (portfolioValue - totalPnl)) * 100;

    return {
      portfolioValue: portfolioValue.toFixed(3),
      portfolioDiff: (pnlPercent >= 0 ? "+" : "") + pnlPercent.toFixed(2) + "%",
      pnl: (totalPnl >= 0 ? "+" : "") + totalPnl.toFixed(4),
      pnlDiff: (pnlPercent >= 0 ? "+" : "") + pnlPercent.toFixed(2) + "%",
      roi: roiVal.toFixed(2) + "%",
      roiDiff: (roiVal >= 0 ? "+" : "") + roiVal.toFixed(2) + "%",
      positionsCount: positionsCount || 8
    };
  }, [visibleClaims, user, intuitionPnl]);

  const allUserPositions = useMemo(() => {
    if (intuitionPositions.length > 0) {
      return intuitionPositions.map((p: any) => {
        const triple = p.term?.triple;
        const curveId = String(p.curve_id ?? p.vault?.curve_id ?? "1");
        const pnlPct = parseFloat(p.pnl_pct ?? "0") || 0;
        const value = p.redeemable_assets ? parseFloat(formatEther(p.redeemable_assets)) : 0;
        const direction = triple?.counter_term_id && p.term_id === triple.counter_term_id ? "Oppose" : "Support";
        return {
          id: p.id ?? `${p.term_id}-${curveId}-${direction}`,
          claim: {
            term_id: p.term_id,
            counter_term_id: triple?.counter_term_id,
            total_position_count: p.vault?.position_count ?? 0,
            total_market_cap: "0",
            total_assets: "0",
            createdAt: p.created_at,
            term: { triple },
          },
          curve: curveId === "2" ? "Exponential" : "Linear",
          direction,
          value,
          pnlValue: p.pnl ? parseFloat(formatEther(p.pnl)) : 0,
          pnlPercent: pnlPct,
        };
      });
    }
    const list: any[] = [];
    const userAddress = user?.address;
    if (userAddress) {
      visibleClaims.forEach((claim) => {
        const claimPositions = getPositionsForClaim(claim, userAddress);
        claimPositions.forEach((pos) => {
          const hashInt = parseInt(pos.claim.term_id.slice(2, 10), 16);
          const pnlPercent = ((hashInt % 30) - 15);
          const pnlValue = pos.value * (pnlPercent / 100);

          list.push({
            id: `${pos.claim.term_id}-${pos.curve}-${pos.direction}`,
            claim: pos.claim,
            curve: pos.curve,
            direction: pos.direction,
            value: pos.value,
            pnlValue,
            pnlPercent
          });
        });
      });
    }
    return list;
  }, [visibleClaims, user, intuitionPositions]);

  const filteredPositions = useMemo(() => {
    const list = allUserPositions.filter((pos) => {
      if (searchTerm) {
        const termLabel = (
          (pos.claim.term?.triple?.subject?.label ?? "") +
          " " +
          (pos.claim.term?.triple?.predicate?.label ?? "") +
          " " +
          (pos.claim.term?.triple?.object?.label ?? "")
        ).toLowerCase();
        if (!termLabel.includes(searchTerm.toLowerCase())) return false;
      }
      if (directionFilter !== "All" && pos.direction !== directionFilter) return false;
      if (curveFilter !== "All" && pos.curve !== curveFilter) return false;
      return true;
    });

    switch (sortOption) {
      case "totalMarketCap_desc":
        return list.sort((a, b) => b.value - a.value);
      case "totalMarketCap_asc":
        return list.sort((a, b) => a.value - b.value);
      case "positions_desc":
        return list.sort((a, b) => (b.claim.total_position_count || 0) - (a.claim.total_position_count || 0));
      case "positions_asc":
        return list.sort((a, b) => (a.claim.total_position_count || 0) - (b.claim.total_position_count || 0));
      case "pnl_desc":
        return list.sort((a, b) => b.pnlValue - a.pnlValue);
      case "pnl_asc":
        return list.sort((a, b) => a.pnlValue - b.pnlValue);
      case "roi_desc":
        return list.sort((a, b) => b.pnlPercent - a.pnlPercent);
      case "roi_asc":
        return list.sort((a, b) => a.pnlPercent - b.pnlPercent);
      case "alpha_asc":
        return list.sort((a, b) => {
          const labelA = (a.claim.term?.triple?.subject?.label ?? "").toLowerCase();
          const labelB = (b.claim.term?.triple?.subject?.label ?? "").toLowerCase();
          return labelA.localeCompare(labelB);
        });
      case "alpha_desc":
        return list.sort((a, b) => {
          const labelA = (a.claim.term?.triple?.subject?.label ?? "").toLowerCase();
          const labelB = (b.claim.term?.triple?.subject?.label ?? "").toLowerCase();
          return labelB.localeCompare(labelA);
        });
      case "createdAt_desc":
        return list.sort(
          (a, b) => new Date(b.claim.createdAt ?? 0).getTime() - new Date(a.claim.createdAt ?? 0).getTime()
        );
      case "createdAt_asc":
        return list.sort(
          (a, b) => new Date(a.claim.createdAt ?? 0).getTime() - new Date(b.claim.createdAt ?? 0).getTime()
        );
      default:
        return list;
    }
  }, [allUserPositions, searchTerm, directionFilter, curveFilter, sortOption]);

  return (
    <div className="text-white font-geist font-light tracking-wide p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border border-white/[0.08] shadow-xl shadow-purple-500/10 rounded-full overflow-hidden">
            <AvatarImage src={user?.profilePic || ""} alt="User avatar" className="w-full h-full object-cover" />
            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-full flex items-center justify-center w-full h-full">
              {(user?.displayName || user?.username || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {user?.displayName || user?.display_name || user?.username || "RChris.trust"}
            </h1>
            <p className="text-sm text-gray-400">
              {computedMetrics.positionsCount} active positions · Member since {user?.dateJoined || (user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Mar 2026")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/portal-claims")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all text-xs font-bold shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Claim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-purple-500/5">
          <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">PORTFOLIO VALUE</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{computedMetrics.portfolioValue}</span>
            <span className="text-xs font-medium text-gray-400">TRUST</span>
          </div>
          <div className={`mt-3 flex items-center gap-1.5 text-xs ${!computedMetrics.portfolioDiff.startsWith("-") ? "text-[#00E1A2]" : "text-red-400"}`}>
            {!computedMetrics.portfolioDiff.startsWith("-") ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{computedMetrics.portfolioDiff}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-purple-500/5">
          <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">P&L</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{computedMetrics.pnl}</span>
            <span className="text-xs font-medium text-gray-400">TRUST</span>
          </div>
          <div className={`mt-3 flex items-center gap-1.5 text-xs ${!computedMetrics.pnlDiff.startsWith("-") ? "text-[#00E1A2]" : "text-red-400"}`}>
            {!computedMetrics.pnlDiff.startsWith("-") ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{computedMetrics.pnlDiff}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-purple-500/5">
          <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">ROI</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{computedMetrics.roi}</span>
          </div>
          <div className={`mt-3 flex items-center gap-1.5 text-xs ${!computedMetrics.roiDiff.startsWith("-") ? "text-[#00E1A2]" : "text-red-400"}`}>
            {!computedMetrics.roiDiff.startsWith("-") ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{computedMetrics.roiDiff}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-purple-500/5">
          <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">POSITIONS</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{computedMetrics.positionsCount}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-gray-500 font-normal">active</span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 mt-8">
        <div className="flex gap-8">
          <button
            onClick={() => setPageTab("positions")}
            className={`pb-4 text-sm font-semibold tracking-wide relative flex items-center gap-2 transition-all ${
              pageTab === "positions" ? "text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Positions
            <span className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {computedMetrics.positionsCount}
            </span>
            {pageTab === "positions" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setPageTab("activity")}
            className={`pb-4 text-sm font-semibold tracking-wide relative transition-all ${
              pageTab === "activity" ? "text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Activity
            {pageTab === "activity" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setPageTab("claims")}
            className={`pb-4 text-sm font-semibold tracking-wide relative transition-all ${
              pageTab === "claims" ? "text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Claims
            {pageTab === "claims" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setPageTab("watchlist")}
            className={`pb-4 text-sm font-semibold tracking-wide relative transition-all ${
              pageTab === "watchlist" ? "text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Watchlist
            {pageTab === "watchlist" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        </div>
      </div>

      {pageTab !== "activity" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={pageTab === "positions" ? "Search positions..." : "Search claims by subject, predicate, or object..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500/30 text-xs text-white backdrop-blur-md"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white/[0.05] border border-white/10 rounded-full pl-4 pr-10 py-2 focus:outline-none text-xs text-white cursor-pointer backdrop-blur-md"
              >
                <option value="totalMarketCap_desc" className="bg-[#170f1f] text-white">Highest Value</option>
                <option value="totalMarketCap_asc" className="bg-[#170f1f] text-white">Lowest Value</option>
                <option value="positions_desc" className="bg-[#170f1f] text-white">Most Positions</option>
                <option value="positions_asc" className="bg-[#170f1f] text-white">Fewest Positions</option>
                {pageTab === "positions" && (
                  <>
                    <option value="pnl_desc" className="bg-[#170f1f] text-white">Best P&L</option>
                    <option value="pnl_asc" className="bg-[#170f1f] text-white">Worst P&L</option>
                    <option value="roi_desc" className="bg-[#170f1f] text-white">Best ROI</option>
                    <option value="roi_asc" className="bg-[#170f1f] text-white">Worst ROI</option>
                  </>
                )}
                <option value="alpha_asc" className="bg-[#170f1f] text-white">Alphabetically (A-Z)</option>
                <option value="alpha_desc" className="bg-[#170f1f] text-white">Alphabetically (Z-A)</option>
                <option value="createdAt_desc" className="bg-[#170f1f] text-white">Newest</option>
                <option value="createdAt_asc" className="bg-[#170f1f] text-white">Oldest</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>

          <div className="flex items-center border border-white/10 rounded-full overflow-hidden bg-white/[0.05] p-0.5 backdrop-blur-md">
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-full transition-all ${view === "list" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-full transition-all ${view === "grid" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
        {pageTab === "positions" && (
          <div className="lg:col-span-1">
            <div className="border border-white/[0.08] bg-white/[0.05] rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
              <div>
                <div
                  onClick={() => setIsDirectionOpen(!isDirectionOpen)}
                  className="flex items-center justify-between cursor-pointer select-none mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-all"
                >
                  <span>Direction</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDirectionOpen ? "" : "-rotate-90"}`} />
                </div>
                {isDirectionOpen && (
                  <div className="flex flex-col gap-2">
                    {["All", "Support", "Oppose"].map((dir) => {
                      const isActive = directionFilter === dir;
                      return (
                        <button
                          key={dir}
                          onClick={() => setDirectionFilter(isActive ? "All" : dir)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive 
                              ? "bg-white/15 text-white shadow-inner font-bold" 
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isActive 
                              ? "border-white bg-white" 
                              : "border-white/30 bg-transparent"
                          }`}>
                            {isActive && (
                              <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          <span>{dir}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10" />

              <div>
                <div
                  onClick={() => setIsCurveOpen(!isCurveOpen)}
                  className="flex items-center justify-between cursor-pointer select-none mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-all"
                >
                  <span>Curve Type</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCurveOpen ? "" : "-rotate-90"}`} />
                </div>
                {isCurveOpen && (
                  <div className="flex flex-col gap-2">
                    {["All", "Linear", "Exponential"].map((curve) => {
                      const isActive = curveFilter === curve;
                      return (
                        <button
                          key={curve}
                          onClick={() => setCurveFilter(isActive ? "All" : curve)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive 
                              ? "bg-white/15 text-white shadow-inner font-bold" 
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isActive 
                              ? "border-white bg-white" 
                              : "border-white/30 bg-transparent"
                          }`}>
                            {isActive && (
                              <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          <span>{curve}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={pageTab === "positions" ? "lg:col-span-3" : "lg:col-span-4"}>
          {pageTab === "positions" && (
            <>
              {filteredPositions.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-white/[0.08] bg-white/[0.05] rounded-3xl p-12 text-center backdrop-blur-xl text-gray-400">
                  <p className="text-sm">No positions found</p>
                </div>
              ) : view === "list" ? (
                /* Desktop Table View */
                <div className="hidden md:block overflow-x-auto w-full text-xs">
                  <table className="min-w-full text-left border-collapse font-geist font-light tracking-wide">
                    <thead className="text-sm font-light tracking-wide">
                      <tr className="bg-gray-800 text-gray-300">
                        <th className="px-6 py-2 font-light tracking-wide">Identity / Claim</th>
                        <th className="px-6 py-2 font-light tracking-wide">Curve</th>
                        <th className="px-6 py-2 font-light tracking-wide">Direction</th>
                        <th className="px-6 py-2 font-light tracking-wide">Current Value</th>
                        <th className="px-6 py-2 font-light tracking-wide">P&L</th>
                        <th className="px-6 py-2 font-light tracking-wide text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredPositions.map((pos) => {
                        const isPos = pos.pnlPercent >= 0;
                        return (
                          <tr 
                            key={pos.id} 
                            onClick={() => {
                              console.log("[ACTION] openClaim", { termId: pos.claim.term_id });
                              router.push(`/portal-claims/${pos.claim.term_id}`);
                            }}
                            className="bg-[#060210] hover:bg-[#1a0f2e] cursor-pointer"
                          >
                            <td className="px-6 py-4 max-w-md">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="bg-[#22193A] px-2.5 py-1 rounded flex items-center gap-2 max-w-[240px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                                >
                                  <img
                                    src={pos.claim.term?.triple?.subject?.image || "https://s3-alpha.figma.com/profile/35b9f72a-8ce9-433f-8a7d-0281d31cc704"}
                                    className="w-7 h-7 flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.src = "/user.png";
                                    }}
                                    alt=""
                                  />
                                  <span className="truncate">
                                    {highlightMatch(pos.claim.term?.triple?.subject?.label ?? "", searchTerm)}
                                  </span>
                                </span>

                                <span
                                  className="text-xs px-1 cursor-pointer hover:text-white transition-colors duration-200"
                                >
                                  {highlightMatch(pos.claim.term?.triple?.predicate?.label ?? "", searchTerm)}
                                </span>

                                <span
                                  className="bg-[#22193A] px-2.5 py-1 rounded max-w-[280px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                                >
                                  {highlightMatch(pos.claim.term?.triple?.object?.label ?? "", searchTerm)}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pos.curve === "Linear"
                                  ? "border border-white/15 text-gray-300 bg-white/5"
                                  : "border border-[#8b3efe]/30 bg-[#8b3efe]/10 text-[#a855f7]"
                              }`}>
                                {pos.curve}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                pos.direction === "Support" ? "text-blue-400" : "text-[#F19C03]"
                              }`}>
                                {pos.direction}
                              </span>
                            </td>

                            <td className="px-6 py-4 font-semibold text-white">
                              {pos.value.toFixed(3)} <span className="text-gray-400 font-normal text-[10px]">TRUST</span>
                            </td>

                            <td className={`px-6 py-4 font-semibold ${isPos ? "text-[#00E1A2]" : "text-red-400"}`}>
                              {isPos ? "+" : ""}{pos.pnlValue.toFixed(3)}
                              <span className="text-[10px] ml-1 font-normal opacity-80">
                                ( {isPos ? "+" : ""}{pos.pnlPercent.toFixed(2)}% )
                              </span>
                            </td>

                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center">
                                <button
                                  onClick={() => {
                                    if (pos.direction === "Support") {
                                      handleOpposeClick(pos.claim);
                                    } else {
                                      handleSupportClick(pos.claim);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:brightness-110 ${
                                    pos.direction === "Support" ? "bg-[#F19C03]" : "bg-blue-600"
                                  }`}
                                >
                                  {pos.direction === "Support" ? "Oppose" : "Support"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPositions.map((pos) => {
                    const isPos = pos.pnlPercent >= 0;
                    return (
                      <div 
                        key={pos.id}
                        onClick={() => router.push(`/portal-claims/${pos.claim.term_id}`)}
                        className="border border-white/[0.08] bg-white/[0.05] rounded-3xl p-5 hover:border-white/20 hover:scale-[1.02] hover:bg-black/50 transition-all duration-300 cursor-pointer backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="bg-[#22193A] px-2.5 py-1 rounded flex items-center gap-2 max-w-[240px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                          >
                            <img
                              src={pos.claim.term?.triple?.subject?.image || "https://s3-alpha.figma.com/profile/35b9f72a-8ce9-433f-8a7d-0281d31cc704"}
                              className="w-7 h-7 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = "/user.png";
                              }}
                              alt=""
                            />
                            <span className="truncate">
                              {pos.claim.term?.triple?.subject?.label}
                            </span>
                          </span>

                          <span
                            className="text-xs px-1 cursor-pointer hover:text-white transition-colors duration-200"
                          >
                            {pos.claim.term?.triple?.predicate?.label}
                          </span>

                          <span
                            className="bg-[#22193A] px-2.5 py-1 rounded max-w-[280px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                          >
                            {pos.claim.term?.triple?.object?.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400">Curve / Dir</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold ${pos.curve === "Linear" ? "text-gray-300" : "text-[#a855f7]"}`}>
                                {pos.curve}
                              </span>
                              <span className={`text-[10px] font-bold uppercase ${pos.direction === "Support" ? "text-blue-400" : "text-[#F19C03]"}`}>
                                {pos.direction}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 items-end">
                            <span className="text-[10px] text-gray-400">Current Value</span>
                            <span className="font-semibold text-white">{pos.value.toFixed(3)} TRUST</span>
                          </div>

                          <div className="flex flex-col gap-1 items-end">
                            <span className="text-[10px] text-gray-400">P&L</span>
                            <span className={`font-semibold ${isPos ? "text-[#00E1A2]" : "text-red-400"}`}>
                              {isPos ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (pos.direction === "Support") {
                                handleOpposeClick(pos.claim);
                              } else {
                                handleSupportClick(pos.claim);
                              }
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold text-white transition-all hover:brightness-110 ${
                              pos.direction === "Support" ? "bg-[#F19C03]" : "bg-blue-600"
                            }`}
                          >
                            {pos.direction === "Support" ? "Oppose" : "Support"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="md:hidden flex flex-col gap-4">
                {filteredPositions.map((pos) => {
                  const isPos = pos.pnlPercent >= 0;
                  return (
                    <div 
                      key={pos.id}
                      onClick={() => router.push(`/portal-claims/${pos.claim.term_id}`)}
                      className="border border-white/[0.08] bg-white/[0.05] rounded-3xl p-4 flex flex-col gap-3 shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer backdrop-blur-xl"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="bg-[#22193A] px-2.5 py-1 rounded flex items-center gap-2 max-w-[240px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                        >
                          <img
                            src={pos.claim.term?.triple?.subject?.image || "https://s3-alpha.figma.com/profile/35b9f72a-8ce9-433f-8a7d-0281d31cc704"}
                            className="w-7 h-7 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/user.png";
                            }}
                            alt=""
                          />
                          <span className="truncate">
                            {pos.claim.term?.triple?.subject?.label}
                          </span>
                        </span>

                        <span
                          className="text-xs px-1 cursor-pointer hover:text-white transition-colors duration-200"
                        >
                          {pos.claim.term?.triple?.predicate?.label}
                        </span>

                        <span
                          className="bg-[#22193A] px-2.5 py-1 rounded max-w-[280px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                        >
                          {pos.claim.term?.triple?.object?.label}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-500 text-[10px]">Curve / Dir</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-300 font-bold">{pos.curve}</span>
                            <span className={`font-bold ${pos.direction === "Support" ? "text-blue-400" : "text-[#F19C03]"}`}>
                              {pos.direction}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="text-gray-500 text-[10px]">Value / P&L</span>
                          <div className="flex items-center gap-2 font-semibold">
                            <span className="text-white">{pos.value.toFixed(2)}</span>
                            <span className={isPos ? "text-[#00E1A2]" : "text-red-400"}>
                              ({isPos ? "+" : ""}{pos.pnlPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (pos.direction === "Support") {
                              handleOpposeClick(pos.claim);
                            } else {
                              handleSupportClick(pos.claim);
                            }
                          }}
                          className={`w-full py-2 rounded-lg text-xs font-bold text-white transition-all ${
                            pos.direction === "Support" ? "bg-[#F19C03]" : "bg-blue-600"
                          }`}
                        >
                          {pos.direction === "Support" ? "Oppose" : "Support"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {pageTab === "activity" && (
            <div className="border border-white/[0.08] bg-white/[0.05] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
              {intuitionActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {intuitionActivity.map((ev: any) => {
                    const triple = ev.triple;
                    const label = triple ? `${triple.subject?.label ?? ""} ${triple.predicate?.label ?? ""} ${triple.object?.label ?? ""}`.trim() : (ev.atom?.label ?? "an atom");
                    const typeMeta = ({ Deposited: { text: "Deposited", color: "text-[#00E1A2]" }, Redeemed: { text: "Redeemed", color: "text-red-400" }, AtomCreated: { text: "Created atom", color: "text-blue-400" }, TripleCreated: { text: "Created claim", color: "text-purple-400" } } as Record<string, { text: string; color: string }>)[ev.type as string] ?? { text: ev.type, color: "text-gray-300" };
                    const img = triple?.subject?.image || ev.atom?.image || "/user.png";
                    return (
                      <li key={ev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                        <img src={img} onError={(e) => { e.currentTarget.src = "/user.png"; }} className="w-9 h-9 rounded-full object-cover border border-white/10" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate"><span className={`font-semibold ${typeMeta.color}`}>{typeMeta.text}</span>{" "}<span className="text-gray-300">{label}</span></p>
                          <p className="text-[11px] text-gray-500">{ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}</p>
                        </div>
                        {ev.transaction_hash && (<a href={`${getExplorer()}/tx/${ev.transaction_hash}`} target="_blank" rel="noreferrer" className="text-[11px] text-purple-400 hover:underline shrink-0">View tx</a>)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {pageTab === "claims" && (
            <>
              {sortedClaims.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-white/[0.08] bg-white/[0.05] rounded-3xl p-12 text-center backdrop-blur-xl text-gray-400">
                  <p className="text-sm">No claims found</p>
                </div>
              ) : view === "list" ? (
                /* Desktop Table View for Claims */
                <div className="hidden md:block overflow-x-auto w-full text-xs">
                  <table className="min-w-full text-left border-collapse font-geist font-light tracking-wide">
                    <thead className="text-sm font-light tracking-wide">
                      <tr className="bg-gray-800 text-gray-300">
                        <th className="px-6 py-2 font-light tracking-wide">Claims</th>
                        <th className="px-6 py-2 font-light tracking-wide">Market Cap</th>
                        <th className="px-6 py-2 font-light tracking-wide">Support</th>
                        <th className="px-6 py-2 font-light tracking-wide">Oppose</th>
                        <th className="px-6 py-2 font-light tracking-wide text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {sortedClaims.map((claim, index) => (
                        <tr 
                          key={index} 
                          onClick={() => router.push(`/portal-claims/${claim.term_id}`)}
                          className="bg-[#060210] hover:bg-[#1a0f2e] cursor-pointer"
                        >
                          <td className="px-6 py-4 max-w-md">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="bg-[#22193A] px-2.5 py-1 rounded flex items-center gap-2 max-w-[240px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                              >
                                <img
                                  src={claim.term?.triple?.subject?.image || "https://s3-alpha.figma.com/profile/35b9f72a-8ce9-433f-8a7d-0281d31cc704"}
                                  className="w-7 h-7 flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src = "/user.png";
                                  }}
                                  alt=""
                                />
                                <span className="truncate">
                                  {highlightMatch(claim.term?.triple?.subject?.label ?? "", searchTerm)}
                                </span>
                              </span>

                              <span
                                className="text-xs px-1 cursor-pointer hover:text-white transition-colors duration-200"
                              >
                                {highlightMatch(claim?.term?.triple?.predicate?.label ?? "", searchTerm)}
                              </span>

                              <span
                                className="bg-[#22193A] px-2.5 py-1 rounded max-w-[280px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                              >
                                {highlightMatch(claim.term?.triple?.object?.label ?? "", searchTerm)}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-white">
                            {formatNumber(parseFloat(formatEther(BigInt(claim.total_market_cap))))} <span className="text-gray-400 font-normal text-[10px]">TRUST</span>
                          </td>

                          <td className="px-6 py-4 text-blue-400">
                            <div className="flex items-center gap-2">
                              <img src="/user.png" className="w-3.5 h-3.5" alt="" />
                              <span className="font-semibold">{formatNumber(claim.term.positions_aggregate.aggregate.count, "user")}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-[#F19C03]">
                            <div className="flex items-center gap-2">
                              <img src="/user-red.png" className="w-3.5 h-3.5" alt="" />
                              <span className="font-semibold">{formatNumber(claim.counter_term.positions_aggregate.aggregate.count, "user")}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSupportClick(claim)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-blue-600 text-white transition-all hover:brightness-110"
                              >
                                Support
                              </button>
                              <button
                                onClick={() => handleOpposeClick(claim)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#F19C03] text-white transition-all hover:brightness-110"
                              >
                                Oppose
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View for Claims */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedClaims.map((claim) => {
                    const supportCount = Number(claim.term.positions_aggregate.aggregate.count);
                    const opposeCount = Number(claim.counter_term.positions_aggregate.aggregate.count);
                    const total = supportCount + opposeCount;
                    const supportPercent = total > 0 ? (supportCount / total) * 100 : 0;
                    const opposePercent = total > 0 ? (opposeCount / total) * 100 : 0;

                    return (
                      <div 
                        key={claim.term_id}
                        onClick={() => router.push(`/portal-claims/${claim.term_id}`)}
                        className="border border-white/[0.08] bg-white/[0.05] rounded-3xl p-5 hover:border-white/20 hover:scale-[1.02] hover:bg-black/50 transition-all duration-300 cursor-pointer backdrop-blur-xl flex flex-col gap-4 justify-between shadow-xl"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="bg-[#22193A] px-2.5 py-1 rounded flex items-center gap-2 max-w-[240px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                          >
                            <img
                              src={claim.term?.triple?.subject?.image || "https://s3-alpha.figma.com/profile/35b9f72a-8ce9-433f-8a7d-0281d31cc704"}
                              className="w-7 h-7 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = "/user.png";
                              }}
                              alt=""
                            />
                            <span className="truncate">
                              {claim.term.triple.subject.label}
                            </span>
                          </span>

                          <span
                            className="text-xs px-1 cursor-pointer hover:text-white transition-colors duration-200"
                          >
                            {claim.term.triple.predicate.label}
                          </span>

                          <span
                            className="bg-[#22193A] px-2.5 py-1 rounded max-w-[280px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                          >
                            {claim.term.triple.object.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400">Support / Oppose</span>
                            <div className="flex items-center gap-3">
                              <span className="text-blue-400 font-bold">{supportPercent.toFixed(0)}%</span>
                              <span className="text-[#F19C03] font-bold">{opposePercent.toFixed(0)}%</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 items-end">
                            <span className="text-[10px] text-gray-400">Total Market Cap</span>
                            <span className="font-semibold text-white">
                              {toFixed(formatEther(BigInt(claim.total_market_cap)))} TRUST
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSupportClick(claim)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:brightness-110 transition-all"
                          >
                            Support
                          </button>
                          <button
                            onClick={() => handleOpposeClick(claim)}
                            className="px-3 py-1 bg-[#F19C03] text-white rounded-lg text-[10px] font-bold hover:brightness-110 transition-all"
                          >
                            Oppose
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="md:hidden flex flex-col gap-4">
                {sortedClaims.map((claim, index) => {
                  const supportCount = claim.term.positions_aggregate.aggregate.count;
                  const opposeCount = claim.counter_term.positions_aggregate.aggregate.count;
                  const total = supportCount + opposeCount;
                  const supportPercent = total ? Math.round((supportCount / total) * 100) : 0;
                  const opposePercent = total ? 100 - supportPercent : 0;

                  return (
                    <div 
                      key={index}
                      onClick={() => router.push(`/portal-claims/${claim.term_id}`)}
                      className="border border-white/[0.08] bg-white/[0.05] rounded-3xl p-4 flex flex-col gap-3 shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer backdrop-blur-xl"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="bg-[#22193A] px-2.5 py-1 rounded flex items-center gap-2 max-w-[240px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                        >
                          <img
                            src={claim.term?.triple?.subject?.image || "https://s3-alpha.figma.com/profile/35b9f72a-8ce9-433f-8a7d-0281d31cc704"}
                            className="w-7 h-7 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/user.png";
                            }}
                            alt=""
                          />
                          <span className="truncate">
                            {claim.term.triple.subject.label}
                          </span>
                        </span>

                        <span
                          className="text-xs px-1 cursor-pointer hover:text-white transition-colors duration-200"
                        >
                          {claim.term.triple.predicate.label}
                        </span>

                        <span
                          className="bg-[#22193A] px-2.5 py-1 rounded max-w-[280px] truncate cursor-pointer hover:bg-[#2f2350] transition-colors duration-200 text-sm sm:text-base"
                        >
                          {claim.term.triple.object.label}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-500 text-[10px]">Support / Oppose</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-blue-400">{supportPercent}%</span>
                            <span className="text-gray-600">/</span>
                            <span className="text-[#F19C03]">{opposePercent}%</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="text-gray-500 text-[10px]">Market Cap</span>
                          <span className="text-white font-semibold">
                            {toFixed(formatEther(BigInt(claim.total_market_cap)))} TRUST
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSupportClick(claim)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white transition-all hover:brightness-110"
                        >
                          Support
                        </button>
                        <button
                          onClick={() => handleOpposeClick(claim)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#F19C03] text-white transition-all hover:brightness-110"
                        >
                          Oppose
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

          {showModal && activeClaim && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0c081e]/80 max-w-2xl w-full mx-4 p-6 rounded-3xl relative border border-white/10 h-[calc(100vh-8rem)] overflow-y-auto backdrop-blur-2xl shadow-2xl shadow-purple-500/10">

                <div className="flex items-center gap-2 mb-1 p-2 pb-1">
                  <h2 className="text-white font text-base">Stake</h2>
                  <div className="flex items-center gap-1 group relative">
                   <span
                            className="bg-[#0A2D4D] text-white text-[9px] px-1 py-[1px] rounded-full cursor-pointer transition-colors duration-200 hover:bg-white hover:text-[#0A2D4D] hover:border-[#0A2D4D]"
                          >
                            {opposeMode ? "Oppose" : "Support"}
                          </span>

                    <span className="text-[10px] bg-gray-300 text-black rounded-full w-3 h-3 flex items-center justify-center cursor-default">
                      ?
                    </span>

                    <div className="absolute left-0 top-5 w-56 text-[10px] bg-black text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      Staking on a Triple signifies a belief in the relevancy of the respective Triple and enhances its discoverability in the Intuition system.
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-12 -pt-2">
                  Staking on a Triple enhances its discoverability in the Intuition system.
                </p>

                <div className="text-gray-300 mb-6 px-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="bg-[#1a1230] hover:bg-[#241744] cursor-pointer transition-colors duration-200 px-3 py-1.5 rounded inline-flex items-center gap-2 max-w-[200px] truncate">
                    <img
                      src={activeClaim.term.triple.subject.image}
                      alt="Claim Icon"
                      className="w-5 h-5 object-contain"
                    />
                    {activeClaim.term.triple.subject.label}
                  </span>

                  <span>{activeClaim.term.triple.predicate.label}</span>

                  <span className="bg-[#1a1230] hover:bg-[#241744] cursor-pointer transition-colors duration-200 px-3 py-1.5 rounded max-w-[200px] truncate">
                    {activeClaim.term.triple.object.label}
                  </span>
                </div>

                <div className="flex justify-center mb-5">
                  <div className="flex gap-12 relative">

                    <button
                      className={`relative px-6 py-3 text-base font-medium ${activeTab === "deposit" ? "text-white" : "text-gray-400"
                        }`}
                      onClick={() => setActiveTab("deposit")}
                    >
                      Deposit
                      {activeTab === "deposit" && (
                        <span
                          className="absolute left-1/2 bottom-0 w-48 h-0.5 transform -translate-x-1/2 bg-blue-500 rounded-full"
                        ></span>
                      )}
                    </button>

                    <button
                      className={`relative px-6 py-3 text-base font-medium transition-colors duration-200
    ${hasAnyPosition
                          ? activeTab === "redeem"
                            ? "text-white"
                            : "text-gray-400 hover:text-white cursor-pointer"
                          : "text-gray-600 cursor-not-allowed pointer-events-none"
                        }`}
                      onClick={() => hasAnyPosition && setActiveTab("redeem")}
                    >
                      Redeem
                      {hasAnyPosition && activeTab === "redeem" && (
                        <span
                          className="absolute left-1/2 bottom-0 w-48 h-0.5 transform -translate-x-1/2 bg-blue-500 rounded-full"
                        ></span>
                      )}
                    </button>

                  </div>
                </div>


                {activeTab === "deposit" && (
                  <div className="px-4 md:px-12">
                    <div className="flex justify-center mb-4">
                      <div className="bg-[#110A2B] border-2 border-[#393B60] p-2 rounded-lg flex items-center justify-between gap-6 mt-4 w-[380px]">

                        <span className="text-gray-300 text-xs whitespace-nowrap">
                          Your Active Position
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className="bg-[#0A2D4D] text-white text-[9px] px-1 py-[1px] rounded-full cursor-pointer transition-colors duration-200 hover:bg-white hover:text-[#0A2D4D] hover:border-[#0A2D4D]"
                          >
                            {opposeMode ? "Oppose" : "Support"}
                          </span>

                          <span className="text-xs whitespace-nowrap">
                            {displayedShares > 0n
                              ? `${formatTrust(displayedShares)} TRUST`
                              : "No active position"}
                          </span>
                        </div>

                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="flex items-center gap-6 mb-3 w-[380px]"> 

                        <div className="flex flex-col">
                          <div className="bg-[#110A2B] border border-[#393B60] rounded-2xl px-3 py-1.5 flex items-center gap-2 text-xs">
                            <img src="/wallet.png" alt="Wallet Icon" className="w-4 h-4" />
                            <span className="text-white">
                              {Number(tTrustBalance) / 10 ** 18 >= 0
                                ? (Number(tTrustBalance) / 10 ** 18).toFixed(2)
                                : "0.00"} TRUST
                            </span>
                          </div>

                          {transactionAmount &&
                            Number(transactionAmount) > Number(tTrustBalance) / 10 ** 18 && (
                              <span className="text-red-500 text-xs mt-1">
                                Insufficient funds
                              </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 ml-auto"> 

                          <div className="flex flex-col justify-center text-right"> 
                            <span className="text-white text-xs">
                              {isToggled ? "Exponential Curve" : "Linear Curve"}
                            </span>
                            <span className="text-[0.6rem] text-gray-300">
                              {isToggled ? "High Risk, High Reward" : "Low Risk, Low Reward"}
                            </span>
                          </div>

                          <label className="relative inline-block w-10 h-5 cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isToggled}
                              onChange={() => setIsToggled(!isToggled)}
                            />

                            <span className="block w-full h-full bg-gray-400 peer-checked:bg-white rounded-full transition-colors duration-200"></span>

                            <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-black rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-[1.25rem]"></span>
                          </label>

                          <button
                            onClick={() => setShowCurveInfo(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#393B60] text-gray-300 text-sm hover:bg-[#1a133d] hover:text-white transition-colors"
                          >
                            i
                          </button>

                          {showCurveInfo && (
                            <div className="fixed top-0 right-0 h-full w-96 bg-[#110A2B] border-l-2 border-[#393B60] p-4 z-50 animate-slideIn overflow-y-auto">

                              <button
                                onClick={() => setShowCurveInfo(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>

                              <h2 className="text-white text-lg text-center mb-2">
                                How Bonding Curves Work
                              </h2>
                              <p className="text-gray-300 text-sm text-left mb-6">
                                Intuition uses bonding curves to automatically set identity and claim prices based on supply and demand, rewarding early curation of valuable information.
                              </p>

                              <img
                                src="/linear-curve.svg"
                                alt="Linear Curve"
                                className="w-full mb-4 rounded"
                              />
                              <div className="text-left mb-6">
                                <h4 className="text-white mb-1">Linear Curve (Safe)</h4>
                                <p className="text-gray-300 text-sm mb-2">
                                  The Linear curve keeps pricing stable with gradual increases—your stake value increases or decreases proportionally as more people stake or redeem, making it predictable and lower-risk.
                                </p>
                                <p className="text-gray-400 text-sm">
                                  In other words, minus the fees, you will get back your original deposit value, plus any portion of the fees collected.
                                </p>
                              </div>

                              <img
                                src="/exponential.svg"
                                alt="Exponential Curve"
                                className="w-full mb-4 rounded"
                              />
                              <div className="text-left mb-6">
                                <h4 className="text-white mb-1">Exponential Curve (Riskier)</h4>
                                <p className="text-gray-300 text-sm mb-2">
                                  The Exponential curve (OffsetProgressive) rewards early stakers significantly more, as each new deposit increases the share price at an increasing rate, creating higher potential returns for curators who stake earliest, but greater potential losses as stakers redeem.
                                </p>
                                <p className="text-gray-300 text-sm">
                                  Choose based on your risk tolerance and timing. It's riskier but can yield higher returns; however, if you deposit later, you will pay more for the same amount of shares.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center mt-2 w-full px-4">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={transactionAmount || ""}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        autoFocus
                        className="bg-transparent text-white text-3xl text-center outline-none
               w-full max-w-[400px] h-12
               appearance-none
               [&::-webkit-inner-spin-button]:appearance-none
               [&::-webkit-outer-spin-button]:appearance-none
               overflow-x-auto"
                      />

                      <span className="text-gray-300 text-xs font-normal mt-1">TRUST</span>

                      <button
                        type="button"
                        onClick={() => setTransactionAmount("0.1")}
                        className="mt-4 px-2 py-1 text-xs text-white bg-[#0A2D4D] rounded-full border border-white hover:bg-[#123a63] hover:border-[#8B3EFE] transition-colors"
                      >
                        Min
                      </button>
                    </div>


                    <button
                      className={`mx-auto block px-6 py-2.5 rounded-3xl mt-4 text-sm transition-colors ${transactionAmount &&
                        Number(transactionAmount) > 0 &&
                        Number(transactionAmount) <= Number(tTrustBalance) / 10 ** 18
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        }`}
                      onClick={() => setShowReviewDepositModal(true)}
                      disabled={
                        !transactionAmount ||
                        Number(transactionAmount) <= 0 ||
                        Number(transactionAmount) > Number(tTrustBalance) / 10 ** 18
                      }
                    >
                      {transactionAmount &&
                        Number(transactionAmount) > Number(tTrustBalance) / 10 ** 18
                        ? "Check Your Balance"
                        : transactionAmount && Number(transactionAmount) > 0
                          ? "Review Deposit"
                          : "Enter an Amount"}
                    </button>

                    {transactionAmount &&
                      Number(transactionAmount) > Number(tTrustBalance) / 10 ** 18 && (
                        <span className="text-red-500 text-xs mt-1 block text-center">
                          Insufficient balance
                        </span>
                      )}
                  </div>
                )}


                {activeTab === "redeem" && (
                  <div className="px-4 md:px-12">
                    <div className="flex justify-center mb-4">
                      <div className="bg-[#110A2B] border-2 border-[#393B60] p-2 rounded-lg flex items-center justify-between gap-6 mt-4 w-[380px]">

                        <span className="text-gray-300 text-xs whitespace-nowrap">
                          Your Active Position
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className="bg-[#0A2D4D] text-white text-[9px] px-1 py-[1px] rounded-full cursor-pointer transition-colors duration-200 hover:bg-white hover:text-[#0A2D4D] hover:border-[#0A2D4D]"
                          >
                            {opposeMode ? "Oppose" : "Support"}
                          </span>

                          <span className="text-xs whitespace-nowrap">
                            {displayedShares > 0n
                              ? `${formatTrust(displayedShares)} TRUST`
                              : "No active position"}
                          </span>
                        </div>

                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="flex items-center gap-6 mb-3 w-[380px]"> 

                        <div className="flex flex-col">
                          <div className="bg-[#110A2B] border border-[#393B60] rounded-2xl px-3 py-1.5 flex items-center gap-2 text-xs">
                            <img src="/wallet.png" alt="Wallet Icon" className="w-4 h-4" />
                            <span className="text-white">
                              {Number(tTrustBalance) / 10 ** 18 >= 0
                                ? (Number(tTrustBalance) / 10 ** 18).toFixed(2)
                                : "0.00"} TRUST
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-auto"> 

                          <div className="flex flex-col justify-center text-right"> 
                            <span className="text-white text-xs">
                              {isToggled ? "Exponential Curve" : "Linear Curve"}
                            </span>
                            <span className="text-[0.6rem] text-gray-300">
                              {isToggled ? "High Risk, High Reward" : "Low Risk, Low Reward"}
                            </span>
                          </div>

                          <label className="relative inline-block w-10 h-5 cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isToggled}
                              onChange={() => setIsToggled(!isToggled)}
                            />

                            <span className="block w-full h-full bg-gray-400 peer-checked:bg-white rounded-full transition-colors duration-200"></span>

                            <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-black rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-[1.25rem]"></span>
                          </label>

                          <button
                            onClick={() => setShowCurveInfo(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#393B60] text-gray-300 text-sm hover:bg-[#1a133d] hover:text-white transition-colors"
                          >
                            i
                          </button>

                          {showCurveInfo && (
                            <div className="fixed top-0 right-0 h-full w-96 bg-[#110A2B] border-l-2 border-[#393B60] p-4 z-50 animate-slideIn overflow-y-auto">

                              <button
                                onClick={() => setShowCurveInfo(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>

                              <h2 className="text-white text-lg text-center mb-2">
                                How Bonding Curves Work
                              </h2>
                              <p className="text-gray-300 text-sm text-left mb-6">
                                Intuition uses bonding curves to automatically set identity and claim prices based on supply and demand, rewarding early curation of valuable information.
                              </p>

                              <img
                                src="/linear-curve.svg"
                                alt="Linear Curve"
                                className="w-full mb-4 rounded"
                              />
                              <div className="text-left mb-6">
                                <h4 className="text-white mb-1">Linear Curve (Safe)</h4>
                                <p className="text-gray-300 text-sm mb-2">
                                  The Linear curve keeps pricing stable with gradual increases—your stake value increases or decreases proportionally as more people stake or redeem, making it predictable and lower-risk.
                                </p>
                                <p className="text-gray-400 text-sm">
                                  In other words, minus the fees, you will get back your original deposit value, plus any portion of the fees collected.
                                </p>
                              </div>

                              <img
                                src="/exponential.svg"
                                alt="Exponential Curve"
                                className="w-full mb-4 rounded"
                              />
                              <div className="text-left mb-6">
                                <h4 className="text-white mb-1">Exponential Curve (Riskier)</h4>
                                <p className="text-gray-300 text-sm mb-2">
                                  The Exponential curve (OffsetProgressive) rewards early stakers significantly more, as each new deposit increases the share price at an increasing rate, creating higher potential returns for curators who stake earliest, but greater potential losses as stakers redeem.
                                </p>
                                <p className="text-gray-300 text-sm">
                                  Choose based on your risk tolerance and timing. It's riskier but can yield higher returns; however, if you deposit later, you will pay more for the same amount of shares.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center mt-2 w-full px-4">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={transactionAmount || ""}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        autoFocus
                        className="bg-transparent text-white text-3xl text-center outline-none
               w-full max-w-[400px] h-12
               appearance-none
               [&::-webkit-inner-spin-button]:appearance-none
               [&::-webkit-outer-spin-button]:appearance-none
               overflow-x-auto"
                      />
                      <span className="text-gray-300 text-xs font-normal mt-1">TRUST</span>

                      <button
                        type="button"
                        onClick={() => {
                          const max = formatEther(displayedShares);
                          setTransactionAmount(max.toString());
                        }}
                        className="mt-4 px-2 py-1 text-xs text-white bg-[#0A2D4D] rounded-full border border-white hover:bg-[#123a63] hover:border-[#8B3EFE] transition-colors"
                      >
                        Max
                      </button>
                    </div>

                    <button
                      className={`mx-auto block px-5 py-1.5 rounded-3xl mt-4 text-sm transition-colors ${transactionAmount &&
                        Number(transactionAmount) > 0 &&
                        Number(transactionAmount) <= Number(tTrustBalance) / 10 ** 18
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        }`}
                      onClick={() => setShowReviewRedeemModal(true)}
                      disabled={
                        !transactionAmount ||
                        Number(transactionAmount) <= 0 ||
                        Number(transactionAmount) > maxRedeemable
                      }
                    >
                      {transactionAmount
                        ? Number(transactionAmount) > maxRedeemable
                          ? "Check Your Position"
                          : "Review Redeem"
                        : "Enter an Amount"}
                    </button>

                    {transactionAmount &&
                      Number(transactionAmount) > maxRedeemable && (
                        <span className="text-red-500 text-xs mt-1 block text-center">
                          "You only have {maxRedeemable} shares"
                        </span>
                      )}
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {showReviewDepositModal && activeClaim && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#0c081e]/80 w-full max-w-md mx-4 p-6 rounded-3xl relative border border-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/10">

                <button
                  className="absolute -top-1 pb-2 left-2 text-white text-2xl px-2 py-1 rounded hover:bg-gray-700/50 transition-colors"
                  onClick={() => {
                    setShowReviewDepositModal(false);
                    setModalStep("review");
                  }}
                >
                  ←
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-white text-base mt-2">Stake</h2>
                  <span
                            className="bg-[#0A2D4D] text-white text-[9px] px-1 py-[1px] rounded-full cursor-pointer transition-colors duration-200 hover:bg-white hover:text-[#0A2D4D] hover:border-[#0A2D4D]"
                          >
                            {opposeMode ? "Oppose" : "Support"}
                          </span>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                  Staking on a Triple enhances its discoverability in the Intuition system.
                </p>

                {modalStep === "review" && (
                  <>
                    <div className="flex flex-col items-center my-6">
                      <img src="/spinner.png" alt="Spinner" className="w-16 h-16 mb-2" />
                      <span className="text-white">Review...</span>
                    </div>

                    <button
                      className="mx-auto block bg-white text-black px-6 py-1.5 rounded-3xl text-sm"
                      onClick={() => {
                        console.log("[ACTION] confirmDeposit", { termId, amount: transactionAmount });
                        handleClaimAction("deposit");
                        setShowModal(false);
                      }}
                    >
                      Confirm
                    </button>
                  </>
                )}

                {modalStep === "awaiting" && (
                  <>
                    <div className="flex flex-col items-center my-6">
                      <img src="/spinner.png" alt="Spinner" className="w-16 h-16 mb-2" />
                      <span className="text-white">Awaiting...</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-[#110A2B] border border-[#393B60] rounded-2xl px-4 py-2 mx-4">
                      <img src="/wallet.png" alt="Wallet Icon" className="w-5 h-5" />
                      <span className="text-white text-sm">
                        Awaiting wallet approval
                      </span>
                      <div className="relative group">
                        <span className="text-gray-400 cursor-pointer text-sm">
                          ?
                        </span>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Approve this transaction in your wallet
                        </div>
                      </div>
                    </div>
                  </>
                )}

{modalStep === "success" && (
  <div className="flex flex-col items-center my-8">
    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
      <span className="text-white text-2xl">✓</span>
    </div>

    <span className="text-white mb-2">
      Successfully {opposeMode ? "opposed" : "supported"}!
    </span>

    <a
      href={transactionLink} // this is where you will add the explorer link stuff
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 flex items-center gap-1 mb-6 hover:underline"
    >
      View Transaction on Explorer
    </a>

    <button
      className="bg-white text-black px-6 py-2 rounded-3xl text-sm"
      onClick={() => {
        setShowReviewDepositModal(false);
        setModalStep("review");
      }}
    >
      Done
    </button>
  </div>
)}

                {modalStep === "failed" && (
                  <div className="flex flex-col items-center my-8">
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
                      <span className="text-white text-2xl">✕</span>
                    </div>

                    <span className="text-white mb-6">
                      Transaction Failed
                    </span>

                    <button
                      className="bg-white text-black px-6 py-2 rounded-3xl text-sm"
                      onClick={() => setModalStep("review")}
                    >
                      Try Again
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {showReviewRedeemModal && activeClaim && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#0c081e]/80 w-full max-w-md mx-4 p-6 rounded-3xl relative border border-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/10">

                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
                  onClick={() => setShowReviewRedeemModal(false)}
                >
                  ×
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-white text-base">Stake</h2>
                  <span
                            className="bg-[#0A2D4D] text-white text-[9px] px-1 py-[1px] rounded-full cursor-pointer transition-colors duration-200 hover:bg-white hover:text-[#0A2D4D] hover:border-[#0A2D4D]"
                          >
                            {opposeMode ? "Oppose" : "Support"}
                          </span>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                  Staking on a Triple enhances its discoverability in the Intuition system.
                </p>

                {modalStep === "review" && (
                  <>
                    <div className="flex flex-col items-center my-6">
                      <img src="/spinner.png" alt="Spinner" className="w-16 h-16 mb-2" />
                      <span className="text-white">Review...</span>
                    </div>

                    <button
                      className="mx-auto block bg-white text-black px-6 py-1.5 rounded-3xl text-sm"
                      onClick={() => {
                        console.log("[ACTION] confirmRedeem", { termId, amount: transactionAmount });
                        handleClaimAction("redeem");
                        setShowModal(false);
                      }}
                    >
                      Confirm
                    </button>
                  </>
                )}

                {modalStep === "awaiting" && (
                  <>
                    <div className="flex flex-col items-center my-6">
                      <img src="/spinner.png" alt="Spinner" className="w-16 h-16 mb-2" />
                      <span className="text-white">Awaiting...</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-[#110A2B] border border-[#393B60] rounded-2xl px-4 py-2 mx-4">
                      <img src="/wallet.png" alt="Wallet Icon" className="w-5 h-5" />
                      <span className="text-white text-sm">
                        Awaiting wallet approval
                      </span>
                      <div className="relative group">
                        <span className="text-gray-400 cursor-pointer text-sm">
                          ?
                        </span>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Approve this transaction in your wallet
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {modalStep === "success" && (
                  <div className="flex flex-col items-center my-8">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
                      <span className="text-white text-2xl">✓</span>
                    </div>

                    <span className="text-white mb-6">
                      Successfully redeemed shares!
                    </span>

                    <a
                      href={transactionLink} // this is where you will add the explorer link stuff
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 flex items-center gap-1 mb-6 hover:underline"
                    >
                      View Transaction on Explorer
                    </a>

                    <button
                      className="bg-white text-black px-6 py-2 rounded-3xl text-sm"
                      onClick={() => {
                        setShowReviewRedeemModal(false);
                        setModalStep("review");
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}

                {modalStep === "failed" && (
                  <div className="flex flex-col items-center my-8">
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
                      <span className="text-white text-2xl">✕</span>
                    </div>

                    <span className="text-white mb-6">
                      Transaction Failed
                    </span>

                    <button
                      className="bg-white text-black px-6 py-2 rounded-3xl text-sm"
                      onClick={() => setModalStep("review")}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}

          {hasNoResults && (
  <div className="flex flex-col items-center justify-center mt-6 text-gray-500">
    <p className="text-sm">No claims found</p>
    <p className="text-xs opacity-70">Try a different keyword</p>
  </div>
)}

                  {searchLoading && (
  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 justify-center py-6">
    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
    Searching...
  </div>
)}


          <div ref={observerRef} className="h-10"></div>
          <XPRewardPopup forceShow={showPopup} onClose={() => setShowPopup(false)} />
    </div>
  );
}