import { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Users, Clock, AlertTriangle, LogOut } from 'lucide-react';
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
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-700 text-sm">PHÂN BỔ BỆNH NHÂN THEO KHOA</h3>
            </div>
            <div className="flex-1 m-4">
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dept_distribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" name="Số lượng Bệnh nhân" radius={[4, 4, 0, 0]}>
                      {stats.dept_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
