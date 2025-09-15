/** @format */

import dbConnect from "@/db";
import QRCodeModel from "@/models/qrcode.mode";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { formData, decodedText } = await request.json();
    const { isPrinted } = formData;
    if (!decodedText)
      return NextResponse.json(
        { error: "Decoded Text is required" },
        { status: 400 }
      );
    await dbConnect();
    const qrCodeRecord = await QRCodeModel.findOne({ uniqueId: decodedText });
    if (!qrCodeRecord) {
      return NextResponse.json(
        { error: "QR Code record not found" },
        { status: 404 }
      );
    }
    qrCodeRecord.isQRPrinted = isPrinted;
    await qrCodeRecord.save();

    return NextResponse.json(
      { message: "QR Code print status updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating QR Code print status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
