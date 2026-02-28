
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react"
import { Address, formatEther, parseEther } from "viem";
import { formatNumber } from "../lib/utils";
import { toFixed } from "./PortalClaims";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Line,
} from "recharts";
import { apiRequestV2 } from "../lib/queryClient";
import { useAuth } from "../lib/auth";
import { useWallet } from "../hooks/use-wallet";
import { buyShares, sellShares } from "../services/web3";
import { useToast } from "../hooks/use-toast";
import { Term, Position } from "../types/types";
import { getPublicClient, getWalletClient } from "../lib/viem";
import { multiVaultPreviewDeposit, multiVaultPreviewRedeem, getMultiVaultAddressFromChainId } from "@0xintuition/sdk";
import Chart from "react-apexcharts";

function generateChartData(claim: any, growthType: string) {
  // For demo: use fixed pattern similar to your spec
  const dates = ["20/01", "25/01", "30/01", "05/02", "10/02", "15/02", "20/02"];
  let values = [105, 104, 104, 105, 106, 105.5, 110];

  if (growthType === "exponential") {
    // small variation for demo exponential growth
    values = values.map((v, i) => 104 + i ** 1.3);
  }

  return dates.map((date, i) => ({ date, value: values[i] }));
}


export default function ClaimDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("support");
  const [isBuy, setIsBuy] = useState(true);
  const [positionType, setPositionType] = useState("support");
  const [growthType, setGrowthType] = useState("linear");
  const [positionsOption, setPositionsOption] = useState("");
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]); // all positions
  const [userPositions, setUserPositions] = useState<Position[]>([]); // my positions
  const [visiblePositions, setVisiblePositions] = useState<Position[]>([]); // paginated slice
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const [claim, setClaim] = useState<any | null>(null);
  const [buying, setBuying] = useState(false);
  const [selling, setSelling] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [term, setTerm] = useState<Term>({});
  const [counterTerm, setCounterTerm] = useState<Term>({});
  const [supportCount, setSupportCount] = useState(0);
  const [opposeCount, setOpposeCount] = useState(0);
  const [supportPercent, setSupportPercent] = useState(0);
  const [opposePercent, setOpposePercent] = useState(0);
  const [totalPostions, setTotalPositions] = useState("0");
  const [marketCap, setMarketCap] = useState("0");
  const [balance, setBalance] = useState("0");
  const [amountToReceive, setAmountToReceive] = useState("0");
  const [isToggled, setIsToggled] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState("")

  const { user } = useAuth();
  const { connectWallet } = useWallet();
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;

  const loadMorePositions = () => {
    if (!hasMore) return;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    const nextItems = positions.slice(start, end) as never[];

    setVisiblePositions(prev => [...prev, ...nextItems]);
    console.log(visiblePositions);

    if (end >= positions.length) {
      setHasMore(false);
    } else {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    setVisiblePositions([]);
    setPage(1);
    setHasMore(true);
  }, [positions]);

  useEffect(() => {
    loadMorePositions();
  }, []);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMorePositions();
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
  }, [hasMore, page]);

  useEffect(() => {
    fetchClaim();
  }, [id]);

  useEffect(() => {
    (async () => {
      const curveId = growthType === "linear" ? 1n : 2n;
      const publicClient = getPublicClient();
      
      const walletClient = await getWalletClient();

      const address = getMultiVaultAddressFromChainId(walletClient.chain?.id!);

      let sharesAmount = 0n;

      if (isBuy && buyAmount) {
        const [shares] = await multiVaultPreviewDeposit(
          { address, walletClient, publicClient },
          { args: [id as "0x", curveId, parseEther(buyAmount)] }
        );
        sharesAmount = shares;

      } else if (!isBuy && sellAmount) {
        const [shares] = await multiVaultPreviewRedeem(
          { address, walletClient, publicClient },
          { args: [id as "0x", curveId, parseEther(sellAmount)] }
        );
        sharesAmount = shares;
      }

      setAmountToReceive(formatEther(sharesAmount));
    })();
  }, [buyAmount, sellAmount]);

  useEffect(() => {
    (async () => {
      if (user) {
        const userBalance = await getBalance();
        setBalance(userBalance);
      }
    })();
  }, [user]);

  async function fetchClaim() {
    const fetched = await apiRequestV2("GET", "/api/get-triple?termId=" + id);
    setClaim(fetched);

    // Support / Oppose totals
    const supportAssets = parseFloat(formatEther(BigInt(fetched.term.total_assets)));
    const opposeAssets = parseFloat(formatEther(BigInt(fetched.counter_term.total_assets)));
    const totalAssets = supportAssets + opposeAssets;

    setSupportCount(supportAssets);
    setOpposeCount(opposeAssets);
    setSupportPercent((supportAssets / totalAssets) * 100);
    setOpposePercent((opposeAssets / totalAssets) * 100);

    setTotalPositions(formatNumber(parseInt(fetched.total_position_count)));
    setMarketCap(formatNumber(parseFloat(formatEther(BigInt(fetched.total_market_cap)))));

    setTerm(fetched.term);
    setCounterTerm(fetched.counter_term);

    // All positions
    const allPositions = [
      ...(fetched.term.positions ?? []),
      ...(fetched.counter_term.positions ?? []),
    ];
    setPositions(allPositions);

    // My positions (from vaults)
    const myPositions = [
      ...(fetched.term.vaults?.[0]?.userPosition ?? []),
      ...(fetched.term.vaults?.[1]?.userPosition ?? []),
      ...(fetched.counter_term.vaults?.[0]?.userPosition ?? []),
      ...(fetched.counter_term.vaults?.[1]?.userPosition ?? []),
    ];
    setUserPositions(myPositions);

    // Initially show first page for active tab
    const initial = activeTab === "all" ? allPositions : myPositions;
    setVisiblePositions(initial.slice(0, ITEMS_PER_PAGE));
  };

  function getPrice() {
    let sharePrice = "0";

    const counterSharePrice = (index: number) => {
      return toFixed(formatEther(BigInt(counterTerm.vaults[index].current_share_price)));
    }

    const supportSharePrice = (index: number) => {
      return toFixed(formatEther(BigInt(term.vaults[index].current_share_price)));
    }

    if (activeTab === "support") {
      sharePrice = growthType === "linear" ? supportSharePrice(0) : supportSharePrice(1);
    } else {
      sharePrice = growthType === "linear" ? counterSharePrice(0) : counterSharePrice(1);
    }

    return sharePrice;
  }

  const handleClaimAction = async () => {
    try {
      const curveId = growthType === "linear" ? 1n : 2n;
      
      const address = activeTab === "support" ? id : counterTerm.id;

      if (isBuy) {
        if (!buyAmount) {
          toast({ title: "Error", description: "select a buy amount to proceed", variant: "destructive" });
          return;
        }

        setBuying(true);
        await buyShares(buyAmount, address as Address, curveId);
        setBuying(false);
      } else {
        if (!sellAmount) {
          toast({ title: "Error", description: "select a sell amount to proceed", variant: "destructive" });
          return;
        }

        setSelling(true);
        await sellShares(sellAmount, address as Address, curveId);
        setSelling(false);
      }

      toast({ title: "Success", description: `Shares ${isBuy ? "bought" : "sold"} successfully!` });
    } catch (error) {
      console.error(error);
      setSelling(false);
      setBuying(false);
      toast({ title: "error", description: `error ${isBuy ? "buying" : "selling"} shares`, variant: "destructive" })
    }
  }

  const handleConnectWallet = async () => {
    await connectWallet();
  }

  async function getBalance() {
    const publicClient = getPublicClient();

    const balance = await publicClient?.getBalance({ address: user?.address as Address });

    return formatEther(balance ?? 0n);
  }

  if (!claim) return <div className="p-6 text-white">Claim not found</div>;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////
  // filter user's positions based on positionType
