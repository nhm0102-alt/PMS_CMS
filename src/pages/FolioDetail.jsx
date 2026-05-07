import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Plus, CreditCard, Receipt, FileText, History,
  RefreshCw, BedDouble, User, Calendar, Tag, Printer,
  CheckCircle2, Clock, XCircle, AlertTriangle, ChevronDown,
  DollarSign, RotateCcw, ArrowRightLeft, Moon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FolioSummaryBar from "@/components/folio/FolioSummaryBar";
import TransactionRow from "@/components/folio/TransactionRow";
import AddTransactionDialog from "@/components/folio/AddTransactionDialog";
import VoidDialog from "@/components/folio/VoidDialog";

const STATUS_CONFIG = {
  pending:     { label: "Chờ xác nhận", color: "text-warning",           bg: "bg-warning/10 border-warning/30",     icon: Clock },
  confirmed:   { label: "Đã xác nhận",  color: "text-info",              bg: "bg-info/10 border-info/30",           icon: CheckCircle2 },
  checked_in:  { label: "Đang ở",       color: "text-success",           bg: "bg-success/10 border-success/30",     icon: CheckCircle2 },
  checked_out: { label: "Đã trả phòng", color: "text-muted-foreground",  bg: "bg-muted border-border",              icon: CheckCircle2 },
  cancelled:   { label: "Đã hủy",       color: "text-destructive",       bg: "bg-destructive/10 border-destructive/30", icon: XCircle },
  no_show:     { label: "Không đến",    color: "text-destructive",       bg: "bg-destructive/10 border-destructive/30", icon: XCircle },
};

const SOURCE_LABELS = {
  direct: "Trực tiếp", phone: "Điện thoại", email: "Email", walk_in: "Walk-in",
  booking_com: "Booking.com", agoda: "Agoda", expedia: "Expedia", airbnb: "Airbnb",
  traveloka: "Traveloka", other_ota: "OTA khác",
};

