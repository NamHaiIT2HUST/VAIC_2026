import { useState, useEffect } from 'react';
import { Stethoscope, Activity, FileText, UserPlus, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

function App() {
  const [ws, setWs] = useState(null);
  const [alert, setAlert] = useState(null);

  // Mock Data for the Kanban Board
  const [patients, setPatients] = useState([
    { id: 'P001', name: 'Nguyễn Văn A', status: 'X-Quang', time: '10:15 AM' },
    { id: 'P002', name: 'Trần Thị B', status: 'Lấy máu', time: '10:20 AM' },
    { id: 'P003', name: 'Lê Văn C', status: 'Siêu âm', time: '10:30 AM' },
    { id: 'P004', name: 'Phạm Thị D', status: 'Đăng ký', time: '10:45 AM' },
  ]);

  // Mock Data for the Patient App Timeline (Focusing on P001)
  const [patientTimeline, setPatientTimeline] = useState([
    { step: 1, title: 'Đăng ký & Khám ban đầu', status: 'completed', time: '09:00 AM' },
    { step: 2, title: 'X-Quang', status: 'current', time: 'Đang chờ (10 phút)' },
    { step: 3, title: 'Lấy máu', status: 'pending', time: 'Dự kiến 10:45 AM' },
    { step: 4, title: 'Gặp bác sĩ tư vấn', status: 'pending', time: 'Dự kiến 11:30 AM' },
  ]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');
    
    socket.onopen = () => console.log('Connected to CareFlow WebSocket');

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle audio if present
        if (data.audio_url) {
           const audio = new Audio(data.audio_url);
           audio.play().catch(e => console.error("Audio play failed:", e));
        }

        // Handle Alert Event
        if (data.type === 'ALERT') {
          setAlert(data.message);
          
          // Simulate Re-optimization: Move P001 from X-Quang to Lấy Máu
          setTimeout(() => {
            setPatients(prev => prev.map(p => 
              p.id === 'P001' ? { ...p, status: 'Lấy máu', time: 'Chuyển hướng AI' } : p
            ));
            
            setPatientTimeline([
              { step: 1, title: 'Đăng ký & Khám ban đầu', status: 'completed', time: '09:00 AM' },
              { step: 2, title: 'Lấy máu', status: 'current', time: 'Đang chuyển đến (5 phút)' },
              { step: 3, title: 'X-Quang', status: 'pending', time: 'Chờ sửa chữa' },
              { step: 4, title: 'Gặp bác sĩ tư vấn', status: 'pending', time: 'Dự kiến 11:30 AM' },
            ]);
            
            setTimeout(() => setAlert(null), 8000); // Clear alert after 8s
          }, 2000);
        }

      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const triggerMachineFailure = async () => {
    try {
      await fetch('http://localhost:8080/api/v1/events/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'ALERT', 
          message: 'Sự cố: Máy X-Quang phòng số 2 báo lỗi kỹ thuật. Đang tự động phân luồng lại bệnh nhân.' 
        }),
      });
    } catch (error) {
      console.error('Failed to trigger event', error);
    }
  };

  const KanbanColumn = ({ title, icon: Icon, statusName, colorClass }) => {
    const columnPatients = patients.filter(p => p.status === statusName);
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[300px]">
        <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${colorClass}`}>
          <Icon size={20} className={colorClass.replace('border-', 'text-')} />
          <h3 className="font-bold text-gray-700">{title}</h3>
          <span className="ml-auto bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-bold">
            {columnPatients.length}
          </span>
        </div>
        <div className="space-y-3">
          {columnPatients.map(p => (
            <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-800">{p.name}</span>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{p.id}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <RefreshCw size={12} /> {p.time}
              </div>
            </div>
          ))}
          {columnPatients.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4 italic border-2 border-dashed border-gray-200 rounded-lg">
              Trống
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 p-4 md:p-8">
      
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">CareFlow <span className="text-blue-600">AI</span></h1>
            <p className="text-xs text-gray-500 font-medium">Hệ thống Điều phối Thông minh</p>
          </div>
        </div>
        <button 
          onClick={triggerMachineFailure}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
        >
          <AlertTriangle size={18} />
          Giả lập: Hỏng máy X-Quang
        </button>
      </header>

      {/* Alert Banner */}
      {alert && (
        <div className="mb-8 bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="animate-pulse" size={24} />
            <div>
              <p className="font-bold text-lg">CẢNH BÁO HỆ THỐNG</p>
              <p className="text-red-100 text-sm">{alert}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-red-800 bg-opacity-50 px-3 py-1 rounded-full">
            <RefreshCw size={14} className="animate-spin" />
            Đang phân luồng lại bằng AI...
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left: Hospital Kanban Dashboard (Takes 2/3 space on XL screens) */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
            <Activity className="text-blue-500" />
            Dashboard Điều Phối Hàng Đợi (Real-time)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KanbanColumn title="Đăng ký" icon={UserPlus} statusName="Đăng ký" colorClass="border-gray-400" />
            <KanbanColumn title="X-Quang" icon={Activity} statusName="X-Quang" colorClass="border-blue-500" />
            <KanbanColumn title="Lấy máu" icon={Stethoscope} statusName="Lấy máu" colorClass="border-red-500" />
            <KanbanColumn title="Gặp Bác sĩ" icon={FileText} statusName="Gặp bác sĩ" colorClass="border-green-500" />
          </div>
        </div>

        {/* Right: Mobile App Simulator */}
        <div className="flex justify-center xl:justify-end">
          <div className="w-full max-w-[360px] bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col relative h-[700px]">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-20"></div>
            
            {/* App Header */}
            <div className="bg-blue-600 text-white pt-10 pb-6 px-6 rounded-b-3xl shadow-md z-10 relative">
              <h2 className="text-lg font-bold opacity-90">Xin chào, Nguyễn Văn A</h2>
              <p className="text-blue-100 text-sm mt-1">Mã BN: P001</p>
              
              <div className="mt-4 bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider font-semibold text-blue-100 mb-1">Trạng thái hiện tại</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="font-bold">{patientTimeline.find(t => t.status === 'current')?.title || 'Hoàn tất'}</p>
                </div>
              </div>
            </div>

            {/* App Body - Timeline */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
              <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Lộ trình của bạn
              </h3>
              
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                {patientTimeline.map((item, index) => (
                  <div key={index} className="relative pl-6">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white
                      ${item.status === 'completed' ? 'border-green-500 bg-green-500' : 
                        item.status === 'current' ? 'border-blue-500 bg-blue-100 animate-pulse' : 
                        'border-gray-300'}`}
                    >
                      {item.status === 'completed' && <CheckCircle2 size={12} className="text-white absolute -top-0.5 -left-0.5" />}
                    </div>
                    
                    {/* Content */}
                    <div className={`p-4 rounded-xl shadow-sm border transition-all duration-300
                      ${item.status === 'current' ? 'bg-blue-50 border-blue-200 shadow-blue-100 scale-105 transform origin-left' : 
                        item.status === 'completed' ? 'bg-white border-gray-100 opacity-75' : 
                        'bg-white border-gray-100 border-dashed opacity-60'}`}
                    >
                      <h4 className={`font-bold text-sm ${item.status === 'current' ? 'text-blue-700' : 'text-gray-800'}`}>
                        {item.title}
                      </h4>
                      <p className={`text-xs mt-1 font-medium ${item.status === 'current' ? 'text-blue-500' : 'text-gray-500'}`}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* App Footer Tab Bar */}
            <div className="bg-white border-t border-gray-100 p-4 flex justify-around text-gray-400">
              <Activity className="text-blue-600" />
              <FileText />
              <UserPlus />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
