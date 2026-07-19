import { useNavigate } from 'react-router-dom';
import { ShieldPlus, Smartphone, Stethoscope, BarChart3, Users } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (role, path) => {
    localStorage.setItem('userRole', role);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="bg-blue-900 text-white p-12 md:w-2/5 flex flex-col justify-center items-center text-center">
          <ShieldPlus size={64} className="mb-6 text-blue-300" />
          <h1 className="text-4xl font-bold tracking-tight mb-2">CareFlow AI</h1>
          <h2 className="text-lg font-medium text-blue-200">Bệnh viện Thông minh</h2>
        </div>

        {/* Right Side: Login Options */}
        <div className="p-12 md:w-3/5 bg-white">
          <h3 className="text-xl font-bold text-slate-800 mb-8 border-b pb-4">Chọn quyền đăng nhập</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            
            <button 
              onClick={() => handleLogin('patient', '/app/patient')}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all group flex flex-col items-start gap-3"
            >
              <div className="text-blue-600 bg-blue-50 p-2 rounded">
                <Smartphone size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-slate-800 group-hover:text-blue-700">Bệnh Nhân (Patient)</h2>
                <p className="text-slate-500 text-xs mt-1">Cổng thông tin & Lộ trình khám</p>
              </div>
            </button>

            <button 
              onClick={() => handleLogin('nurse', '/app/nurse')}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:border-teal-600 hover:shadow-md transition-all group flex flex-col items-start gap-3"
            >
              <div className="text-teal-600 bg-teal-50 p-2 rounded">
                <Users size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-slate-800 group-hover:text-teal-700">Điều Dưỡng (Nurse)</h2>
                <p className="text-slate-500 text-xs mt-1">Quản lý luồng tiếp đón bệnh nhân</p>
              </div>
            </button>

            <button 
              onClick={() => handleLogin('doctor', '/app/doctor')}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all group flex flex-col items-start gap-3"
            >
              <div className="text-indigo-600 bg-indigo-50 p-2 rounded">
                <Stethoscope size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-slate-800 group-hover:text-indigo-700">Bác Sĩ (Doctor)</h2>
                <p className="text-slate-500 text-xs mt-1">Khám lâm sàng & Chỉ định y lệnh</p>
              </div>
            </button>

            <button 
              onClick={() => handleLogin('admin', '/app/admin')}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-800 hover:shadow-md transition-all group flex flex-col items-start gap-3"
            >
              <div className="text-slate-700 bg-slate-100 p-2 rounded">
                <BarChart3 size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-slate-800 group-hover:text-slate-900">Ban Giám Đốc (Admin)</h2>
                <p className="text-slate-500 text-xs mt-1">Trung tâm điều hành & Báo cáo</p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
          </div>
        </div>

      </div>
    </div>
  );
}
