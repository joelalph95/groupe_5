import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="w-16 h-16 border-4 border-danger border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Loading;