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
  ShieldAlert,
  PhoneCall,
  Share2,
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

// ─── Locked VITO Theme Tokens ───────────────────────────────────────────────
export const ROLE_THEMES: Record<RoleType, RoleTheme> = {
  customer: {
    primary: 'teal',
    accentHex: '#00C2B3',
    badgeBg: 'bg-vito-teal-50',
    badgeBorder: 'border-vito-teal-500/30',
    badgeText: 'text-vito-teal-600',
    activeBg: 'bg-vito-teal-500',
    activeBorder: 'border-vito-teal-400',
    activeText: 'text-white font-bold',
    activeIcon: 'text-white',
    hoverBg: 'hover:bg-white/[0.08] hover:text-white',
    glow: 'shadow-[0_0_16px_rgba(0,194,179,0.35)]',
    avatarGradient: 'from-[#00C2B3] to-[#00A99D]',
    borderAccent: 'border-vito-teal-500/20',
  },
  driver: {
    primary: 'teal',
    accentHex: '#00C2B3',
    badgeBg: 'bg-vito-teal-50',
    badgeBorder: 'border-vito-teal-500/30',
    badgeText: 'text-vito-teal-600',
    activeBg: 'bg-vito-teal-500',
    activeBorder: 'border-vito-teal-400',
    activeText: 'text-white font-bold',
    activeIcon: 'text-white',
    hoverBg: 'hover:bg-white/[0.08] hover:text-white',
    glow: 'shadow-[0_0_16px_rgba(0,194,179,0.35)]',
    avatarGradient: 'from-[#00C2B3] to-[#10243A]',
    borderAccent: 'border-vito-teal-500/20',
  },
  partner: {
    primary: 'teal',
    accentHex: '#00C2B3',
    badgeBg: 'bg-vito-teal-50',
    badgeBorder: 'border-vito-teal-500/30',
    badgeText: 'text-vito-teal-600',
    activeBg: 'bg-vito-teal-500',
    activeBorder: 'border-vito-teal-400',
    activeText: 'text-white font-bold',
    activeIcon: 'text-white',
    hoverBg: 'hover:bg-white/[0.08] hover:text-white',
    glow: 'shadow-[0_0_16px_rgba(0,194,179,0.35)]',
    avatarGradient: 'from-[#00C2B3] to-[#07111F]',
    borderAccent: 'border-vito-teal-500/20',
  },
  admin: {
    primary: 'teal',
    accentHex: '#00C2B3',
    badgeBg: 'bg-vito-teal-50',
    badgeBorder: 'border-vito-teal-500/30',
    badgeText: 'text-vito-teal-600',
    activeBg: 'bg-vito-teal-500',
    activeBorder: 'border-vito-teal-400',
    activeText: 'text-white font-bold',
    activeIcon: 'text-white',
    hoverBg: 'hover:bg-white/[0.08] hover:text-white',
    glow: 'shadow-[0_0_16px_rgba(0,194,179,0.35)]',
    avatarGradient: 'from-[#00C2B3] to-[#7567E8]',
    borderAccent: 'border-vito-teal-500/20',
  },
};

