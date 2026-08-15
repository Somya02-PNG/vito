'use client';

import { LucideIcon } from 'lucide-react';
import {
  Home,
  LayoutDashboard,
  Car,
  UserCheck,
  Key,
  Compass,
  Sparkles,
  Shield,
  CreditCard,
  Receipt,
  UserCircle,
  HelpCircle,
  Settings as SettingsIcon,
  Radio,
  Navigation,
  Wallet,
  Clock,
  CalendarDays,
  CalendarRange,
  Users,
  CarFront,
  Wrench,
  Star,
  MessageSquare,
  Activity,
  BarChart3,
  Building2,
  LifeBuoy,
  Zap,
  Sliders,
  DollarSign,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export type RoleType = 'customer' | 'driver' | 'partner' | 'admin';

export interface NavSubItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isAiAssistant?: boolean;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  id: string;
  title?: string;
  items: NavItem[];
}

export interface RoleTheme {
  primary: string;
  accentHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  activeIcon: string;
  hoverBg: string;
  glow: string;
  avatarGradient: string;
  borderAccent: string;
}

export interface RoleNavConfig {
  role: RoleType;
  title: string;
  badgeText: string;
  theme: RoleTheme;
  bottomNavItems: NavItem[];
  groups: NavGroup[];
  footerItems: NavItem[];
}

export const ROLE_THEMES: Record<RoleType, RoleTheme> = {
  customer: {
    primary: 'blue',
    accentHex: '#3B82F6',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-300',
    activeBg: 'bg-blue-500/15',
    activeBorder: 'border-blue-500/30',
    activeText: 'text-blue-300',
    activeIcon: 'text-blue-400',
    hoverBg: 'hover:bg-blue-500/10 hover:text-white',
    glow: 'shadow-blue-500/20',
    avatarGradient: 'from-blue-600 to-indigo-600',
    borderAccent: 'border-blue-500/20',
  },
  driver: {
    primary: 'cyan',
    accentHex: '#06B6D4',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    activeBg: 'bg-cyan-500/15',
    activeBorder: 'border-cyan-500/30',
    activeText: 'text-cyan-300',
    activeIcon: 'text-cyan-400',
    hoverBg: 'hover:bg-cyan-500/10 hover:text-white',
    glow: 'shadow-cyan-500/20',
    avatarGradient: 'from-cyan-600 to-emerald-600',
    borderAccent: 'border-cyan-500/20',
  },
  partner: {
    primary: 'teal',
    accentHex: '#14B8A6',
    badgeBg: 'bg-teal-500/10',
    badgeBorder: 'border-teal-500/30',
    badgeText: 'text-teal-300',
    activeBg: 'bg-teal-500/15',
    activeBorder: 'border-teal-500/30',
    activeText: 'text-teal-300',
    activeIcon: 'text-teal-400',
    hoverBg: 'hover:bg-teal-500/10 hover:text-white',
    glow: 'shadow-teal-500/20',
    avatarGradient: 'from-teal-600 to-emerald-600',
    borderAccent: 'border-teal-500/20',
  },
  admin: {
    primary: 'violet',
    accentHex: '#8B5CF6',
    badgeBg: 'bg-violet-500/10',
    badgeBorder: 'border-violet-500/30',
    badgeText: 'text-violet-300',
    activeBg: 'bg-violet-500/15',
    activeBorder: 'border-violet-500/30',
    activeText: 'text-violet-300',
    activeIcon: 'text-violet-400',
    hoverBg: 'hover:bg-violet-500/10 hover:text-white',
    glow: 'shadow-violet-500/20',
    avatarGradient: 'from-violet-600 to-indigo-600',
    borderAccent: 'border-violet-500/20',
  },
};

