import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ChevronDown,
  ExternalLinkIcon,
  LogOutIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { useTheme } from '@/components/theme/provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/lib/auth-context';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function PageShell({
  title,
  children,
  maxWidth = 'max-w-md',
}: PageShellProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const hasRedirect = redirectUrl && redirectUrl !== '/';

  return (
    <div className="flex min-h-svh flex-col bg-transparent">
      {/* Navbar — same style as rsnra.link */}
      <nav className="rsnra-nav border-border sticky top-0 z-50 border-b">
        <div className="rsnra-nav-inner mx-auto flex w-full max-w-[1200px] items-center justify-between">
          {/* Left: logo + service links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img
                src={theme === 'dark' ? '/icon.svg' : '/icon-light.svg'}
                alt="RSNRA Auth"
                className="size-8"
              />
            </Link>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                render={
                  <a
                    href="https://rsnra.link"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Music
              </Button>
              <Button
                variant="ghost"
                render={
                  <a
                    href="https://md.rsnra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                MD Editor
              </Button>
            </div>
          </div>

          {/* Right: back + theme + user menu */}
          <div className="flex items-center gap-2">
            {hasRedirect && (
              <Button
                variant="outline"
                className="flex items-center gap-1.5"
                onClick={() => {
                  if (redirectUrl!.startsWith('http')) {
                    window.location.href = redirectUrl!;
                  } else {
                    navigate(redirectUrl!);
                  }
                }}
              >
                <ArrowLeftIcon className="size-4" />
                Back
              </Button>
            )}
            <Button
              variant="ghost"
              className="relative flex items-center justify-center"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex size-4 items-center justify-center"
                >
                  {theme === 'dark' ? (
                    <MoonIcon className="size-4" />
                  ) : (
                    <SunIcon className="size-4" />
                  )}
                </motion.span>
              </AnimatePresence>
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="flex items-center gap-1.5 pr-2 pl-1"
                    />
                  }
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    name={user.displayName ?? user.email}
                    size={24}
                  />
                  <span className="max-w-25 overflow-hidden text-ellipsis whitespace-nowrap">
                    {user.displayName ?? user.email.split('@')[0]}
                  </span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem render={<Link to="/profile" />}>
                    <ExternalLinkIcon className="size-3.5" />
                    Profile
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem render={<Link to="/admin" />}>
                      <ShieldIcon className="size-3.5" />
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      void logout();
                      navigate('/');
                    }}
                  >
                    <LogOutIcon className="size-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" render={<Link to="/auth" />}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        <div className={`w-full ${maxWidth}`}>
          <h1 className="font-heading mb-6 text-2xl font-medium">{title}</h1>
          {children}
        </div>
      </main>

      <footer className="text-muted-foreground flex justify-center gap-4 px-4 py-6 text-xs">
        <Link to="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
        <Link to="/terms" className="hover:text-foreground">
          Terms of Use
        </Link>
      </footer>
    </div>
  );
}
