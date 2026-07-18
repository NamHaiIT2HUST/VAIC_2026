import { useState, useEffect } from 'react';
import { Activity, FileText, UserPlus, CheckCircle2, Zap, Clock } from 'lucide-react';
import ChatbotWidget from '../components/ChatbotWidget';

export default function PatientApp() {
  const [patient, setPatient] = useState(null);
  const [patientTimeline, setPatientTimeline] = useState([]);
  const [aiMessage, setAiMessage] = useState('AI CareFlow đã tối ưu lộ trình: Bạn sẽ chụp X-Quang trong lúc chờ kết quả máu để tiết kiệm 45 phút chờ đợi.');

  useEffect(() => {
    const fetchPathway = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/patients/BN-0005/pathway');
        const data = await res.json();
        setPatient(data.patient || null);
        setPatientTimeline(Array.isArray(data.timeline) ? data.timeline : []);
      } catch (err) {
        console.error("Failed to fetch pathway", err);
      }
    };
    fetchPathway();

    const socket = new WebSocket('ws://localhost:8080/ws');
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ALERT') {
          setAiMessage('⚠ Máy X-Quang số 2 gặp sự cố. AI đang tự động tính toán lại lộ trình của bạn để tránh ùn tắc...');
          setTimeout(() => {
            setAiMessage('⚡ AI CareFlow đã sắp xếp lại: Mời bạn đi Siêu âm trước để tránh ùn tắc tại phòng X-Quang. Tiết kiệm 30 phút.');
            fetchPathway(); // Refetch updated timeline from Go DB
          }, 3000);
        } else if (data.type === 'WORKFLOW_UPDATED') {
          setAiMessage('⚡ Bác sĩ vừa chỉ định dịch vụ mới. AI CareFlow đã tính toán lộ trình tối ưu nhất cho bạn.');
          fetchPathway();
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
              <h2 className="text-2xl font-bold opacity-90">{patient?.name || 'Đang tải...'}</h2>
              <p className="text-blue-100 text-sm mt-1">Mã BN: {patient?.patient_code || 'BN-...'} | {patient?.gender || 'N/A'}, {patient?.age || '--'} tuổi</p>
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
              <p className="font-bold text-xl md:text-2xl">{(patientTimeline || []).find(t => t.status === 'current')?.title || 'Hoàn thành'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Optimization Banner */}
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 mt-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm flex gap-4 items-start">
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
                  'bg-white border-slate-100 border-dashed opacity-60'}`}
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

      <ChatbotWidget />
    </div>
  );
}