const filteredPositions = userPositions.filter(p =>
  positionType === "support"
    ? Number(p.curve_id) === 1
    : Number(p.curve_id) === 2
);

// total shares owned
const totalShares = filteredPositions.reduce(
  (acc, p) => acc + Number(formatEther(BigInt(p.shares ?? 0))),
  0
);

// total spent (bought)
const totalBought = filteredPositions.reduce(
  (acc, p) => acc + Number(formatEther(BigInt(p.amount ?? 0))), // assuming p.amount is what user spent
  0
);

// current value = total shares * current share price
const currentSharePrice =
  activeTab === "support"
    ? Number(getPrice()) // your getPrice already handles support/oppose & growthType
    : Number(getPrice());

const currentValue = totalShares * currentSharePrice;

// P&L
const profitLoss = currentValue - totalBought;

// ownership %
const totalMarketShares =
  positionType === "support"
    ? parseFloat(formatEther(BigInt(term.total_assets)))
    : parseFloat(formatEther(BigInt(counterTerm.total_assets)));

const ownershipPercent = totalMarketShares
  ? (totalShares / totalMarketShares) * 100
  : 0;

  type Transaction = {
  type: "Deposit" | "Withdraw" | "Buy" | "Sell"; 
  amount: number; 
  timestamp: string; 
  icon?: string; 
  color?: string;
};

