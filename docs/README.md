# คู่มือ Smart Finance

[กลับหน้าโปรเจกต์](../README.md)

## เริ่มใช้งาน

ติดตั้งจาก source ด้วย Git, Python 3 และ Docker Compose v2.24.4 ขึ้นไป

```bash
git clone https://github.com/SurakTH/smart-finance-chat.git
cd smart-finance-chat
python3 scripts/configure.py
docker compose up -d --build --wait --wait-timeout 180
docker compose exec api python -m app.bootstrap
```

เปิด [localhost:8080](http://localhost:8080) แล้วเข้าสู่ระบบด้วยบัญชีที่ตั้งในขั้น bootstrap

เริ่มจากเพิ่มบัญชีและยอดตั้งต้น แล้วบันทึกรายการแรกหรือใช้ไฟล์ CSV เมื่อพร้อม ตั้งค่า AI ได้จาก **บริการทั้งหมด → ศูนย์ตั้งค่า AI** เปิด Cloud AI ระดับ workspace เมื่อต้องการให้ใช้บริการภายนอก ช่องทาง Telegram ส่งข้อมูลผ่าน Telegram ด้วย

## ทดลองด้วยข้อมูลสมมติบนเครื่อง

หากต้องการเปิดแอปด้วยข้อมูลตัวอย่าง ให้ใช้ฐานข้อมูลใหม่สำหรับทดสอบ แล้วรันคำสั่งนี้แทนขั้น bootstrap

```bash
python3 scripts/seed_demo.py
```

เข้าสู่ระบบที่ [localhost:8080](http://localhost:8080) ด้วยข้อมูลใน `artifacts/demo-access.json` แล้วเปิด **ผู้ช่วย AI** พิมพ์ `กาแฟ 75 จากเงินสด` ตรวจร่าง และพิมพ์ `ยืนยัน` เพื่อดูรายการที่บันทึก โฟลว์นี้ลองได้โดยไม่ต้องตั้ง API key

ถ้าต้องการลอง AI Inbox ใช้ [สลิปสมมติ](media/sample-receipt.png) แล้วกรอกยอด ฿125.00 และวันที่ในหน้าตรวจร่างเมื่อยังไม่ได้ตั้งโมเดลอ่านภาพ

## คู่มือตามงาน

| เรื่อง | อ่านต่อ |
| --- | --- |
| หน้าการเงินและการวิเคราะห์ | [หน้าจอและการนำทาง](UI.md) · [Insights](INSIGHTS.md) · [นำเข้า CSV](STATEMENT_IMPORT.md) |
| ผู้ช่วยและรับสลิป | [เว็บและ Telegram](AI_ASSISTANT.md) · [AI Inbox](AI_INBOX.md) · [ท่าทางและแป้นพิมพ์ในแชท](CHAT_UX.md) |
| การเชื่อมต่อ AI | [ศูนย์ตั้งค่า AI](AI_SETTINGS_HUB.md) · [การตั้งค่าโมเดล](MODEL_SETTINGS.md) |
| โครงสร้างและข้อกำหนด | [Architecture](ARCHITECTURE.md) · [AI runtime](AI_RUNTIME.md) |
| เซิร์ฟเวอร์และอัปเดต | [CI/CD](CICD.md) · [Nginx](NGINX.md) · [ตัวแปรแวดล้อม](../.env.example) |
| ผลตรวจและงานต่อไป | [Verification](VERIFICATION.md) · [โมเดลเล็กและสลิป](SMALL_MODELS.md) · [Roadmap](ROADMAP.md) |

## รันชุดทดสอบบนเครื่องพัฒนา

ใช้ stack ทดสอบแยกจากฐานข้อมูลจริง หลังเปิดบริการแล้วให้รันคำสั่งจาก root ของ repo

```bash
python3 scripts/test_docker.py
python3 scripts/seed_demo.py  # ใช้เมื่อยังไม่มีบัญชีเดโมใน stack นี้
cd frontend
npm ci
npm run typecheck
npm run build
npx playwright install chromium
npx playwright test
```

เครื่อง Linux ที่ขาดไลบรารีระบบอาจต้องใช้ `npx playwright install --with-deps chromium` หรือกำหนด `SF_CHROME_PATH` ไปที่ Chrome ที่ติดตั้งแล้ว ก่อนอัปเดตเซิร์ฟเวอร์ให้สำรองฐานข้อมูลและเก็บ `ENCRYPTION_KEY` เดิม สำหรับการติดตั้งผ่าน CI/CD ใช้ Compose และ image ของ release ตาม `current-commit` ดู [คู่มือ deploy](CICD.md) ก่อนใช้คำสั่ง Compose บนเครื่องจริง

## เอกสารย้อนหลัง

[README รุ่นก่อน](README_LEGACY.md) · [รายงาน audit AI ตุลาคม 2026](AI_CHAT_AUDIT_2026-10-14.md) · [การวัดขนาด prompt และ tools](AI_PAYLOAD_COMPARISON.md) บันทึกเหล่านี้ระบุพฤติกรรมและผลทดสอบตามรุ่นที่ระบุในแต่ละส่วน
