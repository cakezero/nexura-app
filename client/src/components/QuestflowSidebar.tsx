import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "./ui/sidebar";
import React from "react";
import { Link, useLocation } from "wouter";
import AnimatedBackground from "./AnimatedBackground";

const mainNavItems = [
  { title: "Learn", subtitle: "", icon: "/sidebar-icons/learn.png", href: "/learn", activeClass: "nav-learn-active" },
  { title: "Explore", icon: "/sidebar-icons/explore.png", href: "/discover", activeClass: "nav-explore-active" },
  { title: "Referrals", icon: "/sidebar-icons/referrals.png", href: "/referrals", activeClass: "nav-referrals-active" },
  { title: "Quests", icon: "/sidebar-icons/quests.png", href: "/quests", activeClass: "nav-quests-active" },
  { title: "Campaigns", icon: "/sidebar-icons/campaigns.png", href: "/campaigns", activeClass: "nav-campaigns-active" },
  { title: "Ecosystem Dapps", icon: "/sidebar-icons/ecosystem-dapps.png", href: "/ecosystem-dapps", activeClass: "nav-ecosystem-dapps-active" },
  { title: "Leaderboard", icon: "/sidebar-icons/leaderboard.png", href: "/leaderboard", activeClass: "nav-leaderboard-active" },
  { title: "Portal Claims", icon: "/sidebar-icons/portal-claims.png", href: "/portal-claims", activeClass: "nav-portal-claims-active" },
  { title: "Analytics", icon: "/sidebar-icons/analytics.png", href: "/analytics", activeClass: "nav-analytics-active" },
  { title: "Nexura Studio", icon: "/sidebar-icons/nexura-studio.png", href: "/studio", activeClass: "nav-studio-active" },
];

export default function NexuraSidebar() {
  const [location] = useLocation();
  const [mounted, setMounted] = React.useState(false);
  const { setOpen } = useSidebar();
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col h-full"
    >
      <AnimatedBackground />
      <SidebarContent className="bg-black/55 backdrop-blur-sm relative z-10 flex flex-col h-full justify-between">
        {/* Logo */}
        <div className="h-16 border-b border-border/40 flex items-center overflow-hidden px-3 group-data-[collapsible=icon]:justify-center">
          {/* Collapsed: nex.png icon */}
          <img
            src="/nex.png"
            alt="Nexura"
            className="h-10 w-auto object-contain flex-shrink-0 transition-opacity duration-300 group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:block opacity-0 hidden"
          />
          {/* Expanded: full logo */}
          <img
            src="/nexura-logo.png"
            alt="Nexura"
            className="w-36 h-auto transition-opacity duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden"
          />
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="flex-1 overflow-auto">
          <SidebarGroupContent>
            <SidebarMenu
              className={`transform transition-all duration-500 ${
                mounted ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
              }`}
            >
              {mainNavItems.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href === "/" && (location === "/" || location === "/discover"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? item.activeClass : ""}
                    >
                      <Link
                        href={item.href}
                        className="w-full flex items-center gap-0 group-data-[collapsible=icon]:justify-center"
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <img
                          src={item.icon}
                          alt={item.title}
                          className="w-6 h-6 flex-shrink-0 object-contain"
                        />
                        <span className="text-base font-medium truncate transition-[opacity,max-width,margin-left] duration-300 ease-in-out overflow-hidden max-w-[200px] ml-2 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:ml-0">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="w-full flex justify-between px-4 py-3 border-t border-border/40">
  {/* Discord */}
  <Link
    href="https://discord.gg/ezBvGZVWU"
    className="min-w-[44px] min-h-[44px] flex items-center justify-center"
  >
    {/* Collapsed: icon only */}
    <img
      src="/discord-logo.png"
      alt="Discord"
      className="w-6 h-6 object-contain group-data-[collapsible=icon]:block hidden"
    />
    {/* Expanded: text */}
    <span className="text-sm font-semibold text-white group-data-[collapsible=icon]:hidden block">
      Discord
    </span>
  </Link>

  {/* X link */}
  <Link
    href="https://x.com/NexuraXYZ"
    className="text-sm font-semibold text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
  >
    X
  </Link>

  {/* Docs link */}
  <Link
    href="https://docsnexura.vercel.app"
    className="min-w-[44px] min-h-[44px] flex items-center justify-center"
  >
    {/* Collapsed: icon only */}
    <img
      src="/docs-icon.png"
      alt="Docs"
      className="w-6 h-6 object-contain group-data-[collapsible=icon]:block hidden"
    />
    {/* Expanded: text */}
    <span className="text-sm font-semibold text-white group-data-[collapsible=icon]:hidden block">
      Docs
    </span>
  </Link>
</div>
      </SidebarContent>
    </Sidebar>
  );
}
