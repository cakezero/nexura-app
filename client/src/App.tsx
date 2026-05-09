import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import NotFound from "./pages/not-found";
import Discover from "./pages/Discover";
// import Rewards from "./pages/Rewards";
import Learn from "./pages/Learn";
import Campaigns from "./pages/Campaigns";
import Quests from "./pages/Quests";
import EcosystemDapps from "./pages/EcosystemDapps";
import Referrals from "./pages/Referrals";
import QuestEnvironment from "./pages/QuestEnvironment";
import CampaignEnvironment from "./pages/CampaignEnvironment";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import DiscordCallback from "./pages/DiscordCallback";
import XCallback from "./pages/XCallback";
import Levels from "./pages/Levels";
import UserReferred from "./pages/UserReferred";
import ProjectCreate from "./pages/studio/project/ProjectCreate";
// ProjectDashboard route removed - no longer used
import NexuraSidebar from "./components/QuestflowSidebar";
import ProfileBar from "./components/ProfileBar";
import { WalletProvider } from "./lib/wallet";
import { AuthProvider } from "./lib/auth";
import OrgSignInButton from "./components/OrgSignInButton";
import ProjectLogoutButton from "./components/ProjectLogoutButton";
import ErrorBoundary from "./components/ErrorBoundary";
import PortalClaims from "./pages/PortalClaims";
import AnimatedBackground from "./components/AnimatedBackground";
import Home from "./pages/Home.tsx";
import Analytics from "./pages/Analytics.tsx";
import NexuraStudio from "./pages/NexuraStudio.tsx";
import CreateHub from "./pages/studio/project/CreateHub.tsx";
import SignInToHub from "./pages/studio/project/SignInToHub.tsx";
import TheHub from "./pages/studio/project/TheHub.tsx";
import ConnectedDiscord from "./pages/studio/project/ConnectedDiscord.tsx";
import StudioDashboard from "./pages/studio/project/StudioDashboard.tsx"
import StudioLayout from "./pages/studio/project/StudioLayout.tsx"
import CampaignsTab from "./components/admin/CampaignsTab.tsx";
import { getStoredAccessToken, apiRequest } from './lib/config'
import { clearProjectSession, getStoredProjectToken, projectApiRequest } from './lib/projectApi'
import CreateNewCampaigns from "./components/admin/CreateNewCampaign.tsx";
import MyCampaign from "./components/admin/MyCampaign.tsx"
import AdminManagement from "./components/admin/AdminManagement.tsx";
import AdminSignUp from "./pages/studio/project/AdminSignUp.tsx";
import HubProfile from "./pages/studio/project/HubProfile.tsx";
import ClaimDetails from "./pages/ClaimDetails";
import ConnectDiscord from "./pages/studio/project/ConnectDiscord.tsx";
import Docs from "./pages/Docs.tsx"
import LessonPage from "./pages/LessonPage";
import ResetHubPassword from "./pages/studio/project/ResetHubPassword.tsx";
import AnalyticsBackground from "./components/AnalyticsBackground.tsx"
import LessonCreate from "./pages/studio/project/LessonCreate";
import Lessons from "./pages/studio/project/Lessons";
import UserDashboard from "./pages/studio/user/UserDashboard.tsx";
import UserLayout from "./pages/studio/user/UserLayout.tsx";
import QuestCreate from "./pages/studio/user/QuestCreate.tsx";
import SelectRole from "./pages/studio/SelectRole.tsx";
import ProjectsHub from "./pages/studio/project/ProjectsHub.tsx";
import UsersHub from "./pages/studio/user/UsersHub.tsx";
import UsersCreate from "./pages/studio/user/UsersCreate.tsx";
import UserSignup from "./pages/studio/user/UserSignup.tsx";
import UserSignIn from "./pages/studio/user/UserSignin.tsx";
import OtpVerify from "./pages/studio/OtpVerify.tsx";
import QuestsTab from "./components/admin/QuestsTab.tsx";
import QuestCard from "./components/QuestCard.tsx";

