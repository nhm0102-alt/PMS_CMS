import { useState, useEffect } from "react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Pencil, Trash2, Tag, UtensilsCrossed, ShieldCheck,
  Users, BedDouble, AlertTriangle, X, CheckCircle2
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const mealPlanLabels = {
  none: "Không bao gồm ăn",
  breakfast: "Bao gồm bữa sáng (BB)",
  half_board: "Nửa bữa (HB)",
  full_board: "Đủ bữa (FB)",
  all_inclusive: "All Inclusive (AI)"
};

const defaultForm = {
  name: "", code: "", description: "",
  room_type_ids: [],
  cancellation_policy_id: "",
  surcharge_policy_id: "",
  meal_plan: "none",
  services: [],
  price_modifier_type: "percent",
  price_modifier_value: 0,
  min_stay: 1,
  max_stay: "",
  is_active: true
};

export default function RatePlanManagement() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id") || "demo";

  const [ratePlans, setRatePlans] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newService, setNewService] = useState("");

  useEffect(() => { loadAll(); }, [propertyId]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    let rp = [], rt = [], pol = [];
    try {
      [rp, rt, pol] = await Promise.all([
        api.ratePlans.filter({ property_id: propertyId }),
        api.roomTypes.filter({ property_id: propertyId }),
        api.policies.filter({ property_id: propertyId })
      ]);
    } catch (e) {
      setError(e?.message || "Không thể tải dữ liệu");
    }
    setRatePlans(rp);
    setRoomTypes(rt);
    setPolicies(pol);
    setLoading(false);
  };

  const cancellationPolicies = policies.filter(p => p.type === "cancellation");
  const surchargePolicies = policies.filter(p => p.type === "surcharge");

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...defaultForm, property_id: propertyId });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, room_type_ids: item.room_type_ids || [], services: item.services || [] });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...form, property_id: propertyId };
    try {
      if (editItem) await api.ratePlans.update(editItem.id, payload);
      else await api.ratePlans.create(payload);
      await loadAll();
      setShowForm(false);
    } catch (e) {
      setError(e?.message || "Không thể lưu gói giá");
    }
    setSaving(false);
  };

  const deleteRatePlan = async (id) => {
    setError(null);
    try {
      await api.ratePlans.delete(id);
      await loadAll();
    } catch (e) {
      setError(e?.message || "Không thể xoá gói giá");
    }
    setDeleteConfirm(null);
  };

  const toggleRoomType = (id) => {
    setForm(p => ({
      ...p,
      room_type_ids: p.room_type_ids.includes(id)
        ? p.room_type_ids.filter(x => x !== id)
        : [...p.room_type_ids, id]
    }));
  };

  const addService = () => {
    if (!newService.trim()) return;
    setForm(p => ({ ...p, services: [...(p.services || []), newService.trim()] }));
    setNewService("");
  };

  const removeService = (idx) => {
    setForm(p => ({ ...p, services: p.services.filter((_, i) => i !== idx) }));
  };

  const getPolicyName = (id) => policies.find(p => p.id === id)?.name || "—";
  const getRoomTypeNames = (ids) => {
    if (!ids?.length) return "Tất cả hạng phòng";
    return ids.map(id => roomTypes.find(r => r.id === id)?.name || id).join(", ");
  };

  const RatePlanCard = ({ item }) => (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{item.name}</p>
              {item.code && <Badge variant="outline" className="text-xs">{item.code}</Badge>}
            </div>
            <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs mt-0.5">
              {item.is_active ? "Đang bán" : "Tắt"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirm(item.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        {/* Meal plan */}
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{mealPlanLabels[item.meal_plan] || "—"}</span>
        </div>

        {/* Price modifier */}
        {item.price_modifier_value !== 0 && (
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {item.price_modifier_value > 0 ? "+" : ""}
              {item.price_modifier_type === "percent"
                ? `${item.price_modifier_value}% so với giá gốc`
                : `${item.price_modifier_value?.toLocaleString()}đ cố định`}
            </span>
          </div>
        )}

        {/* Room types */}
        <div className="flex items-center gap-2">
          <BedDouble className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{getRoomTypeNames(item.room_type_ids)}</span>
        </div>

        {/* Policies */}
        {item.cancellation_policy_id && (
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-destructive/70" />
            <span>HH: {getPolicyName(item.cancellation_policy_id)}</span>
          </div>
        )}
        {item.surcharge_policy_id && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
            <span>PT: {getPolicyName(item.surcharge_policy_id)}</span>
          </div>
        )}

        {/* Services */}
        {item.services?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border">
            {item.services.map((s, i) => (
              <span key={i} className="bg-muted rounded-md px-2 py-0.5 text-xs">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Quản lý Gói Giá"
        subtitle="Cấu hình các rate plan và dịch vụ kèm theo"
        actions={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Thêm gói giá
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Đang tải...</div>
      ) : ratePlans.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-base">Chưa có gói giá nào</p>
          <p className="text-sm mt-1">Tạo gói giá để gán cho hạng phòng và bán phòng</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="w-4 h-4" /> Tạo gói giá đầu tiên</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ratePlans.map(rp => <RatePlanCard key={rp.id} item={rp} />)}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Chỉnh sửa" : "Thêm"} Gói Giá</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên gói giá *</Label>
                <Input className="mt-1.5" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Breakfast Included, Non-Refundable..." />
              </div>
              <div>
                <Label>Mã gói</Label>
                <Input className="mt-1.5" value={form.code || ""}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="VD: BB, NRF, FLEX" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label>Đang bán</Label>
              </div>
              <div className="col-span-2">
                <Label>Mô tả</Label>
                <Textarea className="mt-1.5 h-16" value={form.description || ""}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>

            {/* Meal plan */}
            <div>
              <Label>Chế độ ăn</Label>
              <Select value={form.meal_plan} onValueChange={v => setForm(p => ({ ...p, meal_plan: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(mealPlanLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price modifier */}
            <div className="bg-muted/40 rounded-xl p-4">
              <Label className="font-semibold text-sm mb-3 block">Điều chỉnh giá</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Loại điều chỉnh</Label>
                  <Select value={form.price_modifier_type} onValueChange={v => setForm(p => ({ ...p, price_modifier_type: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% so với giá gốc</SelectItem>
                      <SelectItem value="fixed">Giá cố định (VND)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Giá trị {form.price_modifier_type === "percent" ? "(%)" : "(VND)"}</Label>
                  <Input className="mt-1.5" type="number" value={form.price_modifier_value}
                    onChange={e => setForm(p => ({ ...p, price_modifier_value: Number(e.target.value) }))}
                    placeholder={form.price_modifier_type === "percent" ? "0 = bằng giá gốc, -10 = giảm 10%" : "0 = dùng giá gốc"} />
                </div>
              </div>
            </div>

            {/* Min/Max stay */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tối thiểu số đêm</Label>
                <Input className="mt-1.5" type="number" min="1" value={form.min_stay}
                  onChange={e => setForm(p => ({ ...p, min_stay: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Tối đa số đêm <span className="text-muted-foreground text-xs">(để trống = không giới hạn)</span></Label>
                <Input className="mt-1.5" type="number" min="1" value={form.max_stay || ""}
                  onChange={e => setForm(p => ({ ...p, max_stay: e.target.value ? Number(e.target.value) : "" }))} />
              </div>
            </div>

            {/* Services */}
            <div>
              <Label className="font-semibold text-sm">Dịch vụ đi kèm</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={newService} onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addService()}
                  placeholder="VD: Đưa đón sân bay, Spa miễn phí..." />
                <Button variant="outline" onClick={addService} type="button"><Plus className="w-4 h-4" /></Button>
              </div>
              {(form.services || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.services.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 bg-muted border border-border rounded-md px-2.5 py-1 text-sm">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {s}
                      <button onClick={() => removeService(i)} className="ml-1 text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Room types */}
            <div>
              <Label className="font-semibold text-sm">Áp dụng cho hạng phòng</Label>
              <p className="text-xs text-muted-foreground mb-2">Không chọn = áp dụng tất cả hạng phòng</p>
              {roomTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Chưa có hạng phòng nào</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {roomTypes.map(rt => (
                    <label key={rt.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.room_type_ids.includes(rt.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                      <Checkbox
                        checked={form.room_type_ids.includes(rt.id)}
                        onCheckedChange={() => toggleRoomType(rt.id)}
                      />
                      <span className="text-sm">{rt.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Policies */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-destructive/70" />
                  Chính sách hoàn hủy
                </Label>
                <Select value={form.cancellation_policy_id || "_none"} onValueChange={v => setForm(p => ({ ...p, cancellation_policy_id: v === "_none" ? "" : v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn chính sách" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Không áp dụng —</SelectItem>
                    {cancellationPolicies.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  Chính sách phụ thu
                </Label>
                <Select value={form.surcharge_policy_id || "_none"} onValueChange={v => setForm(p => ({ ...p, surcharge_policy_id: v === "_none" ? "" : v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn chính sách" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Không áp dụng —</SelectItem>
                    {surchargePolicies.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? "Đang lưu..." : editItem ? "Cập nhật" : "Tạo gói giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Gói giá này sẽ bị xóa vĩnh viễn.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => deleteRatePlan(deleteConfirm)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
