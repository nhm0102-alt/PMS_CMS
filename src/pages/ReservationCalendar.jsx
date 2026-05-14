import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, LayoutGrid, List,
  BedDouble, Users, DollarSign, RefreshCw, Search
} from "lucide-react";
import { format, addDays, subDays, startOfDay, differenceInDays, parseISO, isToday, addMonths, subMonths, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import ReservationDetailModal from "@/components/calendar/ReservationDetailModal";

const STATUS_COLORS = {
  pending:    { bar: "bg-warning",     light: "bg-warning/80 text-white",     label: "Chờ xác nhận" },
  confirmed:  { bar: "bg-info",        light: "bg-info/80 text-white",        label: "Đã xác nhận" },
  checked_in: { bar: "bg-success",     light: "bg-success/80 text-white",     label: "Đang ở" },
  checked_out:{ bar: "bg-muted-foreground/50", light: "bg-muted-foreground/50 text-white", label: "Đã trả phòng" },
  cancelled:  { bar: "bg-destructive", light: "bg-destructive/80 text-white", label: "Đã hủy" },
  no_show:    { bar: "bg-destructive/60", light: "bg-destructive/60 text-white", label: "Không đến" },
};

const ROOM_STATUS_COLORS = {
  available:    "bg-success/15 border-success/30 text-success",
  occupied:     "bg-primary/10 border-primary/30 text-primary",
  dirty:        "bg-warning/15 border-warning/30 text-warning",
  cleaning:     "bg-info/15 border-info/30 text-info",
  maintenance:  "bg-destructive/15 border-destructive/30 text-destructive",
  out_of_order: "bg-muted border-border text-muted-foreground",
};

const ROOM_STATUS_LABEL = {
  available: "Trống", occupied: "Có khách", dirty: "Cần dọn",
  cleaning: "Đang dọn", maintenance: "Bảo trì", out_of_order: "Hỏng",
};

const DAY_COL_WIDTH = 56; // px per day
const ROW_HEIGHT = 48;    // px per room row
const LEFT_COL = 180;     // px for room label column
const OCCUPANCY_ROW_HEIGHT = 52; // px for occupancy row

export default function ReservationCalendar() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "floor" | "list"
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [numDays, setNumDays] = useState(14);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [otaChannels, setOtaChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);

  const [guests, setGuests] = useState([]);

  useEffect(() => {
    const q = propertyId ? { property_id: propertyId } : {};
    Promise.all([
      api.rooms.filter(q, "room_number", 300),
      api.roomTypes.filter(q),
      api.reservations.filter(q, "-check_in_date", 500),
      api.guests.filter(q, "last_name", 500),
      api.otaChannels.list(),
    ]).then(([r, rt, res, g, ota]) => {
      setRooms(r);
      setRoomTypes(rt);
      setReservations(res);
      setGuests(g);
      setOtaChannels(ota);
      setLoading(false);
    });
  }, [propertyId]);

  const typeMap = Object.fromEntries(roomTypes.map(rt => [rt.id, rt]));
  const floors = [...new Set(rooms.map(r => r.floor).filter(Boolean))].sort();

  const days = Array.from({ length: numDays }, (_, i) => addDays(startDate, i));

  const filteredRooms = rooms.filter(r => {
    const matchFloor = filterFloor === "all" || r.floor === filterFloor;
    const matchSearch = !search || r.room_number?.toLowerCase().includes(search.toLowerCase());
    return matchFloor && matchSearch;
  });

  // Group rooms by type for timeline
  const roomsByType = roomTypes.map(rt => ({
    ...rt,
    rooms: filteredRooms.filter(r => r.room_type_id === rt.id),
  })).filter(rt => rt.rooms.length > 0);

  // Rooms without type
  const unassignedRooms = filteredRooms.filter(r => !r.room_type_id || !typeMap[r.room_type_id]);

  // Get reservations overlapping with a room in the visible date range
  // NOTE: these use reservations passed from parent; TimelineView has its own local copy for optimistic updates
  const getReservationsForRoom = (roomId) => {
    const end = addDays(startDate, numDays - 1);
    return reservations.filter(res => {
      if (res.room_id !== roomId) return false;
      if (!res.check_in_date || !res.check_out_date) return false;
      const ci = parseISO(res.check_in_date);
      const co = parseISO(res.check_out_date);
      return ci <= end && co >= startDate;
    });
  };

  // Get reservations for a room_type that have NO room assigned (unplaced bookings)
  const getUnplacedReservationsForType = (roomTypeId) => {
    const end = addDays(startDate, numDays - 1);
    return reservations.filter(res => {
      if (res.room_id) return false; // already placed
      if (res.room_type_id !== roomTypeId) return false;
      if (!res.check_in_date || !res.check_out_date) return false;
      const ci = parseISO(res.check_in_date);
      const co = parseISO(res.check_out_date);
      return ci <= end && co >= startDate;
    });
  };

  // Guest name lookup
  const guestMap = Object.fromEntries(guests.map(g => [g.id, `${g.last_name} ${g.first_name || ""}`.trim()]));
  const getGuestName = (res) => {
    if (res.guest_id && guestMap[res.guest_id]) return guestMap[res.guest_id];
    return res.guest_name || res.reservation_number || "Booking";
  };

  const getBarProps = (res) => {
    const ci = parseISO(res.check_in_date);
    const co = parseISO(res.check_out_date);
    const visStart = ci < startDate ? startDate : ci;
    const visEnd = co > addDays(startDate, numDays) ? addDays(startDate, numDays) : co;
    const left = differenceInDays(visStart, startDate) * DAY_COL_WIDTH;
    const width = Math.max(differenceInDays(visEnd, visStart), 1) * DAY_COL_WIDTH - 2;
    return { left, width };
  };

  const prevPeriod = () => setStartDate(d => subDays(d, numDays));
  const nextPeriod = () => setStartDate(d => addDays(d, numDays));
  const goToday = () => setStartDate(startOfDay(new Date()));

  const totalAvailable = rooms.filter(r => r.status === "available").length;
  const totalOccupied = rooms.filter(r => r.status === "occupied").length;
  const todayCheckIns = reservations.filter(r => r.check_in_date === format(new Date(), "yyyy-MM-dd") && r.status === "confirmed").length;
  const todayCheckOuts = reservations.filter(r => r.check_out_date === format(new Date(), "yyyy-MM-dd") && r.status === "checked_in").length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 space-y-3 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">Quản Lý Đặt Phòng</h1>
            <p className="text-xs text-muted-foreground">Theo dõi và quản lý tất cả đặt phòng</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              {[
                { key: "timeline", icon: Calendar, label: "Timeline" },
                { key: "floor", icon: LayoutGrid, label: "Sơ đồ" },
                { key: "list", icon: List, label: "Danh sách" },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    viewMode === v.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <v.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
            <Link to={createPageUrl("NewReservation") + (propertyId ? `?property_id=${propertyId}` : "")}>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />Tạo đặt phòng
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Phòng trống", value: totalAvailable, color: "text-success" },
            { label: "Đang có khách", value: totalOccupied, color: "text-primary" },
            { label: "Check-in hôm nay", value: todayCheckIns, color: "text-info" },
            { label: "Check-out hôm nay", value: todayCheckOuts, color: "text-warning" },
          ].map(s => (
            <div key={s.label} className="bg-muted/50 rounded-lg px-3 py-2 text-center">
              <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm phòng..."
              className="pl-8 pr-3 py-1.5 text-xs bg-muted rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-ring w-32"
            />
          </div>
          {floors.length > 0 && (
            <Select value={filterFloor} onValueChange={setFilterFloor}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="Tầng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tầng</SelectItem>
                {floors.map(f => <SelectItem key={f} value={f}>Tầng {f}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {viewMode === "list" && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(STATUS_COLORS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "timeline" ? (
          <TimelineView
            days={days}
            startDate={startDate}
            numDays={numDays}
            setNumDays={setNumDays}
            roomsByType={roomsByType}
            unassignedRooms={unassignedRooms}
            getReservationsForRoom={getReservationsForRoom}
            getBarProps={getBarProps}
            prevPeriod={prevPeriod}
            nextPeriod={nextPeriod}
            goToday={goToday}
            scrollRef={scrollRef}
            tooltip={tooltip}
            setTooltip={setTooltip}
            reservations={reservations}
            rooms={rooms}
            roomTypes={roomTypes}
            guests={guests}
            getGuestName={getGuestName}
            getUnplacedReservationsForType={getUnplacedReservationsForType}
          />
        ) : viewMode === "floor" ? (
          <FloorView
            rooms={filteredRooms}
            typeMap={typeMap}
            floors={floors}
            filterFloor={filterFloor}
            reservations={reservations}
            propertyId={propertyId}
          />
        ) : (
          <ListView
            reservations={reservations}
            filterStatus={filterStatus}
            search={search}
            propertyId={propertyId}
            otaChannels={otaChannels}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────── TIMELINE VIEW ─────────────── */
function TimelineView({ days, startDate, numDays, setNumDays, roomsByType, unassignedRooms,
  getReservationsForRoom, getBarProps, prevPeriod, nextPeriod, goToday, scrollRef, tooltip, setTooltip,
  reservations: reservationsProp, rooms, roomTypes, guests, getGuestName, getUnplacedReservationsForType }) {

  const today = format(new Date(), "yyyy-MM-dd");
  const todayOffset = differenceInDays(startOfDay(new Date()), startDate);
  const totalWidth = days.length * DAY_COL_WIDTH;

  // drag state (timeline reorder)
  const [dragging, setDragging] = useState(null); // { resId, mouseStartX }
  const [resizing, setResizing] = useState(null);  // { resId, origWidth, mouseStartX }
  const [localOverrides, setLocalOverrides] = useState({}); // resId -> { leftDelta?, width? }
  const gridRef = useRef(null);

  // drag-to-assign state (any booking → room)
  const [assignDrag, setAssignDrag] = useState(null); // { resId, mouseX, mouseY, origRoomId }
  const [dropTarget, setDropTarget] = useState(null);  // roomId being hovered
  const [reservations, setReservations] = useState(reservationsProp);
  // modal
  const [selectedRes, setSelectedRes] = useState(null);

  // keep local copy in sync with prop
  useEffect(() => { setReservations(reservationsProp); }, [reservationsProp]);

  const allRoomGroups = [
    ...roomsByType,
    ...(unassignedRooms.length > 0 ? [{ id: "__unassigned__", name: "Chưa phân loại", rooms: unassignedRooms }] : [])
  ];

  const totalRooms = rooms.length;

  // Local versions that use local (optimistic) reservations state
  const localGetReservationsForRoom = (roomId) => {
    const end = addDays(startDate, numDays - 1);
    return reservations.filter(res => {
      if (res.room_id !== roomId) return false;
      if (!res.check_in_date || !res.check_out_date) return false;
      const ci = parseISO(res.check_in_date);
      const co = parseISO(res.check_out_date);
      return ci <= end && co >= startDate;
    });
  };

  const localGetUnplacedForType = (roomTypeId) => {
    const end = addDays(startDate, numDays - 1);
    return reservations.filter(res => {
      if (res.room_id) return false;
      if (res.room_type_id !== roomTypeId) return false;
      if (!res.check_in_date || !res.check_out_date) return false;
      const ci = parseISO(res.check_in_date);
      const co = parseISO(res.check_out_date);
      return ci <= end && co >= startDate;
    });
  };

  // Compute per-day occupancy: how many rooms have a reservation overlapping that day
  const getDayOccupancy = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const occupied = new Set();
    reservationsProp.forEach(res => {
      if (!res.check_in_date || !res.check_out_date) return;
      if (["cancelled", "no_show"].includes(res.status)) return;
      if (res.check_in_date <= dayStr && res.check_out_date > dayStr) {
        if (res.room_id) occupied.add(res.room_id);
      }
    });
    return occupied.size;
  };

  // Per-day price for a room type: just base_price for now (can extend with dynamic pricing)
  const getRoomTypePrice = (group, day) => {
    return group.base_price || null;
  };

  // Count available rooms in a group for a specific day
  const getGroupAvailableForDay = (group, day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const occupiedRoomIds = new Set(
      reservationsProp
        .filter(res => {
          if (!res.check_in_date || !res.check_out_date) return false;
          if (["cancelled", "no_show"].includes(res.status)) return false;
          return res.check_in_date <= dayStr && res.check_out_date > dayStr;
        })
        .map(r => r.room_id)
    );
    return group.rooms.filter(r => !occupiedRoomIds.has(r.id)).length;
  };

  // Attach drag/resize handlers to window so they work even when mouse moves fast
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging) {
        const dx = e.clientX - dragging.mouseStartX;
        const snapped = Math.round(dx / DAY_COL_WIDTH) * DAY_COL_WIDTH;
        setLocalOverrides(prev => ({ ...prev, [dragging.resId]: { ...prev[dragging.resId], leftDelta: snapped } }));
      }
      if (resizing) {
        const dx = e.clientX - resizing.mouseStartX;
        const snapped = Math.round(dx / DAY_COL_WIDTH) * DAY_COL_WIDTH;
        const newWidth = Math.max(DAY_COL_WIDTH - 2, resizing.origWidth + snapped);
        setLocalOverrides(prev => ({ ...prev, [resizing.resId]: { ...prev[resizing.resId], width: newWidth } }));
      }
    };

    const handleMouseUp = async () => {
      if (dragging) {
        const delta = localOverrides[dragging.resId]?.leftDelta || 0;
        const daysDelta = Math.round(delta / DAY_COL_WIDTH);
        if (daysDelta !== 0) {
          const res = reservations.find(r => r.id === dragging.resId);
          if (res) {
            const newCI = format(addDays(parseISO(res.check_in_date), daysDelta), "yyyy-MM-dd");
            const newCO = format(addDays(parseISO(res.check_out_date), daysDelta), "yyyy-MM-dd");
            await api.reservations.update(res.id, { check_in_date: newCI, check_out_date: newCO });
            window.location.reload();
          }
        }
        setDragging(null);
        setLocalOverrides(prev => { const n = {...prev}; delete n[dragging.resId]; return n; });
      }
      if (resizing) {
        const newWidth = localOverrides[resizing.resId]?.width;
        if (newWidth) {
          const res = reservations.find(r => r.id === resizing.resId);
          if (res) {
            const nights = Math.round(newWidth / DAY_COL_WIDTH);
            const newCO = format(addDays(parseISO(res.check_in_date), nights), "yyyy-MM-dd");
            await api.reservations.update(res.id, { check_out_date: newCO, nights });
            window.location.reload();
          }
        }
        setResizing(null);
        setLocalOverrides(prev => { const n = {...prev}; delete n[resizing.resId]; return n; });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, localOverrides, reservations]);

  // Window-level handlers for assign-drag (unplaced → room)
  useEffect(() => {
    if (!assignDrag) return;

    const handleMove = (e) => {
      setAssignDrag(prev => ({ ...prev, mouseX: e.clientX, mouseY: e.clientY }));
      // hit-test: find which room row the cursor is over via data attribute
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const rowEl = el?.closest("[data-room-id]");
      setDropTarget(rowEl ? rowEl.dataset.roomId : null);
    };

    const handleUp = async (e) => {
      if (dropTarget && dropTarget !== assignDrag.origRoomId) {
        const res = reservations.find(r => r.id === assignDrag.resId);
        if (res) {
          // optimistic update
          setReservations(prev => prev.map(r => r.id === res.id ? { ...r, room_id: dropTarget } : r));
          await api.reservations.update(res.id, { room_id: dropTarget });
        }
      }
      setAssignDrag(null);
      setDropTarget(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [assignDrag, dropTarget, reservations]);

  return (
    <div className="flex flex-col h-full">
      {/* Timeline Controls */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
        <button onClick={prevPeriod} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={goToday} className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
          Hôm nay
        </button>
        <button onClick={nextPeriod} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-foreground ml-1">
          {format(days[0], "dd/MM")} – {format(days[days.length - 1], "dd/MM/yyyy")}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {[7, 14, 30].map(n => (
            <button
              key={n}
              onClick={() => setNumDays(n)}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-all",
                numDays === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {n} ngày
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-auto relative" ref={scrollRef}>
        <div style={{ minWidth: LEFT_COL + totalWidth }} ref={gridRef}>

          {/* ── Sticky Day headers ── */}
          <div className="sticky top-0 z-30 flex border-b border-border bg-card shadow-sm">
            <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="sticky left-0 z-40 flex-shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border bg-card">
              Loại / Phòng
            </div>
            <div className="flex relative">
              {days.map((day, i) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const isCurrentDay = dayStr === today;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH }}
                    className={cn(
                      "flex flex-col items-center justify-center py-1.5 border-r border-border text-center",
                      isCurrentDay ? "bg-primary/10" : isWeekend ? "bg-muted/30" : ""
                    )}
                  >
                    <span className={cn("text-xs font-medium", isCurrentDay ? "text-primary font-bold" : isWeekend ? "text-warning" : "text-muted-foreground")}>
                      {format(day, "EEE").slice(0, 2)}
                    </span>
                    <span className={cn(
                      "text-sm font-bold mt-0.5 w-6 h-6 flex items-center justify-center rounded-full",
                      isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    <span className="text-xs text-muted-foreground/60">{format(day, "MM")}</span>
                  </div>
                );
              })}
              {/* Today line */}
              {todayOffset >= 0 && todayOffset < numDays && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10 pointer-events-none"
                  style={{ left: todayOffset * DAY_COL_WIDTH + DAY_COL_WIDTH / 2 }}
                />
              )}
            </div>
          </div>

          {/* Room rows grouped by type */}
          {allRoomGroups.map(group => (
            <div key={group.id}>
              {/* Group header: sticky left col, per-day price + availability */}
              <div className="flex border-b border-border bg-muted/40">
                <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="sticky left-0 z-20 flex-shrink-0 px-3 py-1.5 border-r border-border bg-muted/60">
                  <span className="text-xs font-bold text-foreground/80">{group.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{group.rooms.length} phòng</span>
                </div>
                <div className="flex">
                  {days.map((day, i) => {
                    const price = getRoomTypePrice(group, day);
                    const avail = getGroupAvailableForDay(group, day);
                    const dayStr = format(day, "yyyy-MM-dd");
                    const isCurrentDay = dayStr === today;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={i}
                        style={{ width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH }}
                        className={cn(
                          "flex flex-col items-center justify-center border-r border-border/60 py-1",
                          isCurrentDay ? "bg-primary/5" : isWeekend ? "bg-muted/20" : ""
                        )}
                      >
                        {price && (
                          <span className="text-xs font-semibold text-foreground" style={{ fontSize: 9 }}>
                            {(price / 1000).toFixed(0)}k
                          </span>
                        )}
                        <span className={cn("text-xs font-medium", avail === 0 ? "text-destructive" : avail <= 1 ? "text-warning" : "text-success")} style={{ fontSize: 9 }}>
                          {avail} tr
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual room rows */}
              {group.rooms.map(room => {
                const roomReservations = localGetReservationsForRoom(room.id);
                const isDropTarget = dropTarget === room.id;
                return (
                  <RoomRow
                    key={room.id}
                    room={room}
                    roomReservations={roomReservations}
                    days={days}
                    today={today}
                    totalWidth={totalWidth}
                    getBarProps={getBarProps}
                    getGuestName={getGuestName}
                    dragging={dragging}
                    resizing={resizing}
                    setDragging={setDragging}
                    setResizing={setResizing}
                    localOverrides={localOverrides}
                    setLocalOverrides={setLocalOverrides}
                    setTooltip={setTooltip}
                    isDropTarget={isDropTarget}
                    assignDragging={!!assignDrag}
                    setAssignDrag={setAssignDrag}
                    setSelectedRes={setSelectedRes}
                  />
                );
              })}

              {/* Unplaced bookings row (no room assigned, only room_type_id) */}
              {group.id !== "__unassigned__" && (() => {
                const unplaced = localGetUnplacedForType(group.id);
                if (!unplaced.length) return null;
                return (
                  <div className="flex border-b border-dashed border-warning/40 bg-warning/5" style={{ height: ROW_HEIGHT }}>
                    <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="sticky left-0 z-20 flex-shrink-0 flex items-center gap-2 px-3 border-r border-border bg-warning/5">
                      <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-warning truncate">Chưa xếp phòng</p>
                        <p className="text-xs text-muted-foreground">{unplaced.length} booking · Kéo vào phòng</p>
                      </div>
                    </div>
                    <div className="relative flex-1" style={{ width: totalWidth, minWidth: totalWidth }}>
                      {days.map((day, i) => (
                        <div key={i} className={cn("absolute top-0 bottom-0 border-r border-border/40", format(day, "yyyy-MM-dd") === today ? "bg-primary/5" : day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/20" : "")} style={{ left: i * DAY_COL_WIDTH, width: DAY_COL_WIDTH }} />
                      ))}
                      {unplaced.map(res => {
                        const base = getBarProps(res);
                        if (base.width <= 0) return null;
                        const sc = STATUS_COLORS[res.status] || STATUS_COLORS.pending;
                        const isBeingDragged = assignDrag?.resId === res.id;
                        return (
                          <div key={res.id}
                            className={cn("absolute top-2 bottom-2 rounded-md flex items-center shadow-sm border border-white/20 select-none cursor-grab hover:opacity-90", sc.light, isBeingDragged && "opacity-40")}
                            style={{ left: base.left + 1, width: base.width }}
                            onClick={(e) => {
                              if (!assignDrag) { e.stopPropagation(); setSelectedRes(res); }
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setAssignDrag({ resId: res.id, mouseX: e.clientX, mouseY: e.clientY, origRoomId: null });
                              setTooltip(null);
                            }}
                            onMouseEnter={(e) => { if (!assignDrag) setTooltip({ res, x: e.clientX, y: e.clientY }); }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <span className="text-xs font-medium truncate pl-2 flex-1 pointer-events-none">{getGuestName(res)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}

          {allRoomGroups.length === 0 && (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <div className="text-center">
                <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có phòng nào. Hãy thêm phòng trong Quản lý phòng.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom: Occupancy row ── */}
      <div className="flex-shrink-0 flex border-t-2 border-border bg-card shadow-[0_-2px_8px_rgba(0,0,0,0.06)] sticky bottom-0 z-30" style={{ height: OCCUPANCY_ROW_HEIGHT }}>
        <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="flex-shrink-0 flex items-center px-3 border-r border-border bg-card">
          <span className="text-xs font-bold text-foreground/70 uppercase tracking-wide">Công suất</span>
        </div>
        <div className="flex overflow-x-hidden" style={{ width: `calc(100% - ${LEFT_COL}px)` }}>
          {/* We need to sync horizontal scroll with the main grid */}
          <OccupancyRowScroller days={days} today={today} totalRooms={totalRooms} getDayOccupancy={getDayOccupancy} scrollRef={scrollRef} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 flex flex-wrap gap-3 px-4 py-2 border-t border-border bg-card/50">
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-2.5 rounded", v.bar)} />
            <span className="text-xs text-muted-foreground">{v.label}</span>
          </div>
        ))}
      </div>

      {/* Reservation Detail Modal */}
      {selectedRes && (() => {
        const roomObj = rooms.find(r => r.id === selectedRes.room_id);
        const roomTypeObj = roomTypes.find(rt => rt.id === selectedRes.room_type_id);
        return (
          <ReservationDetailModal
            reservation={selectedRes}
            guestName={getGuestName(selectedRes)}
            roomName={roomObj ? `${roomObj.room_number}${roomObj.room_name ? ` · ${roomObj.room_name}` : ""}` : null}
            roomTypeName={roomTypeObj?.name}
            onClose={() => setSelectedRes(null)}
            onStatusChange={async (res, status) => {
              setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status } : r));
              setSelectedRes(prev => prev ? { ...prev, status } : prev);
              await api.reservations.update(res.id, { status });
            }}
          />
        );
      })()}

      {/* Assign-drag ghost */}
      {assignDrag && (() => {
        const res = reservations.find(r => r.id === assignDrag.resId);
        if (!res) return null;
        const sc = STATUS_COLORS[res.status] || STATUS_COLORS.pending;
        return (
          <div
            className={cn("fixed z-50 pointer-events-none rounded-md px-3 py-1.5 text-xs font-medium shadow-lg border border-white/20 flex items-center gap-2", sc.light)}
            style={{ left: assignDrag.mouseX + 12, top: assignDrag.mouseY - 16 }}
          >
            <span>{getGuestName(res)}</span>
            <span className="opacity-70">→ {dropTarget ? "thả để xếp phòng" : "kéo vào phòng"}</span>
          </div>
        );
      })()}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-card border border-border rounded-xl shadow-lg p-3 text-xs pointer-events-none"
          style={{ left: Math.min(tooltip.x + 12, window.innerWidth - 240), top: Math.max(tooltip.y - 120, 8), maxWidth: 240 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {(getGuestName(tooltip.res) || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight">{getGuestName(tooltip.res)}</p>
              <p className="text-muted-foreground text-xs">#{tooltip.res.reservation_number || tooltip.res.id?.slice(-6)}</p>
            </div>
          </div>
          <div className="space-y-1 border-t border-border pt-2">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium text-foreground">{tooltip.res.check_in_date ? format(parseISO(tooltip.res.check_in_date), "dd/MM/yyyy") : "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium text-foreground">{tooltip.res.check_out_date ? format(parseISO(tooltip.res.check_out_date), "dd/MM/yyyy") : "—"}</span>
            </div>
            {tooltip.res.nights && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Số đêm</span>
                <span className="font-medium text-foreground">{tooltip.res.nights} đêm</span>
              </div>
            )}
            {tooltip.res.num_adults && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Khách</span>
                <span className="font-medium text-foreground">{tooltip.res.num_adults} NL{tooltip.res.num_children ? `, ${tooltip.res.num_children} TE` : ""}</span>
              </div>
            )}
            {tooltip.res.total_amount && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Tổng tiền</span>
                <span className="font-bold text-primary">{tooltip.res.total_amount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            {tooltip.res.source && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Kênh</span>
                <span className="font-medium text-foreground capitalize">{tooltip.res.source}</span>
              </div>
            )}
          </div>
          <div className={cn("mt-2 px-2 py-0.5 rounded-full text-center text-xs font-medium", STATUS_COLORS[tooltip.res.status]?.light)}>
            {STATUS_COLORS[tooltip.res.status]?.label}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Room Row Component ─── */
function RoomRow({ room, roomReservations, days, today, totalWidth, getBarProps, getGuestName,
  dragging, resizing, setDragging, setResizing, localOverrides, setLocalOverrides, setTooltip,
  isDropTarget, assignDragging, setAssignDrag, setSelectedRes }) {

  const statusDot = { available: "bg-success", occupied: "bg-primary", dirty: "bg-warning", cleaning: "bg-info", maintenance: "bg-destructive", out_of_order: "bg-destructive/60" };

  return (
    <div
      data-room-id={room.id}
      className={cn("flex border-b border-border group transition-colors", isDropTarget ? "bg-success/15 border-success/40" : assignDragging ? "hover:bg-success/10" : "hover:bg-muted/10")}
      style={{ height: ROW_HEIGHT }}
    >
      <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="sticky left-0 z-20 flex-shrink-0 flex items-center gap-2 px-3 border-r border-border bg-card group-hover:bg-muted/20">
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot[room.status] || "bg-muted-foreground")} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{room.room_number}{room.room_name ? ` · ${room.room_name}` : ""}</p>
          <p className="text-xs text-muted-foreground truncate">{ROOM_STATUS_LABEL[room.status] || ""}</p>
        </div>
      </div>
      <div className="relative flex-1" style={{ width: totalWidth, minWidth: totalWidth }}>
        {days.map((day, i) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const isCurrentDay = dayStr === today;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div key={i} className={cn("absolute top-0 bottom-0 border-r border-border/40", isCurrentDay ? "bg-primary/5" : isWeekend ? "bg-muted/20" : "")} style={{ left: i * DAY_COL_WIDTH, width: DAY_COL_WIDTH }} />
          );
        })}
        {roomReservations.map(res => {
          const base = getBarProps(res);
          const override = localOverrides[res.id] || {};
          const left = base.left + (override.leftDelta || 0);
          const width = override.width || base.width;
          const sc = STATUS_COLORS[res.status] || STATUS_COLORS.pending;
          if (base.width <= 0) return null;
          const isDraggingThis = dragging?.resId === res.id;
          const isResizingThis = resizing?.resId === res.id;
          const isAssignDraggingThis = assignDragging && !dragging;
          const nights = Math.round(width / DAY_COL_WIDTH);
          return (
            <div
              key={res.id}
              className={cn(
                "absolute top-2 bottom-2 rounded-md flex items-center shadow-sm border border-white/20 select-none",
                sc.light,
                isDraggingThis || isResizingThis ? "opacity-80 z-10 shadow-lg cursor-grabbing" : "cursor-pointer hover:opacity-90 hover:shadow-md"
              )}
              style={{ left: left + 1, width }}
              onClick={(e) => {
                if (!dragging && !resizing && !assignDragging) {
                  e.stopPropagation();
                  setSelectedRes(res);
                  setTooltip(null);
                }
              }}
              onMouseDown={(e) => {
                if (e.target.dataset.resize) return;
                if (e.target.dataset.assignhandle) return;
                e.preventDefault();
                setDragging({ resId: res.id, mouseStartX: e.clientX });
                setLocalOverrides(prev => ({ ...prev, [res.id]: { ...prev[res.id], leftDelta: 0 } }));
              }}
              onMouseEnter={(e) => { if (!dragging && !resizing && !assignDragging) setTooltip({ res, x: e.clientX, y: e.clientY }); }}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className="text-xs font-medium truncate pl-2 flex-1 pointer-events-none">{getGuestName(res)}</span>
              {width > 80 && <span className="mr-7 text-xs opacity-75 pointer-events-none">{nights}đ</span>}
              {/* Assign-drag handle (move to different room) */}
              <div
                data-assignhandle="true"
                title="Kéo để đổi phòng"
                className="absolute right-6 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 cursor-grab z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAssignDrag({ resId: res.id, mouseX: e.clientX, mouseY: e.clientY, origRoomId: room.id });
                  setTooltip(null);
                }}
              >
                <div className="flex flex-col gap-0.5 pointer-events-none">
                  <div className="w-0.5 h-2.5 bg-white/70 rounded" />
                  <div className="w-0.5 h-2.5 bg-white/70 rounded" />
                </div>
              </div>
              <div
                data-resize="true"
                className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center rounded-r-md hover:bg-white/20"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setResizing({ resId: res.id, origWidth: width, mouseStartX: e.clientX }); }}
              >
                <div className="w-0.5 h-4 bg-white/50 rounded pointer-events-none" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Occupancy row - syncs scroll with main scrollRef */
function OccupancyRowScroller({ days, today, totalRooms, getDayOccupancy, scrollRef }) {
  const rowRef = useRef(null);

  useEffect(() => {
    const mainEl = scrollRef.current;
    const rowEl = rowRef.current;
    if (!mainEl || !rowEl) return;
    const onScroll = () => { rowEl.scrollLeft = mainEl.scrollLeft; };
    mainEl.addEventListener("scroll", onScroll);
    return () => mainEl.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <div ref={rowRef} className="flex overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
      {days.map((day, i) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const isCurrentDay = dayStr === today;
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const occupied = getDayOccupancy(day);
        const pct = totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;
        const color = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : pct >= 40 ? "bg-info" : "bg-success";
        return (
          <div
            key={i}
            style={{ width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH, height: OCCUPANCY_ROW_HEIGHT }}
            className={cn(
              "flex flex-col items-center justify-center border-r border-border gap-0.5 flex-shrink-0",
              isCurrentDay ? "bg-primary/5" : isWeekend ? "bg-muted/20" : ""
            )}
          >
            <div className="w-4/5 bg-muted rounded-full overflow-hidden" style={{ height: 5 }}>
              <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
            </div>
            <span className={cn("font-bold", isCurrentDay ? "text-primary" : "text-foreground")} style={{ fontSize: 10 }}>
              {Math.round(pct)}%
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 9 }}>{occupied}/{totalRooms}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── FLOOR VIEW ─────────────── */
function FloorView({ rooms, typeMap, floors, filterFloor, reservations, propertyId }) {
  const updateStatus = async (room, newStatus) => {
    // optimistic local update handled by parent — but since we don't have setter here, just call API
    await api.rooms.update(room.id, { status: newStatus });
    window.location.reload(); // simple reload for now
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const checkedInRooms = new Set(
    reservations.filter(r => r.status === "checked_in").map(r => r.room_id)
  );
  const checkingInToday = new Set(
    reservations.filter(r => r.check_in_date === today && r.status === "confirmed").map(r => r.room_id)
  );
  const checkingOutToday = new Set(
    reservations.filter(r => r.check_out_date === today && r.status === "checked_in").map(r => r.room_id)
  );

  const displayFloors = filterFloor === "all" ? floors : [filterFloor];
  const roomsWithoutFloor = rooms.filter(r => !r.floor);

  const renderFloor = (floorRooms, floorLabel) => (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{floorLabel}</span>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{floorRooms.length} phòng</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
        {floorRooms.map(room => (
          <FloorRoomCard
            key={room.id}
            room={room}
            typeMap={typeMap}
            isCheckingIn={checkingInToday.has(room.id)}
            isCheckingOut={checkingOutToday.has(room.id)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 overflow-auto h-full">
      {displayFloors.length > 0
        ? displayFloors.map(floor => {
            const floorRooms = rooms.filter(r => r.floor === floor);
            return floorRooms.length > 0 ? renderFloor(floorRooms, `Tầng ${floor}`) : null;
          })
        : rooms.length > 0
          ? renderFloor(rooms, "Tất cả phòng")
          : null
      }
      {roomsWithoutFloor.length > 0 && filterFloor === "all" && renderFloor(roomsWithoutFloor, "Chưa phân tầng")}

      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <BedDouble className="w-12 h-12 mb-3 opacity-30" />
          <p>Chưa có phòng nào</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
        {Object.entries(ROOM_STATUS_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded border", ROOM_STATUS_COLORS[k]?.replace("text-", "border-")?.split(" ")[1] || "border-border",
              k === "available" ? "bg-success/30" : k === "occupied" ? "bg-primary/20" : k === "dirty" ? "bg-warning/20" : "bg-muted"
            )} />
            <span className="text-xs text-muted-foreground">{v}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-info bg-info/10" />
          <span className="text-xs text-muted-foreground">Check-in hôm nay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-warning bg-warning/10" />
          <span className="text-xs text-muted-foreground">Check-out hôm nay</span>
        </div>
      </div>
    </div>
  );
}

function FloorRoomCard({ room, typeMap, isCheckingIn, isCheckingOut }) {
  const [showMenu, setShowMenu] = useState(false);
  const sc = ROOM_STATUS_COLORS[room.status] || ROOM_STATUS_COLORS.available;
  const rt = typeMap[room.room_type_id];
  const statuses = Object.entries(ROOM_STATUS_LABEL);

  const handleStatusChange = async (newStatus) => {
    await api.rooms.update(room.id, { status: newStatus });
    setShowMenu(false);
    window.location.reload();
  };

  const statusDotColor = {
    available: "bg-success", occupied: "bg-primary", dirty: "bg-warning",
    cleaning: "bg-info", maintenance: "bg-destructive", out_of_order: "bg-muted-foreground/60"
  };

  return (
    <div className="relative">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "rounded-xl border-2 p-2.5 cursor-pointer transition-all hover:shadow-md select-none",
          isCheckingIn ? "border-info bg-info/10" : isCheckingOut ? "border-warning bg-warning/10" : cn(sc),
          "border-opacity-50"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <div className={cn("w-2 h-2 rounded-full", statusDotColor[room.status] || "bg-muted-foreground")} />
          {isCheckingIn && <span className="text-xs font-bold text-info">IN</span>}
          {isCheckingOut && <span className="text-xs font-bold text-warning">OUT</span>}
        </div>
        <p className="text-sm font-bold text-foreground">{room.room_number}</p>
        {rt && <p className="text-xs text-muted-foreground truncate mt-0.5">{rt.name}</p>}
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ROOM_STATUS_LABEL[room.status]}</p>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-44 bg-card border border-border rounded-xl shadow-lg py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">Phòng {room.room_number}</p>
            {statuses.map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2",
                  room.status === key && "font-semibold bg-muted")}
              >
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDotColor[key])} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────── LIST VIEW ─────────────── */
function ListView({ reservations, filterStatus, search, propertyId, otaChannels = [] }) {
  const filtered = reservations.filter(r => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchSearch = !search ||
      r.reservation_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.room_number?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const sourceLabels = {
    direct: "Trực tiếp", phone: "Điện thoại", email: "Email", walk_in: "Walk-in",
    booking_com: "Booking.com", agoda: "Agoda", expedia: "Expedia", airbnb: "Airbnb",
    traveloka: "Traveloka", other_ota: "OTA khác",
  };

  const getSourceLabel = (source) => {
    if (sourceLabels[source]) return sourceLabels[source];
    const ota = otaChannels.find(c => c.id === source);
    return ota ? ota.name : (source || "—");
  };

  const handleStatusChange = async (r, status) => {
    await api.reservations.update(r.id, { status });
    window.location.reload();
  };

  return (
    <div className="overflow-auto h-full">
      <table className="w-full min-w-[800px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/60 border-b border-border">
            {["Mã ĐP", "Khách hàng", "Phòng", "Check-in", "Check-out", "Đêm", "Kênh", "Tổng tiền", "Trạng thái", ""].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.length === 0 ? (
            <tr><td colSpan={10} className="text-center py-16 text-muted-foreground text-sm">Không có đặt phòng nào</td></tr>
          ) : filtered.map(r => {
            const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
            return (
              <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono font-bold text-primary">{r.reservation_number || r.id?.slice(-8)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {(r.guest_name || "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.guest_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.num_adults || 1} người lớn{r.num_children ? `, ${r.num_children} trẻ em` : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{r.room_number || "—"}</td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {r.check_in_date ? format(parseISO(r.check_in_date), "dd/MM/yyyy") : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {r.check_out_date ? format(parseISO(r.check_out_date), "dd/MM/yyyy") : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                  {r.nights || (r.check_in_date && r.check_out_date ? differenceInDays(parseISO(r.check_out_date), parseISO(r.check_in_date)) : "—")}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                    {getSourceLabel(r.source)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">
                  {r.total_amount ? r.total_amount.toLocaleString("vi-VN") + "đ" : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", sc.light)}>{sc.label}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {r.status === "confirmed" && (
                      <button
                        onClick={() => handleStatusChange(r, "checked_in")}
                        className="text-xs px-2 py-1 bg-success/10 text-success rounded-md hover:bg-success/20 font-medium whitespace-nowrap"
                      >
                        Check-in
                      </button>
                    )}
                    {r.status === "checked_in" && (
                      <button
                        onClick={() => handleStatusChange(r, "checked_out")}
                        className="text-xs px-2 py-1 bg-warning/10 text-warning rounded-md hover:bg-warning/20 font-medium whitespace-nowrap"
                      >
                        Check-out
                      </button>
                    )}
                    {["pending", "confirmed"].includes(r.status) && (
                      <button
                        onClick={() => handleStatusChange(r, "cancelled")}
                        className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 font-medium"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
