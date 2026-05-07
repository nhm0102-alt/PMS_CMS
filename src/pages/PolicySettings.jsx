import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Pencil, Trash2, ShieldCheck, Users, BedDouble,
  Baby, ChevronRight, AlertTriangle
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const emptyCancel = { days_before: "", charge_percent: "", label: "" };
const emptyChild = { age_from: "", age_to: "", free_count: 1, fee_per_child: "", label: "" };

const defaultCancellationPolicy = {
  name: "", type: "cancellation",
  cancellation_rules: [
    { days_before: 7, charge_percent: 0, label: "Miễn phí hủy" },
    { days_before: 3, charge_percent: 50, label: "Phí 50%" },
    { days_before: 1, charge_percent: 100, label: "Phí 100%" }
  ],
  is_active: true, notes: ""
};

const defaultSurchargePolicy = {
  name: "", type: "surcharge",
  extra_adult_fee: 0,
  child_rules: [
    { age_from: 0, age_to: 5, free_count: 1, fee_per_child: 0, label: "Dưới 5 tuổi" },
    { age_from: 5, age_to: 12, free_count: 0, fee_per_child: 200000, label: "5–12 tuổi" }
  ],
  extra_bed_fee: 300000,
  extra_bed_available: true,
  is_active: true, notes: ""
};

