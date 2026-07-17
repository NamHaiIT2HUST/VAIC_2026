import { useState } from 'react';
import { Stethoscope, User, FileText, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [patients] = useState([
    { id: 'P005', name: 'Hoàng Văn E', status: 'Đang khám', time: '10:00 AM' },
    { id: 'P006', name: 'Ngô Thị F', status: 'Chờ khám', time: '10:15 AM' },
    { id: 'P007', name: 'Đinh Văn G', status: 'Chờ kết quả X-Quang', time: '10:30 AM' },
  ]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-purple-600 text-white p-2 rounded-lg"><Stethoscope size={24} /></div>
          <h2 className="text-xl font-bold text-gray-800">Bác sĩ</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 bg-purple-50 text-purple-700 p-3 rounded-xl font-bold">
            <User size={20} /> Hàng đợi khám
          </button>
          <button className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-50 p-3 rounded-xl font-medium transition-colors">
            <FileText size={20} /> Lịch sử bệnh án
          </button>
        </nav>

        <button onClick={handleLogout} className="text-red-500 font-bold p-3 hover:bg-red-50 rounded-xl transition-colors">
          Đăng xuất
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-800">Phòng Khám Nội 01</h1>
          <p className="text-gray-500">BS. Trần Trọng Hùng</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Queue */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-[600px]">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="text-purple-500" /> Hàng đợi tiếp theo
            </h3>
            <div className="space-y-4">
              {patients.map(p => (
                <div key={p.id} className={`p-4 rounded-2xl border ${p.status === 'Đang khám' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'}`}>
                  <h4 className="font-bold text-gray-800">{p.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">{p.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'Đang khám' ? 'bg-purple-200 text-purple-700' : p.status.includes('Chờ') ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Patient Detail */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-[600px] flex flex-col">
             <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Hoàng Văn E <span className="text-sm bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono ml-2">P005</span></h2>
                  <p className="text-gray-500 mt-1">Nam, 45 tuổi. Lý do khám: Đau tức ngực, khó thở.</p>
                </div>
                <button className="bg-purple-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-purple-700 transition-colors">
                  Gọi Bệnh Nhân (Voice)
                </button>
             </div>

             <div className="flex-1 bg-slate-50 rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-gray-400">
                <FileText size={48} className="mb-4 text-gray-300" />
                <p className="font-medium">Chưa có kết quả xét nghiệm.</p>
                <p className="text-sm mt-2 text-center max-w-sm">Hệ thống sẽ tự động cập nhật kết quả (X-Quang, Máu) ngay khi phòng xét nghiệm hoàn tất.</p>
             </div>

             <div className="mt-4 flex gap-4">
                <button className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  Chỉ định Sinh hóa
                </button>
                <button className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  Chỉ định X-Quang
                </button>
                <button className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> Hoàn tất & Kê đơn
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
