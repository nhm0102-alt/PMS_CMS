import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "@/components/shared/PageHeader";
import {
  Search, Filter, Plus, Eye, Edit, Trash2, MoreVertical,
  CalendarDays, User, BedDouble, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Chờ xác nhận", class: "bg-warning/10 text-warning border-warning/20" },
  confirmed: { label: "Đã xác nhận", class: "bg-info/10 text-info border-info/20" },
  checked_in: { label: "Đang ở", class: "bg-success/10 text-success border-success/20" },
  checked_out: { label: "Đã trả phòng", class: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Đã hủy", class: "bg-destructive/10 text-destructive border-destructive/20" },
  no_show: { label: "Không đến", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

const sourceLabels = {
  direct: "Trực tiếp", phone: "Điện thoại", email: "Email", walk_in: "Walk-in",
  booking_com: "Booking.com", agoda: "Agoda", expedia: "Expedia", airbnb: "Airbnb",
  traveloka: "Traveloka", other_ota: "OTA khác",
};

export default function ReservationList() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const query = propertyId ? { property_id: propertyId } : {};
    base44.entities.Reservation.filter(query, "-created_date", 100).then(d => {
      setReservations(d);
      setLoading(false);
    });
  }, [propertyId]);

  const filtered = reservations.filter(r => {
    const matchSearch = !search ||
      r.reservation_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.guest_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa đặt phòng này?")) return;
    await base44.entities.Reservation.delete(id);
    setReservations(prev => prev.filter(r => r.id !== id));
  };

  const handleStatusChange = async (r, status) => {
    await base44.entities.Reservation.update(r.id, { status });
    setReservations(prev => prev.map(res => res.id === r.id ? { ...res, status } : res));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Danh Sách Đặt Phòng"
        subtitle="Quản lý tất cả đặt phòng"
        actions={
          <Link to={createPageUrl("NewReservation") + (propertyId ? `?property_id=${propertyId}` : "")}>
            <Button className="bg-primary gap-2"><Plus className="w-4 h-4" />Tạo Đặt Phòng</Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm mã đặt phòng, tên khách..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mã ĐP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Khách</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phòng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-in</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kênh</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(9).fill(0).map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-muted rounded w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-14 text-muted-foreground">Không có đặt phòng nào</td></tr>
              ) : filtered.map(r => {
                const sc = statusConfig[r.status] || statusConfig.pending;
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono font-medium text-primary">{r.reservation_number || r.id?.slice(-8)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center text-xs font-bold text-primary">
                          {(r.guest_name || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.guest_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.num_adults || 1} người lớn</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-foreground">{r.room_number || "—"}</td>
                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {r.check_in_date ? format(new Date(r.check_in_date), "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {r.check_out_date ? format(new Date(r.check_out_date), "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{sourceLabels[r.source] || r.source || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                      {r.total_amount ? r.total_amount.toLocaleString("vi-VN") + "đ" : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className={`text-xs border ${sc.class}`}>{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {r.status === "confirmed" && <DropdownMenuItem onClick={() => handleStatusChange(r, "checked_in")} className="text-success">Check-in</DropdownMenuItem>}
                          {r.status === "checked_in" && <DropdownMenuItem onClick={() => handleStatusChange(r, "checked_out")} className="text-warning">Check-out</DropdownMenuItem>}
                          {["pending", "confirmed"].includes(r.status) && <DropdownMenuItem onClick={() => handleStatusChange(r, "cancelled")} className="text-destructive">Hủy đặt phòng</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => handleDelete(r.id)} className="text-destructive gap-2"><Trash2 className="w-4 h-4" />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
