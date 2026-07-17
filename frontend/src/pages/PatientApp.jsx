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
    <div className="min-h-screen bg-slate-200 flex justify-center items-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col relative h-[800px]">
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-20"></div>
        
        <div className="bg-blue-600 text-white pt-12 pb-6 px-6 rounded-b-3xl shadow-md z-10 relative">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold opacity-90">Xin chào, Nguyễn Văn A</h2>
              <p className="text-blue-100 text-sm mt-1">Mã BN: P001</p>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/login'; }}
              className="text-xs bg-blue-700 bg-opacity-50 hover:bg-opacity-80 px-3 py-1 rounded-full transition-colors"
            >
              Thoát
            </button>
          </div>
          <div className="mt-4 bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider font-semibold text-blue-100 mb-1">Trạng thái hiện tại</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <p className="font-bold text-lg">{patientTimeline.find(t => t.status === 'current')?.title}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto pb-24">
          <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2 text-lg">
            <FileText className="text-blue-500" /> Lộ trình khám bệnh
          </h3>
          
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
            {patientTimeline.map((item, index) => (
              <div key={index} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white
                  ${item.status === 'completed' ? 'border-green-500 bg-green-500' : 
                    item.status === 'current' ? 'border-blue-500 bg-blue-100 animate-pulse' : 
                    'border-gray-300'}`}
                >
                  {item.status === 'completed' && <CheckCircle2 size={12} className="text-white absolute -top-0.5 -left-0.5" />}
                </div>
                
                <div className={`p-4 rounded-xl shadow-sm border transition-all duration-300
                  ${item.status === 'current' ? 'bg-blue-50 border-blue-200 scale-105 transform origin-left' : 
                    item.status === 'completed' ? 'bg-white border-gray-100 opacity-75' : 
                    'bg-white border-gray-100 border-dashed opacity-60'}`}
                >
                  <h4 className={`font-bold ${item.status === 'current' ? 'text-blue-700' : 'text-gray-800'}`}>
                    {item.title}
                  </h4>
                  <p className={`text-sm mt-1 font-medium ${item.status === 'current' ? 'text-blue-500' : 'text-gray-500'}`}>
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 flex justify-around text-gray-400 pb-8 rounded-b-3xl">
          <Activity className="text-blue-600" />
          <FileText />
          <UserPlus />
        </div>
      </div>
    </div>
  );
}
