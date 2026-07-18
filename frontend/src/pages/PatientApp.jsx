import { useState, useEffect } from 'react';
import { Activity, FileText, UserPlus, CheckCircle2, Zap, Clock, MapPin, Search } from 'lucide-react';
import ChatbotWidget from '../components/ChatbotWidget';

export default function PatientApp() {
  const [patient, setPatient] = useState(null);
  const [patientTimeline, setPatientTimeline] = useState([]);
  const [aiMessage, setAiMessage] = useState('AI CareFlow đã tối ưu lộ trình: Bạn sẽ chụp X-Quang trong lúc chờ kết quả máu để tiết kiệm 45 phút chờ đợi.');
  const [doctorNote, setDoctorNote] = useState('');
  const [alertToast, setAlertToast] = useState(null);
  const [patientCode, setPatientCode] = useState('BN-0005');
  const [allPatients, setAllPatients] = useState([]);

  useEffect(() => {
    // Fetch danh sách bệnh nhân cho dropdown
    const fetchPatients = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/patients');
        const data = await res.json();
        setAllPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchPathway = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080') + `/api/v1/patients/${patientCode}/pathway`);
        const data = await res.json();
        setPatient(data.patient || null);
        setPatientTimeline(Array.isArray(data.timeline) ? data.timeline : []);
      } catch (err) {
        console.error("Failed to fetch pathway", err);
      }
    };
    fetchPathway();

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ALERT') {
          setAlertToast(data.message);
          setAiMessage('⚠ Cảnh báo: ' + data.message + ' AI đang tự động tính toán lại lộ trình của bạn để tránh ùn tắc...');
          setTimeout(() => {
            setAiMessage('⚡ AI CareFlow đã sắp xếp lại lịch trình để tránh ùn tắc. Tiết kiệm 30 phút.');
            setAlertToast(null);
            fetchPathway();
          }, 3000);
        } else if (data.type === 'WORKFLOW_UPDATED') {
          if (data.patient_code && data.patient_code !== patientCode) return; // Bỏ qua nếu của bệnh nhân khác
          if (data.note) setDoctorNote(data.note);
          setAiMessage('⚡ Lộ trình của bạn đã được cập nhật.');
          fetchPathway();
        } else if (data.type === 'CALL_PATIENT') {
          if (data.patient_code && data.patient_code !== patientCode) return; // Bỏ qua nếu của bệnh nhân khác
          setAiMessage('📢 BÁC SĨ GỌI: ' + data.message);
          // Play a sound or use SpeechSynthesis
          const utterance = new SpeechSynthesisUtterance(data.message);
          utterance.lang = 'vi-VN';
          window.speechSynthesis.speak(utterance);
          
          // Force screen to blink
          document.body.style.backgroundColor = '#fecaca'; // light red
          setTimeout(() => { document.body.style.backgroundColor = ''; }, 500);
          setTimeout(() => { document.body.style.backgroundColor = '#fecaca'; }, 1000);
          setTimeout(() => { document.body.style.backgroundColor = ''; }, 1500);
        }
      } catch (err) {}
    };
    return () => socket.close();
  }, [patientCode]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-20">
      
      {/* Toast Alert */}
      {alertToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300 w-[90%] max-w-md">
          <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg border border-red-600 flex items-start gap-3">
            <Zap className="flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="font-bold">CẢNH BÁO / KHẨN CẤP</h4>
              <p className="text-sm mt-1">{alertToast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white pt-8 pb-6 px-6 shadow-md z-10 relative md:pt-10">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold opacity-90">{patient?.name || 'Đang tải...'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <select 
                  value={patientCode} 
                  onChange={(e) => setPatientCode(e.target.value)}
                  className="bg-blue-700 text-white border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {allPatients.map(p => (
                    <option key={p.patient_code} value={p.patient_code}>
                      {p.patient_code} - {p.name}
                    </option>
                  ))}
                  {allPatients.length === 0 && <option value="BN-0005">BN-0005</option>}
                </select>
                <span className="text-blue-100 text-sm">| {patient?.gender || 'N/A'}, {patient?.age || '--'} tuổi</span>
              </div>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/login'; }}
              className="text-sm bg-blue-700 bg-opacity-50 hover:bg-opacity-80 px-4 py-2 rounded-full transition-colors font-medium self-end md:self-auto whitespace-nowrap"
            >
              Thoát
            </button>
          </div>
          <div className="mt-6 bg-white bg-opacity-20 rounded-2xl p-5 backdrop-blur-sm shadow-inner">
            <p className="text-sm uppercase tracking-wider font-semibold text-blue-100 mb-2">Hướng dẫn di chuyển</p>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <MapPin size={14} className="animate-bounce" />
              </div>
              <div>
                <p className="font-bold text-xl md:text-2xl text-white">
                  {(patientTimeline || []).find(t => t.status === 'current')?.title || 'Hoàn thành khám'}
                </p>
                <p className="text-blue-100 text-sm mt-1">
                  Vui lòng di chuyển theo đường mũi tên màu xanh trên sàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Optimization Banner */}
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 mt-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm flex gap-4 items-start mb-4">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <Zap size={24} className={aiMessage.includes('⚠') ? 'text-amber-500 animate-pulse' : 'text-blue-600'} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              Trợ lý AI Phân luồng
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Smart</span>
            </h4>
            <p className="text-sm text-blue-800 mt-1 font-medium">{aiMessage}</p>
          </div>
        </div>

        {/* Doctor Note Chat Bubble */}
        {doctorNote && (
          <div className="flex items-end gap-3 mb-6 mt-2 px-2 animate-in fade-in slide-in-from-left duration-500">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 relative">
              <FileText size={20} className="text-blue-600" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] relative">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Bác sĩ điều trị
                <span className="text-[10px] text-slate-400 font-normal">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </h4>
              <p className="text-slate-700 mt-1">{doctorNote}</p>
            </div>
          </div>
        )}

        {/* Floor Map */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
           <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-sm flex items-center gap-2">
             <MapPin size={16} /> Sơ đồ Tầng 1
           </div>
           <div className="p-4 flex justify-center bg-slate-100 relative">
              <svg width="100%" height="200" viewBox="0 0 400 200" className="max-w-full drop-shadow-sm">
                 <rect x="10" y="10" width="380" height="180" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2"/>
                 {/* Sảnh chờ */}
                 <rect x="30" y="30" width="80" height="140" rx="4" fill="#f1f5f9" stroke="#94a3b8" />
                 <text x="70" y="100" textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="bold">Sảnh Chờ</text>
                 
                 {/* Khám nội */}
                 <rect x="140" y="30" width="100" height="60" rx="4" fill={patientTimeline.some(t => t.title.includes('Khám') && t.status === 'current') ? '#dbeafe' : '#f8fafc'} stroke={patientTimeline.some(t => t.title.includes('Khám') && t.status === 'current') ? '#3b82f6' : '#cbd5e1'} strokeWidth="2" />
                 <text x="190" y="65" textAnchor="middle" fontSize="12" fill="#334155" fontWeight="bold">Khám Nội</text>
                 
                 {/* X-Quang */}
                 <rect x="270" y="30" width="100" height="60" rx="4" fill={patientTimeline.some(t => t.title.includes('X-Quang') && t.status === 'current') ? '#dbeafe' : '#f8fafc'} stroke={patientTimeline.some(t => t.title.includes('X-Quang') && t.status === 'current') ? '#3b82f6' : '#cbd5e1'} strokeWidth="2" />
                 <text x="320" y="65" textAnchor="middle" fontSize="12" fill="#334155" fontWeight="bold">X-Quang</text>
                 
                 {/* Siêu âm */}
                 <rect x="140" y="110" width="100" height="60" rx="4" fill={patientTimeline.some(t => t.title.includes('Siêu âm') && t.status === 'current') ? '#dbeafe' : '#f8fafc'} stroke={patientTimeline.some(t => t.title.includes('Siêu âm') && t.status === 'current') ? '#3b82f6' : '#cbd5e1'} strokeWidth="2" />
                 <text x="190" y="145" textAnchor="middle" fontSize="12" fill="#334155" fontWeight="bold">Siêu Âm</text>
                 
                 {/* Xét nghiệm */}
                 <rect x="270" y="110" width="100" height="60" rx="4" fill={patientTimeline.some(t => t.title.includes('Sinh hóa') && t.status === 'current') ? '#dbeafe' : '#f8fafc'} stroke={patientTimeline.some(t => t.title.includes('Sinh hóa') && t.status === 'current') ? '#3b82f6' : '#cbd5e1'} strokeWidth="2" />
                 <text x="320" y="145" textAnchor="middle" fontSize="12" fill="#334155" fontWeight="bold">Xét Nghiệm</text>

                 {/* Current Point Dot */}
                 {(() => {
                   const currentStep = patientTimeline.find(t => t.status === 'current');
                   let cx = 70; // Default: Sảnh Chờ
                   let cy = 100;
                   if (currentStep) {
                     if (currentStep.title.includes('Khám')) { cx = 190; cy = 60; }
                     else if (currentStep.title.includes('X-Quang')) { cx = 320; cy = 60; }
                     else if (currentStep.title.includes('Siêu âm')) { cx = 190; cy = 140; }
                     else if (currentStep.title.includes('Sinh hóa') || currentStep.title.includes('Xét nghiệm')) { cx = 320; cy = 140; }
                   }
                   return (
                     <g>
                       <circle cx={cx} cy={cy} r="8" fill="#3b82f6" className="animate-ping" />
                       <circle cx={cx} cy={cy} r="5" fill="#2563eb" />
                     </g>
                   );
                 })()}
              </svg>
           </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-slate-800 font-bold flex items-center gap-2 text-xl">
            <FileText className="text-blue-500" /> Chỉ định Lâm sàng
          </h3>
          <span className="text-xs bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock size={12} /> Tiết kiệm 45p
          </span>
        </div>
        
        <div className="relative border-l-[3px] border-slate-200 ml-4 space-y-10">
          {(patientTimeline || []).map((item, index) => (
            <div key={index} className="relative pl-8">
              {/* Dot */}
              <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 bg-white
                ${item.status === 'completed' ? 'border-green-500 bg-green-500' : 
                  item.status === 'current' ? 'border-blue-500 bg-blue-100 animate-pulse' : 
                  'border-slate-300'}`}
              >
                {item.status === 'completed' && <CheckCircle2 size={12} className="text-white absolute -top-0.5 -left-0.5" />}
              </div>
              
              {/* Card */}
              <div className={`p-5 rounded-xl shadow-sm border transition-all duration-300 relative overflow-hidden
                ${item.status === 'current' ? 'bg-white border-blue-300 shadow-blue-100/50 scale-105 transform origin-left md:scale-100 md:-translate-y-1' : 
                  item.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-90' : 
                  'bg-white border-slate-200 opacity-70'}`}
              >
                {item.status === 'current' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                
                <div className="flex justify-between items-start">
                  <h4 className={`font-bold text-lg ${item.status === 'current' ? 'text-blue-700' : 'text-slate-800'}`}>
                    {item.title}
                  </h4>
                  {item.isOptimal && item.status !== 'completed' && (
                    <span className="text-[10px] text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded font-bold">Lựa chọn Tối ưu nhất</span>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className={`text-sm md:text-base font-medium flex items-center gap-2 ${item.status === 'current' ? 'text-blue-600' : 'text-slate-500'}`}>
                    <Clock size={16} /> 
                    <span className="font-bold">Ước tính chờ:</span> {item.time}
                  </p>
                  
                  {/* Điều kiện tiên quyết (Fasting requirement) */}
                  {item.title.toLowerCase().includes('máu') && (
                    <p className="text-[11px] font-semibold text-red-600 mt-2 bg-red-50 border border-red-100 inline-block px-2 py-1 rounded">
                      ⚠ Cảnh báo lâm sàng: Yêu cầu nhịn ăn 8 tiếng trước khi lấy mẫu
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 flex justify-around text-slate-400 z-40 md:hidden">
        <button className="flex flex-col items-center p-2 text-blue-600"><Activity size={24} /><span className="text-[10px] font-bold mt-1">Lộ trình</span></button>
        <button className="flex flex-col items-center p-2 hover:text-slate-600 transition-colors"><FileText size={24} /><span className="text-[10px] font-bold mt-1">Kết quả</span></button>
        <button className="flex flex-col items-center p-2 hover:text-slate-600 transition-colors"><UserPlus size={24} /><span className="text-[10px] font-bold mt-1">Tài khoản</span></button>
      </div>

      <ChatbotWidget patientCode={patientCode} />
    </div>
  );
}
