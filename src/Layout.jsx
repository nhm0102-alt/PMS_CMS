import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { api } from "@/api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Users, Key, DollarSign,
  CalendarDays, BedDouble, LogOut, ChevronRight, ChevronDown,
  Settings, BarChart3, Globe, Tag, UserCheck, FileText,
  Menu, X, Bell, Search, ChevronLeft, Hotel, Shield, ShieldCheck,
  CreditCard, ClipboardList, Star, Layers, PlusSquare,
  TrendingUp, Wallet, ShoppingCart, Package, Warehouse,
  LinkIcon, History, Home, Cog, UserCog, Bell as BellIcon,
  Wrench, BarChart2, ListOrdered, CalendarCheck, Map, FileText as FileTextIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const SUPER_ADMIN_MENU = [
  { label: "Tổng Quan", icon: LayoutDashboard, page: "SuperAdminDashboard" },
  { label: "Quản Lý Khách Sạn", icon: Building2, page: "PropertiesManagement" },
  { label: "Quản Lý Users", icon: Users, page: "UsersManagement" },
  { label: "License & Hợp Đồng", icon: Key, page: "LicenseManagement" },
  { label: "Tài Chính", icon: DollarSign, page: "FinancialManagement" },
  { label: "Cài Đặt Hệ Thống", icon: Settings, page: "SystemSettings" },
];

const HOTEL_MENU = [
  { label: "Tổng quan", icon: LayoutDashboard, page: "HotelDashboard" },
  { label: "Thêm đặt phòng", icon: PlusSquare, page: "NewReservation" },
  { label: "Giá và phòng trống", icon: Tag, page: "PricingCalendar" },
  {
    label: "Quản lý đặt phòng", icon: CalendarDays, children: [
      { label: "Xem theo lịch", icon: CalendarDays, page: "ReservationCalendar" },
      { label: "Sơ đồ phòng", icon: Map, page: "RoomChart" },
      { label: "Xem theo đơn hàng", icon: ListOrdered, page: "ReservationList" },
      { label: "Folio / Chi tiết", icon: FileTextIcon, page: "FolioDetail" },
    ]
  },
  {
    label: "Quản lý tài chính", icon: Wallet, children: [
      { label: "Lương", icon: DollarSign, page: "BillingPayment" },
      { label: "Chi phí mua hàng", icon: ShoppingCart, page: "BillingPayment" },
    ]
  },
  {
    label: "Quản lý kho", icon: Warehouse, children: [
      { label: "Thiết lập hàng hóa", icon: Package, page: "RoomManagement" },
      { label: "Quản lý tồn kho", icon: Layers, page: "RoomManagement" },
    ]
  },
  {
    label: "Quản lý buồng phòng", icon: BedDouble, children: [
      { label: "Tình trạng phòng", icon: BedDouble, page: "CheckInOut" },
      { label: "Phân công công việc", icon: UserCheck, page: "CheckInOut" },
    ]
  },
  { label: "Quản lý kết nối kênh", icon: LinkIcon, page: "OTAChannels" },
  { label: "Phân tích dữ liệu", icon: BarChart2, page: "Reports" },
  { label: "Lịch sử thay đổi", icon: History, page: "Reports" },
  {
    label: "Cấu hình chung", icon: null, section: true, children: [
      {
        label: "Cơ sở lưu trú", icon: Home, children: [
          { label: "Thông tin cơ bản", icon: Building2, page: "HotelSettings" },
          { label: "Cấu hình phòng", icon: BedDouble, page: "RoomManagement" },
          { label: "Gói giá", icon: Tag, page: "RatePlanManagement" },
          { label: "Cấu hình Policy", icon: ShieldCheck, page: "PolicySettings" },
        ]
      },
      {
        label: "Quản lý phân quyền", icon: Shield, children: [
          { label: "Phân quyền", icon: Key, page: "UsersManagement" },
          { label: "Người dùng", icon: Users, page: "GuestManagement" },
        ]
      },
      { label: "Thiết lập dịch vụ", icon: Cog, page: "HotelSettings" },
      { label: "Thông báo", icon: BellIcon, page: "HotelSettings" },
    ]
  },
];

