import { useState } from "react";
import PredictionResult from "../components/PredictionResult";
import usePageTitle from "../hooks/usePageTitle";
import toast from "react-hot-toast";

export default function Scan() {
  usePageTitle("Tiny Malaria Scan | Scan");

  const [imageURL, setImageURL] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "https://malaria-backend-gddz.onrender.com/predict",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Server error");
    }

    return res.json();
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size should be under 3MB");
      return;
    }

    setImageURL(URL.createObjectURL(file));
    setLoading(true);
    setResult(null);

    toast.loading("Analyzing RBC image...", { id: "scan" });

    try {
      const data = await analyzeImage(file);
      setResult(data);
      toast.success("Scan completed successfully!", { id: "scan" });
    } catch (err) {
      toast.error(err.message || "Scan failed", { id: "scan" });
      setResult(null);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 
        bg-gradient-to-r from-blue-600 to-teal-500 
        bg-clip-text text-transparent">
        Scan RBC Cell
      </h1>

      <p className="text-gray-500 mb-6 text-sm sm:text-base">
        Upload a microscope image of an RBC cell to detect malaria infection.
      </p>

      <label className="cursor-pointer block border-2 border-dashed 
        border-gray-300 p-8 sm:p-10 text-center rounded-xl 
        hover:border-blue-400 transition">
        <p className="text-gray-600 text-sm sm:text-base">
          Click to upload RBC image
        </p>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

      {loading && (
        <p className="mt-4 text-blue-600 font-medium text-sm">
          Analyzing image…
        </p>
      )}

      {result && imageURL && !loading && (
        <div className="mt-8">
          <PredictionResult
            prediction={result.prediction}
            confidence={result.confidence / 100}
            uploadedImage={imageURL}
          />
        </div>
      )}
    </div>
  );
}
