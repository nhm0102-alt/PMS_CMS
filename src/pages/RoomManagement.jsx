import { useState, useEffect } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, BedDouble, Layers, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const roomStatusColors = {
  available: "bg-success/10 text-success border-success/20",
  occupied: "bg-primary/10 text-primary border-primary/20",
  dirty: "bg-warning/10 text-warning border-warning/20",
  cleaning: "bg-info/10 text-info border-info/20",
  maintenance: "bg-destructive/10 text-destructive border-destructive/20",
  out_of_order: "bg-muted text-muted-foreground",
};
const roomStatusLabels = { available: "Trống", occupied: "Có khách", dirty: "Cần dọn", cleaning: "Đang dọn", maintenance: "Bảo trì", out_of_order: "Hỏng" };
const bedTypeLabels = { single: "Giường đơn", double: "Giường đôi", twin: "Twin", king: "King", queen: "Queen", suite: "Suite" };

const defRT = { name: "", code: "", description: "", standard_adults: 2, max_adults: 2, max_children: 1, max_occupancy: 3, base_price: "", area: "", bed_type: "double", is_active: true, total_rooms: 1 };
const defRoom = { room_number: "", room_name: "", floor: "", room_type_id: "", status: "available", notes: "", is_active: true };

export default function RoomManagement() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rtForm, setRTForm] = useState(defRT);
  const [roomForm, setRoomForm] = useState(defRoom);
  const [editRT, setEditRT] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [showRTForm, setShowRTForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const q = propertyId ? { property_id: propertyId } : {};
    Promise.all([
      api.rooms.filter(q, "room_number"),
      api.roomTypes.filter(q),
    ]).then(([r, rt]) => { setRooms(r); setRoomTypes(rt); setLoading(false); });
  };
  useEffect(load, [propertyId]);

  const saveRT = async () => {
    setSaving(true);
    const d = {
      ...rtForm,
      property_id: propertyId,
      standard_adults: Number(rtForm.standard_adults),
      max_adults: Number(rtForm.max_adults),
      max_children: Number(rtForm.max_children),
      max_occupancy: Number(rtForm.max_adults) + Number(rtForm.max_children),
      base_price: Number(rtForm.base_price),
      area: Number(rtForm.area),
    };
    if (editRT) await api.roomTypes.update(editRT.id, d);
    else await api.roomTypes.create(d);
    setSaving(false); setShowRTForm(false); load();
  };

  const saveRoom = async () => {
    setSaving(true);
    const d = { ...roomForm, property_id: propertyId };
    if (editRoom) await api.rooms.update(editRoom.id, d);
    else await api.rooms.create(d);
    setSaving(false); setShowRoomForm(false); load();
  };

  const typeMap = Object.fromEntries(roomTypes.map(rt => [rt.id, rt]));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Quản Lý Phòng" subtitle="Cấu hình loại phòng và danh sách phòng" />

      <Tabs defaultValue="rooms">
        <TabsList className="bg-muted">
          <TabsTrigger value="rooms" className="gap-2"><BedDouble className="w-4 h-4" />Danh sách phòng ({rooms.length})</TabsTrigger>
          <TabsTrigger value="types" className="gap-2"><Layers className="w-4 h-4" />Loại phòng ({roomTypes.length})</TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button className="bg-primary gap-2" onClick={() => { setRoomForm(defRoom); setEditRoom(null); setShowRoomForm(true); }}>
              <Plus className="w-4 h-4" />Thêm phòng
            </Button>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Số / Tên phòng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tầng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Loại phòng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ghi chú</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array(6).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-muted rounded w-16 animate-pulse" /></td>)}</tr>
                )) : rooms.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Chưa có phòng nào</td></tr>
                ) : rooms.map(room => (
                  <tr key={room.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                       <p className="font-semibold text-foreground">{room.room_number}</p>
                       {room.room_name && <p className="text-xs text-muted-foreground">{room.room_name}</p>}
                     </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{room.floor || "—"}</td>
                    <td className="px-4 py-3.5 text-sm text-foreground">{typeMap[room.room_type_id]?.name || "—"}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className={`text-xs border ${roomStatusColors[room.status] || ""}`}>
                        {roomStatusLabels[room.status] || room.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground max-w-xs truncate">{room.notes || "—"}</td>
                    <td className="px-4 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setRoomForm({ ...defRoom, ...room }); setEditRoom(room); setShowRoomForm(true); }} className="gap-2"><Edit className="w-4 h-4" />Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => { await api.rooms.delete(room.id); load(); }} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Room Types Tab */}
        <TabsContent value="types" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button className="bg-primary gap-2" onClick={() => { setRTForm(defRT); setEditRT(null); setShowRTForm(true); }}>
              <Plus className="w-4 h-4" />Thêm loại phòng
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomTypes.map(rt => (
              <div key={rt.id} className="bg-card rounded-xl border border-border shadow-card p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{rt.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{rt.code || "—"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setRTForm({ ...defRT, ...rt }); setEditRT(rt); setShowRTForm(true); }} className="gap-2"><Edit className="w-4 h-4" />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => { await api.roomTypes.delete(rt.id); load(); }} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" />Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Giá:</span><span className="font-semibold text-foreground">{rt.base_price?.toLocaleString("vi-VN")}đ/đêm</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Giường:</span><span>{bedTypeLabels[rt.bed_type] || rt.bed_type}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tiêu chuẩn:</span><span>{rt.standard_adults || 2} người lớn</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tối đa:</span><span>{rt.max_adults || rt.max_occupancy} NL + {rt.max_children ?? 1} TE</span></div>
                  {rt.area && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Diện tích:</span><span>{rt.area}m²</span></div>}
                </div>
              </div>
            ))}
            {roomTypes.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-muted-foreground">Chưa có loại phòng nào</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Room Form */}
      <Dialog open={showRoomForm} onOpenChange={setShowRoomForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRoom ? "Chỉnh sửa" : "Thêm"} Phòng</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Số phòng *</Label><Input className="mt-1.5" value={roomForm.room_number} onChange={e => setRoomForm(p => ({ ...p, room_number: e.target.value }))} placeholder="VD: 101, 202" /></div>
            <div><Label>Tên phòng</Label><Input className="mt-1.5" value={roomForm.room_name || ""} onChange={e => setRoomForm(p => ({ ...p, room_name: e.target.value }))} placeholder="VD: Daisy, Rose..." /></div>
            <div><Label>Tầng</Label><Input className="mt-1.5" value={roomForm.floor} onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))} /></div>
            <div>
              <Label>Loại phòng</Label>
              <Select value={roomForm.room_type_id} onValueChange={v => setRoomForm(p => ({ ...p, room_type_id: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                <SelectContent>{roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={roomForm.status} onValueChange={v => setRoomForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roomStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Ghi chú</Label><Textarea className="mt-1.5 h-16" value={roomForm.notes} onChange={e => setRoomForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomForm(false)}>Hủy</Button>
            <Button onClick={saveRoom} disabled={saving || !roomForm.room_number} className="bg-primary">{saving ? "Đang lưu..." : editRoom ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RoomType Form */}
      <Dialog open={showRTForm} onOpenChange={setShowRTForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editRT ? "Chỉnh sửa" : "Thêm"} Loại Phòng</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="col-span-2"><Label>Tên loại phòng *</Label><Input className="mt-1.5" value={rtForm.name} onChange={e => setRTForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Deluxe, Superior, Suite..." /></div>
            <div><Label>Mã loại phòng</Label><Input className="mt-1.5" value={rtForm.code} onChange={e => setRTForm(p => ({ ...p, code: e.target.value }))} placeholder="VD: DLX" /></div>
            <div>
              <Label>Loại giường</Label>
              <Select value={rtForm.bed_type} onValueChange={v => setRTForm(p => ({ ...p, bed_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(bedTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Giá / đêm (VND)</Label><Input className="mt-1.5" type="number" value={rtForm.base_price} onChange={e => setRTForm(p => ({ ...p, base_price: e.target.value }))} /></div>
            <div><Label>Diện tích (m²)</Label><Input className="mt-1.5" type="number" value={rtForm.area} onChange={e => setRTForm(p => ({ ...p, area: e.target.value }))} /></div>

            {/* Occupancy section */}
            <div className="col-span-2 border-t border-border pt-3 mt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cấu hình Occupancy</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Tiêu chuẩn (NL)</Label>
                  <Input className="mt-1.5" type="number" min="1" value={rtForm.standard_adults}
                    onChange={e => setRTForm(p => ({ ...p, standard_adults: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Người lớn tiêu chuẩn</p>
                </div>
                <div>
                  <Label className="text-xs">Tối đa NL</Label>
                  <Input className="mt-1.5" type="number" min="1" value={rtForm.max_adults}
                    onChange={e => setRTForm(p => ({ ...p, max_adults: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Max người lớn</p>
                </div>
                <div>
                  <Label className="text-xs">Tối đa TE</Label>
                  <Input className="mt-1.5" type="number" min="0" value={rtForm.max_children}
                    onChange={e => setRTForm(p => ({ ...p, max_children: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Max trẻ em</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                Tổng sức chứa tối đa: <strong>{Number(rtForm.max_adults || 0) + Number(rtForm.max_children || 0)} người</strong>
                &nbsp;({rtForm.max_adults} NL + {rtForm.max_children} TE)
              </div>
            </div>

            <div className="col-span-2"><Label>Mô tả</Label><Textarea className="mt-1.5 h-16" value={rtForm.description} onChange={e => setRTForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRTForm(false)}>Hủy</Button>
            <Button onClick={saveRT} disabled={saving || !rtForm.name} className="bg-primary">{saving ? "Đang lưu..." : editRT ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
