"use client";

import { useState } from "react";
import Html5QrcodePlugin from "@/components/Html5QrcodePlugin"; // adjust import
import { Button } from "@/components/ui/button";
const App = () => {
  const [decodedResults, setDecodedResults] = useState<any[]>([]);
  const [apiResponse, setApiResponse] = useState<{ status: 'idle' | 'Unique' | 'Used' | 'Booked' | 'Error'; details?: any }>({ status: 'idle', details: null });
  const [formData, setFormData] = useState({
    batchId: "",
    vendorId: "",
    isPrinted: false,
    verify: false,
  });
  const [scanning, setScanning] = useState(true);
  const [decodedText, setDecodedText] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);


  // Handle QR Scan
  const onNewScanResult = async (decodedText: string) => {
    // console.log("Scanned Code:", decodedText);
    setScanning(false);
    setDecodedText(decodedText);
    try {
      setStatus("loading");
      const res = await fetch(`/api/verify-qr-code?code=${decodedText}`);
      const data = await res.json();
      const status = res.statusText as 'Unique' | 'Used' | 'Booked' | 'Error';

      if (status === 'Error') throw new Error(data.message || 'Unknown error');
      setApiResponse({ status, details: data });
      setStatus("idle");
    } catch (err) {
      console.error("API Error:", err);
      setApiResponse({ status: "Error" });
      setStatus("error");
    }
  };
  const handleScanAgain = () => {
    setDecodedResults([]);
    setApiResponse({ status: 'idle', details: null });
    setError(null);
    setScanning(true);
  };
  // Handle Form Submission
  const handleSubmitCreateNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus("loading");
      const response = await fetch("/api/qrcode-unique-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData, decodedText }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("success");
        alert("✅ New record created successfully");
      } else {
        setStatus("error");
        console.error("Creation error:", data);
      }
    } catch (err) {
      setStatus("error");
      console.error("Creation error:", err);
      alert("❌ Failed to create record");
    }
  };
  const handleSubmitChangePrintStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus("loading");
      const response = await fetch("/api/change-print-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData, decodedText }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("success");
        alert("✅ Print status updated successfully");
      } else {
        setStatus("error");
        console.error("Update error:", data);
      }
    } catch (err) {
      setStatus("error");
      console.error("Update error:", err);
      alert("❌ Failed to update print status");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <div className=" shadow-2xl rounded-2xl p-6 w-full max-w-2xl text-center">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            QR Scanner & Verification
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Scan QR → Check status → Verify or Save
          </p>
        </div>
        {scanning ? (
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <Html5QrcodePlugin
              fps={10}
              qrbox={250}
              disableFlip={false}
              qrCodeSuccessCallback={onNewScanResult}
            />
          </div>
        ) : (
          <>
            <Button
              onClick={handleScanAgain}
              className="mt-4 px-6 py-2 mb-10 bg-green-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Scan Again
            </Button>
            {apiResponse?.status === "Unique" && (
              <form
                onSubmit={handleSubmitCreateNewRecord}
                className="bg-white p-6 rounded-2xl shadow-lg space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  🚨 Record Not Found
                </h2>
                <p className="text-sm text-gray-600">
                  Please enter details to create a new record.
                </p>

                <div>
                  <label className="block font-medium text-gray-700">
                    Batch ID *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.batchId}
                    onChange={(e) =>
                      setFormData({ ...formData, batchId: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700">
                    Vendor ID (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.vendorId}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorId: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrinted}
                    onChange={(e) =>
                      setFormData({ ...formData, isPrinted: e.target.checked })
                    }

                  />
                  <span className="text-gray-700">Is Printed</span>
                </div>

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 transition"
                >
                  {status === "loading" ? "Saving..." : "Save Record"}
                </Button>
              </form>
            )}

            {apiResponse?.status === "Booked" && (
              <form
                onSubmit={handleSubmitChangePrintStatus}
                className="bg-white p-6 rounded-2xl shadow-lg space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  ⚠️ Record Found (Unverified)
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.verify}
                    onChange={(e) =>
                      setFormData({ ...formData, verify: e.target.checked })
                    }
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-700">Confirm Verification</span>
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 transition"
                >
                  {status === "loading" ? "Saving..." : "Save Verification"}
                </button>
              </form>
            )}

            {apiResponse?.status === "Used" && (
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl shadow">
                <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                  ✅ Already Verified
                </h2>
                <p className="text-gray-600 mt-2">
                  Batch ID:{" "}
                  {/* <span className="font-semibold">{details.message}</span> is */}
                  already verified.
                </p>
              </div>
            )}
          </>
        )}


        {/* API Response Handling */}

      </div>
    </div>
  );
};

export default App;
