import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Save, MapPin, Upload, X, Star, Phone, Mail, Globe, Hash,
  Image, DollarSign, Clock, Percent
} from "lucide-react";

export default function HotelSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("property_id");

  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const logoRef = useRef(null);
  const coverRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (propertyId) {
      api.properties.filter({ id: propertyId }).then(d => {
        const p = d[0];
        if (p) { setProperty(p); setForm(p); }
      });
    }
  }, [propertyId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    await api.properties.update(property.id, form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const uploadFile = async (file) => {
    const { file_url } = await api.integrations.uploadFile(file);
    return file_url;
  };

  if (!propertyId) return (
    <div className="p-6 text-center text-muted-foreground">
      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>Vui lòng chọn khách sạn từ danh sách</p>
    </div>
  );

  if (!property) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Thông Tin Cơ Sở Lưu Trú"
        subtitle={property?.name}
        actions={
          <Button onClick={handleSave} disabled={saving} className={`gap-2 ${saved ? "bg-success hover:bg-success/90" : ""}`}>
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thay đổi"}
          </Button>
        }
      />

      <div className="space-y-6">

        {/* ─── SECTION 1: Thông tin chung ─── */}
        <Section title="Thông tin chung" icon={<Building2 className="w-4 h-4" />}>
          {/* Logo + Tên */}
          <div className="flex items-center gap-4 pb-5 border-b border-border">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center bg-muted/30 flex-shrink-0">
              {form.logo_url
                ? <img src={form.logo_url} alt="logo" className="w-full h-full object-contain" />
                : <Building2 className="w-8 h-8 text-muted-foreground/30" />}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Logo khách sạn</p>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                const f = e.target.files[0]; if (!f) return;
                setUploadingLogo(true);
                set("logo_url", await uploadFile(f));
                setUploadingLogo(false);
              }} />
              <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
                <Upload className="w-3.5 h-3.5" />{uploadingLogo ? "Đang tải..." : "Tải logo lên"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Tên khách sạn *</Label>
              <Input className="mt-1.5" value={form.name || ""} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Mã khách sạn</Label>
              <Input className="mt-1.5" value={form.code || ""} onChange={e => set("code", e.target.value)} />
            </div>
            <div>
              <Label>Loại cơ sở</Label>
              <Select value={form.type || "hotel"} onValueChange={v => set("type", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["hotel","resort","hostel","villa","apartment","guesthouse"].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />Hạng sao</Label>
              <Select value={String(form.star_rating || "")} onValueChange={v => set("star_rating", Number(v))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map(s => <SelectItem key={s} value={String(s)}>{s} ⭐</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Điện thoại</Label>
              <Input className="mt-1.5" value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</Label>
              <Input className="mt-1.5" type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Website</Label>
              <Input className="mt-1.5" value={form.website || ""} onChange={e => set("website", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Mô tả</Label>
              <Textarea className="mt-1.5 h-20" value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="Mô tả ngắn về khách sạn..." />
            </div>
          </div>
        </Section>

        {/* ─── SECTION 2: Địa chỉ & Bản đồ ─── */}
        <Section title="Địa chỉ & Bản đồ định vị" icon={<MapPin className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Địa chỉ đầy đủ</Label>
              <Input className="mt-1.5" value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Số nhà, tên đường..." />
            </div>
            <div>
              <Label>Thành phố / Tỉnh</Label>
              <Input className="mt-1.5" value={form.city || ""} onChange={e => set("city", e.target.value)} />
            </div>
            <div>
              <Label>Quốc gia</Label>
              <Input className="mt-1.5" value={form.country || ""} onChange={e => set("country", e.target.value)} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />Tọa độ GPS (Lat / Long)
            </p>
            <p className="text-xs text-muted-foreground -mt-2">
              Mở Google Maps → click chuột phải vào vị trí → chọn tọa độ để copy vào đây.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vĩ độ (Latitude)</Label>
                <Input className="mt-1.5 font-mono" type="number" step="0.000001"
                  value={form.latitude || ""} onChange={e => set("latitude", parseFloat(e.target.value) || "")}
                  placeholder="VD: 21.027763" />
              </div>
              <div>
                <Label>Kinh độ (Longitude)</Label>
                <Input className="mt-1.5 font-mono" type="number" step="0.000001"
                  value={form.longitude || ""} onChange={e => set("longitude", parseFloat(e.target.value) || "")}
                  placeholder="VD: 105.834160" />
              </div>
            </div>
          </div>

          {form.latitude && form.longitude ? (
            <div className="mt-3 space-y-2">
              <div className="rounded-xl overflow-hidden border border-border h-64">
                <iframe
                  width="100%" height="100%" frameBorder="0" title="map"
                  src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&z=16&output=embed`}
                  allowFullScreen
                />
              </div>
              <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <MapPin className="w-3 h-3" />Mở Google Maps
              </a>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border-2 border-dashed border-border h-44 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20">
              <MapPin className="w-8 h-8 opacity-30" />
              <p className="text-sm">Nhập tọa độ để xem vị trí trên bản đồ</p>
            </div>
          )}
        </Section>

        {/* ─── SECTION 3: Ảnh ─── */}
        <Section title="Ảnh thumbnail & Bộ sưu tập" icon={<Image className="w-4 h-4" />}>
          {/* Thumbnail/Cover */}
          <div className="space-y-2">
            <Label>Ảnh thumbnail (ảnh đại diện)</Label>
            {form.cover_url ? (
              <div className="relative rounded-xl overflow-hidden border border-border w-full max-w-sm">
                <img src={form.cover_url} alt="cover" className="w-full h-40 object-cover" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-7 h-7"
                  onClick={() => set("cover_url", "")}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div
                className="rounded-xl border-2 border-dashed border-border h-36 max-w-sm flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = "image/*";
                  input.onchange = async (e) => {
                    setUploadingCover(true);
                    set("cover_url", await uploadFile(e.target.files[0]));
                    setUploadingCover(false);
                  };
                  input.click();
                }}
              >
                {uploadingCover ? <span className="text-sm">Đang tải lên...</span> : <>
                  <Upload className="w-7 h-7 opacity-30" />
                  <p className="text-sm">Click để tải ảnh thumbnail</p>
                </>}
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <Label>Bộ sưu tập ảnh ({(form.images || []).length} ảnh)</Label>
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                const f = e.target.files[0]; if (!f) return;
                setUploadingGallery(true);
                const url = await uploadFile(f);
                set("images", [...(form.images || []), url]);
                setUploadingGallery(false);
              }} />
              <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery}>
                <Upload className="w-3.5 h-3.5" />{uploadingGallery ? "Đang tải..." : "Thêm ảnh"}
              </Button>
            </div>
            {(form.images || []).length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border h-28 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20">
                <Image className="w-6 h-6 opacity-30" />
                <p className="text-sm">Chưa có ảnh. Tải ảnh lên để bắt đầu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {(form.images || []).map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="icon" className="w-7 h-7"
                        onClick={() => set("images", (form.images || []).filter((_, j) => j !== i))}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => galleryRef.current?.click()}>
                  <Upload className="w-5 h-5 text-muted-foreground/50" />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ─── SECTION 4: Chính sách & VAT ─── */}
        <Section title="Chính sách & Cấu hình tài chính" icon={<DollarSign className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Giờ check-in</Label>
              <Input className="mt-1.5" type="time" value={form.check_in_time || "14:00"} onChange={e => set("check_in_time", e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Giờ check-out</Label>
              <Input className="mt-1.5" type="time" value={form.check_out_time || "12:00"} onChange={e => set("check_out_time", e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" />Thuế VAT (%)</Label>
              <Input className="mt-1.5" type="number" min="0" max="100"
                value={form.tax_rate ?? 10} onChange={e => set("tax_rate", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">Áp dụng cho tất cả hóa đơn</p>
            </div>
            <div>
              <Label>Đơn vị tiền tệ</Label>
              <Select value={form.currency || "VND"} onValueChange={v => set("currency", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">VND (₫)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="THB">THB (฿)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Múi giờ</Label>
              <Select value={form.timezone || "Asia/Ho_Chi_Minh"} onValueChange={v => set("timezone", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</SelectItem>
                  <SelectItem value="Asia/Bangkok">Bangkok (UTC+7)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* ─── SECTION 5: License (read-only) ─── */}
        <Section title="Thông tin License" icon={<Badge className="w-4 h-4 p-0 bg-transparent border-0 text-current" />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Gói License", value: <span className="capitalize font-bold text-primary">{property.license_type || "basic"}</span> },
              { label: "Trạng thái", value: <Badge className={`text-xs ${property.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"} border-0`}>{property.status}</Badge> },
              { label: "Hết hạn", value: property.license_end || "—" },
              { label: "Phí tháng", value: property.monthly_fee ? (property.monthly_fee / 1e6).toFixed(1) + "M đ" : "—" },
            ].map(item => (
              <div key={item.label} className="bg-muted/40 rounded-lg p-3 border border-border text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <div className="text-sm font-medium mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}
