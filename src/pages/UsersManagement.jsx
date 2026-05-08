import { useState, useEffect } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Building2, Shield, Users, Mail, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [userProps, setUserProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [assignForm, setAssignForm] = useState({ property_id: "", role_name: "Nhân viên lễ tân", is_hotel_admin: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      api.users.list("-created_date", 100),
      api.properties.list("-created_date", 100),
      api.userProperties.list("-created_date", 200),
    ]).then(([u, p, up]) => { setUsers(u); setProperties(p); setUserProps(up); setLoading(false); });
  };
  useEffect(load, []);

  const handleInvite = async () => {
    setInviting(true);
    await api.users.inviteUser(inviteEmail, inviteRole);
    setInviting(false); setShowInvite(false); setInviteEmail("");
  };

  const handleAssign = async () => {
    setSaving(true);
    await api.userProperties.create({
      user_email: showAssign.email,
      property_id: assignForm.property_id,
      role_name: assignForm.role_name,
      is_hotel_admin: assignForm.is_hotel_admin,
      permissions: assignForm.is_hotel_admin
        ? ["all"]
        : ["reservations", "checkin", "checkout", "rooms", "guests"],
    });
    setSaving(false); setShowAssign(null); load();
  };

  const getUserProps = (userEmail) => userProps.filter(up => up.user_email === userEmail);
  const getPropName = (propId) => properties.find(p => p.id === propId)?.name || propId;

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.includes(search)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Quản Lý Người Dùng"
        subtitle="Mời người dùng và phân quyền truy cập khách sạn"
        actions={
          <Button className="bg-primary gap-2" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4" />Mời Người Dùng
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tìm tên, email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Người dùng</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Vai trò hệ thống</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Khách sạn được phân quyền</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}>{Array(4).fill(0).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-3.5 bg-muted rounded animate-pulse" /></td>)}</tr>
            )) : filtered.map(user => {
              const assigned = getUserProps(user.email);
              return (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/8 text-primary text-sm font-bold">
                          {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />{user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge className={`text-xs ${user.role === "admin" ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"} border-0`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role === "admin" ? "Super Admin" : "User"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Chưa phân quyền</span>
                      ) : assigned.map(up => (
                        <Badge key={up.id} variant="outline" className="text-xs gap-1">
                          <Building2 className="w-3 h-3" />
                          {getPropName(up.property_id)}
                          {up.is_hotel_admin && <span className="text-primary font-semibold ml-0.5">Admin</span>}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5" onClick={() => { setShowAssign(user); setAssignForm({ property_id: "", role_name: "Nhân viên lễ tân", is_hotel_admin: false }); }}>
                      <Building2 className="w-3 h-3" />Phân quyền
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Mời Người Dùng Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Email *</Label><Input className="mt-1.5" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" /></div>
            <div>
              <Label>Vai trò hệ thống</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Nhân viên khách sạn)</SelectItem>
                  <SelectItem value="admin">Admin (Quản trị hệ thống)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              Người dùng sẽ nhận email mời và có thể đăng nhập sau khi xác nhận.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Hủy</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-primary gap-2">
              <Mail className="w-4 h-4" />
              {inviting ? "Đang gửi..." : "Gửi lời mời"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Phân Quyền Khách Sạn</DialogTitle></DialogHeader>
          {showAssign && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-lg px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Người dùng: </span>
                <span className="font-medium">{showAssign.full_name || showAssign.email}</span>
              </div>
              <div>
                <Label>Khách sạn</Label>
                <Select value={assignForm.property_id} onValueChange={v => setAssignForm(p => ({ ...p, property_id: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn khách sạn..." /></SelectTrigger>
                  <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tên bộ quyền / Chức danh</Label>
                <Input className="mt-1.5" value={assignForm.role_name} onChange={e => setAssignForm(p => ({ ...p, role_name: e.target.value }))} placeholder="VD: Lễ tân, Quản lý..." />
              </div>
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                <input
                  type="checkbox"
                  id="hotel-admin"
                  checked={assignForm.is_hotel_admin}
                  onChange={e => setAssignForm(p => ({ ...p, is_hotel_admin: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="hotel-admin" className="text-sm cursor-pointer">
                  <span className="font-medium">Hotel Admin</span>
                  <p className="text-xs text-muted-foreground">Có quyền quản lý và phân quyền user khác</p>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Hủy</Button>
            <Button onClick={handleAssign} disabled={saving || !assignForm.property_id} className="bg-primary">{saving ? "Đang lưu..." : "Phân quyền"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
