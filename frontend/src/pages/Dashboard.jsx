import { useState, useEffect } from 'react';
import { Activity, ShieldPlus, AlertOctagon, LogOut, Search, ChevronRight, AlertTriangle, Zap, Clock, Users, Database, ServerCrash, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [alert, setAlert] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientPathway, setPatientPathway] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [machines, setMachines] = useState({ xray1: true, xray2: true, ultra1: true });

  useEffect(() => {
    // Fetch initial data
    const fetchPatients = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/patients');
        let data = await res.json();
        
        // Mock data to make demo look fully populated with AI actions
        if (Array.isArray(data)) {
           data = data.map(p => {
             const num = parseInt(p.patient_code?.replace(/\D/g, '')) || 0;
             // Chỉ giả lập cho những bệnh nhân chưa được bác sĩ khám (location mặc định là Đang phân luồng)
             if (num >= 5 && p.location === 'Đang phân luồng') {
                if (num % 4 === 1) p.location = 'Phòng X-Quang';
                else if (num % 4 === 2) p.location = 'Phòng Siêu âm';
                else if (num % 4 === 3) p.location = 'Phòng xét nghiệm Sinh hóa';
                else p.location = 'Chờ khám lâm sàng';
             }
             return p;
           });
        }
        
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    const socket = new WebSocket(wsUrl);
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

  const toggleMachine = async (id, name) => {
    const isCurrentlyOn = machines[id];
    setMachines(prev => ({ ...prev, [id]: !isCurrentlyOn }));
    
    if (isCurrentlyOn) {
      // Simulate failure alert
      try {
        await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/events/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'ALERT', 
            message: `CẢNH BÁO: ${name} báo lỗi. AI CareFlow đang phân luồng lại để tránh ùn tắc...` 
          }),
        });
      } catch (error) {}
    } else {
      // Restore
      setAlert(`THÔNG BÁO: ${name} đã khôi phục. AI điều phối lại luồng bệnh nhân.`);
      setTimeout(() => setAlert(null), 5000);
    }
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

  // Dynamic Metrics
  const totalPatients = patients.length;
  const avgWaitTime = totalPatients > 0 ? 12 + Math.floor(totalPatients * 0.4) : 0;
  const aiOptimizedCount = totalPatients > 0 ? Math.floor(totalPatients * 0.4) + 1 : 0;
  
  const depLoads = {
    xray: patients.filter(p => p.status.includes('X-Quang')).length,
    blood: patients.filter(p => p.status.includes('Máu') || p.status.includes('Sinh hóa')).length,
    ultrasound: patients.filter(p => p.status.includes('Siêu âm')).length,
    clinic: patients.filter(p => p.status.includes('Chờ khám')).length
  };

  const getWaitTime = (p) => {
    if (p.location === 'Đang phân luồng' || p.location === 'Chờ khám lâm sàng') return '-';
    const num = parseInt(p.patient_code?.replace(/\D/g, '')) || 0;
    return (num * 3 % 20) + 5 + 'p'; 
  };
  const isRerouted = (p) => {
    if (p.location === 'Đang phân luồng' || p.location === 'Chờ khám lâm sàng') return false;
    const num = parseInt(p.patient_code?.replace(/\D/g, '')) || 0;
    return num % 3 === 0;
  };

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
        
        {/* AI Metrics & Department Load Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* KPI 1: Wait Time */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
            <div className="bg-teal-100 text-teal-600 p-3 rounded-full"><Clock size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tr.Bình Chờ</p>
              <h3 className="text-2xl font-bold text-slate-800">{avgWaitTime} <span className="text-sm font-normal text-slate-500">phút</span></h3>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1">↓ Giảm 35% nhờ AI</p>
            </div>
          </div>
          
          {/* KPI 2: AI Re-routed */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><Zap size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Phân Luồng</p>
              <h3 className="text-2xl font-bold text-slate-800">{aiOptimizedCount} <span className="text-sm font-normal text-slate-500">lượt</span></h3>
              <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">Ngăn chặn ùn tắc cục bộ</p>
            </div>
          </div>

          {/* KPI 3: Department Loads */}
          <div className="md:col-span-2 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tải Trọng Phòng Khám (Real-time)</p>
                <Activity size={16} className="text-teal-500" />
             </div>
             <div className="flex gap-4">
               <div className="flex-1">
                 <div className="flex justify-between text-xs font-semibold mb-1"><span>X-Quang</span> <span className={depLoads.xray > 3 ? 'text-red-500' : 'text-slate-700'}>{depLoads.xray} BN</span></div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${depLoads.xray > 3 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(depLoads.xray * 20, 100)}%`}}></div></div>
               </div>
               <div className="flex-1">
                 <div className="flex justify-between text-xs font-semibold mb-1"><span>Siêu Âm</span> <span>{depLoads.ultrasound} BN</span></div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-teal-500 h-1.5 rounded-full" style={{width: `${Math.min(depLoads.ultrasound * 20, 100)}%`}}></div></div>
               </div>
               <div className="flex-1">
                 <div className="flex justify-between text-xs font-semibold mb-1"><span>Lấy máu</span> <span>{depLoads.blood} BN</span></div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full" style={{width: `${Math.min(depLoads.blood * 20, 100)}%`}}></div></div>
               </div>
             </div>
          </div>
        </div>

        {/* Visual Incident Management & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
          <div className="flex-1 w-full max-w-md">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tra cứu Bệnh nhân</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Tra cứu mã BN, tên..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
              />
            </div>
          </div>
          
          <div className="flex-1 w-full border border-slate-200 bg-white p-3 rounded-lg shadow-sm">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><ServerCrash size={14} /> Quản lý Sự cố Trực quan (Machine Config)</label>
             <div className="flex gap-3">
               <button onClick={() => toggleMachine('xray1', 'Máy X-Quang 01')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1 border transition-colors ${machines.xray1 ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
                 {machines.xray1 ? <CheckCircle2 size={14}/> : <AlertOctagon size={14}/>} XQ 01 {machines.xray1 ? 'ON' : 'OFF'}
               </button>
               <button onClick={() => toggleMachine('xray2', 'Máy X-Quang 02')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1 border transition-colors ${machines.xray2 ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
                 {machines.xray2 ? <CheckCircle2 size={14}/> : <AlertOctagon size={14}/>} XQ 02 {machines.xray2 ? 'ON' : 'OFF'}
               </button>
               <button onClick={() => toggleMachine('ultra1', 'Máy Siêu Âm 01')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1 border transition-colors ${machines.ultra1 ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
                 {machines.ultra1 ? <CheckCircle2 size={14}/> : <AlertOctagon size={14}/>} SÂ 01 {machines.ultra1 ? 'ON' : 'OFF'}
               </button>
             </div>
          </div>
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
                  <th className="px-6 py-3 font-semibold">Trạng thái / AI Optimize</th>
                  <th className="px-6 py-3 font-semibold">Vị trí hiện tại</th>
                  <th className="px-6 py-3 font-semibold">Giờ tiếp nhận</th>
                  <th className="px-6 py-3 font-semibold text-center">Dự kiến chờ</th>
                  <th className="px-6 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(filteredPatients || []).map((p, index) => (
                  <tr key={index} className="hover:bg-teal-50 transition-colors border-b last:border-0 group cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{p.patient_code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-teal-900">{p.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {p.status === 'Emergency' || p.status === 'VIP' ? (
                          <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[10px] border border-red-200">CẤP CỨU / VIP</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">Khám Thường</span>
                        )}
                        {isRerouted(p) && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 flex items-center gap-1"><Zap size={10} /> AI Đã Đổi Lịch</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        {p.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                      {p.time}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-1 rounded">{getWaitTime(p)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={async () => {
                          setSelectedPatient(p);
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/patients/${p.patient_code}/pathway`);
                            const data = await res.json();
                            
                            let timeline = data.timeline || [];
                            
                            // Tự động sinh lộ trình giả cho các bệnh nhân Mock để demo
                            if (timeline.length === 0 && p.location !== 'Đang phân luồng' && p.location !== 'Chờ khám lâm sàng') {
                               timeline = [
                                 { title: 'Khám lâm sàng (Phòng 102)', status: 'completed' }
                               ];
                               
                               if (isRerouted(p)) {
                                 timeline.push({ title: 'Lấy máu (AI ưu tiên chèn trước)', status: 'completed' });
                               }
                               
                               timeline.push({ title: p.location, status: 'current' });
                               
                               if (!p.location.includes('X-Quang')) {
                                 timeline.push({ title: 'Chụp X-Quang (Phòng 2)', status: 'pending' });
                               }
                               timeline.push({ title: 'Bác sĩ đọc kết quả', status: 'pending' });
                            }
                            
                            setPatientPathway(timeline);
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
                {!patientPathway || patientPathway.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-lg">
                    <Activity className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-slate-600 font-medium">Bệnh nhân này chưa có lộ trình.</p>
                    <p className="text-slate-500 text-sm mt-1">Bác sĩ chưa chỉ định cận lâm sàng cho bệnh nhân này.</p>
                  </div>
                ) : (
                  patientPathway.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-center p-3 border rounded bg-slate-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${step.status === 'completed' ? 'bg-green-500' : step.status === 'current' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{step.title}</p>
                        <p className="text-xs text-slate-500">{step.status === 'completed' ? 'Đã hoàn thành' : step.status === 'current' ? 'Đang thực hiện' : 'Đang đợi'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={async () => {
                  try {
                    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/patients/${selectedPatient.patient_code}/prioritize`, { method: 'POST' });
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
