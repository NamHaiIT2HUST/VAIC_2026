import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export default function ChatbotWidget({ patientCode = 'BN-0005' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Chào bạn, mình là Trợ lý ảo AI của CareFlow. Bạn cần hỏi gì về quy trình khám bệnh hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const botMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botMsgId, type: 'bot', text: '' }]);

    try {
      const aiUrl = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
      const res = await fetch(`${aiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.text,
          patient_id: patientCode,
          required_services: [] 
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botResponse += decoder.decode(value, { stream: true });
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, text: botResponse } : msg
        ));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: 'Lỗi kết nối tới AI Engine.' } : msg
      ));
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[90vw] md:w-80 h-[60vh] md:h-96 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="font-bold text-sm">Trợ lý ảo RAG</h3>
                <p className="text-[10px] text-blue-200">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2.5 rounded-lg text-sm shadow-sm ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi..." 
              className="flex-1 border border-slate-300 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button 
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-4 border-blue-100"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
