import { useState, useEffect } from 'react';

function App() {
  const [events, setEvents] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to Golang WebSocket Server
    const socket = new WebSocket('ws://localhost:8080/ws');
    
    socket.onopen = () => {
      console.log('Connected to CareFlow WebSocket');
    };

    socket.onmessage = (event) => {
      console.log('Received:', event.data);
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => [data, ...prev]);
        
        // Play AI generated audio if available
        if (data.audio_url) {
           const audio = new Audio(data.audio_url);
           audio.play().catch(e => console.error("Audio play failed:", e));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const triggerEvent = async (type, message) => {
    try {
      await fetch('http://localhost:8080/api/events/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, message }),
      });
    } catch (error) {
      console.error('Failed to trigger event', error);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-blue-800">CareFlow AI Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time Patient Journey Orchestrator</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Simulation Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Control Panel (Simulation)</h2>
          <p className="text-sm text-gray-500 mb-6">Trigger events to see real-time AI adjustments.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => triggerEvent('NORMAL', 'Bệnh nhân Nguyễn Văn A đã check-in thành công.')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              [+] Check-in Bệnh nhân mới
            </button>
            
            <button 
              onClick={() => triggerEvent('ALERT', 'SỰ CỐ: Phòng Siêu Âm số 2 báo lỗi thiết bị!')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded transition-colors shadow-lg animate-pulse"
            >
              [!] BÁO CÁO HỎNG MÁY SIÊU ÂM
            </button>
            
            <button 
              onClick={() => triggerEvent('INFO', 'AI Đang điều phối lại: Chuyển bệnh nhân A sang phòng X-Quang.')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              [*] Chạy luồng tối ưu hóa lại (Re-sequence)
            </button>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500 overflow-hidden flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
            <span className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-ping"></span>
            Live Event Stream
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 h-96">
            {events.length === 0 ? (
              <p className="text-gray-400 italic">Waiting for events...</p>
            ) : (
              events.map((ev, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-md border-l-4 ${
                    ev.type === 'ALERT' ? 'bg-red-900 border-red-500 text-red-100' :
                    ev.type === 'INFO' ? 'bg-yellow-900 border-yellow-500 text-yellow-100' :
                    'bg-gray-700 border-blue-400 text-blue-100'
                  } transition-all duration-300 ease-in-out transform hover:scale-105`}
                >
                  <span className="text-xs font-bold uppercase block mb-1 opacity-70">
                    [{ev.type}] {new Date().toLocaleTimeString()}
                  </span>
                  <p className="text-sm font-medium">{ev.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
