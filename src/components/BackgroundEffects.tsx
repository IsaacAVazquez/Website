"use client";

export function BackgroundEffects() {
  return (
    <>
      {/* Animated Background Gradients */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-teal-400/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-[-8%] right-[-12%] w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-[60%] left-[40%] w-[120px] h-[120px] bg-yellow-200/20 rounded-full blur-2xl animate-pulse" />
      </div>
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1);}
          50% { transform: translateY(-24px) scale(1.08);}
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) scale(1);}
          50% { transform: translateY(24px) scale(0.96);}
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 16s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeIn {
          animation: fadeIn 1.3s cubic-bezier(0.4,0.0,0.2,1) 0.1s both;
        }
      `}</style>
    </>
  );
}
