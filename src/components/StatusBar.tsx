/**
 * StatusBar - 模拟手机状态栏
 * 显示时间、信号、WiFi、电量
 */
import { useState, useEffect } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);
    };
    update();
    const t = setInterval(update, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{ height: '44px', paddingTop: '8px' }}
    >
      {/* 时间 */}
      <span className="text-white font-semibold" style={{ fontSize: '15px', letterSpacing: '-0.3px' }}>
        {time}
      </span>

      {/* 右侧图标 */}
      <div className="flex items-center gap-1.5">
        {/* 信号 */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
          <rect x="0" y="6" width="3" height="6" rx="0.5" />
          <rect x="4.5" y="4" width="3" height="8" rx="0.5" />
          <rect x="9" y="2" width="3" height="10" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>

        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
          <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
          <path d="M3.5 6.5a6.5 6.5 0 0 1 9 0" strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" />
          <path d="M1 4a10 10 0 0 1 14 0" strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" />
        </svg>

        {/* 电量 */}
        <div className="flex items-center gap-0.5">
          <div
            className="relative rounded-sm overflow-hidden"
            style={{ width: '24px', height: '12px', border: '1px solid rgba(255,255,255,0.6)' }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{ width: '80%', background: 'white', margin: '1px' }}
            />
          </div>
          <div className="rounded-r-sm" style={{ width: '2px', height: '6px', background: 'rgba(255,255,255,0.6)' }} />
        </div>
      </div>
    </div>
  );
}
