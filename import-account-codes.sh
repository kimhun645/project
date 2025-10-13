#!/bin/bash

echo "🚀 เริ่ม import ข้อมูล Account Codes ลง Firestore..."

# ตรวจสอบว่า Firebase CLI ติดตั้งแล้วหรือไม่
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI ไม่ได้ติดตั้ง กรุณาติดตั้งด้วย: npm install -g firebase-tools"
    exit 1
fi

# ตรวจสอบว่า login แล้วหรือไม่
if ! firebase projects:list &> /dev/null; then
    echo "🔐 กรุณา login Firebase CLI ก่อน:"
    firebase login
fi

# ตั้งค่า project
echo "📋 ตั้งค่า project: stock-6e930"
firebase use stock-6e930

# Import ข้อมูล
echo "📤 กำลัง import ข้อมูล Account Codes..."
firebase firestore:import add-account-codes.json --collection accountCodes

echo "✅ Import ข้อมูล Account Codes สำเร็จ!"
echo "📊 จำนวนรายการ: $(cat add-account-codes.json | jq '.accountCodes | length')"

echo "🎉 เสร็จสิ้น!"
