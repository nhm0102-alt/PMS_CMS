import { useState, useEffect } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BedDouble, AlertTriangle, Wrench, Sparkles, CheckCircle } from "lucide-react";

const roomStatuses = [
  { key: "available", label: "Trống", color: "bg-success", textColor: "text-success", bgLight: "bg-success/10" },
  { key: "occupied", label: "Có khách", color: "bg-primary", textColor: "text-primary", bgLight: "bg-primary/8" },
  { key: "dirty", label: "Cần dọn", color: "bg-warning", textColor: "text-warning", bgLight: "bg-warning/10" },
  { key: "cleaning", label: "Đang dọn", color: "bg-info", textColor: "text-info", bgLight: "bg-info/10" },
  { key: "maintenance", label: "Bảo trì", color: "bg-destructive", textColor: "text-destructive", bgLight: "bg-destructive/10" },
  { key: "out_of_order", label: "Hỏng", color: "bg-muted-foreground/50", textColor: "text-muted-foreground", bgLight: "bg-muted" },
];

const statusIcons = {
  available: CheckCircle,
  occupied: BedDouble,
  dirty: Sparkles,
  cleaning: Sparkles,
  maintenance: Wrench,
  out_of_order: AlertTriangle,
};

export default function RoomChart() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    Promise.all([
      propertyId
        ? api.rooms.filter({ property_id: propertyId }, "room_number", 200)
        : api.rooms.list("room_number", 200),
      propertyId
        ? api.roomTypes.filter({ property_id: propertyId })
        : api.roomTypes.list(),
    ]).then(([r, rt]) => {
      setRooms(r);
      setRoomTypes(rt);
      setLoading(false);
    });
  }, [propertyId]);

  const floors = [...new Set(rooms.map(r => r.floor).filter(Boolean))].sort();
  const typeMap = Object.fromEntries(roomTypes.map(rt => [rt.id, rt]));

  const updateStatus = async (room, newStatus) => {
    await api.rooms.update(room.id, { status: newStatus });
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: newStatus } : r));
  };

  const filtered = rooms.filter(r => {
    const matchFloor = filterFloor === "all" || r.floor === filterFloor;
    const matchType = filterType === "all" || r.room_type_id === filterType;
    return matchFloor && matchType;
  });

  const countByStatus = (status) => rooms.filter(r => r.status === status).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Sơ Đồ Phòng" subtitle="Tổng quan tình trạng tất cả phòng" />

      {/* Legend + Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {roomStatuses.map(s => (
          <div key={s.key} className={cn("rounded-xl border border-border p-3 text-center", s.bgLight)}>
            <div className={cn("text-2xl font-bold", s.textColor)}>{countByStatus(s.key)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tầng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tầng</SelectItem>
            {floors.map(f => <SelectItem key={f} value={f}>Tầng {f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Loại phòng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {Array(20).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <BedDouble className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có phòng nào</p>
        </div>
      ) : (
        <div>
          {/* Group by floor */}
          {floors.length > 0 ? floors.filter(f => filterFloor === "all" || filterFloor === f).map(floor => {
            const floorRooms = filtered.filter(r => r.floor === floor);
            if (!floorRooms.length) return null;
            return (
              <div key={floor} className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted px-3 py-1 rounded-full">Tầng {floor}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{floorRooms.length} phòng</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
                  {floorRooms.map(room => <RoomCell key={room.id} room={room} typeMap={typeMap} onStatusChange={updateStatus} statuses={roomStatuses} />)}
                </div>
              </div>
            );
          }) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
              {filtered.map(room => <RoomCell key={room.id} room={room} typeMap={typeMap} onStatusChange={updateStatus} statuses={roomStatuses} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoomCell({ room, typeMap, onStatusChange, statuses }) {
  const [showMenu, setShowMenu] = useState(false);
  const sc = statuses.find(s => s.key === room.status) || statuses[0];
  const roomType = typeMap[room.room_type_id];
  const Icon = statusIcons[room.status] || BedDouble;

  return (
    <div className="relative">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "rounded-xl border-2 p-2.5 cursor-pointer transition-all hover:shadow-md select-none",
          sc.bgLight,
          room.status === "occupied" ? "border-primary/30" : "border-transparent hover:border-border"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <Icon className={cn("w-3.5 h-3.5", sc.textColor)} />
          <div className={cn("w-2 h-2 rounded-full", sc.color)} />
        </div>
        <p className="text-sm font-bold text-foreground leading-none">{room.room_number}</p>
        {roomType && <p className="text-xs text-muted-foreground mt-0.5 truncate">{roomType.name}</p>}
      </div>

      {showMenu && (
        <div className="absolute top-full left-0 z-50 mt-1 w-44 bg-card border border-border rounded-xl shadow-lg py-1 overflow-hidden">
          <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">Phòng {room.room_number}</p>
          {statuses.map(s => (
            <button
              key={s.key}
              onClick={() => { onStatusChange(room, s.key); setShowMenu(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2",
                room.status === s.key && "font-semibold"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", s.color)} />
              {s.label}
              {room.status === s.key && " ✓"}
            </button>
          ))}
          <button onClick={() => setShowMenu(false)} className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground border-t border-border hover:bg-muted">Đóng</button>
        </div>
      )}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </div>
  );
}
