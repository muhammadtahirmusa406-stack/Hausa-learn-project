import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetProgress } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Home, BookOpen, BookA, Trophy, Flame, Medal, LogOut, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: progress } = useGetProgress();
  const { user, isAuthenticated, login, logout } = useAuth();

  const isLessonRoute = location.startsWith("/lesson/");

  if (isLessonRoute) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/vocabulary", label: "Vocab", icon: BookA },
    { href: "/leaderboard", label: "Leaderboard", icon: Medal },
    { href: "/achievements", label: "Trophies", icon: Trophy },
    { href: "/progress", label: "Stats", icon: Flame },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border p-4 sticky top-0 h-[100dvh]">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              H
            </span>
            Hausa Learn
          </h1>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  location === item.href
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                    <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" className="w-full justify-center" onClick={() => login()}>
              Log in
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden font-display font-bold text-primary text-xl">
            Hausa Learn
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-secondary">
              <Flame className="w-5 h-5 fill-secondary" />
              <span>{progress?.streak || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <Trophy className="w-5 h-5" />
              <span>{progress?.totalXp || 0} XP</span>
            </div>
            
            {/* Mobile Auth */}
            <div className="md:hidden ml-2">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                      <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm font-medium border-b border-border mb-1">
                      {user.firstName} {user.lastName}
                    </div>
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" variant="outline" onClick={() => login()}>Log in</Button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around p-2 pb-safe z-50 overflow-x-auto gap-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1 min-w-[4rem]">
            <div
              className={`flex flex-col items-center justify-center py-2 rounded-xl ${
                location === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${location === item.href ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-medium mt-1 truncate max-w-full px-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