export default function PolicySettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("cancellation");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultCancellationPolicy);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if (propertyId) load(); }, [propertyId]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Policy.filter({ property_id: propertyId });
    setPolicies(data);
    setLoading(false);
  };

  const cancellationPolicies = policies.filter(p => p.type === "cancellation");
  const surchargePolicies = policies.filter(p => p.type === "surcharge");

  const openAdd = (type) => {
    setEditItem(null);
    setForm(type === "cancellation" ? { ...defaultCancellationPolicy, property_id: propertyId }
      : { ...defaultSurchargePolicy, property_id: propertyId });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    if (editItem) {
      await base44.entities.Policy.update(editItem.id, form);
    } else {
      await base44.entities.Policy.create({ ...form, property_id: propertyId });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const deletePolicy = async (id) => {
    await base44.entities.Policy.delete(id);
    setDeleteConfirm(null);
    load();
  };

  // Cancellation rules helpers
  const updateRule = (idx, field, val) => {
    const rules = [...(form.cancellation_rules || [])];
    rules[idx] = { ...rules[idx], [field]: val };
    setForm(p => ({ ...p, cancellation_rules: rules }));
  };
  const addRule = () => setForm(p => ({ ...p, cancellation_rules: [...(p.cancellation_rules || []), { ...emptyCancel }] }));
  const removeRule = (idx) => setForm(p => ({ ...p, cancellation_rules: p.cancellation_rules.filter((_, i) => i !== idx) }));

  // Child rules helpers
  const updateChild = (idx, field, val) => {
    const rules = [...(form.child_rules || [])];
    rules[idx] = { ...rules[idx], [field]: val };
    setForm(p => ({ ...p, child_rules: rules }));
  };
  const addChild = () => setForm(p => ({ ...p, child_rules: [...(p.child_rules || []), { ...emptyChild }] }));
  const removeChild = (idx) => setForm(p => ({ ...p, child_rules: p.child_rules.filter((_, i) => i !== idx) }));

  const isCancellation = form.type === "cancellation";

  const PolicyCard = ({ item }) => (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${item.type === "cancellation" ? "bg-destructive/10" : "bg-amber-50"}`}>
            {item.type === "cancellation"
              ? <ShieldCheck className="w-4 h-4 text-destructive" />
              : <Users className="w-4 h-4 text-amber-600" />}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{item.name}</p>
            <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs mt-0.5">
              {item.is_active ? "Đang dùng" : "Tắt"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(item.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {item.type === "cancellation" && item.cancellation_rules?.length > 0 && (
        <div className="space-y-1.5">
          {[...item.cancellation_rules].sort((a, b) => b.days_before - a.days_before).map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
              <span>Hủy trước <strong className="text-foreground">{r.days_before}</strong> ngày: </span>
              <Badge variant={r.charge_percent === 0 ? "outline" : "destructive"} className="text-xs">
                {r.charge_percent === 0 ? "Miễn phí" : `Phí ${r.charge_percent}%`}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {item.type === "surcharge" && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {item.extra_adult_fee > 0 && (
            <div className="flex gap-2 items-center">
              <Users className="w-3 h-3" />
              Phụ thu NL thêm: <strong className="text-foreground">{item.extra_adult_fee?.toLocaleString()} đ</strong>
            </div>
          )}
          {item.child_rules?.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Baby className="w-3 h-3" />
              <span>{r.age_from}–{r.age_to} tuổi: {r.free_count > 0 ? `${r.free_count} trẻ miễn phí, ` : ""}{r.fee_per_child > 0 ? `thêm ${r.fee_per_child?.toLocaleString()}đ` : "miễn phí"}</span>
            </div>
          ))}
          {item.extra_bed_available && (
            <div className="flex gap-2 items-center">
              <BedDouble className="w-3 h-3" />
              Giường phụ: <strong className="text-foreground">{item.extra_bed_fee?.toLocaleString()} đ/đêm</strong>
            </div>
          )}
        </div>
      )}

      {item.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2 italic">{item.notes}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Cấu hình Policy"
        subtitle="Quản lý chính sách hoàn hủy và phụ thu"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="cancellation" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Chính sách hoàn hủy
          </TabsTrigger>
          <TabsTrigger value="surcharge" className="gap-2">
            <Users className="w-4 h-4" /> Phụ thu NL / TE / Giường phụ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cancellation">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{cancellationPolicies.length} chính sách</p>
            <Button size="sm" onClick={() => openAdd("cancellation")}>
              <Plus className="w-4 h-4" /> Thêm chính sách hủy
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
          ) : cancellationPolicies.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có chính sách hoàn hủy</p>
              <p className="text-sm mt-1">Thêm chính sách để áp dụng vào gói giá</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {cancellationPolicies.map(p => <PolicyCard key={p.id} item={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="surcharge">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{surchargePolicies.length} chính sách</p>
            <Button size="sm" onClick={() => openAdd("surcharge")}>
              <Plus className="w-4 h-4" /> Thêm chính sách phụ thu
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
          ) : surchargePolicies.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có chính sách phụ thu</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {surchargePolicies.map(p => <PolicyCard key={p.id} item={p} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Chỉnh sửa" : "Thêm"} {isCancellation ? "Chính sách hoàn hủy" : "Chính sách phụ thu"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div>
              <Label>Tên chính sách *</Label>
              <Input className="mt-1.5" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="VD: Miễn phí hủy 7 ngày" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <Label>Đang áp dụng</Label>
            </div>

            {/* CANCELLATION RULES */}
            {isCancellation && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Các mốc chính sách hủy</Label>
                  <Button size="sm" variant="outline" onClick={addRule}><Plus className="w-3.5 h-3.5" /> Thêm mốc</Button>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 mb-2 text-xs text-muted-foreground">
                  Mỗi mốc định nghĩa: hủy <strong>trước X ngày</strong> thì phí là bao nhiêu %. Sắp xếp từ nhiều ngày → ít ngày.
                </div>
                <div className="space-y-3">
                  {(form.cancellation_rules || []).map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end bg-card border border-border rounded-lg p-3">
                      <div>
                        <Label className="text-xs">Trước (ngày)</Label>
                        <Input className="mt-1 h-8 text-sm" type="number" min="0" value={r.days_before}
                          onChange={e => updateRule(i, "days_before", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Phí hủy (%)</Label>
                        <Input className="mt-1 h-8 text-sm" type="number" min="0" max="100" value={r.charge_percent}
                          onChange={e => updateRule(i, "charge_percent", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Nhãn</Label>
                        <Input className="mt-1 h-8 text-sm" value={r.label}
                          onChange={e => updateRule(i, "label", e.target.value)} placeholder="VD: Miễn phí hủy" />
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive mt-5"
                        onClick={() => removeRule(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SURCHARGE RULES */}
            {!isCancellation && (
              <div className="space-y-5">
                {/* Extra adult */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">Phụ thu người lớn thêm</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs">Phí / người lớn thêm (VND)</Label>
                      <Input className="mt-1.5" type="number" min="0" value={form.extra_adult_fee || 0}
                        onChange={e => setForm(p => ({ ...p, extra_adult_fee: Number(e.target.value) }))} />
                    </div>
                    <div className="text-xs text-muted-foreground pt-6">
                      (Áp dụng khi vượt sức chứa tiêu chuẩn)
                    </div>
                  </div>
                </div>

                {/* Child rules */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Baby className="w-4 h-4 text-primary" />
                      <Label className="font-semibold">Phụ thu trẻ em theo độ tuổi</Label>
                    </div>
                    <Button size="sm" variant="outline" onClick={addChild}><Plus className="w-3.5 h-3.5" /> Thêm nhóm tuổi</Button>
                  </div>
                  <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                    <strong>Ví dụ:</strong> Trẻ 0–5 tuổi: 1 trẻ miễn phí, trẻ thứ 2 thu phí. Trẻ 5–12 tuổi: thu 200.000đ/trẻ.
                  </div>
                  <div className="space-y-3">
                    {(form.child_rules || []).map((r, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end bg-muted/40 rounded-lg p-3">
                        <div>
                          <Label className="text-xs">Tuổi từ</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" min="0" value={r.age_from}
                            onChange={e => updateChild(i, "age_from", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Đến</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" min="0" value={r.age_to}
                            onChange={e => updateChild(i, "age_to", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Số trẻ miễn phí</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" min="0" value={r.free_count}
                            onChange={e => updateChild(i, "free_count", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Phí/trẻ thêm (đ)</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" min="0" value={r.fee_per_child}
                            onChange={e => updateChild(i, "fee_per_child", Number(e.target.value))} />
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive mt-5"
                          onClick={() => removeChild(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra bed */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BedDouble className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">Giường phụ</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.extra_bed_available} onCheckedChange={v => setForm(p => ({ ...p, extra_bed_available: v }))} />
                      <Label className="text-sm">Cho phép giường phụ</Label>
                    </div>
                    {form.extra_bed_available && (
                      <div className="flex-1">
                        <Label className="text-xs">Phí giường phụ (VND/đêm)</Label>
                        <Input className="mt-1.5" type="number" min="0" value={form.extra_bed_fee || 0}
                          onChange={e => setForm(p => ({ ...p, extra_bed_fee: Number(e.target.value) }))} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Ghi chú</Label>
              <Textarea className="mt-1.5 h-16" value={form.notes || ""}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? "Đang lưu..." : editItem ? "Cập nhật" : "Tạo chính sách"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Xác nhận xóa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Chính sách này sẽ bị xóa vĩnh viễn. Các gói giá đang dùng chính sách này sẽ không còn liên kết.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => deletePolicy(deleteConfirm)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