export default function FolioDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const reservationId = urlParams.get("reservation_id");
  const propertyId = urlParams.get("property_id");

  const [reservation, setReservation] = useState(null);
  const [guest, setGuest] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("folio"); // folio | info | audit
  const [dialog, setDialog] = useState(null); // null | "charge" | "payment" | "void"
  const [voidTarget, setVoidTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!reservationId) return;
    loadAll();
  }, [reservationId]);

  const loadAll = async () => {
    setLoading(true);
    const [res, txns] = await Promise.all([
      base44.entities.Reservation.filter({ id: reservationId }),
      base44.entities.FolioTransaction.filter({ reservation_id: reservationId }, "created_date", 500),
    ]);
    const r = res?.[0];
    setReservation(r);
    setTransactions(txns);

    if (r) {
      const [guestRes, roomRes, rtRes] = await Promise.all([
        r.guest_id ? base44.entities.Guest.filter({ id: r.guest_id }) : Promise.resolve([]),
        r.room_id ? base44.entities.Room.filter({ id: r.room_id }) : Promise.resolve([]),
        r.room_type_id ? base44.entities.RoomType.filter({ id: r.room_type_id }) : Promise.resolve([]),
      ]);
      setGuest(guestRes?.[0] || null);
      setRoom(roomRes?.[0] || null);
      setRoomType(rtRes?.[0] || null);
    }
    setLoading(false);
  };

  // ── Computed financials ──
  const activeTxns = transactions.filter(t => t.status !== "voided");
  const charges = activeTxns.filter(t => t.amount > 0);
  const credits = activeTxns.filter(t => t.amount < 0);
  const totalCharges = charges.reduce((s, t) => s + t.amount, 0);
  const totalPayments = Math.abs(credits.reduce((s, t) => s + t.amount, 0));
  const totalTax = activeTxns.filter(t => t.is_tax_line).reduce((s, t) => s + t.amount, 0);
  const balance = totalCharges - totalPayments;

  const guestName = guest
    ? `${guest.last_name || ""} ${guest.first_name || ""}`.trim()
    : reservation?.guest_name || "Khách";

  const nights = reservation?.nights || (reservation?.check_in_date && reservation?.check_out_date
    ? differenceInDays(parseISO(reservation.check_out_date), parseISO(reservation.check_in_date))
    : 0);

  // ── Actions ──
  const handleAddTransaction = async (formData) => {
    setSaving(true);
    const txnData = {
      property_id: propertyId || reservation?.property_id,
      reservation_id: reservationId,
      transaction_type: formData.transaction_type,
      amount: formData.amount,
      description: formData.description,
      reference_number: formData.reference_number,
      payment_method: formData.payment_method || null,
      business_date: formData.business_date,
      tax_rate: formData.tax_rate,
      tax_amount: formData.tax_amount,
      posted_by: currentUser?.email || "staff",
      status: "active",
      is_night_audit: false,
      notes: formData.notes,
    };
    await base44.entities.FolioTransaction.create(txnData);

    // Auto-post tax line if apply_tax
    if (formData.apply_tax && formData.tax_amount > 0) {
      const taxTxn = await base44.entities.FolioTransaction.create({
        ...txnData,
        transaction_type: "tax",
        amount: formData.tax_amount,
        description: `Thuế ${formData.tax_rate}% - ${formData.description}`,
        is_tax_line: true,
        tax_rate: formData.tax_rate,
        tax_amount: formData.tax_amount,
      });
    }
    setDialog(null);
    setSaving(false);
    loadAll();
  };

  const handleVoidConfirm = async (txn, reason) => {
    setSaving(true);
    await base44.entities.FolioTransaction.update(txn.id, {
      status: "voided",
      void_reason: reason,
      voided_by: currentUser?.email || "staff",
      voided_at: new Date().toISOString(),
    });
    setVoidTarget(null);
    setDialog(null);
    setSaving(false);
    loadAll();
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    await base44.entities.Reservation.update(reservationId, { status: newStatus });
    setReservation(prev => ({ ...prev, status: newStatus }));
    setSaving(false);
  };

  const handleNightAuditPost = async () => {
    if (!reservation) return;
    setSaving(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const roomRate = reservation.room_rate || roomType?.base_price || 0;
    const taxAmt = Math.round(roomRate * (reservation.tax_rate || 10) / 100);

    await base44.entities.FolioTransaction.create({
      property_id: propertyId || reservation.property_id,
      reservation_id: reservationId,
      transaction_type: "room_charge",
      amount: roomRate,
      description: `Tiền phòng ngày ${today}${room ? ` - Phòng ${room.room_number}` : ""}`,
      business_date: today,
      charge_date: today,
      posted_by: currentUser?.email || "night_audit",
      status: "active",
      is_night_audit: true,
      tax_rate: reservation.tax_rate || 10,
      tax_amount: taxAmt,
    });
    if (taxAmt > 0) {
      await base44.entities.FolioTransaction.create({
        property_id: propertyId || reservation.property_id,
        reservation_id: reservationId,
        transaction_type: "tax",
        amount: taxAmt,
        description: `Thuế ${reservation.tax_rate || 10}% - Tiền phòng ${today}`,
        business_date: today,
        charge_date: today,
        posted_by: currentUser?.email || "night_audit",
        status: "active",
        is_night_audit: true,
        is_tax_line: true,
        tax_rate: reservation.tax_rate || 10,
        tax_amount: taxAmt,
      });
    }
    setSaving(false);
    loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Không tìm thấy đặt phòng.</p>
      </div>
    );
  }

  const sc = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.confirmed;
  const StatusIcon = sc.icon;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Top Header ── */}
      <div className="flex-shrink-0 bg-card border-b border-border px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to={createPageUrl("ReservationCalendar") + (propertyId ? `?property_id=${propertyId}` : "")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">{guestName}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", sc.bg, sc.color)}>
                <StatusIcon className="w-3 h-3" />{sc.label}
              </span>
              {reservation.reservation_number && (
                <span className="text-xs text-muted-foreground font-mono">#{reservation.reservation_number}</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
              {room && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />Phòng {room.room_number}{room.room_name ? ` · ${room.room_name}` : ""}</span>}
              {roomType && <span>{roomType.name}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                {reservation.check_in_date ? format(parseISO(reservation.check_in_date), "dd/MM/yyyy") : "—"} → {reservation.check_out_date ? format(parseISO(reservation.check_out_date), "dd/MM/yyyy") : "—"}
                {" "}({nights} đêm)
              </span>
              {reservation.source && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{SOURCE_LABELS[reservation.source] || reservation.source}</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {reservation.status === "pending" && (
              <button onClick={() => handleStatusChange("confirmed")} disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-info/10 text-info hover:bg-info/20 border border-info/20 transition-colors">
                Xác nhận
              </button>
            )}
            {reservation.status === "confirmed" && (
              <button onClick={() => handleStatusChange("checked_in")} disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-colors">
                Check-in
              </button>
            )}
            {reservation.status === "checked_in" && (
              <>
                <button onClick={handleNightAuditPost} disabled={saving}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors flex items-center gap-1.5">
                  <Moon className="w-3 h-3" />Post đêm nay
                </button>
                <button onClick={() => handleStatusChange("checked_out")} disabled={saving}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 transition-colors">
                  Check-out
                </button>
              </>
            )}
            {["pending", "confirmed"].includes(reservation.status) && (
              <button onClick={() => handleStatusChange("cancelled")} disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors">
                Hủy
              </button>
            )}
          </div>
        </div>

        {/* Summary bar */}
        <FolioSummaryBar
          totalCharges={totalCharges}
          totalPayments={totalPayments}
          totalTax={totalTax}
          balance={balance}
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-5 pt-3 border-b border-border bg-card/50">
        {[
          { key: "folio", label: "Folio / Sổ phát sinh", icon: Receipt },
          { key: "info", label: "Thông tin đặt phòng", icon: FileText },
          { key: "audit", label: "Audit Trail", icon: History },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">

        {/* ── FOLIO TAB ── */}
        {activeTab === "folio" && (
          <div className="p-5 space-y-4">
            {/* Action row */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDialog("charge")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />Thêm phát sinh
                </button>
                <button
                  onClick={() => setDialog("payment")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />Ghi nhận TT / Hoàn tiền
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {balance === 0 && <span className="text-success font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Đã cân đối</span>}
                {balance > 0 && <span className="text-destructive font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Còn nợ {balance.toLocaleString("vi-VN")}đ</span>}
                {balance < 0 && <span className="text-info font-semibold flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />Hoàn lại {Math.abs(balance).toLocaleString("vi-VN")}đ</span>}
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-16">Ngày</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-36">Loại</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Mô tả</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground w-28">Phát sinh (Đ)</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground w-28">Thanh toán (C)</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Người post</th>
                    <th className="px-4 py-2.5 w-14" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Folio trống. Nhấn "Thêm phát sinh" để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(txn => (
                      <TransactionRow
                        key={txn.id}
                        txn={txn}
                        canVoid={true}
                        onVoid={(t) => { setVoidTarget(t); setDialog("void"); }}
                      />
                    ))
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="border-t-2 border-border bg-muted/30">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Tổng cộng</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{totalCharges.toLocaleString("vi-VN")}đ</td>
                      <td className="px-4 py-3 text-right font-bold text-success">{totalPayments.toLocaleString("vi-VN")}đ</td>
                      <td colSpan={2} className="px-4 py-3 text-right">
                        <span className={cn("text-sm font-bold", balance === 0 ? "text-success" : balance > 0 ? "text-destructive" : "text-info")}>
                          {balance === 0 ? "Cân đối" : balance > 0 ? `Còn nợ: ${balance.toLocaleString("vi-VN")}đ` : `Hoàn: ${Math.abs(balance).toLocaleString("vi-VN")}đ`}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Night audit section */}
            {reservation.status === "checked_in" && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Night Audit / Auto Posting</p>
                    <p className="text-xs text-muted-foreground">
                      Post tiền phòng hàng đêm: {(reservation.room_rate || roomType?.base_price || 0).toLocaleString("vi-VN")}đ/đêm + thuế {reservation.tax_rate || 10}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNightAuditPost}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {saving ? "Đang post..." : "Post đêm nay"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── INFO TAB ── */}
        {activeTab === "info" && (
          <div className="p-5 max-w-2xl space-y-5">
            <InfoSection title="Thông Tin Khách" icon={User}>
              <InfoGrid>
                <InfoItem label="Tên khách" value={guestName} />
                <InfoItem label="Số điện thoại" value={guest?.phone || "—"} />
                <InfoItem label="Email" value={guest?.email || "—"} />
                <InfoItem label="Quốc tịch" value={guest?.nationality || "—"} />
                <InfoItem label="Loại giấy tờ" value={guest?.id_type || "—"} />
                <InfoItem label="Số giấy tờ" value={guest?.id_number || "—"} />
              </InfoGrid>
            </InfoSection>

            <InfoSection title="Thông Tin Đặt Phòng" icon={BedDouble}>
              <InfoGrid>
                <InfoItem label="Mã đặt phòng" value={reservation.reservation_number || reservation.id?.slice(-8)} mono />
                <InfoItem label="Trạng thái" value={STATUS_CONFIG[reservation.status]?.label || reservation.status} />
                <InfoItem label="Check-in" value={reservation.check_in_date ? format(parseISO(reservation.check_in_date), "dd/MM/yyyy") : "—"} />
                <InfoItem label="Check-out" value={reservation.check_out_date ? format(parseISO(reservation.check_out_date), "dd/MM/yyyy") : "—"} />
                <InfoItem label="Số đêm" value={`${nights} đêm`} />
                <InfoItem label="Loại phòng" value={roomType?.name || "—"} />
                <InfoItem label="Số phòng" value={room ? `${room.room_number}${room.room_name ? ` · ${room.room_name}` : ""}` : "Chưa xếp phòng"} />
                <InfoItem label="Người lớn / Trẻ em" value={`${reservation.num_adults || 1} NL · ${reservation.num_children || 0} TE`} />
                <InfoItem label="Kênh" value={SOURCE_LABELS[reservation.source] || reservation.source || "—"} />
                <InfoItem label="Gói giá" value={reservation.rate_plan || "—"} />
                <InfoItem label="Giá phòng/đêm" value={reservation.room_rate ? reservation.room_rate.toLocaleString("vi-VN") + "đ" : "—"} />
                <InfoItem label="Thuế" value={`${reservation.tax_rate || 10}%`} />
              </InfoGrid>
            </InfoSection>

            <InfoSection title="Tài Chính & Thanh Toán" icon={DollarSign}>
              <InfoGrid>
                <InfoItem label="Tổng tiền" value={reservation.total_amount ? reservation.total_amount.toLocaleString("vi-VN") + "đ" : "—"} />
                <InfoItem label="Tiền cọc" value={reservation.deposit_amount ? reservation.deposit_amount.toLocaleString("vi-VN") + "đ" : "0đ"} />
                <InfoItem label="Đã thanh toán" value={reservation.paid_amount ? reservation.paid_amount.toLocaleString("vi-VN") + "đ" : "0đ"} />
                <InfoItem label="Phương thức TT" value={reservation.payment_method || "—"} />
              </InfoGrid>
            </InfoSection>

            {(reservation.special_requests || reservation.internal_notes) && (
              <InfoSection title="Ghi Chú" icon={FileText}>
                {reservation.special_requests && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Yêu cầu đặc biệt</p>
                    <p className="text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2">{reservation.special_requests}</p>
                  </div>
                )}
                {reservation.internal_notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Ghi chú nội bộ</p>
                    <p className="text-sm text-foreground bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">{reservation.internal_notes}</p>
                  </div>
                )}
              </InfoSection>
            )}
          </div>
        )}

        {/* ── AUDIT TRAIL TAB ── */}
        {activeTab === "audit" && (
          <div className="p-5">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Audit Log — {transactions.length} giao dịch</span>
              </div>
              <div className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Chưa có giao dịch nào</div>
                ) : (
                  [...transactions].reverse().map(txn => (
                    <AuditRow key={txn.id} txn={txn} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      {dialog === "charge" && (
        <AddTransactionDialog
          mode="charge"
          defaultDate={format(new Date(), "yyyy-MM-dd")}
          taxRate={reservation?.tax_rate || 10}
          onClose={() => setDialog(null)}
          onSubmit={handleAddTransaction}
        />
      )}
      {dialog === "payment" && (
        <AddTransactionDialog
          mode="payment"
          defaultDate={format(new Date(), "yyyy-MM-dd")}
          taxRate={0}
          onClose={() => setDialog(null)}
          onSubmit={handleAddTransaction}
        />
      )}
      {dialog === "void" && voidTarget && (
        <VoidDialog
          transaction={voidTarget}
          onClose={() => { setDialog(null); setVoidTarget(null); }}
          onConfirm={handleVoidConfirm}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function InfoSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>;
}

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm font-semibold text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function AuditRow({ txn }) {
  const isCredit = txn.amount < 0;
  const isVoided = txn.status === "voided";

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", isVoided && "opacity-50")}>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{txn.description || txn.transaction_type}</span>
          {isVoided && <span className="text-xs text-destructive font-semibold">[VOID]</span>}
          {txn.is_night_audit && <span className="text-xs bg-primary/10 text-primary px-1.5 rounded font-medium">Night Audit</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span>{txn.business_date ? format(parseISO(txn.business_date), "dd/MM/yyyy") : "—"}</span>
          <span>by {txn.posted_by || "system"}</span>
          {txn.reference_number && <span>Ref: {txn.reference_number}</span>}
          {isVoided && txn.void_reason && <span className="text-destructive">Lý do: {txn.void_reason}</span>}
        </div>
      </div>
      <div className={cn("text-sm font-bold flex-shrink-0", isCredit ? "text-success" : "text-foreground")}>
        {isCredit ? "-" : "+"}{Math.abs(txn.amount).toLocaleString("vi-VN")}đ
      </div>
    </div>
  );
}
