import { useNavigate } from 'react-router-dom';

export default function UnderConstruction() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <img
          src="/assets/under-construction.png"
          alt="Under Construction"
          className="w-full max-w-md mx-auto mb-8"
        />
        <h1 className="text-3xl font-bold text-white mb-4">
          CPAP / BiPAP Module
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          This module is currently under construction. Please check back soon.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
