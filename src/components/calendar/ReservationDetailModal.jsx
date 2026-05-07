import { format, parseISO, differenceInDays } from "date-fns";
import { X, Phone, MapPin, User, BedDouble, Calendar, DollarSign, Tag, Users, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_COLORS = {
  pending:    { light: "bg-warning/80 text-white",     label: "Chờ xác nhận",   badge: "bg-warning/15 text-warning border-warning/30" },
  confirmed:  { light: "bg-info/80 text-white",        label: "Đã xác nhận",    badge: "bg-info/15 text-info border-info/30" },
  checked_in: { light: "bg-success/80 text-white",     label: "Đang ở",         badge: "bg-success/15 text-success border-success/30" },
  checked_out:{ light: "bg-muted-foreground/50 text-white", label: "Đã trả phòng", badge: "bg-muted text-muted-foreground border-border" },
  cancelled:  { light: "bg-destructive/80 text-white", label: "Đã hủy",         badge: "bg-destructive/15 text-destructive border-destructive/30" },
  no_show:    { light: "bg-destructive/60 text-white", label: "Không đến",      badge: "bg-destructive/10 text-destructive border-destructive/20" },
};

const SOURCE_LABELS = {
  direct: "Trực tiếp", phone: "Điện thoại", email: "Email", walk_in: "Walk-in",
  booking_com: "Booking.com", agoda: "Agoda", expedia: "Expedia", airbnb: "Airbnb",
  traveloka: "Traveloka", other_ota: "OTA khác",
};

const PAYMENT_LABELS = {
  cash: "Tiền mặt", credit_card: "Thẻ tín dụng", debit_card: "Thẻ ghi nợ",
  bank_transfer: "Chuyển khoản", ota_prepaid: "OTA trả trước", invoice: "Hóa đơn",
};

export default function ReservationDetailModal({ reservation, guestName, roomName, roomTypeName, onClose, onStatusChange }) {
  if (!reservation) return null;

  const res = reservation;
  const sc = STATUS_COLORS[res.status] || STATUS_COLORS.pending;

  const nights = res.nights || (res.check_in_date && res.check_out_date
    ? differenceInDays(parseISO(res.check_out_date), parseISO(res.check_in_date))
    : 0);

  const initials = (guestName || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight">{guestName || "Khách"}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {res.reservation_number && (
                <span className="text-xs text-muted-foreground font-mono">#{res.reservation_number}</span>
              )}
              <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", sc.badge)}>
                {sc.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock icon={Calendar} label="Ngày đến" value={res.check_in_date ? format(parseISO(res.check_in_date), "dd/MM/yyyy") : "—"} />
            <InfoBlock icon={Calendar} label="Ngày đi" value={res.check_out_date ? format(parseISO(res.check_out_date), "dd/MM/yyyy") : "—"} />
          </div>

          {/* Room & type */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock icon={BedDouble} label="Loại phòng" value={roomTypeName || "—"} />
            <InfoBlock icon={BedDouble} label="Số phòng" value={roomName || res.room_id ? (roomName || "Đã xếp phòng") : "Chưa xếp phòng"} highlight={!res.room_id} />
          </div>

          {/* Guests & nights */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock icon={Users} label="Khách" value={`${res.num_adults || 1} NL${res.num_children ? ` · ${res.num_children} TE` : ""}`} />
            <InfoBlock icon={Calendar} label="Số đêm" value={`${nights} đêm`} />
          </div>

          {/* Rate plan & source */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock icon={Tag} label="Gói giá" value={res.rate_plan || "—"} />
            <InfoBlock icon={Tag} label="Kênh" value={SOURCE_LABELS[res.source] || res.source || "—"} />
          </div>

          {/* Financials */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Tài chính</span>
            </div>
            <FinRow label="Giá phòng/đêm" value={res.room_rate ? res.room_rate.toLocaleString("vi-VN") + "đ" : "—"} />
            {res.discount_amount > 0 && <FinRow label="Giảm giá" value={`- ${res.discount_amount.toLocaleString("vi-VN")}đ`} color="text-success" />}
            {res.tax_amount > 0 && <FinRow label="Thuế" value={res.tax_amount.toLocaleString("vi-VN") + "đ"} />}
            <div className="border-t border-border pt-2">
              <FinRow label="Tổng cộng" value={res.total_amount ? res.total_amount.toLocaleString("vi-VN") + "đ" : "—"} bold />
              <FinRow label="Đã thanh toán" value={res.paid_amount ? res.paid_amount.toLocaleString("vi-VN") + "đ" : "0đ"} />
              {res.balance_due > 0 && <FinRow label="Còn lại" value={res.balance_due.toLocaleString("vi-VN") + "đ"} color="text-destructive" bold />}
            </div>
            {res.payment_method && (
              <p className="text-xs text-muted-foreground pt-1">Thanh toán: {PAYMENT_LABELS[res.payment_method] || res.payment_method}</p>
            )}
          </div>

          {/* Special requests */}
          {res.special_requests && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Yêu cầu đặc biệt</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{res.special_requests}</p>
            </div>
          )}

          {/* Internal notes */}
          {res.internal_notes && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">Ghi chú nội bộ</span>
              </div>
              <p className="text-sm text-muted-foreground bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">{res.internal_notes}</p>
            </div>
          )}
        </div>

        {/* Open Folio link */}
        <div className="px-5 pb-1">
          <Link
            to={`${createPageUrl("FolioDetail")}?reservation_id=${res.id}${res.property_id ? `&property_id=${res.property_id}` : ""}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Mở Folio Chi Tiết
          </Link>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-border pt-3">
          {res.status === "pending" && (
            <button onClick={() => onStatusChange(res, "confirmed")}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors">
              Xác nhận
            </button>
          )}
          {res.status === "confirmed" && (
            <button onClick={() => onStatusChange(res, "checked_in")}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
              Check-in
            </button>
          )}
          {res.status === "checked_in" && (
            <button onClick={() => onStatusChange(res, "checked_out")}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors">
              Check-out
            </button>
          )}
          {["pending", "confirmed"].includes(res.status) && (
            <button onClick={() => onStatusChange(res, "cancelled")}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
              Hủy đặt phòng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value, highlight }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-sm font-semibold", highlight ? "text-warning" : "text-foreground")}>{value}</p>
    </div>
  );
}

function FinRow({ label, value, color, bold }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium", bold && "font-bold text-sm", color || "text-foreground")}>{value}</span>
    </div>
  );
}
