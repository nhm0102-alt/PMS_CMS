import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Building2, Users, Key, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";

export default function SuperAdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Property.list("-created_date", 50),
      base44.entities.User.list("-created_date", 50),
      base44.entities.LicenseTransaction.list("-created_date", 20),
    ]).then(([props, usrs, txns]) => {
      setProperties(props);
      setUsers(usrs);
      setTransactions(txns);
      setLoading(false);
    });
  }, []);

  const activeProps = properties.filter(p => p.status === "active").length;
  const trialProps = properties.filter(p => p.status === "trial").length;
  const expiringProps = properties.filter(p => {
    if (!p.license_end) return false;
    const end = new Date(p.license_end);
    const soon = addDays(new Date(), 30);
    return end <= soon && end >= new Date();
  });

  const totalRevenue = transactions
    .filter(t => t.payment_status === "paid")
    .reduce((s, t) => s + (t.amount || 0), 0);

  const statusConfig = {
    active: { label: "Hoạt động", class: "bg-success/10 text-success border-success/20" },
    trial: { label: "Dùng thử", class: "bg-info/10 text-info border-info/20" },
    inactive: { label: "Tạm dừng", class: "bg-muted text-muted-foreground" },
    suspended: { label: "Đình chỉ", class: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const licenseConfig = {
    basic: { label: "Basic", class: "bg-muted text-muted-foreground" },
    professional: { label: "Pro", class: "bg-info/10 text-info" },
    enterprise: { label: "Enterprise", class: "bg-accent/20 text-accent-foreground" },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Bảng Điều Khiển Hệ Thống"
        subtitle="Tổng quan StayPro PMS — Quản lý toàn bộ khách sạn trên hệ thống"
        actions={
          <Link to={createPageUrl("PropertiesManagement")}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Building2 className="w-4 h-4" />
              Quản lý Khách Sạn
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng Khách Sạn" value={properties.length} icon={Building2} color="primary" subtitle={`${activeProps} đang hoạt động`} />
        <StatCard title="Đang Dùng Thử" value={trialProps} icon={Clock} color="info" subtitle="Chưa có license" />
        <StatCard title="Sắp Hết Hạn" value={expiringProps.length} icon={AlertTriangle} color="warning" subtitle="Trong 30 ngày tới" />
        <StatCard title="Doanh Thu" value={`${(totalRevenue / 1e6).toFixed(1)}M`} icon={DollarSign} color="gold" subtitle="VND tháng này" />
      </div>

      {/* Expiring Warning */}
      {expiringProps.length > 0 && (
        <div className="bg-warning/8 border border-warning/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{expiringProps.length} khách sạn sắp hết hạn license</p>
              <p className="text-xs text-muted-foreground mt-0.5">Vui lòng liên hệ hoặc gia hạn trước khi hết hạn</p>
            </div>
            <Link to={createPageUrl("LicenseManagement")}>
              <Button variant="outline" size="sm" className="border-warning/30 text-warning hover:bg-warning/10 gap-1.5 text-xs">
                Xem ngay <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Properties List */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Danh Sách Khách Sạn</h2>
            <Link to={createPageUrl("PropertiesManagement")}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 text-xs">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 animate-pulse flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-1/3" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : properties.slice(0, 8).map(prop => (
              <Link key={prop.id} to={createPageUrl("HotelDashboard") + `?property_id=${prop.id}`}>
                <div className="px-5 py-3.5 hover:bg-muted/40 transition-colors flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4.5 h-4.5 text-primary w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{prop.name}</span>
                      {prop.star_rating && (
                        <span className="flex items-center gap-0.5 text-xs text-warning">
                          <Star className="w-3 h-3 fill-current" />
                          {prop.star_rating}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate block">{prop.city || prop.address || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-xs border ${licenseConfig[prop.license_type]?.class || licenseConfig.basic.class}`}>
                      {licenseConfig[prop.license_type]?.label || "Basic"}
                    </Badge>
                    <Badge variant="outline" className={`text-xs border ${statusConfig[prop.status]?.class || ""}`}>
                      {statusConfig[prop.status]?.label || prop.status}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            ))}
            {!loading && properties.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Chưa có khách sạn nào</p>
                <Link to={createPageUrl("PropertiesManagement")}>
                  <Button size="sm" className="mt-3">Thêm khách sạn</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Giao Dịch Gần Đây</h2>
            <Link to={createPageUrl("FinancialManagement")}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 text-xs">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {transactions.slice(0, 8).map(txn => (
              <div key={txn.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{txn.license_type || "—"} License</p>
                    <p className="text-xs text-muted-foreground">{txn.created_date ? format(new Date(txn.created_date), "dd/MM/yyyy") : "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">{txn.amount?.toLocaleString("vi-VN") || "—"}đ</p>
                    <Badge variant="outline" className={`text-xs border mt-0.5 ${txn.payment_status === "paid" ? "text-success border-success/20" : "text-warning border-warning/20"}`}>
                      {txn.payment_status === "paid" ? "Đã thanh toán" : "Chờ"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Chưa có giao dịch</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
