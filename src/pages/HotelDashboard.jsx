import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import {
  BedDouble, CalendarDays, Users, DollarSign, TrendingUp,
  ArrowRight, CheckCircle, Clock, AlertCircle, UserCheck,
  BarChart3, Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusLabels = {
  pending: { label: "Chờ xác nhận", class: "bg-warning/10 text-warning" },
  confirmed: { label: "Đã xác nhận", class: "bg-info/10 text-info" },
  checked_in: { label: "Đang ở", class: "bg-success/10 text-success" },
  checked_out: { label: "Đã trả phòng", class: "bg-muted text-muted-foreground" },
  cancelled: { label: "Đã hủy", class: "bg-destructive/10 text-destructive" },
  no_show: { label: "Không đến", class: "bg-destructive/10 text-destructive" },
};

export default function HotelDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [property, setProperty] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const loads = [
      base44.entities.Reservation.filter({ property_id: propertyId }, "-created_date", 50),
      base44.entities.Room.filter({ property_id: propertyId }, "-created_date", 100),
    ];
    if (propertyId) loads.unshift(base44.entities.Property.filter({ id: propertyId }));

    Promise.all(loads).then(results => {
      if (propertyId) {
        setProperty(results[0]?.[0]);
        setReservations(results[1]);
        setRooms(results[2]);
      } else {
        setReservations(results[0]);
        setRooms(results[1]);
      }
      setLoading(false);
    });
  }, [propertyId]);

  const todayCheckIns = reservations.filter(r => r.check_in_date === today && ["confirmed", "pending"].includes(r.status));
  const todayCheckOuts = reservations.filter(r => r.check_out_date === today && r.status === "checked_in");
  const inHouse = reservations.filter(r => r.status === "checked_in");
  const availableRooms = rooms.filter(r => r.status === "available").length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  const todayRevenue = reservations
    .filter(r => r.check_out_date === today && r.status === "checked_out")
    .reduce((s, r) => s + (r.total_amount || 0), 0);

  const roomStatusColors = {
    available: "bg-success/80",
    occupied: "bg-primary",
    dirty: "bg-warning/70",
    cleaning: "bg-info/70",
    maintenance: "bg-destructive/70",
    out_of_order: "bg-muted-foreground/50",
  };

  const roomStatusLabels = {
    available: "Trống",
    occupied: "Có khách",
    dirty: "Cần dọn",
    cleaning: "Đang dọn",
    maintenance: "Bảo trì",
    out_of_order: "Hỏng",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={property ? property.name : "Quản Lý Khách Sạn"}
        subtitle={property ? `${property.city || ""} — Dashboard tổng quan` : "Dashboard tổng quan hôm nay"}
        actions={
          <Link to={createPageUrl("NewReservation") + (propertyId ? `?property_id=${propertyId}` : "")}>
            <Button className="bg-primary gap-2">
              <CalendarDays className="w-4 h-4" /> Tạo Đặt Phòng
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Check-in Hôm Nay" value={todayCheckIns.length} icon={UserCheck} color="info" subtitle="Lượt khách đến" />
        <StatCard title="Check-out Hôm Nay" value={todayCheckOuts.length} icon={ArrowRight} color="warning" subtitle="Lượt trả phòng" />
        <StatCard title="Đang Lưu Trú" value={inHouse.length} icon={BedDouble} color="success" subtitle={`${occupancyRate}% công suất`} />
        <StatCard title="Doanh Thu Hôm Nay" value={`${(todayRevenue / 1e6).toFixed(1)}M`} icon={DollarSign} color="gold" subtitle="VND" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Arrivals & Departures */}
        <div className="lg:col-span-2 space-y-4">
          {/* Check-ins */}
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-info/10 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-info" />
                </div>
                <h2 className="font-semibold text-foreground">Check-in Hôm Nay</h2>
                <Badge className="bg-info/10 text-info border-0">{todayCheckIns.length}</Badge>
              </div>
              <Link to={createPageUrl("CheckInOut") + (propertyId ? `?property_id=${propertyId}` : "")}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                  Xử lý <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border max-h-52 overflow-y-auto">
              {todayCheckIns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Không có check-in hôm nay</p>
              ) : todayCheckIns.map(r => (
                <ReservationRow key={r.id} reservation={r} propertyId={propertyId} />
              ))}
            </div>
          </div>

          {/* Check-outs */}
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
                <h2 className="font-semibold text-foreground">Check-out Hôm Nay</h2>
                <Badge className="bg-warning/10 text-warning border-0">{todayCheckOuts.length}</Badge>
              </div>
            </div>
            <div className="divide-y divide-border max-h-52 overflow-y-auto">
              {todayCheckOuts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Không có check-out hôm nay</p>
              ) : todayCheckOuts.map(r => (
                <ReservationRow key={r.id} reservation={r} propertyId={propertyId} />
              ))}
            </div>
          </div>
        </div>

        {/* Room Status */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Tình Trạng Phòng</h2>
            </div>
            <Link to={createPageUrl("RoomChart") + (propertyId ? `?property_id=${propertyId}` : "")}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                Sơ đồ <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {/* Occupancy bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Công suất hôm nay</span>
                <span className="font-semibold text-foreground">{occupancyRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${occupancyRate}%` }} />
              </div>
            </div>

            {/* Status breakdown */}
            {Object.entries(roomStatusLabels).map(([status, label]) => {
              const count = rooms.filter(r => r.status === status).length;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", roomStatusColors[status])} />
                  <span className="text-sm text-muted-foreground flex-1">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="text-center py-6">
                <BedDouble className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có phòng</p>
                <Link to={createPageUrl("RoomManagement") + (propertyId ? `?property_id=${propertyId}` : "")}>
                  <Button size="sm" variant="outline" className="mt-2 text-xs">Thêm phòng</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="border-t border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Truy cập nhanh</p>
            {[
              { label: "Lịch đặt phòng", page: "ReservationCalendar" },
              { label: "Sơ đồ phòng", page: "RoomChart" },
              { label: "Check-in / Check-out", page: "CheckInOut" },
              { label: "Hóa đơn & thanh toán", page: "BillingPayment" },
            ].map(item => (
              <Link key={item.page} to={createPageUrl(item.page) + (propertyId ? `?property_id=${propertyId}` : "")}>
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted text-sm text-muted-foreground hover:text-foreground group">
                  <span>{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationRow({ reservation: r, propertyId }) {
  const src = {
    direct: "Trực tiếp", phone: "Điện thoại", walk_in: "Walk-in",
    booking_com: "Booking.com", agoda: "Agoda", expedia: "Expedia", airbnb: "Airbnb",
  };
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
        {(r.guest_name || r.reservation_number || "?")[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{r.guest_name || r.reservation_number || "—"}</p>
        <p className="text-xs text-muted-foreground">{src[r.source] || r.source || "—"} · {r.num_adults || 1} khách</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-medium text-foreground">{r.room_number || "—"}</p>
        <p className="text-xs text-muted-foreground">{r.nights || 1} đêm</p>
      </div>
    </div>
  );
}
