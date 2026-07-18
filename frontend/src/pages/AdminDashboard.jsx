import { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Users, Clock, AlertTriangle, LogOut, Zap, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
    
    // Poll stats every 10s to simulate live updating dashboard
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899'];

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
              <p className="text-2xl font-black text-slate-800 mt-1">{stats ? stats.total_patients : '...'}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-teal-50 text-teal-600 p-3 rounded-md"><TrendingDown size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Thời Gian Chờ (TB)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black text-slate-800">{stats ? stats.wait_time_avg : '...'} <span className="text-sm font-semibold text-slate-500">phút</span></p>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">▼ 15% (AI)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-md"><Clock size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Công Suất Sử Dụng</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats ? stats.utilization : '...'}%</p>
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-700 text-sm">LƯU LƯỢNG BỆNH NHÂN THEO GIỜ</h3>
            </div>
            <div className="flex-1 m-4">
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.hourly_traffic} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="patients" name="Thực tế" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="optimal" name="Mục tiêu (AI)" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-md border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex justify-between">
              <h3 className="font-bold text-slate-700 text-sm">PHÂN TÍCH ĐIỂM NGHẼN (BOTTLENECKS)</h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Real-time</span>
            </div>
            <div className="flex-1 m-4">
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Phòng Khám Nội", wait: 5, limit: 15 },
                    { name: "Phòng X-Quang 1", wait: 45, limit: 20 },
                    { name: "Phòng Siêu Âm 2", wait: 12, limit: 15 },
                    { name: "Phòng Xét Nghiệm", wait: 25, limit: 30 }
                  ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="wait" name="Phút chờ trung bình" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="limit" name="Ngưỡng cho phép" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Metrics Row */}
        <div className="mt-6 bg-indigo-900 rounded-md shadow-lg p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex-1">
             <h3 className="text-xl font-bold text-indigo-100 flex items-center gap-2">
               <Zap className="text-yellow-400" fill="currentColor" /> Báo cáo Hiệu suất AI CareFlow
             </h3>
             <p className="text-indigo-300 text-sm mt-2">Tổng hợp các can thiệp tự động từ Hệ thống Trí tuệ nhân tạo nhằm giảm thiểu thời gian chờ và chống ùn tắc cục bộ.</p>
           </div>
           <div className="flex gap-8">
              <div className="text-center">
                <p className="text-4xl font-black text-white">24</p>
                <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mt-1">Lần Tái điều phối</p>
              </div>
              <div className="w-px bg-indigo-700"></div>
              <div className="text-center">
                <p className="text-4xl font-black text-green-400">142</p>
                <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mt-1">Giờ Chờ Tiết kiệm</p>
              </div>
              <div className="w-px bg-indigo-700"></div>
              <div className="text-center">
                <p className="text-4xl font-black text-yellow-400">98%</p>
                <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mt-1">Độ chính xác (SLA)</p>
              </div>
           </div>
        </div>

        {/* Live Room Status (TỔNG QUÁT HỆ THỐNG) */}
        <div className="mt-6 bg-white rounded-md border border-slate-200 shadow-sm p-6 mb-10">
           <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
             <Activity className="text-teal-500" size={20} /> Tổng quan Trạng thái Phòng ban (Real-time)
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-slate-100 bg-slate-50 p-4 rounded text-center">
                 <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Lâm sàng</p>
                 <div className="text-3xl font-black text-slate-800">4</div>
                 <p className="text-xs text-green-600 mt-1 font-medium">Bình thường</p>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-4 rounded text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                 <p className="text-xs font-bold text-slate-500 mb-2 uppercase">X-Quang</p>
                 <div className="text-3xl font-black text-slate-800">15</div>
                 <p className="text-xs text-red-500 mt-1 font-bold animate-pulse">Đang ùn tắc</p>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-4 rounded text-center">
                 <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Siêu âm</p>
                 <div className="text-3xl font-black text-slate-800">2</div>
                 <p className="text-xs text-green-600 mt-1 font-medium">Trống</p>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-4 rounded text-center">
                 <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Xét nghiệm</p>
                 <div className="text-3xl font-black text-slate-800">8</div>
                 <p className="text-xs text-amber-500 mt-1 font-medium">Hoạt động cao</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
