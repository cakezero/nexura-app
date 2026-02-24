"use client";

import { ResponsivePie } from "@nivo/pie";

interface DesktopCardsProps {
  usersJoined: number;
  tasksCompleted: number;
  totalQuests: number;
  totalCampaigns: number;
  totalTrustDistributed: number;
  totalOnchainInteractions: number;
  totalOnchainClaims: number;
}

export default function DesktopCards({
  usersJoined,
  tasksCompleted,
  totalQuests,
  totalCampaigns,
  totalTrustDistributed,
  totalOnchainInteractions,
  totalOnchainClaims,
}: DesktopCardsProps) {
  const remaining = Math.max(totalOnchainInteractions - totalOnchainClaims, 0);
  const mints = Math.floor(remaining * 0.5);
  const payments = remaining - mints;
  const interactionData = [
    { id: 'Claims', label: 'Claims', value: Math.max(totalOnchainClaims, 0), color: '#a855f7' },
    { id: 'Mints', label: 'Mints', value: Math.max(mints, 0), color: '#3b82f6' },
    { id: 'Payments', label: 'Payments', value: Math.max(payments, 0), color: '#10b981' },
  ];
  const hasData = totalOnchainInteractions > 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* TOTAL QUESTS CREATED */}
      <div className="glass glass-hover shimmer-once rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-purple-500/40 hover:border-purple-400/70 transition-all duration-300 group min-h-[140px]">
        <h2 className="text-purple-400 font-bold text-base tracking-widest uppercase">
          Total Quests Created
        </h2>
        <p className="text-4xl font-bold text-purple-300 mt-4 group-hover:text-white transition-colors duration-300">{totalQuests}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-white/50 text-xs uppercase tracking-wider">
            Verified Ecosystem Tasks
          </span>
          <img src="/quest-icon.png" alt="Quest Icon" className="w-7 h-7 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Join vs Completion Ratio */}
      <div className="glass glass-hover rounded-2xl p-4 flex flex-col items-center border border-purple-500/40 hover:border-purple-400/70 transition-all duration-300 sm:col-span-2 lg:col-span-1">
        <h2 className="text-white font-bold text-center text-lg mb-4">
          Join vs Completion Ratio
        </h2>

        <div className="relative w-48 h-48 sm:w-56 sm:h-56" style={{ height: 220 }}>
          <ResponsivePie
            data={[
              { id: 'Tasks Completed', value: Math.min(tasksCompleted, usersJoined) },
              { id: 'Users Not Completed', value: Math.max(usersJoined - tasksCompleted, 0) },
            ]}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            innerRadius={0.6}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={['#3B82F6', '#833AFD']}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={false}
            enableArcLabels={false}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            theme={{
              tooltip: {
                container: {
                  background: '#333333',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                },
              },
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-white font-bold text-2xl">
              {usersJoined === 0 ? 0 : ((Math.min(tasksCompleted, usersJoined) / usersJoined) * 100).toFixed(2)}%
            </p>
            <span className="text-white text-xs">Completion</span>
          </div>
        </div>
        {/* Legend Boxes */} <div className="mt-4 flex flex-col gap-3 w-full items-center"> <div className="w-full bg-gray-700/50 border border-purple-500 rounded-lg px-3 py-2 flex justify-between items-center"> <div className="flex items-center gap-2"> <span className="w-3 h-3 bg-purple-500 rounded-full"></span> <span className="text-white text-sm">Users Joined</span> </div> <span className="text-white text-sm font-semibold">{usersJoined}</span> </div> <div className="w-full bg-gray-700/50 border border-purple-500 rounded-lg px-3 py-2 flex justify-between items-center"> <div className="flex items-center gap-2"> <span className="w-3 h-3 bg-blue-500 rounded-full"></span> <span className="text-white text-sm">Tasks Completed</span> </div> <span className="text-white text-sm font-semibold">{tasksCompleted}</span> </div> </div>
      </div>

      {/* TOTAL $TRUST DISTRIBUTED */}
      <div className="glass glass-hover shimmer-once rounded-2xl p-4 sm:p-5 border border-purple-500/40 hover:border-purple-400/70 transition-all duration-300 min-h-[100px]">
        <div className="grid grid-cols-2 h-full gap-2">
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-white font-bold text-sm tracking-wide leading-tight">
              TOTAL $TRUST DISTRIBUTED
            </h2>
            <div className="flex items-center mt-2 gap-2">
              <img src="/trust-icon.png" alt="Trust Icon" className="w-10 h-5 object-contain flex-shrink-0" />
              <p className="text-3xl font-semibold text-white truncate">{totalTrustDistributed.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <img src="/intuition-icon.png" alt="Intuition Icon" className="w-16 h-16 rounded-lg object-cover" />
          </div>
        </div>
      </div>

      {/* TOTAL CAMPAIGNS CREATED */}
      <div className="glass glass-hover shimmer-once rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-purple-500/40 hover:border-purple-400/70 transition-all duration-300 group min-h-[140px]">
        <h2 className="text-purple-400 font-bold text-base tracking-widest uppercase">Total Campaigns Created</h2>
        <p className="text-4xl font-bold text-purple-300 mt-4 group-hover:text-white transition-colors duration-300">{totalCampaigns}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-white/50 text-xs uppercase tracking-wider">Verified Ecosystem Campaigns</span>
          <img src="/quest-icon.png" alt="Quest Icon" className="w-7 h-7 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* On-Chain Activity */}
      <div
        className="rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center sm:col-span-2 lg:col-span-1"
        style={{ background: 'linear-gradient(135deg, #833AFD 0%, #6028c7 100%)', boxShadow: '0 8px 32px rgba(131,58,253,0.45)' }}
      >
        <h2 className="text-white font-bold text-lg mb-4 text-center">On-Chain Activity</h2>
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-2" style={{ height: 180 }}>
          <ResponsivePie
            data={hasData ? interactionData : [{ id: 'None', label: 'None', value: 1, color: '#ffffff20' }]}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            innerRadius={0.62}
            padAngle={1.5}
            cornerRadius={4}
            activeOuterRadiusOffset={6}
            colors={hasData ? interactionData.map(d => d.color) : ['#ffffff20']}
            borderWidth={0}
            enableArcLinkLabels={false}
            enableArcLabels={false}
            animate={true}
            theme={{ tooltip: { container: { background: '#1a1a2e', color: '#fff', fontSize: '12px', padding: '6px 10px', borderRadius: '6px' } } }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-white font-bold text-2xl leading-none">{totalOnchainInteractions.toLocaleString()}</p>
            <span className="text-white/60 text-xs mt-0.5">Total</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full mt-1">
          {interactionData.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-white/70">{d.label}</span>
              </div>
              <span className="text-white font-semibold">{d.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
