import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, LogOut, Search, Clock, CheckCircle, User, BedDouble, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

export default function CheckInOut() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(null);
  const [checkInModal, setCheckInModal] = useState(null);
  const [checkOutModal, setCheckOutModal] = useState(null);
  const [notes, setNotes] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const load = () => {
    const q = propertyId ? { property_id: propertyId } : {};
    base44.entities.Reservation.filter(q, "-check_in_date", 200).then(d => {
      setReservations(d);
      setLoading(false);
    });
  };
  useEffect(load, [propertyId]);

  const arrivals = reservations.filter(r =>
    r.check_in_date === today && ["confirmed", "pending"].includes(r.status)
  );
  const departures = reservations.filter(r =>
    r.check_out_date === today && r.status === "checked_in"
  );
  const inHouse = reservations.filter(r => r.status === "checked_in");

  const filterList = (list) => {
    if (!search) return list;
    return list.filter(r =>
      r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reservation_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.room_number?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const doCheckIn = async () => {
    if (!checkInModal) return;
    setProcessing(checkInModal.id);
    await base44.entities.Reservation.update(checkInModal.id, {
      status: "checked_in",
      actual_check_in: new Date().toISOString(),
      internal_notes: notes || checkInModal.internal_notes,
    });
    setCheckInModal(null);
    setNotes("");
    setProcessing(null);
    load();
  };

  const doCheckOut = async () => {
    if (!checkOutModal) return;
    setProcessing(checkOutModal.id);
    await base44.entities.Reservation.update(checkOutModal.id, {
      status: "checked_out",
      actual_check_out: new Date().toISOString(),
    });
    setCheckOutModal(null);
    setNotes("");
    setProcessing(null);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Check-in / Check-out" subtitle="Xử lý nhận phòng và trả phòng" />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-info/8 border border-info/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-info">{arrivals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Check-in hôm nay</p>
        </div>
        <div className="bg-success/8 border border-success/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{inHouse.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Đang lưu trú</p>
        </div>
        <div className="bg-warning/8 border border-warning/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-warning">{departures.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Check-out hôm nay</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tìm tên khách, mã đặt phòng, số phòng..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="arrivals">
        <TabsList className="bg-muted">
          <TabsTrigger value="arrivals" className="gap-2"><UserCheck className="w-4 h-4" />Check-in ({arrivals.length})</TabsTrigger>
          <TabsTrigger value="departures" className="gap-2"><LogOut className="w-4 h-4" />Check-out ({departures.length})</TabsTrigger>
          <TabsTrigger value="inhouse" className="gap-2"><BedDouble className="w-4 h-4" />Đang ở ({inHouse.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="arrivals" className="mt-4">
          <ReservationTable
            reservations={filterList(arrivals)}
            loading={loading}
            actionLabel="Check-in"
            actionClass="bg-info hover:bg-info/90 text-white"
            onAction={r => { setCheckInModal(r); setNotes(""); }}
            emptyMsg="Không có khách check-in hôm nay"
          />
        </TabsContent>

        <TabsContent value="departures" className="mt-4">
          <ReservationTable
            reservations={filterList(departures)}
            loading={loading}
            actionLabel="Check-out"
            actionClass="bg-warning hover:bg-warning/90 text-white"
            onAction={r => { setCheckOutModal(r); setNotes(""); }}
            emptyMsg="Không có khách check-out hôm nay"
          />
        </TabsContent>

        <TabsContent value="inhouse" className="mt-4">
          <ReservationTable
            reservations={filterList(inHouse)}
            loading={loading}
            actionLabel="Check-out"
            actionClass="bg-warning hover:bg-warning/90 text-white"
            onAction={r => { setCheckOutModal(r); setNotes(""); }}
            emptyMsg="Không có khách đang lưu trú"
          />
        </TabsContent>
      </Tabs>

      {/* Check-in Modal */}
      <Dialog open={!!checkInModal} onOpenChange={() => setCheckInModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-info" />
              Xác nhận Check-in
            </DialogTitle>
          </DialogHeader>
          {checkInModal && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Khách:</span><span className="font-medium">{checkInModal.guest_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phòng:</span><span className="font-medium">{checkInModal.room_number || "Chưa gán"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Check-out:</span><span className="font-medium">{checkInModal.check_out_date ? format(new Date(checkInModal.check_out_date), "dd/MM/yyyy") : "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Còn lại:</span><span className="font-semibold text-warning">{checkInModal.balance_due?.toLocaleString("vi-VN")}đ</span></div>
              </div>
              {checkInModal.special_requests && (
                <div className="bg-warning/8 border border-warning/20 rounded-lg px-3 py-2 text-sm">
                  <p className="text-xs font-semibold text-warning mb-1">Yêu cầu đặc biệt:</p>
                  <p className="text-muted-foreground">{checkInModal.special_requests}</p>
                </div>
              )}
              <div>
                <Label>Ghi chú nhận phòng</Label>
                <Textarea className="mt-1.5 h-16" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ghi chú khi nhận phòng..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInModal(null)}>Hủy</Button>
            <Button onClick={doCheckIn} disabled={!!processing} className="bg-info hover:bg-info/90 text-white gap-2">
              <UserCheck className="w-4 h-4" />
              {processing ? "Đang xử lý..." : "Xác nhận Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Modal */}
      <Dialog open={!!checkOutModal} onOpenChange={() => setCheckOutModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-warning" />
              Xác nhận Check-out
            </DialogTitle>
          </DialogHeader>
          {checkOutModal && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Khách:</span><span className="font-medium">{checkOutModal.guest_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phòng:</span><span className="font-medium">{checkOutModal.room_number || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tổng tiền:</span><span className="font-medium">{checkOutModal.total_amount?.toLocaleString("vi-VN")}đ</span></div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-2"><span className="text-warning">Còn cần thanh toán:</span><span className="text-warning">{checkOutModal.balance_due?.toLocaleString("vi-VN")}đ</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOutModal(null)}>Hủy</Button>
            <Button onClick={doCheckOut} disabled={!!processing} className="bg-warning hover:bg-warning/90 text-white gap-2">
              <LogOut className="w-4 h-4" />
              {processing ? "Đang xử lý..." : "Xác nhận Check-out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReservationTable({ reservations, loading, actionLabel, actionClass, onAction, emptyMsg }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Khách</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phòng</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-in</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-out</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Số đêm</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Còn lại</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-muted rounded w-16 animate-pulse" /></td>)}</tr>
              ))
            ) : reservations.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">{emptyMsg}</td></tr>
            ) : reservations.map(r => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center text-xs font-bold text-primary">
                      {(r.guest_name || "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.guest_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.reservation_number || r.id?.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{r.room_number || "—"}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{r.check_in_date ? format(new Date(r.check_in_date), "dd/MM") : "—"}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{r.check_out_date ? format(new Date(r.check_out_date), "dd/MM") : "—"}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{r.nights || "—"}</td>
                <td className="px-4 py-3.5 text-sm font-semibold text-warning">{r.balance_due ? r.balance_due.toLocaleString("vi-VN") + "đ" : "0đ"}</td>
                <td className="px-4 py-3.5">
                  <Button size="sm" className={`text-xs ${actionClass} h-7`} onClick={() => onAction(r)}>{actionLabel}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
