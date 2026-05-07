import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, Users, BedDouble, BarChart3, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--info))", "hsl(var(--warning))"];

export default function Reports() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const q = propertyId ? { property_id: propertyId } : {};
    Promise.all([
      base44.entities.Reservation.filter(q, "-created_date", 500),
      base44.entities.Room.filter(q),
    ]).then(([r, rm]) => { setReservations(r); setRooms(rm); setLoading(false); });
  }, [propertyId]);

  const days = Number(period);
  const cutoff = format(subDays(new Date(), days), "yyyy-MM-dd");
  const filtered = reservations.filter(r => r.check_in_date >= cutoff);

  // Revenue by day
  const revenueByDay = {};
  filtered.forEach(r => {
    if (r.check_in_date && r.total_amount) {
      const d = r.check_in_date;
      revenueByDay[d] = (revenueByDay[d] || 0) + r.total_amount;
    }
  });
  const revenueData = Object.entries(revenueByDay).sort().slice(-14).map(([d, v]) => ({
    date: format(new Date(d), "dd/MM"),
    revenue: v,
  }));

  // Source breakdown
  const sourceCounts = {};
  filtered.forEach(r => { sourceCounts[r.source || "direct"] = (sourceCounts[r.source || "direct"] || 0) + 1; });
  const sourceData = Object.entries(sourceCounts).map(([k, v]) => ({ name: k, value: v }));

  // Stats
  const totalRevenue = filtered.filter(r => r.status !== "cancelled").reduce((s, r) => s + (r.total_amount || 0), 0);
  const avgRate = filtered.length > 0 ? totalRevenue / Math.max(1, filtered.filter(r => r.status !== "cancelled").length) : 0;
  const occupancyRate = rooms.length > 0
    ? Math.round((reservations.filter(r => r.status === "checked_in").length / rooms.length) * 100)
    : 0;
  const cancelRate = filtered.length > 0
    ? Math.round((filtered.filter(r => r.status === "cancelled").length / filtered.length) * 100)
    : 0;

  const sourceLabels = {
    direct: "Trực tiếp", phone: "Điện thoại", walk_in: "Walk-in",
    booking_com: "Booking.com", agoda: "Agoda", expedia: "Expedia",
    airbnb: "Airbnb", traveloka: "Traveloka", other_ota: "OTA khác",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Báo Cáo & Thống Kê"
        subtitle="Phân tích hoạt động kinh doanh khách sạn"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="90">90 ngày</SelectItem>
              <SelectItem value="365">1 năm</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Doanh Thu" value={`${(totalRevenue / 1e6).toFixed(1)}M`} icon={DollarSign} color="gold" subtitle={`VND — ${days} ngày`} />
        <StatCard title="Đặt Phòng" value={filtered.length} icon={Calendar} color="primary" subtitle={`${days} ngày gần đây`} />
        <StatCard title="Công Suất" value={`${occupancyRate}%`} icon={BedDouble} color="info" subtitle="Hiện tại" />
        <StatCard title="Tỷ Lệ Hủy" value={`${cancelRate}%`} icon={TrendingUp} color="warning" subtitle={`${days} ngày`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Doanh Thu 14 Ngày Gần Nhất</h2>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [v.toLocaleString("vi-VN") + "đ", "Doanh thu"]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source Pie */}
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Nguồn Đặt Phòng</h2>
          {sourceData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, sourceLabels[n] || n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sourceData.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground flex-1">{sourceLabels[item.name] || item.name}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Tóm Tắt {days} Ngày</h2>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Confirmed", value: filtered.filter(r => r.status === "confirmed").length, color: "text-info" },
            { label: "Checked In", value: filtered.filter(r => r.status === "checked_in").length, color: "text-success" },
            { label: "Checked Out", value: filtered.filter(r => r.status === "checked_out").length, color: "text-muted-foreground" },
            { label: "Cancelled", value: filtered.filter(r => r.status === "cancelled").length, color: "text-destructive" },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
