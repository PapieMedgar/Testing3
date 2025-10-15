import { 
  Calendar,
  MapPin,
  Camera,
  BarChart3,
  Users,
  UserCheck,
  Home,
  Target,
  TrendingUp,
  Building,
  Smartphone,
  LogOut,
  Plus,
  Package,
  BarChart,
  FileText
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"

// Navigation items based on user roles
const navigationItems = {
  'AGENT': [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Start Visit", url: "/start-visit", icon: Plus },
    // Schedule tab hidden temporarily
    // { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Visit Log", url: "/visits", icon: MapPin },
    { title: "My Manager", url: "/manager-contact", icon: Users },
    { title: "Reports", url: "/reports", icon: FileText }, // Added Reports
  ],
  'MANAGER': [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Team Overview", url: "/team", icon: Users },
    { title: "Visit Log", url: "/manager/visits", icon: FileText },
    { title: "Reports", url: "/reports", icon: FileText }, // Added Reports
    // Goals and Analytics hidden for now
    // { title: "Goals", url: "/goals", icon: Target },
    // { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ],
  'ADMIN': [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Users", url: "/managers", icon: Users },
    { title: "Shops", url: "/shops", icon: Building },
    { title: "Brands", url: "/brands", icon: Package },
    { title: "Visits", url: "/admin/visits", icon: FileText },
    { title: "Reports", url: "/reports", icon: FileText }, // Added Reports for ADMIN
    // Goals and Analytics hidden for now
    // { title: "Goals", url: "/goals", icon: Target },
    // { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ]
}

export function AppSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { setOpenMobile, isMobile } = useSidebar()

  const currentPath = location.pathname
  const userNavItems = user ? navigationItems[user.role] || [] : []

  const handleNavigationClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar className="w-64">
      <SidebarContent>
        {/* Brand Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">SalesSync</h2>
              <p className="text-xs text-muted-foreground capitalize">
                {user ? user.role.toLowerCase().replace('_', ' ') : 'Guest'}
              </p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {userNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <NavLink to={item.url} end onClick={handleNavigationClick}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}