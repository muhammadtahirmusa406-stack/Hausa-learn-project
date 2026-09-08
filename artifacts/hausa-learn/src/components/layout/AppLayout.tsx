import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetProgress } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Home, BookOpen, BookA, Trophy, Flame, Medal, LogOut, User as UserIcon, Sun, Moon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: progress } = useGetProgress();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLessonRoute = location.startsWith("/lesson/");

  if (isLessonRoute) {
    return <div className="min-h-[100dvh] bg-background text-foreground transition-colors">{children}</div>;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/vocabulary", label: "Vocab", icon: BookA },
    { href: "/leaderboard", label: "Ranks", icon: Medal },
    { href: "/achievements", label: "Trophies", icon: Trophy },
    { href: "/progress", label: "Stats", icon: Flame },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border p-4 sticky top-0 h-[100dvh] bg-card">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              H
            </span>
            Hausa Learn
          </h1>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  location === item.href
                    ? "bg-primary/10 text-primary border-primary/20 scale-100"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:scale-[1.02]"
                }`}
              >
                <item.icon className={`w-5 h-5 ${location === item.href ? 'stroke-primary/20' : ''}`} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
          <Button variant="ghost" className="justify-start gap-3 rounded-xl hover:bg-muted/50" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left border border-transparent hover:border-border">
                  <Avatar className="w-8 h-8 shadow-sm">
                    <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary"><UserIcon className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold truncate text-foreground">{user.firstName} {user.lastName}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer rounded-lg">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" className="w-full justify-center rounded-xl font-bold shadow-md hover:shadow-lg transition-all" onClick={() => login()}>
              Log in to save
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden font-display font-bold text-primary text-xl flex items-center gap-2">
             <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm text-sm">
              H
            </span>
            Hausa Learn
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 fill-secondary" />
              <span><AnimatedCounter value={progress?.streak || 0} duration={1000} /></span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Trophy className="w-4 h-4 fill-primary/20" />
              <span><AnimatedCounter value={progress?.totalXp || 0} duration={1000} /> XP</span>
            </div>
            
            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2 ml-1">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 border-2 border-primary/20">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                      <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <div className="px-3 py-2 text-sm font-bold border-b border-border mb-1">
                      {user.firstName} {user.lastName}
                    </div>
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer rounded-lg">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" variant="default" className="rounded-full font-bold shadow-sm" onClick={() => login()}>Log in</Button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-2 pb-safe z-50 overflow-x-auto gap-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1 min-w-[4rem]">
            <div
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                location === item.href
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-6 h-6 transition-colors ${location === item.href ? 'stroke-primary fill-primary/20' : ''}`} />
              <span className="text-[10px] font-bold mt-1 truncate max-w-full px-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
