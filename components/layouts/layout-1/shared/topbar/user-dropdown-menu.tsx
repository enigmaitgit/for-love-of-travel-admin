import { ReactNode, useEffect, useState } from 'react';
import {
  Globe,
  Moon,
  UserCircle,
  Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { getUserProfile, logout, type UserProfile } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

const I18N_LANGUAGES = [
  {
    label: 'English',
    code: 'en',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/united-states.svg'),
  },
  {
    label: 'Arabic (Saudi)',
    code: 'ar',
    direction: 'rtl',
    flag: toAbsoluteUrl('/media/flags/saudi-arabia.svg'),
  },
  {
    label: 'French',
    code: 'fr',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/france.svg'),
  },
  {
    label: 'Chinese',
    code: 'zh',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/china.svg'),
  },
];

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const currenLanguage = I18N_LANGUAGES[0];
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Default values for development
  const defaultUser = {
    fullname: 'Sean',
    email: 'sean@kt.com',
    role: 'Pro'
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setHasError(true);
        // Keep userProfile as null to use defaults
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleLogoutClick = async () => {
    try {
      console.log('🚪 Logging out user...');
      await logout();
      console.log('✅ Logout successful, redirecting...');
      
      // Redirect to login page or external login system
      // You can change this URL to match your login system
      window.location.href = 'http://localhost:3000/login'; // or your login URL
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Even if logout fails, redirect to login page
      window.location.href = 'http://localhost:4000/login';
    }
  };

  // Use real user data if available, otherwise use defaults
  const displayUser = userProfile ? {
    fullname: userProfile.fullname || userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'User',
    email: userProfile.email || 'user@example.com',
    role: userProfile.role || 'User'
  } : defaultUser;
  const userAvatar = (userProfile?.avatar && typeof userProfile.avatar === 'string') 
    ? userProfile.avatar 
    : toAbsoluteUrl('/media/avatars/300-2.png');


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="size-9 rounded-full border-2 border-green-500 flex items-center justify-center">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : (
              <img
                className="size-9 rounded-full border-2 border-green-500"
                src={userAvatar}
                alt="User avatar"
              />
            )}
            <div className="flex flex-col">
              <Link
                href="#"
                className="text-sm text-mono hover:text-primary font-semibold"
              >
                {isLoading ? 'Loading...' : displayUser.fullname}
              </Link>
              <a
                href={`mailto:${displayUser.email}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {displayUser.email}
              </a>
            </div>
          </div>
          <Badge variant="primary" appearance="light" size="sm">
            {isLoading ? '...' : displayUser.role}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link
            href="#"
            className="flex items-center gap-2"
          >
            <UserCircle />
            My Profile
          </Link>
        </DropdownMenuItem>


        {/* Language Submenu with Radio Group */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 [&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden hover:[&_[data-slot=badge]]:border-input data-[state=open]:[&_[data-slot=badge]]:border-input">
            <Globe />
            <span className="flex items-center justify-between gap-2 grow relative">
              Language
              <Badge
                variant="outline"
                className="absolute end-0 top-1/2 -translate-y-1/2"
              >
                {currenLanguage.label}
                <img
                  src={currenLanguage.flag}
                  className="w-3.5 h-3.5 rounded-full"
                  alt={currenLanguage.label}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup value={currenLanguage.code}>
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <img
                    src={item.flag}
                    className="w-4 h-4 rounded-full"
                    alt={item.label}
                  />
                  <span>{item.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Footer */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon />
          <div className="flex items-center gap-2 justify-between grow">
            Dark Mode
            <Switch
              size="sm"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </DropdownMenuItem>
        <div className="p-2 mt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleLogoutClick}
          >
            Logout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
