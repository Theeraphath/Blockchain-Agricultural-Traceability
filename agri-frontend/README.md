# GreenFarm Agricultural Traceability Frontend

Frontend ภาษาไทยสำหรับ Smart Contract `AgriculturalTraceability` ใน `contracts/AgriculturalTraceability.sol` ของ repository Blockchain-Agricultural-Traceability

## ไฟล์
- `index.html` โครงสร้างหน้าเว็บ
- `style.css` รูปแบบและ responsive layout
- `app.js` เชื่อม MetaMask และเรียก Smart Contract ด้วย ethers.js v6

## วิธีใช้งาน
1. เปิด `app.js` แล้วแก้ `CONTRACT_ADDRESS` ให้เป็น address ของ Smart Contract ที่ Deploy บน Sepolia แล้ว
2. เปิดโฟลเดอร์นี้ด้วย VS Code
3. แนะนำให้ใช้ส่วนขยาย **Live Server** แล้วคลิกขวา `index.html` → **Open with Live Server**
4. ติดตั้ง/เปิด MetaMask และเลือกเครือข่าย Sepolia
5. กด **เชื่อมต่อ MetaMask** แล้วอนุมัติการเชื่อมต่อ
6. ทดลองใช้งานเมนูต่าง ๆ โดยบัญชีต้องมี role ตามเงื่อนไขใน Smart Contract

## ข้อกำหนดจาก Smart Contract
- Admin คือ address ที่ deploy contract ใช้ลงทะเบียน Stakeholder และ Recall สินค้า
- Farmer ที่ active เท่านั้นที่ลงทะเบียน Product Batch ได้
- การส่งมอบและอัปเดตสถานะทำได้โดย Stakeholder ที่ active และเป็นเจ้าของปัจจุบัน
- ผู้รับสินค้าต้องเป็น Stakeholder ที่ active อยู่แล้ว
- การอ่านข้อมูลสินค้าและประวัติเป็น public

## หมายเหตุ
- หน้าเว็บนี้เรียกใช้งานฟังก์ชันที่มีอยู่จริงใน ABI ของ contract ปัจจุบัน
- Contract ปัจจุบันไม่มีฟังก์ชันดึงรายชื่อ Stakeholder ทั้งหมด จึงไม่สามารถแสดงจำนวนผู้เกี่ยวข้องทั้งหมดโดยอัตโนมัติใน Dashboard ได้ (แสดง `—`)
- QR Code สร้างจาก Batch ID และ URL ของหน้าเว็บ แต่การเปิดลิงก์ `#trace-ID` ยังต้องกรอก Batch ID ในหน้า Trace ด้วยตนเอง
- ต้องมี Sepolia ETH ในกระเป๋าเพื่อจ่ายค่า gas สำหรับธุรกรรมที่เขียนข้อมูล