function Router() {
   const [isAuthenticated, setIsAuthenticated] = useState(false)

    const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem('nexura-admin:token');
    localStorage.removeItem('nexura-admin:info');
    localStorage.removeItem('nexura_user_session');
    
    // Clear project session and call server logout if project is signed in
    if (getStoredProjectToken()) {
      projectApiRequest({ method: 'POST', endpoint: '/hub/logout' }).catch(() => {});
    }
    
    clearProjectSession();
    setIsAuthenticated(false);
    
    // Force redirect to studio landing page to ensure all state is wiped
    window.location.href = "/studio";
  }

  return (
    // <Home />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/levels" component={Levels} />
      <Route path="/docs" component={Docs} />
      <Route path="/docs/:slug?" component={Docs} />
      {/* NEXURA pages */}
      <Route path="/learn" component={Learn} />
      <Route path="/learn/:id" component={LessonPage } />
      <Route path="/quests" component={Quests} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/ecosystem-dapps" component={EcosystemDapps} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/quest/:questId" component={QuestEnvironment} />
      <Route path="/campaign/:campaignId" component={CampaignEnvironment} />
      <Route path="/discord/callback" component={DiscordCallback} />
      <Route path="/x/callback" component={XCallback} />
      <Route path="/campaigns/tasks" component={CampaignEnvironment} />
      <Route path="/quests/tasks-card" component={QuestEnvironment} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/portal-claims" component={PortalClaims} />
      <Route path="/portal-claims/:id" component={ClaimDetails} />
      <Route path="/studio" component={NexuraStudio} />
      {/* Profile pages */}
      <Route path="/profile" component={Profile} />
      <Route path="/profile/edit" component={EditProfile} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/leaderboard" component={Leaderboard} />
      {/* Developer pages */}
      <Route path="/studio/select-role" component={SelectRole} />
      <Route path="/studio/projects-hub" component={ProjectsHub} />
      <Route path="/studio/users-hub" component={UsersHub} />
      <Route path="/studio/users/create" component={UsersCreate} />
      <Route path="/studio/users/user-signup" component={UserSignup} />
      <Route path="/studio/users/user-signin" component={UserSignIn} />
      <Route path="/user-dashboard">
        <UserLayout title="Dashboard" onLogout={handleLogout}>
          <UserDashboard />
        </UserLayout>
      </Route>
      <Route path="/user-dashboard/quests-tab">
        <UserLayout title="Quests" onLogout={handleLogout}>
          <QuestsTab />
        </UserLayout>
      </Route>
      <Route path="/user-dashboard/create-new-quest">
        <UserLayout title="Create Quest" onLogout={handleLogout}>
          <QuestCreate />
        </UserLayout>
      </Route>
      <Route path="/user-dashboard/lessons-tab">
        <UserLayout title="Lessons" onLogout={handleLogout}>
          <Lessons />
        </UserLayout>
      </Route>
      <Route path="/user-dashboard/create-lesson">
        <UserLayout title="Create Lesson" onLogout={handleLogout}>
          <LessonCreate />
        </UserLayout>
      </Route>
      <Route path="/studio/projects/create" component={ProjectCreate} />
      <Route path="/projects/create/create-hub" component={CreateHub} />
      <Route path="/projects/create/signin-to-hub" component={SignInToHub} />
      <Route path="/projects/create/the-hub" component={TheHub} />
      <Route path="/studio-dashboard">
        <StudioDashboard onLogout={handleLogout} />
      </Route>
      <Route path="/studio-dashboard/dashboard">
        <StudioDashboard onLogout={handleLogout} />
      </Route>
      <Route path="/studio-dashboard/create-new-campaign">
        <StudioLayout title="Create Campaign" onLogout={handleLogout}>
          <CreateNewCampaigns />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/create-lesson">
        <StudioLayout title="Create Lesson" onLogout={handleLogout}>
          <LessonCreate />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/lessons-tab">
        <StudioLayout title="Manage Lessons" onLogout={handleLogout}>
          <Lessons />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/campaigns-tab">
        <StudioLayout title="Campaigns" onLogout={handleLogout}>
          <CampaignsTab />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/admin-management">
        <StudioLayout title="User Administration" onLogout={handleLogout}>
          <AdminManagement />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/my-campaign">
        <StudioLayout title="My Campaign" onLogout={handleLogout}>
          <MyCampaign />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/hub-profile">
        <StudioLayout title="Project Profile" onLogout={handleLogout}>
          <HubProfile />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/connect-discord">
        <StudioLayout title="Connect Discord" onLogout={handleLogout}>
          <ConnectDiscord />
        </StudioLayout>
      </Route>
      <Route path="/studio-dashboard/connected-discord">
        <StudioLayout title="Connect Discord" onLogout={handleLogout}>
          <ConnectedDiscord />
        </StudioLayout>
      </Route>
      <Route path="/connect-discord">
        <StudioLayout title="Connect Discord" onLogout={handleLogout}>
          <ConnectDiscord />
        </StudioLayout>
      </Route>
      <Route path="/project/connected-discord">
        <StudioLayout title="Connect Discord" onLogout={handleLogout}>
          <ConnectedDiscord />
        </StudioLayout>
      </Route>
      <Route path="/studio/register" component={AdminSignUp} />
      <Route path="/studio/reset-password" component={ResetHubPassword} />
        <Route path="/studio/verify-otp" component={OtpVerify} />
      {/* ProjectDashboard route removed - no longer used */}
      {/* Referral */}
      <Route path="/ref/:referrerCode" component={UserReferred} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location]);

  useEffect(() => {
    const isStudioRoute =
      location === "/studio" ||
      location.startsWith("/studio-dashboard") ||
      location.startsWith("/projects/create") ||
      location.startsWith("/connect-discord") ||
      location.startsWith("/project/connected-discord") ||
      location.startsWith("/studio/register") ||
      location.startsWith("/studio/reset-password");

    document.body.classList.toggle("studio-theme", isStudioRoute);

    return () => {
      document.body.classList.remove("studio-theme");
    };
  }, [location]);

  // NEXURA-style sidebar configuration
  const sidebarStyle = {
    "--sidebar-width": "12rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <WalletProvider>
      <AuthProvider>
          <TooltipProvider>
            <SidebarProvider defaultOpen={false} style={sidebarStyle as React.CSSProperties}>
              {(() => {
                

                const isHome = location === "/" || location === "/home";
                const isUser = location.startsWith("/user-dashboard")
                const isStudio =
                  location === "/studio" ||
                  location.startsWith("/studio-dashboard") ||
                  location.startsWith("/connect-discord") ||
                  location.startsWith("/project/connected-discord") ||
                  location.startsWith("/studio/register") ||
                  location.startsWith("/studio/reset-password") ||
                  location.startsWith("/studio/") ||
                  location.startsWith("/projects/");
                const isProject = location.startsWith("/project/");
                const isProjectCreate = location.startsWith("/projects/create");
                const isDocs = location.startsWith("/docs")
                return (
                  <div className="flex h-screen w-full text-white selection:bg-blue-500/30 relative">

                    {/* BACKGROUND FOR ALL PAGES */}
{isDocs ? <AnalyticsBackground /> : <AnimatedBackground />}

                    {/* Sidebar */}
                    {!isHome && !isStudio &&!isUser && !isDocs && !isProjectCreate && <NexuraSidebar />}

                    {/* Main content */}
<div className="flex-1 flex flex-col relative z-10">
  
  {!isHome && !isStudio &&!isUser && !isProjectCreate && (
    <header className="flex items-center p-4 app-header">
      
      {/* LEFT: Logo (only for docs) */}
{isDocs && (
  <div className="hidden lg:flex items-center">
    <img
      src="/nexura-logo.png"
      alt="Nexura"
      className="h-8 w-auto"
    />
  </div>
)}

      <SidebarTrigger
          data-testid="button-sidebar-toggle"
          className="md:hidden"
        />

      {/* RIGHT: Controls */}
      <div className="ml-auto flex items-center gap-4">
        <ProfileBar />
      </div>

    </header>
  )}

  <main ref={mainRef} className="flex-1 overflow-y-auto">
    <Router />
  </main>

</div>

                    {/* {!isHome && !isStudio && !isProject && <OrgSignInButton />} */}
                    {isProject && <ProjectLogoutButton />}
                  </div>
                );
              })()}
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;
