/** @format */

import dbConnect from "@/db";
import QRCodeModel from "@/models/qrcode.mode";
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextResponse, response: NextResponse) {
  const { searchParams } = new URL(request.url);
  const code1 = searchParams.get("uniqueId");
  //   console.log("code1", code1);
  const code =
    "QR-96ec529591d86bf8aac7b51174b4a0662cdc0f3807a6df50980a81f9821a9b69-BATCH-8L0JRWM5-VEN-FER-941";

  try {
    await dbConnect();
    const qrCodeData = await QRCodeModel.findOne({ uniqueId: code });
    if (!qrCodeData) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }
    const productId = qrCodeData.batchId;
    const productData = await axios.get(
      `${process.env.UDM_URL}/api/v1/components/${productId}`
    );
    if (!productData) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (productData.data?.vendor) {
      delete productData.data.vendor._id; // remove _id from vendor
    }
    // console.log(productData.data);

    return NextResponse.json({ productData: productData.data });
  } catch (error) {
    console.error("Error fetching QR code details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
