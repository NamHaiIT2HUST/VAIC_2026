import { BarChart3, TrendingDown, Users, Clock, AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-700 px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} className="text-blue-400" />
          <div className="border-l border-slate-700 pl-3">
            <h1 className="text-base font-bold tracking-widest">TRUNG TÂM ĐIỀU HÀNH HIS</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Ban Giám Đốc</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-1.5 px-3 rounded flex items-center gap-2 transition-colors">
          <LogOut size={16} /> Thoát
        </button>
      </header>

      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-md"><Users size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Tổng Lượt Tiếp Nhận</p>
              <p className="text-2xl font-black text-slate-800 mt-1">1,248</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-teal-50 text-teal-600 p-3 rounded-md"><TrendingDown size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Thời Gian Chờ (TB)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black text-slate-800">24 <span className="text-sm font-semibold text-slate-500">phút</span></p>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">▼ 15%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-md"><Clock size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Công Suất Phòng Máy</p>
              <p className="text-2xl font-black text-slate-800 mt-1">92%</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-red-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="bg-red-50 text-red-600 p-3 rounded-md ml-2"><AlertTriangle size={24} /></div>
            <div>
              <p className="text-xs text-red-500 font-bold uppercase tracking-wide">Cảnh Báo Nóng</p>
              <p className="text-base font-bold text-slate-800 mt-1">Khoa Cận Lâm Sàng</p>
              <p className="text-[10px] text-red-600 font-bold mt-0.5">Quá tải X-Quang 02 (15 BN đợi)</p>
            </div>
          </div>
        </div>

        {/* Charts Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-700 text-sm">LƯU LƯỢNG BỆNH NHÂN THEO GIỜ</h3>
            </div>
            <div className="flex-1 m-4 bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium">
              [Vùng hiển thị Biểu đồ Line Chart]
            </div>
          </div>
          <div className="bg-white rounded-md border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-700 text-sm">PHÂN BỔ BỆNH NHÂN THEO KHOA PHÒNG</h3>
            </div>
            <div className="flex-1 m-4 bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium">
              [Vùng hiển thị Biểu đồ Bar Chart]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
