import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Ban, RotateCcw } from "lucide-react";

const TYPE_CONFIG = {
  room_charge:       { label: "Tiền phòng",         color: "text-foreground",        bg: "bg-primary/8" },
  extra_charge:      { label: "Phụ thu",             color: "text-foreground",        bg: "bg-muted/60" },
  payment:           { label: "Thanh toán",          color: "text-success",           bg: "bg-success/8" },
  refund:            { label: "Hoàn tiền",           color: "text-info",              bg: "bg-info/8" },
  discount:          { label: "Giảm giá",            color: "text-success",           bg: "bg-success/8" },
  tax:               { label: "Thuế",                color: "text-muted-foreground",  bg: "bg-muted/40" },
  transfer_in:       { label: "Chuyển vào",          color: "text-info",              bg: "bg-info/8" },
  transfer_out:      { label: "Chuyển đi",           color: "text-warning",           bg: "bg-warning/8" },
  adjustment:        { label: "Điều chỉnh",          color: "text-warning",           bg: "bg-warning/8" },
  void:              { label: "Hủy giao dịch",       color: "text-destructive",       bg: "bg-destructive/8" },
  deposit:           { label: "Đặt cọc",             color: "text-success",           bg: "bg-success/8" },
  ota_virtual_card:  { label: "OTA Virtual Card",    color: "text-info",              bg: "bg-info/8" },
  city_ledger:       { label: "City Ledger",         color: "text-primary",           bg: "bg-primary/8" },
  late_checkout_fee: { label: "Phí trả phòng muộn",  color: "text-warning",           bg: "bg-warning/8" },
  extra_bed_fee:     { label: "Phí giường phụ",      color: "text-foreground",        bg: "bg-muted/60" },
  service_charge:    { label: "Phí dịch vụ",         color: "text-foreground",        bg: "bg-muted/60" },
  minibar:           { label: "Minibar",             color: "text-foreground",        bg: "bg-muted/60" },
  restaurant:        { label: "Nhà hàng",            color: "text-foreground",        bg: "bg-muted/60" },
  laundry:           { label: "Giặt ủi",             color: "text-foreground",        bg: "bg-muted/60" },
  spa:               { label: "Spa",                 color: "text-foreground",        bg: "bg-muted/60" },
  transport:         { label: "Vận chuyển",          color: "text-foreground",        bg: "bg-muted/60" },
  other_charge:      { label: "Khác",                color: "text-foreground",        bg: "bg-muted/60" },
};

const PAYMENT_METHOD_LABELS = {
  cash: "Tiền mặt", credit_card: "Thẻ TD", debit_card: "Thẻ GN",
  bank_transfer: "Chuyển khoản", ota_prepaid: "OTA prepaid",
  city_ledger: "City Ledger", complimentary: "Complimentary", other: "Khác",
};

export default function TransactionRow({ txn, onVoid, canVoid }) {
  const cfg = TYPE_CONFIG[txn.transaction_type] || TYPE_CONFIG.other_charge;
  const isCredit = txn.amount < 0;
  const isVoided = txn.status === "voided";
  const isTransferred = txn.status === "transferred";
  const isTaxLine = txn.is_tax_line;

  return (
    <tr className={cn(
      "border-b border-border/50 text-sm transition-colors",
      isVoided ? "opacity-40 line-through" : "hover:bg-muted/20",
      isTaxLine && "bg-muted/20"
    )}>
      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
        {txn.business_date ? format(parseISO(txn.business_date), "dd/MM") : "—"}
        {txn.is_night_audit && <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">NA</span>}
      </td>
      <td className="px-4 py-2.5">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
          {isTaxLine && "↳ "}{cfg.label}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm text-foreground max-w-[200px]">
        <p className="truncate">{txn.description || "—"}</p>
        {txn.reference_number && <p className="text-xs text-muted-foreground truncate">Ref: {txn.reference_number}</p>}
        {txn.payment_method && <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[txn.payment_method]}</p>}
      </td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        {!isCredit ? (
          <span className="font-semibold text-foreground">{txn.amount.toLocaleString("vi-VN")}đ</span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        {isCredit ? (
          <span className="font-semibold text-success">{Math.abs(txn.amount).toLocaleString("vi-VN")}đ</span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
        {txn.posted_by?.split("@")[0] || "system"}
        {isVoided && (
          <span className="ml-2 text-destructive font-medium flex items-center gap-1">
            <Ban className="w-3 h-3" />Đã hủy
          </span>
        )}
        {isTransferred && (
          <span className="ml-2 text-warning font-medium flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />Đã chuyển
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        {canVoid && !isVoided && !isTransferred && (
          <button
            onClick={() => onVoid(txn)}
            className="text-xs text-destructive hover:text-destructive/80 hover:underline"
          >
            Void
          </button>
        )}
      </td>
    </tr>
  );
}
