import React from "react";
import toast from "react-hot-toast";

export default function PredictionResult({ prediction, confidence, uploadedImage }) {
  const confidencePercent = Math.round(confidence * 100);
  const notifyStart = (text) =>
    toast.success(text, {
      duration: 2000,
    });


  return (
    <div className="border rounded-xl shadow-md p-6 bg-white space-y-6">
      {uploadedImage && (
        <img
          src={uploadedImage}
          onClick={()=>notifyStart("Result of Your RBC blood Cell")}
          alt="Uploaded RBC"
          className="w-full max-h-64 object-contain border rounded-lg"
        />
      )}
      <div>
        <p className="text-sm text-gray-500">Prediction</p>
        <h2 className="text-2xl font-bold text-gray-800">{prediction}</h2>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">Confidence</p>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full"
            style={{ width: `${confidencePercent}%` }}
          ></div>
        </div>

        <p classname="text-sm font-semibold mt-1">{confidencePercent}%</p>
      </div>
      <p className="text-xs text-gray-500 italic">
        This is an AI-assisted screening tool. Not a medical diagnosis.
      </p>
    </div>
  );
}
