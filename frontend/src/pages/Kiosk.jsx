import { useState } from 'react';
import { UserPlus, Activity, CheckCircle2, Clock } from 'lucide-react';

export default function Kiosk() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'Nam',
    date_of_birth: '1990-01-01',
    phone: '',
    symptom: '',
    priority: 'Normal'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/appointments/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối Server');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
          <h1 className="text-3xl font-black mb-2 relative z-10 flex items-center justify-center gap-3">
            <Activity /> Smart Kiosk <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">CareFlow AI</span>
          </h1>
          <p className="text-blue-100 relative z-10">Hệ thống phân luồng & đặt lịch thông minh</p>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Thông tin Cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên</label>
                  <input type="text" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="VD: Nguyễn Văn A" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Giới tính</label>
                    <select className="w-full border border-slate-300 rounded-xl px-4 py-3" 
                      value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Nam</option>
                      <option>Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Năm sinh</label>
                    <input type="date" className="w-full border border-slate-300 rounded-xl px-4 py-3" 
                      value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input type="tel" className="w-full border border-slate-300 rounded-xl px-4 py-3" 
                    placeholder="098..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white font-bold rounded-xl py-4 mt-6 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Đánh giá Triệu chứng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả triệu chứng hiện tại</label>
                  <textarea rows="3" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="VD: Đau bụng dữ dội, buồn nôn..." value={formData.symptom} onChange={e => setFormData({...formData, symptom: e.target.value})}></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Mức độ Khẩn cấp</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, priority: 'Normal'})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${formData.priority === 'Normal' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <h4 className={`font-bold ${formData.priority === 'Normal' ? 'text-blue-700' : 'text-slate-700'}`}>Khám Thường</h4>
                      <p className="text-xs text-slate-500 mt-1">Phân bổ theo lịch trống của AI để tránh chờ lâu.</p>
                    </button>
                    
                    <button 
                      onClick={() => setFormData({...formData, priority: 'Emergency'})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${formData.priority === 'Emergency' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <h4 className={`font-bold ${formData.priority === 'Emergency' ? 'text-red-700' : 'text-slate-700'}`}>Cấp Cứu VIP</h4>
                      <p className="text-xs text-slate-500 mt-1">Ưu tiên chèn ngang lên đầu hàng đợi ngay lập tức.</p>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setStep(1)} className="w-1/3 bg-slate-100 text-slate-600 font-bold rounded-xl py-4 hover:bg-slate-200 transition-colors">
                    Quay lại
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="w-2/3 bg-blue-600 text-white font-bold rounded-xl py-4 hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2">
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : <UserPlus size={20} />}
                    Check-in & Lấy Số
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="text-center animate-in zoom-in duration-500 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Check-in Thành công!</h2>
              <p className="text-slate-500 mb-8">{result.message}</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto text-left space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Mã Bệnh nhân</span>
                  <span className="text-xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-lg">{result.patient_code}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1"><Clock size={16}/> Giờ khám dự kiến</span>
                  <span className="text-lg font-bold text-slate-800">{result.appointment_time}</span>
                </div>
              </div>
              
              <p className="text-sm text-amber-600 bg-amber-50 inline-block px-4 py-2 rounded-full mt-6 font-medium">
                Vui lòng theo dõi ứng dụng CareFlow để nhận thông báo vào phòng khám.
              </p>
              
              <button onClick={() => { setStep(1); setFormData({...formData, full_name: ''}); setResult(null); }} className="w-full bg-slate-900 text-white font-bold rounded-xl py-4 mt-8 hover:bg-slate-800 transition-colors shadow-lg">
                Về Trang chủ Kiosk
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
