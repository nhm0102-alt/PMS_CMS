import { useState, useEffect } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Globe, Link2, Settings, TrendingUp, CheckCircle, 
  AlertCircle, Plus, Pencil, Trash2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_OTA_CHANNELS = [
  { name: "Booking.com", logo: "🏨", color: "bg-blue-600", description: "Nền tảng đặt phòng lớn nhất thế giới", commission: "15%", connected: true, bookings: 124 },
  { name: "Agoda", logo: "🌏", color: "bg-red-500", description: "Chuyên về châu Á, lượng khách tốt", commission: "12%", connected: true, bookings: 87 },
  { name: "Expedia", logo: "✈️", color: "bg-yellow-500", description: "Thị trường khách quốc tế, đặc biệt Mỹ", commission: "18%", connected: false, bookings: 0 },
  { name: "Airbnb", logo: "🏠", color: "bg-red-400", description: "Phù hợp với villa, căn hộ, boutique", commission: "3%", connected: false, bookings: 0 },
  { name: "Traveloka", logo: "🗺️", color: "bg-blue-400", description: "Thị trường Đông Nam Á", commission: "10%", connected: true, bookings: 45 },
  { name: "Klook", logo: "🎫", color: "bg-green-500", description: "Trải nghiệm và phòng nghỉ", commission: "8%", connected: false, bookings: 0 },
];

export default function OTAChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    logo: "🏨",
    color: "bg-blue-600",
    description: "",
    commission: "15%",
    connected: false,
    bookings: 0
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await api.otaChannels.list();
      if (data.length === 0) {
        // Seed initial data
        const seeded = await api.otaChannels.bulkCreate(DEFAULT_OTA_CHANNELS);
        setChannels(seeded);
      } else {
        setChannels(data);
      }
    } catch (error) {
      console.error("Failed to fetch channels", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách kênh OTA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (channel = null) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name,
        logo: channel.logo,
        color: channel.color,
        description: channel.description,
        commission: channel.commission,
        connected: channel.connected,
        bookings: channel.bookings
      });
    } else {
      setEditingChannel(null);
      setFormData({
        name: "",
        logo: "🏨",
        color: "bg-blue-600",
        description: "",
        commission: "15%",
        connected: false,
        bookings: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingChannel) {
        const updated = await api.otaChannels.update(editingChannel.id, formData);
        setChannels(prev => prev.map(c => c.id === editingChannel.id ? updated : c));
        toast({ title: "Thành công", description: "Đã cập nhật kênh OTA" });
      } else {
        const created = await api.otaChannels.create(formData);
        setChannels(prev => [created, ...prev]);
        toast({ title: "Thành công", description: "Đã thêm kênh OTA mới" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu kênh OTA",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kênh này?")) return;
    try {
      await api.otaChannels.delete(id);
      setChannels(prev => prev.filter(c => c.id !== id));
      toast({ title: "Thành công", description: "Đã xóa kênh OTA" });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa kênh OTA",
        variant: "destructive",
      });
    }
  };

  const toggleChannel = async (channel) => {
    try {
      const newStatus = !channel.connected;
      const updated = await api.otaChannels.update(channel.id, { connected: newStatus });
      setChannels(prev => prev.map(c => c.id === channel.id ? updated : c));
      toast({ 
        title: "Thành công", 
        description: `${newStatus ? "Đã kết nối" : "Đã ngắt kết nối"} ${channel.name}` 
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái kết nối",
        variant: "destructive",
      });
    }
  };

  const connected = channels.filter(c => c.connected);
  const totalBookings = channels.reduce((s, c) => s + (parseInt(c.bookings) || 0), 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Kênh OTA & Phân Phối" 
        subtitle="Kết nối và quản lý các kênh đặt phòng trực tuyến"
        actions={
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" /> Thêm kênh
          </Button>
        }
      />

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
          <div key={ch.id} className="bg-card rounded-xl border border-border shadow-card p-5 relative group">
            <div className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(ch)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ch.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${ch.color || 'bg-slate-200'} flex items-center justify-center text-xl`}>
                  {ch.logo}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{ch.name}</h3>
                  <p className="text-xs text-muted-foreground">{ch.description}</p>
                </div>
              </div>
              <Switch checked={ch.connected} onCheckedChange={() => toggleChannel(ch)} />
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
                <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => toggleChannel(ch)}>
                  <Link2 className="w-3.5 h-3.5" />Kết nối {ch.name}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Chỉnh sửa kênh OTA" : "Thêm kênh OTA mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Tên</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logo" className="text-right">Logo (Emoji)</Label>
              <Input id="logo" value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Màu sắc (CSS)</Label>
              <Input id="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="bg-blue-600" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="commission" className="text-right">Hoa hồng</Label>
              <Input id="commission" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bookings" className="text-right">Đặt phòng</Label>
              <Input id="bookings" type="number" value={formData.bookings} onChange={e => setFormData({...formData, bookings: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Mô tả</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
