import { useState, useEffect } from "react";
import { api } from "@/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { DollarSign, TrendingUp, Building2, CreditCard, BarChart3, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FinancialManagement() {
  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProp, setFilterProp] = useState("all");

  useEffect(() => {
    Promise.all([
      api.licenseTransactions.list("-created_date", 200),
      api.properties.list("-created_date", 100),
    ]).then(([t, p]) => { setTransactions(t); setProperties(p); setLoading(false); });
  }, []);

  const filtered = filterProp === "all" ? transactions : transactions.filter(t => t.property_id === filterProp);

  const totalRevenue = filtered.filter(t => t.payment_status === "paid").reduce((s, t) => s + (t.amount || 0), 0);
  const pendingAmount = filtered.filter(t => t.payment_status === "pending").reduce((s, t) => s + (t.amount || 0), 0);
  const paidCount = filtered.filter(t => t.payment_status === "paid").length;

  const getPropName = (id) => properties.find(p => p.id === id)?.name || id;

  // Monthly chart data
  const monthlyData = {};
  filtered.forEach(t => {
    if (t.created_date) {
      const m = format(new Date(t.created_date), "MM/yyyy");
      monthlyData[m] = (monthlyData[m] || 0) + (t.payment_status === "paid" ? (t.amount || 0) : 0);
    }
  });
  const chartData = Object.entries(monthlyData).slice(-6).map(([m, v]) => ({ month: m, revenue: v }));

  const statusConfig = {
    pending: { label: "Chờ TT", class: "bg-warning/10 text-warning" },
    paid: { label: "Đã TT", class: "bg-success/10 text-success" },
    failed: { label: "Thất bại", class: "bg-destructive/10 text-destructive" },
    refunded: { label: "Hoàn tiền", class: "bg-info/10 text-info" },
  };

  const typeLabels = {
    new_license: "License mới", renewal: "Gia hạn", upgrade: "Nâng cấp",
    downgrade: "Hạ cấp", cancellation: "Hủy", payment: "Thanh toán",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Quản Lý Tài Chính" subtitle="Theo dõi doanh thu license và giao dịch" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng Giao Dịch" value={filtered.length} icon={BarChart3} color="primary" />
        <StatCard title="Doanh Thu" value={`${(totalRevenue / 1e6).toFixed(1)}M`} icon={DollarSign} color="gold" subtitle="VND đã thu" />
        <StatCard title="Chờ Thanh Toán" value={`${(pendingAmount / 1e6).toFixed(1)}M`} icon={TrendingUp} color="warning" subtitle="VND" />
        <StatCard title="Đã Hoàn Thành" value={paidCount} icon={CheckCircle} color="success" subtitle="giao dịch" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Doanh Thu Theo Tháng (VND)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [v.toLocaleString("vi-VN") + "đ", "Doanh thu"]} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Select value={filterProp} onValueChange={setFilterProp}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Lọc theo khách sạn" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khách sạn</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Khách sạn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Gói</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Số tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ngày</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-muted rounded animate-pulse w-20" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-14 text-muted-foreground">Chưa có giao dịch nào</td></tr>
              ) : filtered.map(txn => {
                const sc = statusConfig[txn.payment_status] || statusConfig.pending;
                return (
                  <tr key={txn.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{getPropName(txn.property_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{typeLabels[txn.transaction_type] || txn.transaction_type}</td>
                    <td className="px-4 py-3.5"><Badge className="text-xs bg-muted text-muted-foreground border-0">{txn.license_type || "—"}</Badge></td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-foreground">{txn.amount?.toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{txn.created_date ? format(new Date(txn.created_date), "dd/MM/yyyy") : "—"}</td>
                    <td className="px-4 py-3.5">
                      <Badge className={`text-xs ${sc.class} border-0`}>{sc.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
