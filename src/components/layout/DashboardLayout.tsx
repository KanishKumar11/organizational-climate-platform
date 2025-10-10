'use client';

import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from '@/contexts/TranslationContext';
import RoleBasedNav from '../navigation/RoleBasedNav';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Settings, User, LogOut } from 'lucide-react';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t('error')}
          </h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access the dashboard.
          </p>
          <Button onClick={() => (window.location.href = '/auth/signin')}>
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'company_admin':
        return 'default';
      case 'leader':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
          <SidebarHeader className="border-b border-blue-200 dark:border-blue-700 px-6 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <span className="text-blue-600 font-bold text-sm font-montserrat">
                  OC
                </span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-semibold !text-lg text-white font-montserrat">
                  Climate Platform
                </h2>
                <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="text-xs w-fit bg-white/20 text-white border-white/30 font-montserrat"
                >
                  {user.role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <RoleBasedNav />
          </SidebarContent>

          <SidebarFooter className="border-t border-blue-200 dark:border-blue-700 p-4 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-blue-800 rounded-t-2xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-200 font-montserrat"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-blue-200 dark:ring-blue-600 rounded-xl">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-montserrat">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[120px] font-montserrat">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[120px] font-montserrat">
                      {user.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-blue-200 dark:border-blue-700 rounded-2xl shadow-xl"
              >
                <DropdownMenuLabel className="font-montserrat font-semibold text-blue-600 dark:text-blue-400">
                  {tNav('profile')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-600" />
                <DropdownMenuItem
                  onClick={() => router.push('/profile')}
                  className="font-montserrat rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <User className="mr-2 h-4 w-4 text-blue-500" />
                  {tNav('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem className="font-montserrat rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  <Settings className="mr-2 h-4 w-4 text-blue-500" />
                  {tNav('settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-600" />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-montserrat font-medium">
                  Language
                </DropdownMenuLabel>
                <div className="px-2 py-2">
                  <LanguageSwitcherCompact />
                </div>
                <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-600" />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="font-montserrat rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {tNav('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-blue-200 dark:border-blue-700 bg-gradient-to-r from-white/95 via-blue-50/95 to-indigo-50/95 dark:from-slate-900/95 dark:via-blue-900/95 dark:to-indigo-900/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6 gap-4">
              <SidebarTrigger className="md:hidden bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-xl transition-colors" />

              <div className="flex-1" />

              <div className="flex items-center gap-3">
                <NotificationDropdown />

                <Separator
                  orientation="vertical"
                  className="h-6 bg-blue-200 dark:bg-blue-600"
                />

                <div className="flex items-center gap-2 text-sm font-montserrat">
                  <span className="text-muted-foreground">
                    {t('welcomeBack')},
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {user.name.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <motion.div
              className="p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
