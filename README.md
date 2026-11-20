# Blockchain Agricultural Product Traceability

Smart contract สำหรับบันทึกและตรวจสอบย้อนกลับสินค้าเกษตรบน Ethereum

## Features
- Admin ลงทะเบียนและเปิด/ปิดสิทธิ์ผู้เกี่ยวข้อง
- Farmer ลงทะเบียนสินค้าเป็นล็อต (Product Batch)
- เจ้าของปัจจุบันส่งมอบสินค้าให้ผู้เกี่ยวข้องรายถัดไป
- เจ้าของปัจจุบันอัปเดตสถานะสินค้า
- ตรวจสอบข้อมูลสินค้าและประวัติการดำเนินการ
- Admin เรียกคืนสินค้าที่มีปัญหา (Product Recall)

## Roles
- `Farmer`
- `Transporter`
- `Distributor`
- `Retailer`
- `Inspector`

ค่า Role สำหรับเรียกฟังก์ชัน `registerStakeholder`:
- None = 0
- Farmer = 1
- Transporter = 2
- Distributor = 3
- Retailer = 4
- Inspector = 5

## Product statuses
- Registered = 0
- Harvested = 1
- InTransit = 2
- AtWarehouse = 3
- AtRetailer = 4
- Recalled = 5

## Deploy with Remix
1. เปิด https://remix.ethereum.org/
2. สร้างไฟล์ `AgriculturalTraceability.sol` แล้ววางโค้ดจาก `contracts/AgriculturalTraceability.sol`
3. เลือก Compiler เวอร์ชัน `0.8.26` หรือ compatible `0.8.x` แล้ว Compile
4. ทดลองใน Remix VM หรือเลือก Injected Provider เพื่อเชื่อม MetaMask กับ Sepolia
5. Deploy contract โดยบัญชีผู้ดูแลระบบ (Admin)

## Basic usage
1. Admin เรียก `registerStakeholder` เพื่อเพิ่ม address และ role
2. Farmer เรียก `registerProductBatch` เพื่อสร้างล็อตสินค้า
3. เจ้าของปัจจุบันเรียก `transferCustody` เพื่อส่งมอบให้ address ถัดไป
4. เจ้าของปัจจุบันเรียก `updateProductStatus` เพื่อเปลี่ยนสถานะ
5. ทุกคนเรียก `getProduct` และ `getProductHistory` เพื่อดูข้อมูล
6. Admin เรียก `recallProduct` เมื่อพบปัญหาสินค้า

## QR Code note
Smart contract นี้ใช้ `batchId` เป็นรหัสอ้างอิงสำหรับ QR Code เช่น `1`, `2`, `3` ... การสร้างภาพ QR Code และหน้าเว็บสำหรับสแกนเป็นส่วนของ Frontend ซึ่งสามารถพัฒนาต่อยอดได้

## Important
- ฟังก์ชันที่เขียนข้อมูลบน Blockchain ต้องใช้ gas
- การ deploy บน Sepolia ต้องมี Sepolia ETH สำหรับ gas
- ข้อมูลบน Blockchain เป็นข้อมูลสาธารณะ ไม่ควรบันทึกข้อมูลส่วนบุคคลหรือข้อมูลลับ
- โค้ดนี้เป็นต้นแบบเพื่อการศึกษา ควรทดสอบทุกกรณีก่อนใช้งานจริง
