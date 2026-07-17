import { Link } from 'react-router-dom';
import { Activity, Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-2">CareFlow <span className="text-blue-600">AI</span></h1>
        <p className="text-gray-500">Nền tảng Điều phối Bệnh nhân Thông minh</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link to="/dashboard" className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col items-center text-center">
          <div className="bg-blue-50 text-blue-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Activity size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hospital Dashboard</h2>
          <p className="text-gray-500">Màn hình máy tính dành cho Điều dưỡng & Quản lý bệnh viện (Bảng Kanban)</p>
        </Link>

        <Link to="/patient" className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col items-center text-center">
          <div className="bg-green-50 text-green-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Smartphone size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Patient Mobile App</h2>
          <p className="text-gray-500">Giao diện điện thoại dành cho Bệnh nhân theo dõi lộ trình</p>
        </Link>
      </div>
    </div>
  );
}
