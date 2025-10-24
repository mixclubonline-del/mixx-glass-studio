// import { useState } from "react";

const BloomDemo = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Bloom Demo</h1>
        <p className="text-gray-300 mb-8">
          Bloom interface coming soon...
        </p>
        <button
          onClick={() => window.history.back()}
          className="border border-gray-600 text-gray-300 px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default BloomDemo;
