import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, CreditCard, FileText, DollarSign, TrendingUp, MoreVertical, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const invoiceStatusConfig = {
  draft: { label: "Nháp", class: "bg-muted text-muted-foreground" },
  issued: { label: "Đã xuất", class: "bg-info/10 text-info" },
  paid: { label: "Đã thanh toán", class: "bg-success/10 text-success" },
  partially_paid: { label: "Thanh toán 1 phần", class: "bg-warning/10 text-warning" },
  overdue: { label: "Quá hạn", class: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Đã hủy", class: "bg-muted text-muted-foreground" },
};

export default function BillingPayment() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    invoice_number: "", type: "checkout", guest_name: "",
    subtotal: "", tax_amount: "", discount_amount: "0",
    total_amount: "", payment_method: "cash", status: "draft", notes: "",
    items: [{ description: "", quantity: 1, unit_price: "", total: "" }],
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    const q = propertyId ? { property_id: propertyId } : {};
    base44.entities.Invoice.filter(q, "-created_date", 100).then(d => { setInvoices(d); setLoading(false); });
  };
  useEffect(load, [propertyId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateItem = (i, k, v) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    if (k === "quantity" || k === "unit_price") {
      items[i].total = (Number(items[i].quantity) || 0) * (Number(items[i].unit_price) || 0);
    }
    const subtotal = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const tax = subtotal * 0.1;
    setForm(p => ({ ...p, items, subtotal, tax_amount: tax, total_amount: subtotal + tax - (Number(p.discount_amount) || 0) }));
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Invoice.create({
      ...form,
      property_id: propertyId,
      subtotal: Number(form.subtotal),
      tax_amount: Number(form.tax_amount),
      discount_amount: Number(form.discount_amount),
      total_amount: Number(form.total_amount),
      issue_date: format(new Date(), "yyyy-MM-dd"),
    });
    setSaving(false); setShowCreate(false); load();
  };

  const totalRevenue = invoices.filter(inv => inv.status === "paid").reduce((s, inv) => s + (inv.total_amount || 0), 0);
  const pending = invoices.filter(inv => ["issued", "partially_paid"].includes(inv.status)).reduce((s, inv) => s + (inv.balance_due || 0), 0);

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.invoice_number?.includes(search) || inv.guest_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Hóa Đơn & Thanh Toán"
        subtitle="Quản lý hóa đơn và theo dõi công nợ"
        actions={
          <Button className="bg-primary gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />Tạo Hóa Đơn
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng Hóa Đơn" value={invoices.length} icon={FileText} color="primary" />
        <StatCard title="Đã Thanh Toán" value={invoices.filter(i => i.status === "paid").length} icon={CreditCard} color="success" />
        <StatCard title="Doanh Thu" value={`${(totalRevenue / 1e6).toFixed(1)}M`} icon={DollarSign} color="gold" subtitle="VND" />
        <StatCard title="Còn Nợ" value={`${(pending / 1e6).toFixed(1)}M`} icon={TrendingUp} color="warning" subtitle="VND" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm mã hóa đơn, tên khách..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(invoiceStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Mã HĐ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Khách / Đặt phòng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ngày</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Còn lại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array(6).fill(0).map((_, i) => (
                <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-muted rounded animate-pulse w-16" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-muted-foreground">Chưa có hóa đơn nào</td></tr>
              ) : filtered.map(inv => {
                const sc = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
                return (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5"><span className="text-sm font-mono font-medium text-primary">{inv.invoice_number || inv.id?.slice(-8)}</span></td>
                    <td className="px-4 py-3.5 text-sm text-foreground">{inv.guest_name || "—"}</td>
                    <td className="px-4 py-3.5"><span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{inv.type}</span></td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{inv.issue_date ? format(new Date(inv.issue_date), "dd/MM/yyyy") : "—"}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-foreground">{inv.total_amount?.toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-warning">{inv.balance_due?.toLocaleString("vi-VN") || 0}đ</td>
                    <td className="px-4 py-3.5">
                      <Badge className={`text-xs ${sc.class} border-0`}>{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => { await base44.entities.Invoice.update(inv.id, { status: "paid", paid_amount: inv.total_amount, balance_due: 0 }); load(); }} className="text-success">Đánh dấu đã thanh toán</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => { await base44.entities.Invoice.delete(inv.id); load(); }} className="text-destructive">Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tạo Hóa Đơn Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Mã hóa đơn</Label><Input className="mt-1.5" value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} placeholder="INV001" /></div>
              <div>
                <Label>Loại hóa đơn</Label>
                <Select value={form.type} onValueChange={v => set("type", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkout">Trả phòng</SelectItem>
                    <SelectItem value="deposit">Đặt cọc</SelectItem>
                    <SelectItem value="service">Dịch vụ</SelectItem>
                    <SelectItem value="refund">Hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Tên khách</Label><Input className="mt-1.5" value={form.guest_name} onChange={e => set("guest_name", e.target.value)} /></div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Các khoản</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setForm(p => ({ ...p, items: [...p.items, { description: "", quantity: 1, unit_price: "", total: "" }] }))}>+ Thêm</Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-5 h-8 text-xs" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Mô tả..." />
                    <Input className="col-span-2 h-8 text-xs" type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} placeholder="SL" />
                    <Input className="col-span-3 h-8 text-xs" type="number" value={item.unit_price} onChange={e => updateItem(i, "unit_price", e.target.value)} placeholder="Đơn giá" />
                    <div className="col-span-2 text-xs font-medium text-right pr-1">{Number(item.total).toLocaleString("vi-VN")}đ</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tạm tính:</span><span>{Number(form.subtotal).toLocaleString("vi-VN")}đ</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Thuế 10%:</span><span>{Number(form.tax_amount).toLocaleString("vi-VN")}đ</span></div>
              <div className="flex justify-between text-sm font-bold border-t border-border pt-1.5"><span>Tổng:</span><span className="text-primary">{Number(form.total_amount).toLocaleString("vi-VN")}đ</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phương thức TT</Label>
                <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                    <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Nháp</SelectItem>
                    <SelectItem value="issued">Xuất hóa đơn</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Ghi chú</Label><Textarea className="mt-1.5 h-16" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary">{saving ? "Đang lưu..." : "Tạo hóa đơn"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