// ─── Locked Role Navigation Configs ─────────────────────────────────────────
export const ROLE_NAV_CONFIGS: Record<RoleType, RoleNavConfig> = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. CUSTOMER ROLE
  // ─────────────────────────────────────────────────────────────────────────
  customer: {
    role: 'customer',
    title: 'Customer Portal',
    badgeText: 'Customer',
    theme: ROLE_THEMES.customer,
    bottomNavItems: [
      { label: 'Home', href: '/customer/home', icon: Home },
      { label: 'Rides', href: '/customer/trips', icon: Compass },
      { label: 'AI', href: '#ai', icon: Sparkles, isAiAssistant: true },
      { label: 'Safety', href: '/customer/safety', icon: Shield },
      { label: 'Account', href: '/customer/profile', icon: UserCircle },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/customer/home', icon: Home },
        ],
      },
      {
        id: 'mobility',
        title: 'Mobility Services',
        items: [
          { label: 'Book a Ride', href: '/customer/cab', icon: Car },
          { label: 'Hire a Driver', href: '/customer/driver-hire', icon: UserCheck },
          { label: 'Rentals', href: '/customer/rentals', icon: Key },
          { label: 'My Trips', href: '/customer/trips', icon: Compass },
        ],
      },
      {
        id: 'safety_section',
        title: 'Safety & Trust',
        items: [
          {
            label: 'Safety Center',
            href: '/customer/safety',
            icon: Shield,
            subItems: [
              { label: 'Emergency SOS', href: '/customer/safety?tab=sos' },
              { label: 'Trusted Contacts', href: '/customer/safety?tab=contacts' },
              { label: 'Share Live Trip', href: '/customer/safety?tab=share' },
              { label: 'Safety Preferences', href: '/customer/safety?tab=preferences' },
            ],
          },
        ],
      },
      {
        id: 'finance',
        title: 'Finance & Account',
        items: [
          { label: 'Payments', href: '/customer/payments', icon: CreditCard },
          { label: 'Expenses', href: '/customer/expenses', icon: Receipt },
          { label: 'Account Profile', href: '/customer/profile', icon: UserCircle },
          { label: 'Settings', href: '/customer/settings', icon: SettingsIcon },
        ],
      },
    ],
    footerItems: [
      { label: 'Support & Help', href: '/customer/support', icon: HelpCircle },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. DRIVER ROLE
  // ─────────────────────────────────────────────────────────────────────────
  driver: {
    role: 'driver',
    title: 'Driver Console',
    badgeText: 'Driver',
    theme: ROLE_THEMES.driver,
    bottomNavItems: [
      { label: 'Home', href: '/driver/home', icon: Home },
      { label: 'Requests', href: '/driver/requests', icon: Radio },
      { label: 'Earnings', href: '/driver/earnings', icon: Wallet },
      { label: 'Safety', href: '/driver/safety', icon: Shield },
      { label: 'Profile', href: '/driver/profile', icon: UserCircle },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/driver/home', icon: LayoutDashboard },
          { label: 'Requests', href: '/driver/requests', icon: Radio, badge: 'Live' },
        ],
      },
      {
        id: 'trips',
        title: 'Work & Earnings',
        items: [
          { label: 'My Trips', href: '/driver/trips', icon: Navigation },
          { label: 'Earnings', href: '/driver/earnings', icon: Wallet },
          { label: 'Availability', href: '/driver/availability', icon: Clock },
        ],
      },
      {
        id: 'driver_safety',
        title: 'Safety & Profile',
        items: [
          {
            label: 'Safety Center',
            href: '/driver/safety',
            icon: Shield,
            subItems: [
              { label: 'Emergency SOS', href: '/driver/safety?tab=sos' },
              { label: 'Safety Guidelines', href: '/driver/safety?tab=guidelines' },
              { label: 'Incident Report', href: '/driver/safety?tab=report' },
            ],
          },
          { label: 'Driver Profile', href: '/driver/profile', icon: UserCircle },
          { label: 'Settings', href: '/driver/settings', icon: SettingsIcon },
        ],
      },
    ],
    footerItems: [
      { label: 'Driver Support', href: '/driver/support', icon: HelpCircle },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. PARTNER ROLE
  // ─────────────────────────────────────────────────────────────────────────
  partner: {
    role: 'partner',
    title: 'Partner Operations',
    badgeText: 'Partner',
    theme: ROLE_THEMES.partner,
    bottomNavItems: [
      { label: 'Overview', href: '/partner/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
      { label: 'Fleet', href: '/partner/fleet', icon: CarFront },
      { label: 'Earnings', href: '/partner/earnings', icon: DollarSign },
      { label: 'Settings', href: '/partner/settings', icon: SettingsIcon },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/partner/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        id: 'operations',
        title: 'Operations',
        items: [
          { label: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
          { label: 'Calendar', href: '/partner/calendar', icon: CalendarRange },
          { label: 'Customers', href: '/partner/customers', icon: Users },
        ],
      },
      {
        id: 'fleet',
        title: 'Fleet Management',
        items: [
          { label: 'Fleet Vehicles', href: '/partner/fleet', icon: CarFront },
          { label: 'Maintenance', href: '/partner/maintenance', icon: Wrench },
        ],
      },
      {
        id: 'business',
        title: 'Business & Reviews',
        items: [
          { label: 'Earnings', href: '/partner/earnings', icon: DollarSign },
          { label: 'Reviews', href: '/partner/reviews', icon: Star },
          { label: 'Messages', href: '/partner/messages', icon: MessageSquare },
          { label: 'Settings', href: '/partner/settings', icon: SettingsIcon },
        ],
      },
    ],
    footerItems: [
      { label: 'Partner Support', href: '/partner/support', icon: HelpCircle },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. ADMIN ROLE
  // ─────────────────────────────────────────────────────────────────────────
  admin: {
    role: 'admin',
    title: 'VITO Platform Admin',
    badgeText: 'Super Admin',
    theme: ROLE_THEMES.admin,
    bottomNavItems: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Operations', href: '/admin/operations', icon: Activity },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Safety', href: '/admin/safety', icon: Shield },
      { label: 'Settings', href: '/admin/settings', icon: SettingsIcon },
    ],
    groups: [
      {
        id: 'main',
        items: [
          { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { label: 'Operations', href: '/admin/operations', icon: Activity },
        ],
      },
      {
        id: 'management',
        title: 'Platform Management',
        items: [
          { label: 'Users', href: '/admin/users', icon: Users },
          { label: 'Drivers', href: '/admin/drivers', icon: UserCheck },
          { label: 'Partners', href: '/admin/partners', icon: Building2 },
          { label: 'Vehicles', href: '/admin/vehicles', icon: CarFront },
          { label: 'Finance & Payments', href: '/admin/payments', icon: DollarSign },
        ],
      },
      {
        id: 'safety_control',
        title: 'Safety & System',
        items: [
          { label: 'Safety Center', href: '/admin/safety', icon: Shield },
          { label: 'Support Desk', href: '/admin/support', icon: LifeBuoy },
          { label: 'Platform Settings', href: '/admin/settings', icon: SettingsIcon },
        ],
      },
    ],
    footerItems: [
      { label: 'System Health', href: '/api/health', icon: Activity },
    ],
  },
};
