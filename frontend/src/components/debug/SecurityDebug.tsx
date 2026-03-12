/**
 * CRITICAL SECURITY DEBUG COMPONENT - TEMPORARY
 * This component will be removed after fixing the security issue
 */

import React, { useState, useEffect } from 'react';

interface DebugLog {
  timestamp: string;
  type: 'AUTH' | 'API_REQUEST' | 'API_RESPONSE';
  data: any;
}

class SecurityDebugger {
  private static instance: SecurityDebugger;
  private logs: DebugLog[] = [];
  private listeners: ((logs: DebugLog[]) => void)[] = [];

  static getInstance(): SecurityDebugger {
    if (!SecurityDebugger.instance) {
      SecurityDebugger.instance = new SecurityDebugger();
    }
    return SecurityDebugger.instance;
  }

  addLog(type: DebugLog['type'], data: any) {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      type,
      data
    };
    this.logs.push(log);
    
    // Keep only last 20 logs
    if (this.logs.length > 20) {
      this.logs = this.logs.slice(-20);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const securityDebugger = SecurityDebugger.getInstance();

export const SecurityDebug: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = securityDebugger.subscribe(setLogs);
    setLogs(securityDebugger.getLogs());
    return unsubscribe;
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg font-mono text-sm"
        >
          🚨 Debug ({logs.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 border border-red-500 rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between p-3 border-b border-red-500">
        <h3 className="text-red-400 font-bold text-sm">🚨 Security Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={() => securityDebugger.clear()}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
          >
            Hide
          </button>
        </div>
      </div>
      
      <div className="p-3 max-h-80 overflow-auto">
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm">No debug logs yet...</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    log.type === 'AUTH' ? 'bg-blue-600 text-white' :
                    log.type === 'API_REQUEST' ? 'bg-yellow-600 text-white' :
                    'bg-green-600 text-white'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre className="bg-black/50 p-2 rounded text-white overflow-auto max-h-32">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};