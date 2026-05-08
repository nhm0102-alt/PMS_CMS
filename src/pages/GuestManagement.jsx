import { useState, useEffect } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, MoreVertical, Star, User, Phone, Mail, Globe, Award } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const tierConfig = {
  standard: { label: "Standard", class: "bg-muted text-muted-foreground" },
  silver: { label: "Silver", class: "bg-muted text-foreground" },
  gold: { label: "Gold", class: "bg-accent/20 text-accent-foreground" },
  platinum: { label: "Platinum", class: "bg-primary/10 text-primary" },
};

const defForm = {
  first_name: "", last_name: "", email: "", phone: "", nationality: "Vietnamese",
  id_type: "national_id", id_number: "", gender: "male",
  address: "", city: "", country: "Vietnam",
  loyalty_tier: "standard", notes: "", preferences: "",
};

export default function GuestManagement() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = () => {
    const q = propertyId ? { property_id: propertyId } : {};
    api.guests.filter(q, "-created_date", 100).then(d => { setGuests(d); setLoading(false); });
  };
  useEffect(load, [propertyId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const d = { ...form, property_id: propertyId };
    if (editGuest) await api.guests.update(editGuest.id, d);
    else await api.guests.create(d);
    setSaving(false); setShowForm(false); load();
  };

  const filtered = guests.filter(g => {
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || g.email?.includes(search) || g.phone?.includes(search);
    const matchTier = filterTier === "all" || g.loyalty_tier === filterTier;
    return matchSearch && matchTier;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Quản Lý Khách Hàng"
        subtitle="Hồ sơ và lịch sử lưu trú của khách"
        actions={
          <Button className="bg-primary gap-2" onClick={() => { setForm(defForm); setEditGuest(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" />Thêm Khách
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm tên, email, điện thoại..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Hạng thành viên" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hạng</SelectItem>
            {Object.entries(tierConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? Array(8).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl border border-border p-4 h-36 animate-pulse" />) :
          filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
            </div>
          ) : filtered.map(g => {
            const tc = tierConfig[g.loyalty_tier] || tierConfig.standard;
            return (
              <div
                key={g.id}
                className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all group cursor-pointer"
                onClick={() => setSelected(selected?.id === g.id ? null : g)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {g.first_name?.[0]?.toUpperCase()}{g.last_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-xs ${tc.class} border-0`}><Award className="w-3 h-3 mr-1" />{tc.label}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); setForm({ ...defForm, ...g }); setEditGuest(g); setShowForm(true); }} className="gap-2"><Edit className="w-4 h-4" />Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem onClick={async e => { e.stopPropagation(); await api.guests.delete(g.id); load(); }} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground">{g.first_name} {g.last_name}</h3>
                  {g.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{g.email}</p>}
                  {g.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{g.phone}</p>}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    <div className="text-center"><p className="text-sm font-bold text-foreground">{g.total_stays || 0}</p><p className="text-xs text-muted-foreground">lần ở</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-foreground">{g.loyalty_points || 0}</p><p className="text-xs text-muted-foreground">điểm</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-foreground">{((g.total_spent || 0) / 1e6).toFixed(1)}M</p><p className="text-xs text-muted-foreground">tổng chi</p></div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Guest Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editGuest ? "Chỉnh sửa" : "Thêm"} Khách Hàng</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Họ *</Label><Input className="mt-1.5" value={form.last_name} onChange={e => set("last_name", e.target.value)} /></div>
            <div><Label>Tên *</Label><Input className="mt-1.5" value={form.first_name} onChange={e => set("first_name", e.target.value)} /></div>
            <div><Label>Email</Label><Input className="mt-1.5" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><Label>Điện thoại</Label><Input className="mt-1.5" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div><Label>Quốc tịch</Label><Input className="mt-1.5" value={form.nationality} onChange={e => set("nationality", e.target.value)} /></div>
            <div>
              <Label>Giới tính</Label>
              <Select value={form.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="male">Nam</SelectItem><SelectItem value="female">Nữ</SelectItem><SelectItem value="other">Khác</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại giấy tờ</Label>
              <Select value={form.id_type} onValueChange={v => set("id_type", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">CCCD / CMND</SelectItem>
                  <SelectItem value="passport">Hộ chiếu</SelectItem>
                  <SelectItem value="driver_license">GPLX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Số giấy tờ</Label><Input className="mt-1.5" value={form.id_number} onChange={e => set("id_number", e.target.value)} /></div>
            <div>
              <Label>Hạng thành viên</Label>
              <Select value={form.loyalty_tier} onValueChange={v => set("loyalty_tier", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tierConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Thành phố</Label><Input className="mt-1.5" value={form.city} onChange={e => set("city", e.target.value)} /></div>
            <div className="col-span-2"><Label>Địa chỉ</Label><Input className="mt-1.5" value={form.address} onChange={e => set("address", e.target.value)} /></div>
            <div className="col-span-2"><Label>Sở thích / Yêu cầu đặc biệt</Label><Textarea className="mt-1.5 h-16" value={form.preferences} onChange={e => set("preferences", e.target.value)} /></div>
            <div className="col-span-2"><Label>Ghi chú nội bộ</Label><Textarea className="mt-1.5 h-14" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name} className="bg-primary">
              {saving ? "Đang lưu..." : editGuest ? "Cập nhật" : "Thêm khách"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
