import React from 'react';
import Dashboard from './Dashboard';
import DoctorDashboard from './DoctorDashboard';
import PatientApp from './PatientApp';

export default function DemoHub() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      
      {/* Header */}
      <div className="bg-slate-900 text-white py-4 px-6 border-b border-slate-700 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            CareFlow <span className="text-blue-500">AI</span>
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold ml-2 animate-pulse">Live Demo Mode</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time Event-Driven Coordination Engine</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm">Active Scenario: <strong className="text-blue-400">BN-0005 Smart Routing</strong></p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 overflow-hidden">
        
        {/* Column 1: Nurse Station */}
        <div className="border-r border-slate-700 flex flex-col overflow-hidden bg-slate-100">
          <div className="bg-teal-700 text-white py-2 px-4 shrink-0 shadow-md z-10 flex justify-between items-center">
            <h2 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Nurse Station (Coordinator)
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto relative custom-scrollbar">
            <div className="origin-top-left w-full h-full">
              <Dashboard />
            </div>
          </div>
        </div>

        {/* Column 2: Doctor Workstation */}
        <div className="border-r border-slate-700 flex flex-col overflow-hidden bg-slate-100">
          <div className="bg-indigo-700 text-white py-2 px-4 shrink-0 shadow-md z-10 flex justify-between items-center">
            <h2 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Doctor Workstation
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto relative custom-scrollbar">
            <div className="origin-top-left w-full h-full">
              <DoctorDashboard />
            </div>
          </div>
        </div>

        {/* Column 3: Patient App */}
        <div className="flex flex-col overflow-hidden bg-slate-200 items-center">
          <div className="bg-blue-700 text-white py-2 px-4 w-full shrink-0 shadow-md z-10 flex justify-between items-center">
            <h2 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Patient Mobile App
            </h2>
          </div>
          {/* Mobile frame wrapper */}
          <div className="flex-1 overflow-y-auto w-full flex justify-center py-6 custom-scrollbar">
            <div className="w-[375px] h-[812px] bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative flex-shrink-0 ring-4 ring-slate-900/10">
              {/* Fake iPhone notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-50"></div>
              
              <div className="w-full h-full overflow-y-auto overflow-x-hidden hide-scrollbar bg-slate-50">
                <PatientApp />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
