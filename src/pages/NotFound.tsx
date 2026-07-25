/**
 * NotFound - 404 页面
 * 设计：与抖音暗黑风格保持一致
 */
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="w-full max-w-lg mx-4 text-center px-6">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{ background: "rgba(254,44,85,0.15)" }}
            />
            <AlertCircle
              className="relative h-16 w-16"
              style={{ color: "#FE2C55" }}
            />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-2">404</h1>

        <h2 className="text-xl font-semibold text-white mb-4" style={{ opacity: 0.85 }}>
          页面走丢了
        </h2>

        <p className="mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          你要找的页面不存在，<br />
          可能已经被移除或链接有误。
        </p>

        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all hover:opacity-90"
          style={{ background: "#FE2C55", color: "#fff" }}
        >
          <Home className="w-4 h-4" />
          回到首页
        </button>
      </div>
    </div>
  );
}
