import PageHeader from "@/components/shared/PageHeader";
import { Settings, Shield, Bell, Database, Globe } from "lucide-react";

export default function SystemSettings() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Cài Đặt Hệ Thống" subtitle="Cấu hình toàn bộ hệ thống StayPro PMS" />
      <div className="grid gap-4">
        {[
          { icon: Shield, title: "Bảo mật & Quyền truy cập", desc: "Cấu hình 2FA, session timeout, IP whitelist" },
          { icon: Bell, title: "Thông báo", desc: "Email alerts, webhook, Slack integration" },
          { icon: Database, title: "Backup & Dữ liệu", desc: "Lịch backup tự động, xuất dữ liệu" },
          { icon: Globe, title: "Ngôn ngữ & Múi giờ", desc: "Cấu hình mặc định cho toàn hệ thống" },
        ].map(item => (
          <div key={item.title} className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
