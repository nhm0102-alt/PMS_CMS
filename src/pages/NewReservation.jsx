import { useState, useEffect } from "react";
import { api } from "@/api";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format } from "date-fns";
import { User, BedDouble, Calendar, DollarSign, Globe, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Thông tin khách", "Chọn phòng", "Chi tiết đặt phòng", "Xác nhận"];

export default function NewReservation() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [otaChannels, setOtaChannels] = useState([]);

  const [form, setForm] = useState({
    // Guest
    guest_first_name: "", guest_last_name: "", guest_email: "", guest_phone: "",
    guest_nationality: "Vietnamese", guest_id_type: "national_id", guest_id_number: "",
    // Room
    room_type_id: "", check_in_date: "", check_out_date: "",
    num_adults: 1, num_children: 0,
    // Details
    source: "direct", rate_plan: "standard", promo_code: "",
    payment_method: "cash", deposit_amount: 0, special_requests: "", internal_notes: "",
  });

  useEffect(() => {
    if (propertyId) {
      api.roomTypes.filter({ property_id: propertyId, is_active: true }).then(setRoomTypes);
    } else {
      api.roomTypes.list("-created_date", 50).then(setRoomTypes);
    }
    api.otaChannels.list().then(setOtaChannels);
  }, [propertyId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const nights = form.check_in_date && form.check_out_date
    ? Math.max(0, differenceInDays(new Date(form.check_out_date), new Date(form.check_in_date)))
    : 0;

  const selectedRoomType = roomTypes.find(r => r.id === form.room_type_id);
  const baseAmount = (selectedRoomType?.base_price || 0) * nights;
  const taxAmount = baseAmount * 0.1;
  const totalAmount = baseAmount + taxAmount - (form.discount_amount || 0);

  const handleSubmit = async () => {
    setSaving(true);
    const resNum = "RES" + Date.now().toString().slice(-8);
    await api.reservations.create({
      property_id: propertyId,
      reservation_number: resNum,
      guest_name: `${form.guest_first_name} ${form.guest_last_name}`.trim(),
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
      num_adults: Number(form.num_adults),
      num_children: Number(form.num_children),
      nights,
      status: "confirmed",
      source: form.source,
      room_type_id: form.room_type_id,
      room_rate: selectedRoomType?.base_price || 0,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      deposit_amount: Number(form.deposit_amount),
      paid_amount: Number(form.deposit_amount),
      balance_due: totalAmount - Number(form.deposit_amount),
      payment_method: form.payment_method,
      special_requests: form.special_requests,
      internal_notes: form.internal_notes,
      promo_code: form.promo_code,
      rate_plan: form.rate_plan,
    });
    setSaving(false);
    navigate(createPageUrl("ReservationList") + (propertyId ? `?property_id=${propertyId}` : ""));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Tạo Đặt Phòng Mới" subtitle="Điền thông tin để tạo đơn đặt phòng" />

      {/* Steps */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 transition-all",
              i < step ? "bg-success border-success text-white" :
              i === step ? "bg-primary border-primary text-white" :
              "bg-background border-border text-muted-foreground"
            )}>
              {i < step ? "✓" : i + 1}
            </div>
            <div className={cn("flex-1 text-xs font-medium ml-2 hidden sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</div>
            {i < steps.length - 1 && <div className={cn("h-px flex-1 mx-2", i < step ? "bg-success" : "bg-border")} />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
        {/* Step 0: Guest Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Thông Tin Khách</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ *</Label>
                <Input className="mt-1.5" value={form.guest_last_name} onChange={e => set("guest_last_name", e.target.value)} placeholder="Nguyễn" />
              </div>
              <div>
                <Label>Tên *</Label>
                <Input className="mt-1.5" value={form.guest_first_name} onChange={e => set("guest_first_name", e.target.value)} placeholder="Văn A" />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" type="email" value={form.guest_email} onChange={e => set("guest_email", e.target.value)} placeholder="guest@email.com" />
              </div>
              <div>
                <Label>Điện thoại</Label>
                <Input className="mt-1.5" value={form.guest_phone} onChange={e => set("guest_phone", e.target.value)} placeholder="0901..." />
              </div>
              <div>
                <Label>Quốc tịch</Label>
                <Input className="mt-1.5" value={form.guest_nationality} onChange={e => set("guest_nationality", e.target.value)} />
              </div>
              <div>
                <Label>Loại giấy tờ</Label>
                <Select value={form.guest_id_type} onValueChange={v => set("guest_id_type", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national_id">CCCD / CMND</SelectItem>
                    <SelectItem value="passport">Hộ chiếu</SelectItem>
                    <SelectItem value="driver_license">GPLX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Số giấy tờ</Label>
                <Input className="mt-1.5" value={form.guest_id_number} onChange={e => set("guest_id_number", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Room Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Chọn Phòng & Ngày Ở</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngày check-in *</Label>
                <Input className="mt-1.5" type="date" value={form.check_in_date} onChange={e => set("check_in_date", e.target.value)} min={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div>
                <Label>Ngày check-out *</Label>
                <Input className="mt-1.5" type="date" value={form.check_out_date} onChange={e => set("check_out_date", e.target.value)} min={form.check_in_date || format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div>
                <Label>Số người lớn</Label>
                <Input className="mt-1.5" type="number" min={1} value={form.num_adults} onChange={e => set("num_adults", e.target.value)} />
              </div>
              <div>
                <Label>Trẻ em</Label>
                <Input className="mt-1.5" type="number" min={0} value={form.num_children} onChange={e => set("num_children", e.target.value)} />
              </div>
            </div>
            {nights > 0 && (
              <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-3 text-sm">
                <span className="text-muted-foreground">Thời gian lưu trú: </span>
                <span className="font-semibold text-primary">{nights} đêm</span>
              </div>
            )}
            <div>
              <Label>Loại phòng *</Label>
              <div className="grid gap-3 mt-1.5">
                {roomTypes.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Chưa có loại phòng nào</p>}
                {roomTypes.map(rt => (
                  <div
                    key={rt.id}
                    onClick={() => set("room_type_id", rt.id)}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer transition-all",
                      form.room_type_id === rt.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{rt.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rt.bed_type} · {rt.max_occupancy} khách · {rt.area}m²</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{rt.base_price?.toLocaleString("vi-VN")}đ</p>
                        <p className="text-xs text-muted-foreground">/ đêm</p>
                      </div>
                    </div>
                    {nights > 0 && form.room_type_id === rt.id && (
                      <div className="mt-2 pt-2 border-t border-primary/15 flex justify-between text-xs">
                        <span className="text-muted-foreground">{nights} đêm × {rt.base_price?.toLocaleString("vi-VN")}đ</span>
                        <span className="font-semibold text-primary">{((rt.base_price || 0) * nights).toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Booking Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Chi Tiết Đặt Phòng</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kênh đặt phòng</Label>
                <Select value={form.source} onValueChange={v => set("source", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Trực tiếp</SelectItem>
                    <SelectItem value="phone">Điện thoại</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    {otaChannels.filter(c => c.connected).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="other_ota">OTA khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phương thức thanh toán</Label>
                <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                    <SelectItem value="debit_card">Thẻ ghi nợ</SelectItem>
                    <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                    <SelectItem value="ota_prepaid">OTA trả trước</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mã giảm giá</Label>
                <Input className="mt-1.5" value={form.promo_code} onChange={e => set("promo_code", e.target.value)} placeholder="SUMMER20" />
              </div>
              <div>
                <Label>Tiền cọc (VND)</Label>
                <Input className="mt-1.5" type="number" value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Yêu cầu đặc biệt</Label>
                <Textarea className="mt-1.5 h-20" value={form.special_requests} onChange={e => set("special_requests", e.target.value)} placeholder="Tầng cao, view biển, phòng yên tĩnh..." />
              </div>
              <div className="col-span-2">
                <Label>Ghi chú nội bộ</Label>
                <Textarea className="mt-1.5 h-16" value={form.internal_notes} onChange={e => set("internal_notes", e.target.value)} placeholder="Chỉ nhân viên nội bộ thấy..." />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">Xác Nhận Đặt Phòng</h3>
            </div>
            <div className="bg-muted/40 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Khách:</span>
                <span className="font-medium">{form.guest_last_name} {form.guest_first_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Loại phòng:</span>
                <span className="font-medium">{selectedRoomType?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check-in:</span>
                <span className="font-medium">{form.check_in_date ? format(new Date(form.check_in_date), "dd/MM/yyyy") : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check-out:</span>
                <span className="font-medium">{form.check_out_date ? format(new Date(form.check_out_date), "dd/MM/yyyy") : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số đêm:</span>
                <span className="font-medium">{nights}</span>
              </div>
              <div className="border-t border-border pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiền phòng:</span>
                  <span>{baseAmount.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thuế (10%):</span>
                  <span>{taxAmount.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{totalAmount.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tiền cọc:</span>
                  <span>- {Number(form.deposit_amount).toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Còn lại:</span>
                  <span className="text-warning">{(totalAmount - Number(form.deposit_amount)).toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>Quay lại</Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && (!form.guest_first_name || !form.guest_last_name)) ||
              (step === 1 && (!form.check_in_date || !form.check_out_date || !form.room_type_id || nights < 1))
            }
            className="bg-primary gap-2"
          >
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving} className="bg-success hover:bg-success/90 text-white gap-2">
            {saving ? "Đang tạo..." : "Xác nhận đặt phòng"}
          </Button>
        )}
      </div>
    </div>
  );
}
