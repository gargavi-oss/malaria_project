import { useState } from "react";
import usePageTitle from "../hooks/usePageTitle";
import toast from "react-hot-toast";

export default function Gradcam() {
  usePageTitle("Tiny Malaria Scan | Grad-CAM");

  const [imageURL, setImageURL] = useState(null);
  const [gradcamURL, setGradcamURL] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);

  const analyzeGradcam = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "https://malaria-backend-gddz.onrender.com/gradcam",
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
    setGradcamURL(null);
    setPrediction("");
    setConfidence(0);

    toast.loading("Generating Grad-CAM heatmap...", { id: "gradcam" });

    try {
      const result = await analyzeGradcam(file);

      setPrediction(result.prediction);
      setConfidence(result.confidence);
      setGradcamURL(`data:image/png;base64,${result.gradcam}`);

      toast.success("Grad-CAM generated successfully!", { id: "gradcam" });
    } catch (err) {
      toast.error(err.message || "Failed to generate Grad-CAM", {
        id: "gradcam",
      });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      <h1 className="text-3xl sm:text-4xl font-bold 
        bg-gradient-to-r from-blue-600 to-teal-500 
        text-transparent bg-clip-text">
        Grad-CAM Heatmap Viewer
      </h1>

      <p className="text-gray-600 text-sm sm:text-base">
        Visualize where the neural network focuses while detecting malaria parasites.
      </p>

      <label className="cursor-pointer block border-2 border-dashed 
        border-gray-300 p-8 sm:p-10 text-center rounded-xl 
        hover:border-blue-400 transition">
        <p className="text-gray-600 text-sm sm:text-base">
          Click to upload microscope image
        </p>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

      {loading && (
        <p className="text-blue-600 font-medium text-sm">
          Generating heatmap…
        </p>
      )}

      {!loading && prediction && gradcamURL && (
        <div className="border rounded-xl shadow-lg p-5 sm:p-6 bg-white space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-sm text-gray-500 mb-1">Original Image</p>
              <img
                src={imageURL}
                alt="Uploaded RBC"
                className="rounded-lg border w-full max-h-72 object-contain"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Grad-CAM Heatmap</p>
              <img
                src={gradcamURL}
                alt="Grad-CAM Heatmap"
                className="rounded-lg border w-full max-h-72 object-contain"
              />
            </div>

          </div>
          <div>
            <p className="text-sm text-gray-500">Prediction</p>
            <h2 className="text-xl sm:text-2xl font-bold">{prediction}</h2>
          </div>

          <div>
            <p className="text-sm text-gray-500">Confidence</p>
            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <p className="mt-1 font-semibold">{confidence}%</p>
          </div>

        </div>
      )}
    </div>
  );
}
