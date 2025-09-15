

import dbConnect from "@/db";
import QRCodeModel from "@/models/qrcode.mode";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";


export async function POST(request: NextRequest) {
    try {
        const { formData, decodedText } = await request.json();
        const { batchId, vendorCode, isPrinted } = formData;
        // console.log(batchId, vendorCode);
        if (!batchId)
            return NextResponse.json(
                { error: "Batch ID is required" },
                { status: 400 }
            );
        await dbConnect();
        const ExistingBatchId = await axios.get(
            `${process.env.UDM_URL}/api/v1/components/${batchId}`
        );
        // console.log(ExistingBatchId);
        if (!ExistingBatchId.data) {
            return NextResponse.json({ error: "Invalid Batch ID" }, { status: 400 });
        }
        const totalQuantityPresentInDatabase = await QRCodeModel.countDocuments({
            batchId,
        });
        if (
            ExistingBatchId.data.quantity &&
            totalQuantityPresentInDatabase >= ExistingBatchId.data.quantity
        ) {
            return NextResponse.json(
                { error: "Quantity limit exceeded" },
                { status: 400 }
            );
        }

        const newQRCode = new QRCodeModel({
            uniqueId: decodedText,
            batchId: batchId,
            vendor: ExistingBatchId.data.vendor._id,
            vendorCode: ExistingBatchId.data.vendor.vendorCode || null,
            managementId: "",
            componentType: ExistingBatchId.data.componentType,
            manufacturedDate: ExistingBatchId.data.manufacturedDate,
            warrantyInYears: ExistingBatchId.data.warrantyInYears,
            expiryDate: ExistingBatchId.data.expiryDate,
            qualityOfComponents: ExistingBatchId.data.qualityOfComponents,
            isQRPrinted: isPrinted,
        });
        await newQRCode.save();

        return NextResponse.json({ message: "QR Code record created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating QR Code record:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
