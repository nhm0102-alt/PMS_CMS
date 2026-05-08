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
import { Plus, Key, Building2, AlertTriangle, CheckCircle, Clock, MoreVertical, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, addDays, differenceInDays } from "date-fns";

const licenseFeatures = {
  basic: ["PMS cơ bản", "Tối đa 20 phòng", "1 user", "Hỗ trợ email"],
  professional: ["PMS đầy đủ", "Tối đa 100 phòng", "5 users", "OTA kết nối", "Báo cáo nâng cao", "Hỗ trợ ưu tiên"],
  enterprise: ["PMS & CMS toàn diện", "Không giới hạn phòng", "Không giới hạn user", "API tích hợp", "Báo cáo tùy chỉnh", "Dedicated support"],
};

const licensePrices = { basic: 2000000, professional: 5000000, enterprise: 15000000 };

const defTxnForm = {
  property_id: "", transaction_type: "new_license", license_type: "basic",
  amount: "", payment_method: "bank_transfer", payment_status: "pending",
  period_start: "", period_end: "", notes: "",
};

export default function LicenseManagement() {
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defTxnForm);
  const [saving, setSaving] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(null);

  const load = () => {
    Promise.all([
      api.properties.list("-created_date", 100),
      api.licenseTransactions.list("-created_date", 100),
    ]).then(([p, t]) => { setProperties(p); setTransactions(t); setLoading(false); });
  };
  useEffect(load, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await api.licenseTransactions.create({ ...form, amount: Number(form.amount) });
    setSaving(false); setShowForm(false); load();
  };

  const handleRenew = async (prop) => {
    const newEnd = format(addDays(new Date(prop.license_end || new Date()), 365), "yyyy-MM-dd");
    await api.properties.update(prop.id, {
      license_end: newEnd,
      status: "active",
      contract_status: "active",
    });
    await api.licenseTransactions.create({
      property_id: prop.id,
      transaction_type: "renewal",
      license_type: prop.license_type,
      amount: licensePrices[prop.license_type] || 2000000,
      payment_status: "pending",
      period_start: prop.license_end || format(new Date(), "yyyy-MM-dd"),
      period_end: newEnd,
    });
    setShowRenewModal(null);
    load();
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    return differenceInDays(new Date(endDate), new Date());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Quản Lý License & Hợp Đồng"
        subtitle="Theo dõi tình trạng license và gia hạn dịch vụ"
        actions={
          <Button className="bg-primary gap-2" onClick={() => { setForm(defTxnForm); setShowForm(true); }}>
            <Plus className="w-4 h-4" />Tạo Giao Dịch
          </Button>
        }
      />

      {/* License Plans */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(licenseFeatures).map(([type, features]) => (
          <div key={type} className={`rounded-xl border p-5 ${type === "enterprise" ? "border-accent/40 bg-accent/5" : "border-border bg-card"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-foreground capitalize">{type}</h3>
                <p className="text-lg font-bold text-primary mt-1">{licensePrices[type].toLocaleString("vi-VN")}đ<span className="text-xs font-normal text-muted-foreground">/tháng</span></p>
              </div>
              <Key className={`w-5 h-5 ${type === "enterprise" ? "text-accent" : "text-muted-foreground"}`} />
            </div>
            <ul className="space-y-1.5">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              {properties.filter(p => p.license_type === type).length} khách sạn đang dùng
            </div>
          </div>
        ))}
      </div>

      {/* Properties License Status */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Tình Trạng License Các Khách Sạn</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Khách sạn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Gói</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Bắt đầu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Hết hạn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Còn lại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-muted rounded w-20 animate-pulse" /></td>)}</tr>
              )) : properties.map(prop => {
                const daysLeft = getDaysLeft(prop.license_end);
                const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
                const isExpired = daysLeft !== null && daysLeft < 0;
                return (
                  <tr key={prop.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{prop.name}</p>
                          <p className="text-xs text-muted-foreground">{prop.city || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={`text-xs ${prop.license_type === "enterprise" ? "bg-accent/20 text-accent-foreground" : prop.license_type === "professional" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"}`}>
                        {prop.license_type || "basic"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{prop.license_start ? format(new Date(prop.license_start), "dd/MM/yyyy") : "—"}</td>
                    <td className="px-4 py-3.5 text-sm text-foreground">{prop.license_end ? format(new Date(prop.license_end), "dd/MM/yyyy") : "—"}</td>
                    <td className="px-4 py-3.5">
                      {daysLeft !== null ? (
                        <span className={`text-sm font-semibold ${isExpired ? "text-destructive" : isExpiring ? "text-warning" : "text-success"}`}>
                          {isExpired ? `Đã hết ${Math.abs(daysLeft)}n` : `${daysLeft} ngày`}
                        </span>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {isExpired ? (
                        <Badge variant="outline" className="text-xs border-destructive/30 text-destructive bg-destructive/10">Hết hạn</Badge>
                      ) : isExpiring ? (
                        <Badge variant="outline" className="text-xs border-warning/30 text-warning bg-warning/10 gap-1">
                          <AlertTriangle className="w-3 h-3" />Sắp hết
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/10 gap-1">
                          <CheckCircle className="w-3 h-3" />Còn hạn
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/5" onClick={() => setShowRenewModal(prop)}>
                        <Key className="w-3 h-3" />Gia hạn
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      <Dialog open={!!showRenewModal} onOpenChange={() => setShowRenewModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Gia Hạn License</DialogTitle></DialogHeader>
          {showRenewModal && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Khách sạn:</span><span className="font-medium">{showRenewModal.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gói hiện tại:</span><span className="font-medium capitalize">{showRenewModal.license_type}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gia hạn thêm:</span><span className="font-medium">12 tháng</span></div>
                <div className="flex justify-between text-sm font-bold border-t border-border pt-2"><span>Phí gia hạn:</span><span className="text-primary">{licensePrices[showRenewModal.license_type]?.toLocaleString("vi-VN")}đ</span></div>
              </div>
              <p className="text-xs text-muted-foreground">Giao dịch sẽ được tạo với trạng thái "Chờ thanh toán"</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewModal(null)}>Hủy</Button>
            <Button onClick={() => handleRenew(showRenewModal)} className="bg-primary">Xác nhận gia hạn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tạo Giao Dịch License</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Khách sạn</Label>
              <Select value={form.property_id} onValueChange={v => set("property_id", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn khách sạn..." /></SelectTrigger>
                <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại giao dịch</Label>
                <Select value={form.transaction_type} onValueChange={v => set("transaction_type", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_license">License mới</SelectItem>
                    <SelectItem value="renewal">Gia hạn</SelectItem>
                    <SelectItem value="upgrade">Nâng cấp</SelectItem>
                    <SelectItem value="payment">Thanh toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gói license</Label>
                <Select value={form.license_type} onValueChange={v => { set("license_type", v); set("amount", licensePrices[v]); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Số tiền (VND)</Label><Input className="mt-1.5" type="number" value={form.amount} onChange={e => set("amount", e.target.value)} /></div>
              <div>
                <Label>Trạng thái TT</Label>
                <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Ghi chú</Label><Textarea className="mt-1.5 h-16" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || !form.property_id} className="bg-primary">{saving ? "Đang lưu..." : "Tạo giao dịch"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
