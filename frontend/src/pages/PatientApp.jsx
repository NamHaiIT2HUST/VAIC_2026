import { useState, useEffect } from 'react';
import { Activity, FileText, UserPlus, CheckCircle2 } from 'lucide-react';

export default function PatientApp() {
  const [patientTimeline, setPatientTimeline] = useState([
    { step: 1, title: 'Đăng ký & Khám ban đầu', status: 'completed', time: '09:00 AM' },
    { step: 2, title: 'X-Quang', status: 'current', time: 'Đang chờ (10 phút)' },
    { step: 3, title: 'Lấy máu', status: 'pending', time: 'Dự kiến 10:45 AM' },
    { step: 4, title: 'Gặp bác sĩ tư vấn', status: 'pending', time: 'Dự kiến 11:30 AM' },
  ]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ALERT') {
          setTimeout(() => {
            setPatientTimeline([
              { step: 1, title: 'Đăng ký & Khám ban đầu', status: 'completed', time: '09:00 AM' },
              { step: 2, title: 'Lấy máu', status: 'current', time: 'Đang chuyển đến (5 phút)' },
              { step: 3, title: 'X-Quang', status: 'pending', time: 'Chờ sửa chữa' },
              { step: 4, title: 'Gặp bác sĩ tư vấn', status: 'pending', time: 'Dự kiến 11:30 AM' },
            ]);
          }, 2000);
        }
      } catch (err) {}
    };
    return () => socket.close();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-20">
      
      {/* Header */}
      <div className="bg-blue-600 text-white pt-8 pb-6 px-6 shadow-md z-10 relative md:pt-10">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold opacity-90">Xin chào, Nguyễn Văn A</h2>
              <p className="text-blue-100 text-sm mt-1">Mã BN: P001</p>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/login'; }}
              className="text-sm bg-blue-700 bg-opacity-50 hover:bg-opacity-80 px-4 py-2 rounded-full transition-colors font-medium"
            >
              Thoát
            </button>
          </div>
          <div className="mt-6 bg-white bg-opacity-20 rounded-2xl p-5 backdrop-blur-sm shadow-inner">
            <p className="text-sm uppercase tracking-wider font-semibold text-blue-100 mb-2">Trạng thái hiện tại</p>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <p className="font-bold text-xl md:text-2xl">{patientTimeline.find(t => t.status === 'current')?.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
        <h3 className="text-gray-800 font-bold mb-8 flex items-center gap-2 text-xl">
          <FileText className="text-blue-500" /> Lộ trình khám bệnh
        </h3>
        
        <div className="relative border-l-[3px] border-gray-200 ml-4 space-y-10">
          {patientTimeline.map((item, index) => (
            <div key={index} className="relative pl-8">
              {/* Dot */}
              <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 bg-white
                ${item.status === 'completed' ? 'border-green-500 bg-green-500' : 
                  item.status === 'current' ? 'border-blue-500 bg-blue-100 animate-pulse' : 
                  'border-gray-300'}`}
              >
                {item.status === 'completed' && <CheckCircle2 size={12} className="text-white absolute -top-0.5 -left-0.5" />}
              </div>
              
              {/* Card */}
              <div className={`p-5 rounded-2xl shadow-sm border transition-all duration-300
                ${item.status === 'current' ? 'bg-blue-50 border-blue-200 shadow-blue-100/50 scale-105 transform origin-left md:scale-100 md:-translate-y-1' : 
                  item.status === 'completed' ? 'bg-white border-gray-100 opacity-80' : 
                  'bg-white border-gray-100 border-dashed opacity-60'}`}
              >
                <h4 className={`font-bold text-lg ${item.status === 'current' ? 'text-blue-700' : 'text-gray-800'}`}>
                  {item.title}
                </h4>
                <p className={`text-sm md:text-base mt-2 font-medium ${item.status === 'current' ? 'text-blue-500' : 'text-gray-500'}`}>
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Tab Bar (Fixed at bottom on Mobile, hidden on larger screens if we wanted) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3 flex justify-around text-gray-400 z-50 md:hidden">
        <button className="flex flex-col items-center p-2 text-blue-600"><Activity size={24} /><span className="text-[10px] font-bold mt-1">Lộ trình</span></button>
        <button className="flex flex-col items-center p-2 hover:text-gray-600 transition-colors"><FileText size={24} /><span className="text-[10px] font-bold mt-1">Kết quả</span></button>
        <button className="flex flex-col items-center p-2 hover:text-gray-600 transition-colors"><UserPlus size={24} /><span className="text-[10px] font-bold mt-1">Tài khoản</span></button>
      </div>

    </div>
  );
}
