import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function VoidDialog({ transaction, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Void Giao Dịch
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-destructive/8 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-destructive">{transaction.description || transaction.transaction_type}</p>
            <p className="text-sm text-foreground mt-1">{Math.abs(transaction.amount).toLocaleString("vi-VN")}đ</p>
          </div>
          <p className="text-xs text-muted-foreground">Giao dịch bị void sẽ không bị xóa mà được đánh dấu và ghi vào audit log. Không thể hoàn tác.</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Lý do void *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do void giao dịch..."
              rows={3}
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
              Hủy
            </button>
            <button
              disabled={!reason.trim()}
              onClick={() => onConfirm(transaction, reason)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              Xác nhận Void
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
