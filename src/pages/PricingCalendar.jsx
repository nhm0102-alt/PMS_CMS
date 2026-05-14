import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Tag, Lock, Unlock,
  AlertCircle, CalendarDays, Pencil, Check
} from "lucide-react";
import { format, addDays, startOfDay, parseISO, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

const DAYS_VISIBLE = 21;

const FAKE_ROOM_TYPES = [
  { id: "rt1", name: "Standard Room", code: "STD", base_price: 800000, total_rooms: 10, is_active: true },
  { id: "rt2", name: "Deluxe Room", code: "DLX", base_price: 1200000, total_rooms: 6, is_active: true },
  { id: "rt3", name: "Suite", code: "STE", base_price: 2500000, total_rooms: 3, is_active: true },
];

const FAKE_RATE_PLANS = [
  { id: "rp1", property_id: "demo", name: "Flexible Rate", code: "FLEX", meal_plan: "breakfast", price_modifier_type: "percent", price_modifier_value: 0, min_stay: 1, is_active: true, room_type_ids: [] },
  { id: "rp2", property_id: "demo", name: "Non-Refundable", code: "NRF", meal_plan: "none", price_modifier_type: "percent", price_modifier_value: -15, min_stay: 1, is_active: true, room_type_ids: [] },
  { id: "rp3", property_id: "demo", name: "Bed & Breakfast", code: "BB", meal_plan: "breakfast", price_modifier_type: "percent", price_modifier_value: 10, min_stay: 2, is_active: true, room_type_ids: ["rt1", "rt2"] },
  { id: "rp4", property_id: "demo", name: "Half Board", code: "HB", meal_plan: "half_board", price_modifier_type: "percent", price_modifier_value: 20, min_stay: 3, is_active: true, room_type_ids: ["rt3"] },
];

function loadFromLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function formatVND(n) {
  if (!n && n !== 0) return "—";
  return n.toLocaleString("vi-VN") + "đ";
}

function getDayOfWeekLabel(date) {
  const d = date.getDay();
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return labels[d];
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

// Cell data keyed by "roomTypeId|ratePlanId|dateStr"
function makeCellKey(rtId, rpId, dateStr) {
  return `${rtId}|${rpId}|${dateStr}`;
}

export default function PricingCalendar() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [roomTypes, setRoomTypes] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterRoomType, setFilterRoomType] = useState("all");
  const [filterRatePlan, setFilterRatePlan] = useState("all");

  // Edit modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const pid = propertyId || "demo";
    let rt = [], rp = [];
    const tryLoad = async () => {
      try {
        if (pid !== "demo") {
          [rt, rp] = await Promise.all([
            api.roomTypes.filter({ property_id: pid }),
            api.ratePlans.filter({ property_id: pid }),
          ]);
        }
      } catch {}
      if (rt.length === 0) rt = loadFromLS("staypro_roomtypes", FAKE_ROOM_TYPES);
      if (rp.length === 0) rp = loadFromLS("staypro_rateplans", FAKE_RATE_PLANS);
      setRoomTypes(rt.filter(r => r.is_active !== false));
      setRatePlans(rp.filter(r => r.is_active !== false));

      // Load inventory from API
      if (pid !== "demo") {
        fetchInventory(pid, startDate);
      } else {
        setLoading(false);
      }
    };
    tryLoad();
  }, [propertyId, startDate]);

  const fetchInventory = async (pid, start) => {
    setRefreshing(true);
    try {
      const data = await api.pricing.getInventory(pid, format(start, "yyyy-MM-dd"), DAYS_VISIBLE);
      setInventory(data || {});
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const days = Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i));

  const getCell = (rtId, rpId, dateStr) => {
    return inventory[makeCellKey(rtId, rpId, dateStr)] || null;
  };

  const openEdit = (rtId, rpId, dateStr) => {
    const existing = getCell(rtId, rpId, dateStr) || {};
    const rt = roomTypes.find(r => r.id === rtId);
    const rp = ratePlans.find(r => r.id === rpId);
    const basePrice = rt?.base_price || 0;
    const modifier = rp?.price_modifier_type === "percent"
      ? basePrice * (1 + (rp.price_modifier_value || 0) / 100)
      : basePrice + (rp?.price_modifier_value || 0);
    setEditForm({
      price: existing.price != null ? existing.price : (Math.round(modifier) || ""),
      allotment: existing.allotment ?? (rt?.total_rooms || ""),
      closed: existing.closed ?? false,
      cutoff: existing.cutoff ?? "",
      min_night: existing.min_night ?? (rp?.min_stay || 1),
      max_night: existing.max_night ?? (rp?.max_stay || ""),
    });
    setEditModal({ rtId, rpId, dateStr });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const { rtId, rpId, dateStr } = editModal;
    const pid = propertyId || "demo";

    try {
      if (pid !== "demo") {
        await api.pricing.updateInventory(pid, {
          roomTypeId: rtId,
          ratePlanId: rpId,
          dateStr: dateStr,
          ...editForm
        });
      }

      // Update local state
      const key = makeCellKey(rtId, rpId, dateStr);
      setInventory(prev => ({
        ...prev,
        [key]: { ...editForm }
      }));
      setEditModal(null);
    } catch (error) {
      console.error("Failed to save inventory", error);
    }
  };

  // Navigate
  const prevWeek = () => setStartDate(d => addDays(d, -7));
  const nextWeek = () => setStartDate(d => addDays(d, 7));
  const goToday = () => setStartDate(startOfDay(new Date()));

  const visibleRoomTypes = filterRoomType === "all" ? roomTypes : roomTypes.filter(r => r.id === filterRoomType);
  const visibleRatePlans = filterRatePlan === "all" ? ratePlans : ratePlans.filter(r => r.id === filterRatePlan);

  // Get rate plans for a room type
  const getRatePlansForRT = (rtId) => {
    const rps = visibleRatePlans.filter(rp =>
      !rp.room_type_ids?.length || rp.room_type_ids.includes(rtId)
    );
    return rps;
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const LABEL_WIDTH = 220;
  const COL_WIDTH = 68;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-foreground text-lg">Giá và Phòng Trống</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterRoomType} onValueChange={setFilterRoomType}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Hạng phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hạng phòng</SelectItem>
                {roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRatePlan} onValueChange={setFilterRatePlan}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Loại giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại giá</SelectItem>
                {ratePlans.map(rp => <SelectItem key={rp.id} value={rp.id}>{rp.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={goToday}>
              <CalendarDays className="w-3.5 h-3.5 mr-1" />Hôm nay
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: LABEL_WIDTH + DAYS_VISIBLE * COL_WIDTH + 32 }}>
          {/* Date header row */}
          <div className="sticky top-0 z-20 bg-card border-b border-border flex" style={{ height: 56 }}>
            {/* Nav + label col */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-3 border-r border-border bg-card"
              style={{ width: LABEL_WIDTH }}
            >
              <button onClick={prevWeek} className="p-1 rounded hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-semibold text-muted-foreground">
                {format(startDate, "MMM yyyy", { locale: vi })}
              </span>
              <button onClick={nextWeek} className="p-1 rounded hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>
            {/* Day columns */}
            {days.map(day => {
              const ds = format(day, "yyyy-MM-dd");
              const isToday = ds === today;
              const weekend = isWeekend(day);
              return (
                <div
                  key={ds}
                  style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center border-r border-border text-xs",
                    isToday ? "bg-primary text-primary-foreground" : weekend ? "bg-amber-50" : "bg-card",
                  )}
                >
                  <span className={cn("font-semibold", isToday ? "text-primary-foreground" : weekend ? "text-amber-700" : "text-foreground")}>
                    {format(day, "d")}
                  </span>
                  <span className={cn("text-[10px]", isToday ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {getDayOfWeekLabel(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Đang tải...
            </div>
          ) : visibleRoomTypes.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Chưa có hạng phòng nào được cấu hình</p>
            </div>
          ) : visibleRoomTypes.map(rt => {
            const rps = getRatePlansForRT(rt.id);
            return (
              <div key={rt.id} className="border-b-2 border-primary/20">
                {/* Room type header */}
                <div className="flex bg-primary/5 border-b border-primary/10 sticky" style={{ zIndex: 10 }}>
                  <div
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-r border-primary/10 bg-primary/10"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <div>
                      <p className="font-bold text-xs text-primary">{rt.name}</p>
                      <p className="text-[10px] text-muted-foreground">{rt.total_rooms || 0} phòng · Giá gốc: {formatVND(rt.base_price)}</p>
                    </div>
                  </div>
                  {/* Allotment row - shows total rooms per day */}
                  {days.map(day => {
                    const ds = format(day, "yyyy-MM-dd");
                    const firstRp = rps[0];
                    const cell = firstRp ? getCell(rt.id, firstRp.id, ds) : null;
                    const allotment = cell?.allotment ?? rt.total_rooms ?? "—";
                    const closed = cell?.closed;
                    const isToday = ds === today;
                    const weekend = isWeekend(day);
                    return (
                      <div
                        key={ds}
                        style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-center justify-center border-r border-primary/10 py-1.5",
                          isToday ? "bg-primary/20" : weekend ? "bg-amber-50/60" : ""
                        )}
                      >
                        {closed ? (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">Đóng</Badge>
                        ) : (
                          <span className="text-xs font-bold text-primary">{allotment}</span>
                        )}
                        <span className="text-[9px] text-muted-foreground">phòng</span>
                      </div>
                    );
                  })}
                </div>

                {/* Rate plan rows */}
                {rps.length === 0 ? (
                  <div className="flex border-b border-border">
                    <div className="flex-shrink-0 flex items-center px-3 py-2 border-r border-border text-xs text-muted-foreground italic" style={{ width: LABEL_WIDTH }}>
                      Chưa có gói giá nào
                    </div>
                    {days.map(day => (
                      <div key={format(day, "yyyy-MM-dd")} style={{ width: COL_WIDTH, minWidth: COL_WIDTH }} className="flex-shrink-0 border-r border-border" />
                    ))}
                  </div>
                ) : rps.map((rp, rpIdx) => (
                  <div key={rp.id} className={cn("flex border-b border-border", rpIdx % 2 === 1 ? "bg-muted/20" : "")}>
                    {/* Label */}
                    <div
                      className="flex-shrink-0 flex flex-col justify-center px-3 py-2 border-r border-border"
                      style={{ width: LABEL_WIDTH }}
                    >
                      <p className="text-xs font-medium text-foreground">{rp.name}</p>
                      {rp.code && <span className="text-[10px] text-muted-foreground">{rp.code}</span>}
                      {rp.meal_plan && rp.meal_plan !== "none" && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 w-fit mt-0.5">{rp.meal_plan}</Badge>
                      )}
                    </div>
                    {/* Price cells */}
                    {days.map(day => {
                      const ds = format(day, "yyyy-MM-dd");
                      const cell = getCell(rt.id, rp.id, ds);
                      const basePrice = rt.base_price || 0;
                      const defaultPrice = rp.price_modifier_type === "percent"
                        ? Math.round(basePrice * (1 + (rp.price_modifier_value || 0) / 100))
                        : basePrice + (rp.price_modifier_value || 0);
                      const price = cell?.price ?? defaultPrice;
                      const closed = cell?.closed;
                      const cutoff = cell?.cutoff;
                      const minNight = cell?.min_night ?? rp.min_stay;
                      const maxNight = cell?.max_night;
                      const isToday = ds === today;
                      const weekend = isWeekend(day);
                      const hasCustom = !!cell;

                      return (
                        <div
                          key={ds}
                          style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                          className={cn(
                            "flex-shrink-0 group relative border-r border-border cursor-pointer hover:bg-accent/10 transition-colors",
                            isToday ? "bg-primary/5" : weekend ? "bg-amber-50/40" : "",
                            closed ? "bg-red-50" : "",
                            hasCustom ? "ring-1 ring-inset ring-accent/50" : ""
                          )}
                          onClick={() => openEdit(rt.id, rp.id, ds)}
                        >
                          <div className="flex flex-col items-center justify-center py-1.5 gap-0.5 text-center">
                            {closed ? (
                              <div className="flex flex-col items-center">
                                <Lock className="w-3.5 h-3.5 text-destructive" />
                                <span className="text-[9px] text-destructive font-medium">Đóng</span>
                              </div>
                            ) : (
                              <>
                                <span className={cn("text-[11px] font-semibold leading-tight", hasCustom ? "text-accent-foreground" : "text-foreground")}>
                                  {formatVND(price)}
                                </span>
                                {(cutoff || minNight > 1 || maxNight) && (
                                  <div className="flex gap-1 flex-wrap justify-center">
                                    {cutoff > 0 && <span className="text-[9px] text-amber-600 bg-amber-50 rounded px-0.5">C{cutoff}</span>}
                                    {minNight > 1 && <span className="text-[9px] text-blue-600 bg-blue-50 rounded px-0.5">≥{minNight}đ</span>}
                                    {maxNight > 0 && <span className="text-[9px] text-purple-600 bg-purple-50 rounded px-0.5">≤{maxNight}đ</span>}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {/* Edit overlay */}
                          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-accent/20">
                            <Pencil className="w-3 h-3 text-accent-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-border bg-card px-4 py-2 flex-shrink-0 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Hôm nay</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-100 rounded inline-block border border-amber-200" /> Cuối tuần</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-50 rounded inline-block border border-red-200" /> Đóng phòng</span>
        <span className="flex items-center gap-1 text-accent-foreground"><span className="w-3 h-2 rounded border border-accent/50 inline-block" /> Đã tuỳ chỉnh</span>
        <span className="ml-2">Số trên mỗi ô = Giá · <span className="text-amber-600 font-medium">C</span> = Cutoff · <span className="text-blue-600 font-medium">≥</span> = Min đêm · <span className="text-purple-600 font-medium">≤</span> = Max đêm</span>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Chỉnh sửa giá & phòng trống
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 mb-4">
              <p className="text-sm text-foreground font-medium">
                {roomTypes.find(r => r.id === editModal.rtId)?.name} — {ratePlans.find(r => r.id === editModal.rpId)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(editModal.dateStr), "EEEE, dd/MM/yyyy", { locale: vi })}
              </p>
            </div>

            <div className="space-y-4">
              {/* Open/Close */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <div className="flex items-center gap-2">
                  {editForm.closed ? <Lock className="w-4 h-4 text-destructive" /> : <Unlock className="w-4 h-4 text-success" />}
                  <Label className="text-sm font-medium">{editForm.closed ? "Đóng phòng" : "Mở phòng"}</Label>
                </div>
                <Switch checked={!editForm.closed} onCheckedChange={v => setEditForm(p => ({ ...p, closed: !v }))} />
              </div>

              {!editForm.closed && (
                <>
                  {/* Price */}
                  <div>
                    <Label className="text-xs">Giá (VND)</Label>
                    <Input className="mt-1" type="number" min="0" value={editForm.price}
                      onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))} />
                  </div>

                  {/* Allotment */}
                  <div>
                    <Label className="text-xs">Số phòng trống (allotment)</Label>
                    <Input className="mt-1" type="number" min="0" value={editForm.allotment}
                      onChange={e => setEditForm(p => ({ ...p, allotment: Number(e.target.value) }))} />
                  </div>

                  {/* Cutoff */}
                  <div>
                    <Label className="text-xs">Cut-off (ngày trước checkin)</Label>
                    <Input className="mt-1" type="number" min="0" value={editForm.cutoff || ""}
                      onChange={e => setEditForm(p => ({ ...p, cutoff: e.target.value ? Number(e.target.value) : "" }))}
                      placeholder="0 = không giới hạn" />
                  </div>

                  {/* Min/Max night */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Min đêm lưu trú</Label>
                      <Input className="mt-1" type="number" min="1" value={editForm.min_night || 1}
                        onChange={e => setEditForm(p => ({ ...p, min_night: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Max đêm lưu trú</Label>
                      <Input className="mt-1" type="number" min="1" value={editForm.max_night || ""}
                        onChange={e => setEditForm(p => ({ ...p, max_night: e.target.value ? Number(e.target.value) : "" }))}
                        placeholder="Không giới hạn" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditModal(null)}>Hủy</Button>
              <Button onClick={saveEdit}>
                <Check className="w-4 h-4 mr-1" /> Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
