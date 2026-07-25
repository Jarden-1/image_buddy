/**
 * DouyinNav - 抖音底部导航栏
 * 设计：5个tab，中间"+"按钮为珊瑚红，模仿抖音原版
 */
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';

export default function DouyinNav() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2"
      style={{
        height: '56px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 100%)',
        paddingBottom: '4px',
      }}
    >
      {/* 首页 */}
      <button className="flex flex-col items-center gap-0.5 px-3">
        <Home size={22} color="white" strokeWidth={2} />
        <span className="text-white text-xs font-semibold" style={{ fontSize: '10px' }}>首页</span>
      </button>

      {/* 搜索 */}
      <button className="flex flex-col items-center gap-0.5 px-3">
        <Search size={22} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>搜索</span>
      </button>

      {/* 发布（中间+按钮） */}
      <button className="flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: '44px',
            height: '28px',
            background: 'linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)',
            position: 'relative',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: '#fff',
              margin: '2px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} color="#000" strokeWidth={2.5} />
          </div>
        </div>
      </button>

      {/* 消息 */}
      <button className="flex flex-col items-center gap-0.5 px-3">
        <MessageCircle size={22} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>消息</span>
      </button>

      {/* 我 */}
      <button className="flex flex-col items-center gap-0.5 px-3">
        <User size={22} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>我</span>
      </button>
    </div>
  );
}
