import { useState, useEffect } from 'react';
import { Stethoscope, Activity, FileText, UserPlus, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [alert, setAlert] = useState(null);
  const [patients, setPatients] = useState([
    { id: 'P001', name: 'Nguyễn Văn A', status: 'X-Quang', time: '10:15 AM' },
    { id: 'P002', name: 'Trần Thị B', status: 'Lấy máu', time: '10:20 AM' },
    { id: 'P003', name: 'Lê Văn C', status: 'Siêu âm', time: '10:30 AM' },
    { id: 'P004', name: 'Phạm Thị D', status: 'Đăng ký', time: '10:45 AM' },
  ]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.audio_url) {
           const audio = new Audio(data.audio_url);
           audio.play().catch(e => console.error("Audio play failed:", e));
        }
        if (data.type === 'ALERT') {
          setAlert(data.message);
          setTimeout(() => {
            setPatients(prev => prev.map(p => 
              p.id === 'P001' ? { ...p, status: 'Lấy máu', time: 'Chuyển hướng AI' } : p
            ));
            setTimeout(() => setAlert(null), 8000);
          }, 2000);
        }
      } catch (err) {}
    };

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
    } catch (error) {}
  };

  const KanbanColumn = ({ title, icon: Icon, statusName, colorClass }) => {
    const columnPatients = patients.filter(p => p.status === statusName);
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[500px]">
        <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${colorClass}`}>
          <Icon size={20} className={colorClass.replace('border-', 'text-')} />
          <h3 className="font-bold text-gray-700">{title}</h3>
          <span className="ml-auto bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-bold">
            {columnPatients.length}
          </span>
        </div>
        <div className="space-y-3">
          {columnPatients.map(p => (
            <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 cursor-grab hover:border-blue-300">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-800">{p.name}</span>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{p.id}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <RefreshCw size={12} /> {p.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg"><Activity size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">CareFlow <span className="text-blue-600">Dashboard</span></h1>
            <p className="text-xs text-gray-500">Màn hình Điều phối Bệnh viện (Y Tá)</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={triggerMachineFailure} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-2 px-4 rounded-lg shadow-sm">
            <AlertTriangle size={18} /> Giả lập: Hỏng máy
          </button>
          <button 
            onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/login'; }}
            className="flex items-center gap-2 bg-gray-100 text-gray-600 hover:text-red-500 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {alert && (
        <div className="mb-8 bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="animate-pulse" size={24} />
          <div><p className="font-bold">CẢNH BÁO</p><p className="text-sm">{alert}</p></div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KanbanColumn title="Đăng ký" icon={UserPlus} statusName="Đăng ký" colorClass="border-gray-400" />
          <KanbanColumn title="X-Quang" icon={Activity} statusName="X-Quang" colorClass="border-blue-500" />
          <KanbanColumn title="Lấy máu" icon={Stethoscope} statusName="Lấy máu" colorClass="border-red-500" />
          <KanbanColumn title="Gặp Bác sĩ" icon={FileText} statusName="Gặp bác sĩ" colorClass="border-green-500" />
        </div>
      </div>
    </div>
  );
}
