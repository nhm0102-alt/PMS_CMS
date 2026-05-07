import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, Link2, Settings, TrendingUp, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

const OTA_CHANNELS = [
  { id: "booking_com", name: "Booking.com", logo: "🏨", color: "bg-blue-600", description: "Nền tảng đặt phòng lớn nhất thế giới", commission: "15%", connected: true, bookings: 124 },
  { id: "agoda", name: "Agoda", logo: "🌏", color: "bg-red-500", description: "Chuyên về châu Á, lượng khách tốt", commission: "12%", connected: true, bookings: 87 },
  { id: "expedia", name: "Expedia", logo: "✈️", color: "bg-yellow-500", description: "Thị trường khách quốc tế, đặc biệt Mỹ", commission: "18%", connected: false, bookings: 0 },
  { id: "airbnb", name: "Airbnb", logo: "🏠", color: "bg-red-400", description: "Phù hợp với villa, căn hộ, boutique", commission: "3%", connected: false, bookings: 0 },
  { id: "traveloka", name: "Traveloka", logo: "🗺️", color: "bg-blue-400", description: "Thị trường Đông Nam Á", commission: "10%", connected: true, bookings: 45 },
  { id: "klook", name: "Klook", logo: "🎫", color: "bg-green-500", description: "Trải nghiệm và phòng nghỉ", commission: "8%", connected: false, bookings: 0 },
];

export default function OTAChannels() {
  const [channels, setChannels] = useState(OTA_CHANNELS);

  const toggleChannel = (id) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c));
  };

  const connected = channels.filter(c => c.connected);
  const totalBookings = channels.reduce((s, c) => s + c.bookings, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Kênh OTA & Phân Phối" subtitle="Kết nối và quản lý các kênh đặt phòng trực tuyến" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-primary">{connected.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Kênh đang kết nối</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-success">{totalBookings}</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng đặt phòng từ OTA</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-warning">{channels.length - connected.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Kênh chưa kết nối</p>
        </div>
      </div>

      {/* OTA Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {channels.map(ch => (
          <div key={ch.id} className="bg-card rounded-xl border border-border shadow-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${ch.color} flex items-center justify-center text-xl`}>
                  {ch.logo}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{ch.name}</h3>
                  <p className="text-xs text-muted-foreground">{ch.description}</p>
                </div>
              </div>
              <Switch checked={ch.connected} onCheckedChange={() => toggleChannel(ch.id)} />
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1">
                <span className="text-muted-foreground">Hoa hồng: </span>
                <span className="font-semibold text-foreground">{ch.commission}</span>
              </div>
              {ch.connected ? (
                <Badge className="bg-success/10 text-success border-0 gap-1">
                  <CheckCircle className="w-3 h-3" />Đã kết nối
                </Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground border-0 gap-1">
                  <AlertCircle className="w-3 h-3" />Chưa kết nối
                </Badge>
              )}
            </div>

            {ch.connected && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{ch.bookings} đặt phòng</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground">
                  <Settings className="w-3.5 h-3.5" />Cấu hình
                </Button>
              </div>
            )}

            {!ch.connected && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />Kết nối {ch.name}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="bg-info/8 border border-info/20 rounded-xl p-4">
        <div className="flex gap-3">
          <Globe className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Tích hợp Channel Manager</p>
            <p className="text-xs text-muted-foreground mt-1">Để đồng bộ tự động giá và tình trạng phòng với các OTA, vui lòng nâng cấp lên gói Professional hoặc Enterprise và kết nối qua API. Hệ thống hỗ trợ tự động điều chỉnh giá theo công suất (dynamic pricing).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
