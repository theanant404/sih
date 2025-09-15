/** @format */

"use client";

import { useState } from "react";
import Html5QrcodePlugin from "@/components/Html5QrcodePlugin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function App() {
  const [decodedResults, setDecodedResults] = useState([]);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  const onNewScanResult = async (decodedText, decodedResult) => {
    // console.log("Scanned:", decodedText, decodedResult);
    setDecodedResults((prev) => [...prev, decodedResult]);
    setScanning(false);

    try {
      // Example API call (replace with your endpoint)
      const res = await fetch(
        `/api/show-component-details?uniqueId=${decodedText}`
      );
      if (!res.ok) throw new Error("Failed to fetch data from API");
      const data = await res.json();
      // console.log("data", data);
      if (!data.productData)
        throw new Error("No product details found for this QR code");
      const {
        batchId,
        componentType,
        quantity,
        manufacturedDate,
        warrantyInYears,
        createdAt,
        vendor,
      } = data.productData;
      if (
        !batchId ||
        !componentType ||
        !quantity ||
        !manufacturedDate ||
        !warrantyInYears ||
        !createdAt ||
        !vendor
      ) {
        throw new Error("Incomplete product details received from API");
      }
      setApiResponse({
        batchId,
        componentType,
        quantity,
        manufacturedDate,
        warrantyInYears,
        createdAt,
        vendor,
      });
    } catch (err) {
      setError(err.message);
    }
  };
  // console.log("apiResponse", apiResponse);
  const handleScanAgain = () => {
    setDecodedResults([]);
    setApiResponse(null);
    setError(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <div className=" shadow-2xl rounded-2xl p-6 w-full max-w-2xl text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-300">
          QR Code Scanner
        </h1>

        {scanning ? (
          <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
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
            {apiResponse && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Batch Info */}
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">
                        Batch Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Batch ID: </span>
                        <Badge variant="outline">{apiResponse.batchId}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Component Type: </span>
                        {apiResponse.componentType}
                      </div>
                      <div>
                        <span className="font-medium">Quantity: </span>
                        {apiResponse.quantity.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Manufactured Date: </span>
                        {new Date(
                          apiResponse.manufacturedDate
                        ).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Warranty: </span>
                        {apiResponse.warrantyInYears} Years
                      </div>
                      <div>
                        <span className="font-medium">Created At: </span>
                        {new Date(apiResponse.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vendor Info */}
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">
                        Vendor Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Name: </span>
                        {apiResponse.vendor.name}
                      </div>
                      <div>
                        <span className="font-medium">Vendor Code: </span>
                        <Badge>{apiResponse.vendor.vendorCode}</Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-muted-foreground" />
                        {apiResponse.vendor.contact.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-muted-foreground" />
                        {apiResponse.vendor.contact.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-500" />
                        {apiResponse.vendor.performanceRating} / 5
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow mb-4">
                <h2 className="font-semibold">Error:</h2>
                <p className="mt-1">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