const recentTransactions: Transaction[] = [
  {
    type: "Deposit",
    amount: 0.0972,
    timestamp: "2026-02-28T20:13:00Z",
    icon: "/download.png",
    color: "#00FF62",
  },
  {
    type: "Withdraw",
    amount: 0.05,
    timestamp: "2026-02-27T15:45:00Z",
    icon: "/withdraw.png",
    color: "#FF4C4C",
  },
];

  return (
    <div className="p-6 text-white space-y-6">
      {/* Top Statement */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="bg-gray-700 px-1 rounded flex items-center gap-1">
          <img src={term.triple.subject.image} alt="Claim Icon" className="w-5 h-5" />
          {term.triple.subject.label}
        </span>
        <span>{term.triple.predicate.label}</span>

        <span className="bg-gray-700 px-1 rounded">{term.triple.object.label}</span>
      </div>

      {/* Support / Oppose Cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Support Card */}
        <div className="flex-1 bg-[#006CD233] border border-[#393B60] rounded-xl p-4 flex flex-col gap-3">
          {/* Heading */}
          <span className="font-semibold text-lg text-[#006CD2]">SUPPORT</span> {/* increased from default btw */}

          {/* TRUST, intuition icon, support number + user icon */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm md:text-base">{toFixed(formatEther(BigInt(term.total_assets)))} TRUST</span> {/* slightly larger */}
            <img src="/intuition-icon.png" alt="Intuition Icon" className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-semibold text-base md:text-lg">{formatNumber(term.positions_aggregate.aggregate.count)}</span> {/* increased also */}
              <img src="/user.png" alt="User Icon" className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Oppose Card */}
        <div className="flex-1 bg-[#F19C0333] border border-[#393B60] rounded-xl p-4 flex flex-col gap-3">
          {/* Heading */}
          <span className="font-semibold text-lg text-[#F19C03]">OPPOSE</span>

          {/* TRUST, intuition icon, oppose number + user icon */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm md:text-base">{toFixed(formatEther(BigInt(counterTerm.total_assets)))} TRUST</span>
            <img src="/intuition-icon.png" alt="Intuition Icon" className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <span className="text-[#F19C03] font-semibold text-base md:text-lg">{formatNumber(counterTerm.positions_aggregate.aggregate.count)}</span>
              <img src="/user-red.png" alt="User Icon" className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-5 bg-gray-700 rounded-lg overflow-hidden relative flex">
        {/* Support */}
        <div
          className="bg-blue-600 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
          style={{ width: `${supportPercent}%` }}
        >
          {supportPercent.toFixed(0)}%
        </div>

        {/* Oppose */}
        <div
          className="bg-[#F19C03] flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
          style={{ width: `${opposePercent}%` }}

        >
          {opposePercent.toFixed(0)}%
        </div>
      </div>

      <div>
        {/* Total Market Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          {/* Total Market Cap */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total Market Cap</span>
            <span className="font-bold text-xl text-white">
              {marketCap} TRUST
            </span>
            <img src="/intuition-icon.png" alt="Intuition Icon" className="w-5 h-5" />
          </div>

          {/* Divider */}
          <span className="hidden sm:block border-l border-gray-500 h-6"></span>

          {/* Total Position */}
          <div className="flex items-center gap-2">
            <span>Total Position:</span>
            <span className="font-semibold">{totalPostions}</span>
          </div>

          {/* Divider */}
          <span className="hidden sm:block border-l border-gray-500 h-6"></span>

          {/* Creator */}
          <div className="flex items-center gap-2">
            <span>Creator:</span>
            <span className="font-semibold">{term.triple.creator.label}</span>
          </div>

          {/* Share Button */}
          <button
            onClick={() => {
              const textToShare = `${marketCap} TRUST | Total Position: ${totalPostions}`;
              navigator.clipboard.writeText(textToShare)
                .then(() => alert("Copied to clipboard!"))
                .catch(() => alert("Failed to copy."));
            }}
            className="ml-auto px-4 py-2 bg-[#110A2B] border border-[#393B60] rounded-md text-white font-semibold hover:bg-[#1A0F3D] transition-colors duration-200"
          >
            Share
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Graph Placeholder (70%) */}
        <div className="w-full lg:w-[70%] bg-gradient-to-br from-[#1A0A2B] to-[#0B0515] rounded-xl p-4 shadow-lg">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-400">Share Price</span>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {getPrice()} TRUST
              </div>
            </div>

                {/* Toggle Linear / Exponential */}
    <div className="flex rounded-full bg-[#1F123A] p-1">
      {["linear", "exponential"].map((type) => (
        <button
          key={type}
          onClick={() => setGrowthType(type)}
          className={`px-4 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
            growthType === type
              ? "bg-[#392D5F] text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  </div>

{/* ApexCharts Area Graph - Deep Complex Purple */}
<Chart
  type="area"
  height={280}
  series={[
    {
      name: "Share Price",
      data: generateChartData(claim, growthType).map(d => ({
        x: d.date,
        y: d.value,
      })),
    },
  ]}
  options={{
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: "easeinout", speed: 800 },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3, colors: ["#AD77FF"] },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        gradientToColors: ["#8B3EFE"],
        opacityFrom: 0.6,
        opacityTo: 0.3,
        stops: [0, 50, 100],
      },
    },
    xaxis: {
      type: "category",
      labels: { style: { colors: "#BDAFFF" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: true, width: 1, color: "#8B3EFE" },
    },
    yaxis: {
      show: true,
      min: Math.min(...generateChartData(claim, growthType).map(d => d.value)) * 0.95,
      max: Math.max(...generateChartData(claim, growthType).map(d => d.value)) * 1.05,
      labels: { style: { colors: "#BDAFFF" }, formatter: val => val.toFixed(2) },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      intersect: false,
      x: { show: true },
      y: { formatter: val => `${val} TRUST` },
    },
    grid: { show: false },
  }}
/>

        </div>

        {/* Control Card (20%) */}
        <div className="w-full lg:w-[30%] bg-gray-900 rounded-xl p-4 flex flex-col gap-4">
          {/* Support / Oppose Tabs */}
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-md py-2 font-semibold ${activeTab === "support"
                ? "bg-[#0A2D4D] border border-[#006CD2] text-white"
                : "bg-gray-800 border border-gray-700 text-gray-400"
                }`}
              onClick={() => setActiveTab("support")}
            >
              Support
            </button>

            <button
              className={`flex-1 rounded-md py-2 font-semibold ${activeTab === "oppose"
                ? "bg-[#0A2D4D] border border-[#006CD2] text-white"
                : "bg-gray-800 border border-gray-700 text-gray-400"
                }`}
              onClick={() => setActiveTab("oppose")}
            >
              Oppose
            </button>
          </div>

          {/* Buy / Sell Toggle */}
<div className="flex w-full overflow-hidden select-none cursor-pointer bg-[#060210] border border-[#006CD2] rounded-full">
  {/* Buy */}
  <div
    onClick={() => setIsBuy(true)}
    className={`flex-1 flex items-center rounded-full justify-center font-semibold text-base h-10 transition-colors duration-300 ${
      isBuy ? "bg-[#8B3EFE] text-white rounded-l-3xl" : "bg-[#060210] text-white rounded-l-3xl"
    }`}
  >
    Buy
  </div>

  {/* Sell */}
  <div
    onClick={() => setIsBuy(false)}
    className={`flex-1 flex items-center rounded-full justify-center font-semibold text-base h-10 transition-colors duration-300 ${
      !isBuy ? "bg-[#8B3EFE] text-white rounded-r-3xl" : "bg-[#060210] text-white rounded-r-3xl"
    }`}
  >
    Sell
  </div>
</div>

                    {/* Linear Curve Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white">Linear Curve</h3>
              <p className="text-gray-400 text-sm">Low Risk, Low Reward</p>
            </div>
            {/* Toggle button */}
<button
  onClick={() => setIsToggled(!isToggled)}
  className={`bg-gray-700 w-12 h-6 rounded-full relative transition-colors duration-300 ${
    isToggled ? "bg-purple-400" : "bg-gray-700"
  }`}
>
  <span
    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
      isToggled ? "left-6" : "left-0.5"
    }`}
  ></span>
</button>
          </div>

          {/* Amount Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-gray-400">Amount: {balance}</span>
            <span className="text-gray-400">TRUST</span>
          </div>

          {/* Inputs */}
          <div className="w-full bg-gray-800 rounded-md border border-[#833AFD] flex items-center px-2">
            <input
              type="text"
              placeholder="0.1"
              onChange={(e) => isBuy ? setBuyAmount(e.target.value) : setSellAmount(e.target.value)}
              className="flex-1 bg-gray-800 text-white p-2 outline-none"
            />
            <span className="text-gray-400 ml-2">min</span>
          </div>
          <input
            type="text"
            placeholder="Amount you receive"
            value={amountToReceive}
            disabled={true}
            className="w-full bg-gray-800 text-white p-2 rounded-md outline-none border border-[#833AFD]"
          />

          {/* Connect / Buy / Sell Button */}
<button
  onClick={async () => {
    if (!user) {
      await handleConnectWallet();
      return;
    }
    await handleClaimAction();
  }}
  className="flex items-center justify-center gap-2 bg-white text-black font-semibold py-2 rounded-3xl"
>
  <img src="/key.png" alt="Key Icon" className="w-5 h-5" />
  {user
    ? isBuy
      ? buying
        ? "Buying"
        : "Buy"
      : selling
      ? "Selling"
      : "Sell"
    : "Connect Wallet"}
</button>
        </div>
      </div>

      
      {/* Your Position Card */}
      <div className="bg-[#110A2B] rounded-xl p-4 flex flex-col gap-4">
        {/* Header Line */}
        <div className="flex items-center gap-3 text-white text-lg font-semibold">
          <span>Your Position</span>

          {/* Styled Hyphen */}
          <div className="w-6 h-[3px] bg-[#AD77FF] rounded-full"></div>

          <span>
            Support: <span className="font-bold">0.0954 TRUST</span>
          </span>
        </div>

        {/* White Divider */}
        <div className="h-px w-full bg-white opacity-80"></div>
      </div>

      {/* Dual Toggles */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">

        {/* Left Toggle — Support / Oppose */}
        <div className="w-full sm:w-1/2 lg:w-[15%]">
          <div className="flex rounded-md border border-[#393B60] w-full h-12 overflow-hidden">

            <div
              onClick={() => setPositionType("support")}
              className={`flex-1 flex items-center justify-center font-semibold text-lg transition-colors duration-300 cursor-pointer ${positionType === "support"
                ? "bg-[#FFFFFF2B] text-white"
                : "bg-[#060210] text-white"
                }`}
            >
              Support
            </div>

            <div
              onClick={() => setPositionType("oppose")}
              className={`flex-1 flex items-center justify-center font-semibold text-lg transition-colors duration-300 cursor-pointer ${positionType === "oppose"
                ? "bg-[#FFFFFF2B] text-white"
                : "bg-[#060210] text-white"
                }`}
            >
              Oppose
            </div>

          </div>
        </div>

        {/* Right Toggle — Linear / Exponential */}
        <div className="w-full sm:w-1/2 lg:w-[20%]">
          <div className="flex rounded-md border border-[#393B60] w-full h-12 overflow-hidden">

            <div
              onClick={() => setGrowthType("linear")}
              className={`flex-1 flex items-center justify-center font-semibold text-lg transition-colors duration-300 cursor-pointer ${growthType === "linear"
                ? "bg-[#FFFFFF2B] text-white"
                : "bg-[#060210] text-white"
                }`}
            >
              Linear
            </div>

            <div
              onClick={() => setGrowthType("exponential")}
              className={`flex-1 flex items-center justify-center font-semibold text-lg transition-colors duration-300 cursor-pointer ${growthType === "exponential"
                ? "bg-[#FFFFFF2B] text-white"
                : "bg-[#060210] text-white"
                }`}
            >
              Exponential
            </div>

          </div>
        </div>

      </div>

      {/* Support Position Card */}
      <div className="bg-[#110A2B] rounded-xl p-5 mt-6 flex flex-col gap-6 text-white">

        {/* Title Section */}
        <div>
          <h3 className="font-semibold text-lg">Support Position</h3>
          <p className="text-gray-400 text-sm">The Ticker (Progressive)</p>
        </div>

        {/* 5 Equal Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

          {/* A */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-sm">Current Value</span>
            <span className="font-semibold">0.0954 TRUST</span>
          </div>

          {/* B */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-sm">Total Bought</span>
            <span>0.0972 TRUST</span>
          </div>

          {/* C */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-sm">P&amp;L</span>
            <span className="text-red-400">-0.0019 TRUST</span>
          </div>

          {/* D */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-sm">Shares</span>
            <span>0</span>
          </div>

          {/* E */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-sm">Ownership</span>
            <span>0.000%</span>
          </div>

        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-[#110A2B] rounded-xl p-5 mt-6 text-white flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Recent Activity</h3>
          <button className="text-sm text-[#8B3EFE] hover:underline">
            Show all
          </button>
        </div>

        {/* Inner Transaction Card */}
        <div className="bg-[#060210] rounded-xl p-4 flex flex-col gap-4">

          {/* Top Row */}
          <div className="relative flex items-center justify-between">

            {/* Left Side */}
            <div className="flex items-center gap-4">
              <img
                src="/download.png"
                alt="Download"
                className="w-5 h-5 object-contain"
              />

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  Deposit
                </span>
                <span className="font-semibold text-[#00FF62]">
                  0.0972 TRUST
                </span>
              </div>
            </div>

            {/* Right Side */}
            <span className="text-2xl font-bold text-[#00FF62] self-center ml-auto">
              0.0972 TRUST
            </span>

          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>08:13PM</span>
          </div>

        </div>

      </div>

      {/* Positions on this Claim Section */}
      <div className="bg-[#110A2B] rounded-xl p-5 text-white flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-2 justify-start">
          <button
            className={`rounded-md py-2 px-4 font-semibold ${activeTab === "all"
              ? "bg-[#0A2D4D] border border-[#006CD2] text-white"
              : "bg-gray-800 border border-gray-700 text-gray-400"
              }`}
            onClick={() => setActiveTab("all")}
          >
            All Positions
          </button>

          <button
            className={`rounded-md py-2 px-4 font-semibold ${activeTab === "my"
              ? "bg-[#0A2D4D] border border-[#006CD2] text-white"
              : "bg-gray-800 border border-gray-700 text-gray-400"
              }`}
            onClick={() => setActiveTab("my")}
          >
            My Position
          </button>
        </div>



        {/* Dynamic Heading */}
        <h3 className="font-semibold text-lg">
          {activeTab === "all"
            ? "All Positions on this Claim"
            : "My Position on this Claim"}
        </h3>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Positions Input */}
          <input
            type="text"
            placeholder="Search positions"
            className="w-full lg:w-1/2 bg-[#06021A] border border-[#393B60] text-white p-2 rounded-2xl outline-none"
          />

          {/* Positions / Sort Input */}
          {/* Positions / Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">Positions:</span>

            <div className="relative w-48">
              <select
                value={positionsOption}
                onChange={(e) => setPositionsOption(e.target.value)}
                className="appearance-none w-full bg-[#06021A] border border-[#393B60] rounded-2xl px-4 py-2 pr-10 text-white focus:outline-none"
              >
                <option value="all">All</option>
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
                <option value="support">Support</option>
                <option value="oppose">Oppose</option>
              </select>

              {/* Icon inside the select */}
              <img
                src="/up-down.png"
                alt="Dropdown"
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          {/* Sort Input */}
          <div className="flex items-center gap-2 bg-[#06021A] border border-[#393B60] rounded-2xl px-2 py-2">
            <input
              type="text"
              placeholder="Sort"
              className="bg-transparent outline-none text-white"
            />
            <img src="/up-down.png" alt="Dropdown" className="w-4 h-4" />
          </div>
        </div>


        {/* TABLE */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {visiblePositions.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No positions found</div>
            ) : (
              <div className="flex flex-col gap-2">

                {/* Header Row */}
                <div className="bg-[#060210] p-3 rounded-md flex items-center text-gray-400 font-semibold text-sm">
                  <div className="w-[5%] text-center">#</div>
                  <div className="w-[45%]">Account</div>
                  <div className="w-[15%] text-center">Curve</div>
                  <div className="w-[20%] text-right">Shares</div>
                </div>

                {/* Rows */}
                {visiblePositions.map((pos, idx) => (
                  <div
                    key={idx}
                    className="bg-[#110A2B] p-4 rounded-md flex items-center text-white"
                  >
                    {/* Serial Number */}
                    <div className="w-[5%] text-gray-400 font-semibold text-center">
                      {idx + 1}
                    </div>

                    {/* Account */}
                    <div className="w-[45%] flex items-center gap-2 truncate">
                      {pos.account?.image && (
                        <img
                          src={pos.account.image}
                          alt={pos.account.label ?? "User"}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <span className="font-semibold truncate">
                        {pos.account?.label ?? pos.account?.id ?? "Anonymous"}
                      </span>
                    </div>

                    {/* Curve */}
                    <div className="w-[15%] text-center text-gray-400">
                      {Number(pos.curve_id) === 1
                        ? "Linear"
                        : Number(pos.curve_id) === 2
                          ? "Exponential"
                          : "—"}
                    </div>

                    {/* Shares */}
                    <div className="w-[20%] text-right font-semibold">
                      {toFixed(formatEther(BigInt(pos.shares ?? 0)))} TRUST
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Observer div for infinite scroll */}
            <div ref={observerRef} className="h-10"></div>

            {/* Spinner */}
            {loading && (
              <div className="flex justify-center my-4">
                <div className="loader"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
