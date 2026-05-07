import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";

export default function FolioSummaryBar({ totalCharges, totalPayments, totalTax, balance }) {
  const isOverpaid = balance < 0;
  const isBalanceDue = balance > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <SummaryCard
        label="Tổng phát sinh"
        value={totalCharges}
        icon={TrendingUp}
        color="text-foreground"
        bg="bg-muted/50"
      />
      <SummaryCard
        label="Đã thanh toán"
        value={totalPayments}
        icon={Wallet}
        color="text-success"
        bg="bg-success/5"
      />
      <SummaryCard
        label="Thuế & Phí DV"
        value={totalTax}
        icon={TrendingDown}
        color="text-muted-foreground"
        bg="bg-muted/50"
      />
      <SummaryCard
        label={isOverpaid ? "Hoàn trả khách" : "Còn nợ"}
        value={Math.abs(balance)}
        icon={AlertCircle}
        color={isOverpaid ? "text-info" : isBalanceDue ? "text-destructive" : "text-success"}
        bg={isOverpaid ? "bg-info/8" : isBalanceDue ? "bg-destructive/8" : "bg-success/8"}
        highlight
        suffix={isBalanceDue ? " ⚠" : isOverpaid ? " ↩" : " ✓"}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg, highlight, suffix }) {
  return (
    <div className={cn("rounded-xl p-3.5 border border-border", bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-base font-bold", color)}>
        {value.toLocaleString("vi-VN")}đ
        {highlight && suffix && <span className="text-xs ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
