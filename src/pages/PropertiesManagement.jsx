import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "@/components/shared/PageHeader";
import {
  Building2, Plus, Search, Filter, Star, ArrowRight,
  MoreVertical, Edit, Trash2, Key, CheckCircle, AlertTriangle, Clock, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const statusConfig = {
  active: { label: "Hoạt động", icon: CheckCircle, class: "bg-success/10 text-success border-success/20" },
  trial: { label: "Dùng thử", icon: Clock, class: "bg-info/10 text-info border-info/20" },
  inactive: { label: "Tạm dừng", icon: XCircle, class: "bg-muted text-muted-foreground border-border" },
  suspended: { label: "Đình chỉ", icon: AlertTriangle, class: "bg-destructive/10 text-destructive border-destructive/20" },
};

const licenseColors = {
  basic: "bg-muted text-muted-foreground",
  professional: "bg-info/10 text-info",
  enterprise: "bg-accent/20 text-accent-foreground font-semibold",
};

const defaultForm = {
  name: "", code: "", type: "hotel", address: "", city: "", country: "Vietnam",
  phone: "", email: "", star_rating: "", total_rooms: "",
  status: "trial", license_type: "basic", license_start: "", license_end: "",
  monthly_fee: "", check_in_time: "14:00", check_out_time: "12:00", tax_rate: 10,
};

export default function PropertiesManagement() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.Property.list("-created_date", 100).then(d => { setProperties(d); setLoading(false); });
  };
  useEffect(load, []);

  const openCreate = () => { setForm(defaultForm); setEditProp(null); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...defaultForm, ...p }); setEditProp(p); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      star_rating: form.star_rating ? Number(form.star_rating) : undefined,
      total_rooms: form.total_rooms ? Number(form.total_rooms) : undefined,
      monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : undefined,
    };
    if (editProp) await base44.entities.Property.update(editProp.id, data);
    else await base44.entities.Property.create(data);
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa khách sạn này?")) return;
    await base44.entities.Property.delete(id);
    load();
  };

  const filtered = properties.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Quản Lý Khách Sạn"
        subtitle="Toàn bộ cơ sở lưu trú trên hệ thống StayPro"
        actions={
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Thêm Khách Sạn
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm tên khách sạn, thành phố..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="trial">Dùng thử</SelectItem>
            <SelectItem value="inactive">Tạm dừng</SelectItem>
            <SelectItem value="suspended">Đình chỉ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Không tìm thấy khách sạn nào</p>
          <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="w-4 h-4" />Thêm khách sạn mới</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prop => {
            const sc = statusConfig[prop.status] || statusConfig.active;
            return (
              <div key={prop.id} className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all group">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-xs border ${sc.class}`}>
                        <sc.icon className="w-3 h-3 mr-1" />{sc.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(prop)} className="gap-2"><Edit className="w-4 h-4" />Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(prop.id)} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground leading-tight mb-1">{prop.name}</h3>
                    <p className="text-xs text-muted-foreground">{[prop.city, prop.country].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {prop.star_rating && (
                      <span className="flex items-center gap-0.5 text-xs text-warning bg-warning/8 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" />{prop.star_rating} sao
                      </span>
                    )}
                    {prop.total_rooms && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{prop.total_rooms} phòng</span>
                    )}
                    <Badge className={`text-xs ${licenseColors[prop.license_type || "basic"]}`}>
                      {prop.license_type === "enterprise" ? "Enterprise" : prop.license_type === "professional" ? "Pro" : "Basic"}
                    </Badge>
                  </div>
                  {prop.license_end && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Hết hạn: {format(new Date(prop.license_end), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
                <div className="border-t border-border px-5 py-3">
                  <Link to={createPageUrl("HotelDashboard") + `?property_id=${prop.id}`}>
                    <Button variant="ghost" size="sm" className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/5 text-xs">
                      Vào quản lý <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProp ? "Chỉnh sửa" : "Thêm"} Khách Sạn</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Tên khách sạn *</Label>
              <Input className="mt-1.5" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Khách Sạn Mường Thanh..." />
            </div>
            <div>
              <Label>Mã khách sạn</Label>
              <Input className="mt-1.5" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="KS001" />
            </div>
            <div>
              <Label>Loại</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="resort">Resort</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="guesthouse">Guesthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Địa chỉ</Label>
              <Input className="mt-1.5" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>Thành phố</Label>
              <Input className="mt-1.5" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <Label>Quốc gia</Label>
              <Input className="mt-1.5" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
            </div>
            <div>
              <Label>Điện thoại</Label>
              <Input className="mt-1.5" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Số sao</Label>
              <Select value={String(form.star_rating || "")} onValueChange={v => setForm(p => ({ ...p, star_rating: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(s => <SelectItem key={s} value={String(s)}>{s} sao</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tổng số phòng</Label>
              <Input className="mt-1.5" type="number" value={form.total_rooms} onChange={e => setForm(p => ({ ...p, total_rooms: e.target.value }))} />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Dùng thử</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                  <SelectItem value="suspended">Đình chỉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại License</Label>
              <Select value={form.license_type} onValueChange={v => setForm(p => ({ ...p, license_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày bắt đầu License</Label>
              <Input className="mt-1.5" type="date" value={form.license_start} onChange={e => setForm(p => ({ ...p, license_start: e.target.value }))} />
            </div>
            <div>
              <Label>Ngày hết hạn License</Label>
              <Input className="mt-1.5" type="date" value={form.license_end} onChange={e => setForm(p => ({ ...p, license_end: e.target.value }))} />
            </div>
            <div>
              <Label>Phí tháng (VND)</Label>
              <Input className="mt-1.5" type="number" value={form.monthly_fee} onChange={e => setForm(p => ({ ...p, monthly_fee: e.target.value }))} />
            </div>
            <div>
              <Label>Thuế (%)</Label>
              <Input className="mt-1.5" type="number" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-primary">
              {saving ? "Đang lưu..." : editProp ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
