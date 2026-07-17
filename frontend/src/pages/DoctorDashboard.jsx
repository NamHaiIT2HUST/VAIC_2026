import { useState } from 'react';
import { Stethoscope, User, FileText, CheckCircle, Clock, LogOut, ChevronRight, Activity, Microscope } from 'lucide-react';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/patients');
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      
      {/* Sidebar (Clinical Blue) */}
      <div className="w-64 bg-[#0A3D62] text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-blue-800/50 flex items-center gap-3">
          <Stethoscope size={32} className="text-blue-300" />
          <div>
            <h2 className="font-bold tracking-wide">PHÒNG KHÁM 01</h2>
            <p className="text-xs text-blue-300 mt-1">BS. Trần Trọng Hùng</p>
          </div>
        </div>
        
        <nav className="flex-1 py-4">
          <button className="w-full flex items-center gap-3 bg-blue-800/50 border-l-4 border-blue-400 px-6 py-3 text-sm font-semibold">
            <User size={18} /> Danh sách Hàng đợi
          </button>
          <button className="w-full flex items-center gap-3 hover:bg-blue-800/30 border-l-4 border-transparent px-6 py-3 text-sm font-medium text-blue-100 transition-colors">
            <FileText size={18} /> Hồ sơ Bệnh án
          </button>
        </nav>

        <div className="p-4 border-t border-blue-800/50">
          <button onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/login'; }} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm font-semibold transition-colors">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10">
          <h1 className="text-xl font-bold text-slate-800">Khu vực Khám Lâm Sàng</h1>
          <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <Clock size={16} /> Thời gian hiện tại: {new Date().toLocaleTimeString()}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Patient Queue List (Left Side - 4 columns) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Clock className="text-blue-600" size={18} /> 
              <h3 className="font-bold text-slate-800">Hàng đợi tiếp theo</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {patients.map(p => (
                  <li key={p.patient_code} className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${p.status === 'Đang khám' ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold ${p.status === 'Đang khám' ? 'text-blue-800' : 'text-slate-800'}`}>{p.name}</h4>
                      <span className="text-xs font-mono text-slate-500">{p.patient_code}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">{p.age}t - {p.gender}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${p.status === 'Đang khám' ? 'bg-blue-100 text-blue-700' : p.status.includes('Chờ KQ') ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current Patient Detail (Right Side - 8 columns) */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full">
             
             {/* Patient Info Header */}
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-800">Hoàng Văn E</h2>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-mono font-medium">BN-2405</span>
                  </div>
                  <p className="text-slate-600 text-sm mt-1">Giới tính: Nam | Tuổi: 45 | Nhóm máu: O+</p>
                  <p className="text-slate-800 text-sm mt-2 font-medium"><span className="text-slate-500">Lý do khám:</span> Đau tức ngực, khó thở nhẹ về đêm.</p>
                </div>
                <button className="bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded hover:bg-blue-800 transition-colors shadow-sm flex items-center gap-2">
                  <Activity size={16} /> Gọi Bệnh Nhân
                </button>
             </div>

             {/* Clinical Results Area */}
             <div className="flex-1 p-6 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Kết Quả Cận Lâm Sàng</h3>
                <div className="flex-1 bg-slate-50 rounded border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Microscope size={48} className="mb-3 text-slate-300" />
                  <p className="font-medium text-slate-500">Chưa có dữ liệu xét nghiệm / chẩn đoán hình ảnh.</p>
                  <p className="text-xs mt-1">Hệ thống sẽ đồng bộ tự động từ phòng LIS/PACS.</p>
                </div>
             </div>

             {/* Action Buttons */}
             <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button className="flex-1 bg-white text-slate-700 border border-slate-300 text-sm font-bold py-2.5 rounded hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  + Chỉ định Sinh Hóa
                </button>
                <button className="flex-1 bg-white text-slate-700 border border-slate-300 text-sm font-bold py-2.5 rounded hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  + Chỉ định X-Quang
                </button>
                <button className="flex-1 bg-teal-600 text-white text-sm font-bold py-2.5 rounded hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> Kết luận & Kê Đơn
                </button>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
