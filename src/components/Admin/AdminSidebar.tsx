import { 
  BarChart3, 
  MessageSquare, 
  MapPin,
  Share2,
  Sparkles,
  Bot,
  BookOpen,
  FileText,
  Gamepad2,
  Users
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { 
    id: "overview", 
    title: "Overview", 
    icon: BarChart3,
    category: "main"
  },
  { 
    id: "planning", 
    title: "Course Planning", 
    icon: MessageSquare,
    category: "course"
  },
  { 
    id: "structure", 
    title: "Course Structure", 
    icon: BookOpen,
    category: "course"
  },
  { 
    id: "slides", 
    title: "Slides", 
    icon: FileText,
    category: "course"
  },
  { 
    id: "session-slides", 
    title: "Session View", 
    icon: FileText,
    category: "course"
  },
  { 
    id: "games", 
    title: "Games", 
    icon: Gamepad2,
    category: "course"
  },
  { 
    id: "session-games", 
    title: "Session Games", 
    icon: Gamepad2,
    category: "course"
  },
  { 
    id: "chat-history", 
    title: "Chat History", 
    icon: MessageSquare,
    category: "tools"
  },
  { 
    id: "content-creation", 
    title: "Content Creation", 
    icon: Sparkles,
    category: "tools"
  },
  { 
    id: "ai-prompts", 
    title: "AI Prompts", 
    icon: Bot,
    category: "tools"
  },
  { 
    id: "locations", 
    title: "Locations", 
    icon: MapPin,
    category: "analytics"
  },
  { 
    id: "social-media", 
    title: "Social Media", 
    icon: Share2,
    category: "analytics"
  },
  { 
    id: "reddit", 
    title: "Reddit", 
    icon: MessageSquare,
    category: "analytics"
  },
  { 
    id: "users", 
    title: "Users", 
    icon: Users,
    category: "analytics"
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getMenuItemsByCategory = (category: string) => 
    menuItems.filter(item => item.category === category);

  const isActive = (itemId: string) => activeTab === itemId;

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItemsByCategory("main").map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Course Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItemsByCategory("course").map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItemsByCategory("tools").map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItemsByCategory("analytics").map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}