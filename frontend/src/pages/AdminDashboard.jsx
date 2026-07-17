import { BarChart3, TrendingDown, Users, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white p-2 rounded-lg"><BarChart3 size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-gray-800">CareFlow Admin</h1>
            <p className="text-xs text-gray-500">Trung tâm Điều hành Toàn cục</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 font-bold transition-colors">
          Đăng xuất
        </button>
      </header>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl"><Users size={28} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng Bệnh Nhân</p>
              <p className="text-3xl font-black text-gray-800">1,248</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl"><TrendingDown size={28} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Thời gian chờ (TB)</p>
              <p className="text-3xl font-black text-gray-800">24 <span className="text-lg text-gray-400">phút</span></p>
              <p className="text-xs text-green-600 font-bold mt-1">▼ Giảm 15% nhờ AI</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl"><Clock size={28} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Hiệu suất phòng máy</p>
              <p className="text-3xl font-black text-gray-800">92%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm flex items-center gap-4 bg-red-50">
            <div className="bg-red-100 text-red-600 p-4 rounded-2xl"><AlertTriangle size={28} /></div>
            <div>
              <p className="text-sm text-red-500 font-medium">Cảnh báo điểm nghẽn</p>
              <p className="text-xl font-bold text-red-700">Phòng Lấy Máu</p>
              <p className="text-xs text-red-600 font-bold mt-1">Đang chờ: 15 người</p>
            </div>
          </div>
        </div>

        {/* Charts Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4">Lưu lượng Bệnh Nhân theo Giờ</h3>
            <div className="flex-1 bg-slate-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
              [Khu vực gắn Biểu đồ Line Chart]
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4">Phân bổ Bệnh Nhân tại các Phòng ban</h3>
            <div className="flex-1 bg-slate-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
              [Khu vực gắn Biểu đồ Bar Chart]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
