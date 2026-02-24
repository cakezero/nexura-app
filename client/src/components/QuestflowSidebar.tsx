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
import {
  BookOpen,
  Compass,
  Users,
  Trophy,
  Zap,
  Calendar,
  Target,
  Orbit,
  BarChart2,
  Layers,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "wouter";
import AnimatedBackground from "./AnimatedBackground";

const mainNavItems = [
  { title: "Learn", subtitle: "", icon: BookOpen, href: "/learn", activeClass: "nav-learn-active" },
  { title: "Explore", icon: Compass, href: "/discover", activeClass: "nav-explore-active" },
  { title: "Referrals", icon: Users, href: "/referrals", activeClass: "nav-referrals-active" },
  { title: "Quests", icon: Zap, href: "/quests", activeClass: "nav-quests-active" },
  { title: "Campaigns", icon: Calendar, href: "/campaigns", activeClass: "nav-campaigns-active" },
  { title: "Ecosystem Dapps", icon: Target, href: "/ecosystem-dapps", activeClass: "nav-ecosystem-dapps-active" },
  { title: "Leaderboard", icon: Trophy, href: "/leaderboard", activeClass: "nav-leaderboard-active" },
  { title: "Portal Claims", icon: Orbit, href: "/portal-claims", activeClass: "nav-portal-claims-active" },
  { title: "Analytics", icon: BarChart2, href: "/analytics", activeClass: "nav-analytics-active" },
  { 
  title: "Nexura Studio", icon: Layers, href: "/studio", activeClass: "nav-studio-active",
},

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
    >
      <AnimatedBackground />
      <SidebarContent className="bg-black/55 backdrop-blur-sm relative z-10">
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
        <SidebarGroup>
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
                        <item.icon className="w-4 h-4 flex-shrink-0" />
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
      </SidebarContent>
    </Sidebar>
  );
}
