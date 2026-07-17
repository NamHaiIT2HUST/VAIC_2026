import { useNavigate } from 'react-router-dom';
import { Activity, Smartphone, Stethoscope, BarChart3 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (role, path) => {
    localStorage.setItem('userRole', role);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="bg-blue-600 text-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
          <Activity size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-2">CareFlow <span className="text-blue-600">AI</span></h1>
        <p className="text-gray-500 font-medium">Chọn phiên bản trải nghiệm (Demo Quick Login)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {/* Patient Login */}
        <button 
          onClick={() => handleLogin('patient', '/app/patient')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all group flex items-center text-left gap-4"
        >
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:scale-105 transition-transform">
            <Smartphone size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bệnh Nhân (Patient)</h2>
            <p className="text-gray-500 text-sm mt-1">Giao diện Mobile App theo dõi lộ trình</p>
          </div>
        </button>

        {/* Nurse Login */}
        <button 
          onClick={() => handleLogin('nurse', '/app/nurse')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-300 transition-all group flex items-center text-left gap-4"
        >
          <div className="bg-green-50 text-green-600 p-4 rounded-2xl group-hover:scale-105 transition-transform">
            <Activity size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Y Tá / Điều Phối (Nurse)</h2>
            <p className="text-gray-500 text-sm mt-1">Giao diện Kanban quản lý luồng bệnh nhân</p>
          </div>
        </button>

        {/* Doctor Login */}
        <button 
          onClick={() => handleLogin('doctor', '/app/doctor')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-300 transition-all group flex items-center text-left gap-4"
        >
          <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl group-hover:scale-105 transition-transform">
            <Stethoscope size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bác Sĩ (Doctor)</h2>
            <p className="text-gray-500 text-sm mt-1">Màn hình phòng khám, chẩn đoán, kê đơn</p>
          </div>
        </button>

        {/* Admin Login */}
        <button 
          onClick={() => handleLogin('admin', '/app/admin')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-300 transition-all group flex items-center text-left gap-4"
        >
          <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl group-hover:scale-105 transition-transform">
            <BarChart3 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Quản Lý (Admin)</h2>
            <p className="text-gray-500 text-sm mt-1">Biểu đồ thống kê, hiệu suất bệnh viện</p>
          </div>
        </button>
      </div>
    </div>
  );
}
