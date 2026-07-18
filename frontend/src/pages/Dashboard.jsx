import { useState, useEffect } from 'react';
import { Activity, ShieldPlus, AlertOctagon, LogOut, Search, ChevronRight, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [alert, setAlert] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientPathway, setPatientPathway] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch initial data
    const fetchPatients = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/patients');
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();

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
            fetchPatients(); // Re-fetch updated patient routes from Go DB
            setTimeout(() => setAlert(null), 8000);
          }, 3000);
        } else if (data.type === 'WORKFLOW_UPDATED' || data.type === 'CALL_PATIENT') {
          fetchPatients();
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
          message: 'CẢNH BÁO: Thiết bị X-Quang 02 báo lỗi phần cứng. Hệ thống tự động chuyển hướng luồng bệnh nhân.' 
        }),
      });
    } catch (error) {}
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'Tiếp nhận': return <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">Tiếp nhận</span>;
      case 'Cận lâm sàng': return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">Cận lâm sàng</span>;
      case 'Chờ khám': return <span className="px-2 py-1 text-xs font-semibold rounded bg-teal-50 text-teal-700 border border-teal-200">Chờ khám lâm sàng</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const filteredPatients = patients.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.patient_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Header (Clinical Style) */}
      <header className="bg-teal-900 text-white px-6 py-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-4">
          <ShieldPlus size={32} className="text-teal-400" />
          <div className="border-l border-teal-700 pl-4">
            <h1 className="text-lg font-bold tracking-wide">PHÂN HỆ ĐIỀU PHỐI (NURSE STATION)</h1>
            <p className="text-xs text-teal-200 font-medium">Bệnh viện Đa khoa Trung tâm</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold">ĐD. Nguyễn Thị Yến</p>
            <p className="text-xs text-teal-300">Ca sáng (06:00 - 14:00)</p>
          </div>
          <button onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/login'; }} className="bg-teal-800 hover:bg-teal-700 p-2 rounded-md transition-colors" title="Đăng xuất">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
        
        {/* Top Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Tra cứu mã BN, tên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
            />
          </div>
          
          <button 
            onClick={triggerMachineFailure} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors border border-red-800"
          >
            <AlertOctagon size={18} /> Khai báo sự cố (Alert)
          </button>
        </div>

        {/* Alert Banner */}
        {alert && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded shadow-sm flex items-start gap-3">
            <AlertOctagon className="text-red-600 mt-0.5 animate-pulse" size={24} />
            <div>
              <h3 className="text-red-800 font-bold">THÔNG BÁO TỪ TRUNG TÂM ĐIỀU HÀNH AI</h3>
              <p className="text-red-700 text-sm mt-1">{alert}</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Activity className="text-teal-600" /> Danh sách điều phối nội viện
            </h2>
            <span className="text-sm font-semibold bg-teal-100 text-teal-800 px-3 py-1 rounded-full">Tổng: {patients.length} BN</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Mã BN</th>
                  <th className="px-6 py-3 font-semibold">Họ và Tên</th>
                  <th className="px-6 py-3 font-semibold">NS / Giới</th>
                  <th className="px-6 py-3 font-semibold">Phân luồng / Trạng thái</th>
                  <th className="px-6 py-3 font-semibold">Vị trí hiện tại</th>
                  <th className="px-6 py-3 font-semibold">Giờ tiếp nhận</th>
                  <th className="px-6 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(filteredPatients || []).map((p, index) => (
                  <tr key={index} className="hover:bg-teal-50 transition-colors border-b last:border-0 group cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{p.patient_code}</p>
                      <p className="text-xs text-slate-500">{p.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-teal-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.age} tuổi • {p.gender}</p>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'VIP' ? (
                        <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-xs border border-red-200">CẤP CỨU / VIP</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">Thường</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        {p.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={async () => {
                          setSelectedPatient(p);
                          try {
                            const res = await fetch(`http://localhost:8080/api/v1/patients/${p.patient_code}/pathway`);
                            const data = await res.json();
                            setPatientPathway(data.timeline || []);
                          } catch(err){}
                        }}
                        className="text-teal-600 hover:text-teal-800 font-semibold text-sm flex items-center gap-1 ml-auto">
                        Chi tiết <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                <Search size={48} className="mb-4 text-slate-300 opacity-50" />
                <p className="font-medium">Không tìm thấy bệnh nhân nào.</p>
                <p className="text-sm">Hãy thử tìm với tên hoặc mã khác.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Lộ trình của {selectedPatient.name}</h3>
              <button onClick={() => { setSelectedPatient(null); setPatientPathway(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {(patientPathway || []).map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-center p-3 border rounded bg-slate-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${step.status === 'completed' ? 'bg-green-500' : step.status === 'current' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.status === 'completed' ? 'Đã hoàn thành' : step.status === 'current' ? 'Đang thực hiện' : 'Đang đợi'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={async () => {
                  try {
                    await fetch(`http://localhost:8080/api/v1/patients/${selectedPatient.patient_code}/prioritize`, { method: 'POST' });
                    setAlert(`Bệnh nhân ${selectedPatient.name} đã được ưu tiên!`);
                    setSelectedPatient(null);
                    setTimeout(() => setAlert(null), 3000);
                  } catch(err) {}
                }}
                className="px-4 py-2 bg-red-100 text-red-700 font-bold text-sm rounded hover:bg-red-200 flex items-center gap-2">
                <AlertTriangle size={16} /> Ưu tiên khám ngay (VIP)
              </button>
              <button className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-sm rounded hover:bg-slate-300">Tạm dừng bước này</button>
              <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded hover:bg-blue-700">Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
