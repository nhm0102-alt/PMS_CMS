import { useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const CHARGE_TYPES = [
  { value: "room_charge", label: "Tiền phòng" },
  { value: "extra_charge", label: "Phụ thu" },
  { value: "late_checkout_fee", label: "Phí trả phòng muộn" },
  { value: "extra_bed_fee", label: "Phí giường phụ" },
  { value: "minibar", label: "Minibar" },
  { value: "restaurant", label: "Nhà hàng / F&B" },
  { value: "laundry", label: "Giặt ủi" },
  { value: "spa", label: "Spa / Dịch vụ" },
  { value: "transport", label: "Vận chuyển" },
  { value: "service_charge", label: "Phí dịch vụ" },
  { value: "other_charge", label: "Phụ thu khác" },
];

const PAYMENT_TYPES = [
  { value: "payment", label: "Thanh toán" },
  { value: "deposit", label: "Đặt cọc" },
  { value: "refund", label: "Hoàn tiền" },
  { value: "discount", label: "Giảm giá / Complimentary" },
  { value: "ota_virtual_card", label: "OTA Virtual Card" },
  { value: "city_ledger", label: "City Ledger" },
  { value: "adjustment", label: "Điều chỉnh (Adjustment)" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "credit_card", label: "Thẻ tín dụng" },
  { value: "debit_card", label: "Thẻ ghi nợ" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "ota_prepaid", label: "OTA Prepaid" },
  { value: "city_ledger", label: "City Ledger" },
  { value: "complimentary", label: "Complimentary" },
  { value: "other", label: "Khác" },
];

export default function AddTransactionDialog({ mode, onClose, onSubmit, defaultDate, taxRate = 10 }) {
  const isCharge = mode === "charge";
  const types = isCharge ? CHARGE_TYPES : PAYMENT_TYPES;

  const [form, setForm] = useState({
    transaction_type: isCharge ? "extra_charge" : "payment",
    amount: "",
    description: "",
    payment_method: "cash",
    reference_number: "",
    business_date: defaultDate || format(new Date(), "yyyy-MM-dd"),
    apply_tax: isCharge,
    tax_rate: taxRate,
    notes: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const taxAmount = form.apply_tax && form.amount
    ? Math.round(Number(form.amount) * form.tax_rate / 100)
    : 0;
  const total = Number(form.amount || 0) + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    onSubmit({
      ...form,
      amount: isCharge ? Number(form.amount) : -Math.abs(Number(form.amount)),
      tax_amount: taxAmount,
      tax_rate: form.apply_tax ? form.tax_rate : 0,
    });
  };

  const needsPaymentMethod = !isCharge || ["payment", "deposit", "refund", "ota_virtual_card", "city_ledger"].includes(form.transaction_type);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {isCharge ? "Thêm Phát Sinh" : "Ghi Nhận Thanh Toán / Hoàn Tiền"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Loại</label>
            <select
              value={form.transaction_type}
              onChange={e => set("transaction_type", e.target.value)}
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Số tiền (VND)</label>
            <input
              type="number"
              min="0"
              required
              value={form.amount}
              onChange={e => set("amount", e.target.value)}
              placeholder="0"
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Chi tiết phát sinh..."
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Payment method (for payments) */}
          {!isCharge && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phương thức</label>
              <select
                value={form.payment_method}
                onChange={e => set("payment_method", e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}

          {/* Reference */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Số tham chiếu / Receipt No.</label>
            <input
              type="text"
              value={form.reference_number}
              onChange={e => set("reference_number", e.target.value)}
              placeholder="TXN-123456"
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Business date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ngày nghiệp vụ</label>
            <input
              type="date"
              value={form.business_date}
              onChange={e => set("business_date", e.target.value)}
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Tax toggle (charges only) */}
          {isCharge && (
            <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Áp dụng thuế ({form.tax_rate}%)</p>
                {form.apply_tax && form.amount > 0 && (
                  <p className="text-xs text-muted-foreground">+ {taxAmount.toLocaleString("vi-VN")}đ thuế</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => set("apply_tax", !form.apply_tax)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors",
                  form.apply_tax ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                  form.apply_tax ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>
          )}

          {/* Total preview */}
          {form.amount > 0 && (
            <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-2.5 flex justify-between">
              <span className="text-sm text-muted-foreground">Tổng cộng</span>
              <span className="text-sm font-bold text-primary">
                {isCharge ? "+" : "-"}{total.toLocaleString("vi-VN")}đ
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
              Hủy
            </button>
            <button type="submit"
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