export const ROLE_NAV_CONFIGS: Record<RoleType, RoleNavConfig> = {
  customer: {
    role: 'customer',
    title: 'Customer Portal',
    badgeText: 'CUSTOMER',
    theme: ROLE_THEMES.customer,
    bottomNavItems: [
      { label: 'Home', href: '/customer/home', icon: Home },
      { label: 'Cab', href: '/customer/cab', icon: Car },
      { label: 'Rentals', href: '/customer/rentals', icon: Key },
      { label: 'Hire', href: '/customer/driver-hire', icon: UserCheck },
      { label: 'AI Plan', href: '/customer/ai-trip-planner', icon: Sparkles, isAiAssistant: true },
      { label: 'Trips', href: '/customer/trips', icon: Compass },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/customer/home', icon: Home },
          { label: 'Book a Ride', href: '/customer/cab', icon: Car },
          { label: 'Hire a Driver', href: '/customer/driver-hire', icon: UserCheck },
          { label: 'Rentals', href: '/customer/rentals', icon: Key },
          { label: 'My Trips', href: '/customer/trips', icon: Compass },
          { label: 'AI Assistant', href: '/customer/ai-trip-planner', icon: Sparkles, isAiAssistant: true },
          { label: 'Safety', href: '/customer/safety', icon: Shield },
        ],
      },
      {
        id: 'finance',
        items: [
          { label: 'Payments', href: '/customer/payments', icon: CreditCard },
          { label: 'Expenses', href: '/customer/expenses', icon: Receipt },
        ],
      },
      {
        id: 'account_support',
        items: [
          { label: 'Account', href: '/customer/profile', icon: UserCircle },
          { label: 'Help & Support', href: '/customer/support', icon: HelpCircle },
        ],
      },
    ],
    footerItems: [
      { label: 'Profile', href: '/customer/profile', icon: UserCircle },
      { label: 'Settings', href: '/customer/settings', icon: SettingsIcon },
    ],
  },

  driver: {
    role: 'driver',
    title: 'Driver Workspace',
    badgeText: 'DRIVER OPS',
    theme: ROLE_THEMES.driver,
    bottomNavItems: [
      { label: 'Home', href: '/driver/home', icon: Home },
      { label: 'Requests', href: '/driver/requests', icon: Radio },
      { label: 'Trips', href: '/driver/trips', icon: Navigation },
      { label: 'Earnings', href: '/driver/earnings', icon: Wallet },
      { label: 'Safety', href: '/driver/safety', icon: Shield },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/driver/home', icon: Home },
          { label: 'Requests', href: '/driver/requests', icon: Radio },
          { label: 'My Trips', href: '/driver/trips', icon: Navigation },
          { label: 'Earnings', href: '/driver/earnings', icon: Wallet },
          { label: 'Availability', href: '/driver/availability', icon: Clock },
          { label: 'Safety', href: '/driver/safety', icon: Shield },
        ],
      },
      {
        id: 'account_support',
        items: [
          { label: 'Profile', href: '/driver/profile', icon: UserCircle },
          { label: 'Settings', href: '/driver/settings', icon: SettingsIcon },
          { label: 'Help & Support', href: '/driver/support', icon: HelpCircle },
        ],
      },
    ],
    footerItems: [
      { label: 'AI Assistant', href: '#ai-assistant', icon: Sparkles, isAiAssistant: true },
    ],
  },

  partner: {
    role: 'partner',
    title: 'Fleet Command',
    badgeText: 'FLEET OPERATOR',
    theme: ROLE_THEMES.partner,
    bottomNavItems: [
      { label: 'Overview', href: '/partner/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
      { label: 'Fleet', href: '/partner/fleet', icon: CarFront },
      { label: 'Earnings', href: '/partner/earnings', icon: Wallet },
      { label: 'Messages', href: '/partner/messages', icon: MessageSquare },
    ],
    groups: [
      {
        id: 'operations',
        items: [
          { label: 'Overview', href: '/partner/dashboard', icon: LayoutDashboard },
          { label: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
          { label: 'Calendar', href: '/partner/calendar', icon: CalendarRange },
          { label: 'Customers', href: '/partner/customers', icon: Users },
          { label: 'Fleet', href: '/partner/fleet', icon: CarFront },
          { label: 'Maintenance', href: '/partner/maintenance', icon: Wrench },
          { label: 'Earnings', href: '/partner/earnings', icon: Wallet },
          { label: 'Reviews', href: '/partner/reviews', icon: Star },
          { label: 'Messages', href: '/partner/messages', icon: MessageSquare },
        ],
      },
      {
        id: 'management',
        items: [
          { label: 'Driver Management', href: '/partner/driver/dashboard', icon: UserCheck },
          { label: 'Rental Management', href: '/partner/rental/dashboard', icon: Key },
        ],
      },
    ],
    footerItems: [
      { label: 'AI Assistant', href: '#ai-assistant', icon: Sparkles, isAiAssistant: true },
      { label: 'Settings', href: '/partner/settings', icon: SettingsIcon },
      { label: 'Support', href: '/partner/support', icon: LifeBuoy },
    ],
  },

  admin: {
    role: 'admin',
    title: 'Admin Command Center',
    badgeText: 'COMMAND CENTER',
    theme: ROLE_THEMES.admin,
    bottomNavItems: [
      { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Rides', href: '/admin/rides', icon: Navigation },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Safety', href: '/admin/safety', icon: Shield },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          {
            label: 'Operations',
            href: '/admin/operations',
            icon: Activity,
            subItems: [
              { label: 'Rides', href: '/admin/rides' },
              { label: 'Driver Hires', href: '/admin/driver-hires' },
              { label: 'Rentals', href: '/admin/rentals' },
              { label: 'Bookings', href: '/admin/rides?tab=bookings' },
              { label: 'Live Operations', href: '/admin/operations' },
            ],
          },
          {
            label: 'Users',
            href: '/admin/users',
            icon: Users,
            subItems: [
              { label: 'Customers', href: '/admin/users' },
              { label: 'Drivers', href: '/admin/drivers' },
              { label: 'Partners', href: '/admin/partners' },
            ],
          },
          {
            label: 'Fleet',
            href: '/admin/vehicles',
            icon: CarFront,
            subItems: [
              { label: 'Vehicles', href: '/admin/vehicles' },
              { label: 'Maintenance', href: '/admin/maintenance' },
            ],
          },
          {
            label: 'Finance',
            href: '/admin/payments',
            icon: DollarSign,
            subItems: [
              { label: 'Payments', href: '/admin/payments' },
              { label: 'Transactions', href: '/admin/payments?tab=transactions' },
              { label: 'Refunds', href: '/admin/payments?tab=refunds' },
            ],
          },
          {
            label: 'Safety',
            href: '/admin/safety',
            icon: Shield,
            subItems: [
              { label: 'Safety Events', href: '/admin/safety' },
              { label: 'SOS', href: '/admin/safety?tab=sos' },
              { label: 'Reports', href: '/admin/safety?tab=reports' },
            ],
          },
          {
            label: 'Support',
            href: '/admin/support',
            icon: LifeBuoy,
            subItems: [
              { label: 'Tickets', href: '/admin/support' },
              { label: 'Messages', href: '/admin/support?tab=messages' },
            ],
          },
          { label: 'Settings', href: '/admin/settings', icon: SettingsIcon },
        ],
      },
    ],
    footerItems: [
      { label: 'AI Assistant', href: '#ai-assistant', icon: Sparkles, isAiAssistant: true },
    ],
  },
};