function MenuItem({ item, collapsed, openMenus, toggleMenu, isActive, isGroupActive, depth, propertyId }) {
  // Section header (Cấu hình chung)
  if (item.section) {
    return (
      <div className="mt-3">
        {!collapsed && (
          <p className="px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
            {item.label}
          </p>
        )}
        <div className="space-y-0.5">
          {item.children.map(child => (
            <MenuItem key={child.label} item={child} collapsed={collapsed} openMenus={openMenus} toggleMenu={toggleMenu} isActive={isActive} isGroupActive={isGroupActive} depth={depth} propertyId={propertyId} />
          ))}
        </div>
      </div>
    );
  }

  const checkGroupActive = (it) => {
    if (it.page) return isActive(it.page);
    if (it.children) return it.children.some(c => checkGroupActive(c));
    return false;
  };

  if (item.children) {
    const isOpen = openMenus[item.label] || checkGroupActive(item);
    const groupActive = checkGroupActive(item);
    const paddingLeft = depth > 0 ? "pl-5" : "";
    return (
      <div>
        <button
          onClick={() => toggleMenu(item.label)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            groupActive
              ? "bg-sidebar-active text-white"
              : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
            collapsed && "justify-center px-2",
            depth > 0 && "py-1.5 text-sm font-normal",
            paddingLeft
          )}
        >
          {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
            </>
          )}
        </button>
        {!collapsed && isOpen && (
          <div className={cn("mt-0.5 space-y-0.5 border-l border-white/10", depth === 0 ? "ml-3 pl-3" : "ml-4 pl-2")}>
            {item.children.map(child => (
              <MenuItem key={child.label || child.page} item={child} collapsed={collapsed} openMenus={openMenus} toggleMenu={toggleMenu} isActive={isActive} isGroupActive={isGroupActive} depth={depth + 1} propertyId={propertyId} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Leaf item with page
  return (
    <Link to={createPageUrl(item.page) + (propertyId ? `?property_id=${propertyId}` : "")}>
      <div className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
        isActive(item.page)
          ? "bg-accent text-accent-foreground font-medium"
          : depth === 0
            ? "text-sidebar-foreground font-medium hover:bg-sidebar-hover hover:text-white"
            : "text-sidebar-foreground/70 hover:text-white hover:bg-white/5",
        collapsed && "justify-center px-2",
        depth > 0 && "py-1.5"
      )}>
        {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
        {!collapsed && <span>{item.label}</span>}
      </div>
    </Link>
  );
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [activeMode, setActiveMode] = useState("superadmin"); // "superadmin" | "hotel"
  const [currentProperty, setCurrentProperty] = useState(null);
  const location = useLocation();

  // Extract property_id from current URL to pass through navigation
  const currentPropertyId = new URLSearchParams(location.search).get("property_id");

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch property info when property_id changes
  useEffect(() => {
    if (currentPropertyId) {
      api.properties.filter({ id: currentPropertyId }).then(res => {
        setCurrentProperty(res?.[0] || null);
      }).catch(() => setCurrentProperty(null));
    } else {
      setCurrentProperty(null);
    }
  }, [currentPropertyId]);

  // Determine mode from page
  useEffect(() => {
    const collectPages = (items) => items.flatMap(m => {
      if (m.page) return [m.page];
      if (m.children) return collectPages(m.children);
      return [];
    });
    const hotelPages = collectPages(HOTEL_MENU);
    const isHotelPage = hotelPages.includes(currentPageName);
    if (isHotelPage) setActiveMode("hotel");
    else setActiveMode("superadmin");
  }, [currentPageName]);

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = activeMode === "hotel" ? HOTEL_MENU : SUPER_ADMIN_MENU;

  const isActive = (page) => currentPageName === page;
  const isGroupActive = (item) => item.children?.some(c => c.page === currentPageName);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-white/10", collapsed && "justify-center px-2")}>
        <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">StayPro PMS</div>
            <div className="text-sidebar-foreground/50 text-xs">Hotel Management</div>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-white/10">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveMode("superadmin")}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-md transition-all font-medium",
                activeMode === "superadmin" ? "bg-accent text-accent-foreground" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              Super Admin
            </button>
            <button
              onClick={() => setActiveMode("hotel")}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-md transition-all font-medium",
                activeMode === "hotel" ? "bg-accent text-accent-foreground" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              Khách Sạn
            </button>
          </div>
          {activeMode === "hotel" && (
            <div className="mt-2">
              {currentProperty ? (
                <div className="px-2 py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="text-xs text-sidebar-foreground/50 uppercase tracking-wide font-medium">Đang quản lý</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate leading-tight mb-1.5">{currentProperty.name}</p>
                  {currentProperty.city && (
                    <p className="text-xs text-sidebar-foreground/50 truncate mb-1.5">{currentProperty.city}</p>
                  )}
                  <Link to={createPageUrl("PropertiesManagement")}>
                    <button className="w-full text-xs text-left text-sidebar-foreground/50 hover:text-accent flex items-center gap-1.5 py-1 rounded hover:bg-white/5 transition-colors">
                      <ChevronLeft className="w-3 h-3" />
                      Đổi khách sạn
                    </button>
                  </Link>
                </div>
              ) : (
                <Link to={createPageUrl("PropertiesManagement")}>
                  <div className="px-2 py-2 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors">
                    <p className="text-xs text-destructive font-medium mb-1">Chưa chọn khách sạn</p>
                    <p className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" />
                      Chọn khách sạn
                    </p>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => <MenuItem key={item.label} item={item} collapsed={collapsed} openMenus={openMenus} toggleMenu={toggleMenu} isActive={isActive} isGroupActive={isGroupActive} depth={0} propertyId={currentPropertyId} />)}
      </nav>

      {/* Bottom */}
      <div className={cn("border-t border-white/10 p-3", collapsed && "flex justify-center")}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                {user?.full_name?.[0] || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.full_name || "Admin"}</div>
              <div className="text-sidebar-foreground/50 text-xs truncate">{user?.email}</div>
            </div>
            <button onClick={() => { api.auth.logout(); window.location.href = '/'; }} className="text-sidebar-foreground/50 hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => { api.auth.logout(); window.location.href = '/'; }} className="text-sidebar-foreground/50 hover:text-destructive p-1">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col flex-shrink-0 bg-sidebar shadow-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-8px)] z-10 w-5 h-10 bg-sidebar border border-border rounded-r-md flex items-center justify-center hover:bg-accent group"
          style={{ left: collapsed ? 52 : 228 }}
        >
          <ChevronRight className={cn("w-3 h-3 text-sidebar-foreground/50 group-hover:text-accent-foreground transition-transform", collapsed ? "" : "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="relative w-64 h-full bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 flex items-center gap-4 px-4 lg:px-6 bg-card border-b border-border flex-shrink-0 shadow-card">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setMobileSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Tìm kiếm..."
                className="w-56 pl-9 pr-4 py-1.5 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 px-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user?.full_name?.[0] || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:block">{user?.full_name || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
