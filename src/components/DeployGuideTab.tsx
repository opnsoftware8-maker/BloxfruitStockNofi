import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Cloud,
  KeyRound,
  Clock,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export const DeployGuideTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepIdx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <span>🚀 คู่มือทีละขั้นตอน: นำโค้ดขึ้น Vercel และตั้งค่า Cron แจ้งเตือน 24 ชม.</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
          ทำตาม 5 ขั้นตอนนี้เพื่อเริ่มใช้งานบอทแจ้งเตือนสต็อกผลไม้ Blox Fruits เข้า Discord ฟรี 100%
          โดยที่ระบบจะดึงข้อมูลและยิงแจ้งเตือนอัตโนมัติทุกๆ 4 ชั่วโมง
        </p>
      </div>

      {/* Step Cards */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div
          className={`rounded-2xl border transition-all p-6 ${
            completedSteps[1]
              ? 'bg-zinc-950/60 border-emerald-500/40'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shrink-0">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  เตรียมไฟล์โปรเจกต์ (Download or Create Folder)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ไปที่แท็บ <strong>"💻 โค้ด TypeScript"</strong> แล้วกดปุ่ม{' '}
                  <span className="text-amber-400 font-semibold">
                    "📦 ดาวน์โหลดโปรเจกต์ทั้งหมด (.ZIP)"
                  </span>{' '}
                  หรือสร้างโฟลเดอร์ชื่อ <code className="text-amber-300 bg-zinc-950 px-1 py-0.5 rounded">bloxfruits-notifier</code> บนคอมพิวเตอร์ของคุณแล้วแตกไฟล์ออกมา
                </p>

                <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl font-mono text-xs text-zinc-300">
                  <div className="text-zinc-500 mb-1"># โครงสร้างโฟลเดอร์ที่ถูกต้อง:</div>
                  <div>bloxfruits-notifier/</div>
                  <div>├── api/</div>
                  <div>│   └── stock-notifier.ts</div>
                  <div>├── .env.example</div>
                  <div>├── package.json</div>
                  <div>├── tsconfig.json</div>
                  <div>└── vercel.json</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleStep(1)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                completedSteps[1]
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completedSteps[1] ? 'เสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จ'}</span>
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`rounded-2xl border transition-all p-6 ${
            completedSteps[2]
              ? 'bg-zinc-950/60 border-emerald-500/40'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shrink-0">
                2
              </div>
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  นำโปรเจกต์ขึ้น GitHub
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  สร้าง Repository ใหม่บน{' '}
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    GitHub (คลิกที่นี่) <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  ตั้งชื่อเช่น <code className="text-zinc-200">bloxfruits-stock-notifier</code> แล้วรันคำสั่งใน Terminal ในโฟลเดอร์โปรเจกต์ของคุณ:
                </p>

                <div className="relative bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl font-mono text-xs text-zinc-200">
                  <pre className="overflow-x-auto whitespace-pre">
{`git init
git add .
git commit -m "feat: blox fruits stock notifier"
git branch -M main
git remote add origin https://github.com/<your-username>/bloxfruits-stock-notifier.git
git push -u origin main`}
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git init\ngit add .\ngit commit -m "feat: blox fruits stock notifier"\ngit branch -M main\ngit remote add origin https://github.com/<your-username>/bloxfruits-stock-notifier.git\ngit push -u origin main`,
                        2
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 border border-zinc-700 cursor-pointer"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleStep(2)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                completedSteps[2]
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completedSteps[2] ? 'เสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จ'}</span>
            </button>
          </div>
        </div>

        {/* Step 3 & 4 */}
        <div
          className={`rounded-2xl border transition-all p-6 ${
            completedSteps[3]
              ? 'bg-zinc-950/60 border-emerald-500/40'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shrink-0">
                3
              </div>
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  เชื่อมต่อและ Deploy บน Vercel พร้อมใส่ Environment Variable
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  1. เข้าเว็บ{' '}
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Vercel New Project <ExternalLink className="w-3 h-3" />
                  </a>
                  <br />
                  2. เลือก Repository ที่เพิ่ง Push ขึ้นไป แล้วกดปุ่ม <strong>"Import"</strong>
                  <br />
                  3. ในหัวข้อ <strong>Environment Variables</strong> ให้เพิ่มตัวแปรนี้:
                </p>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-amber-300">DISCORD_WEBHOOK_URL</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ',
                          3
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] cursor-pointer"
                    >
                      {copiedIndex === 3 ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> คัดลอกแล้ว!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> คัดลอก Webhook
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-400 break-all bg-zinc-900 p-2 rounded border border-zinc-800">
                    https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  4. กดปุ่ม <strong>"Deploy"</strong> แล้วรอประมาณ 20-30 วินาที ระบบจะสร้างเสร็จสมบูรณ์!
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleStep(3)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                completedSteps[3]
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completedSteps[3] ? 'เสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จ'}</span>
            </button>
          </div>
        </div>

        {/* Step 4 */}
        <div
          className={`rounded-2xl border transition-all p-6 ${
            completedSteps[4]
              ? 'bg-zinc-950/60 border-emerald-500/40'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shrink-0">
                4
              </div>
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ทดสอบยิงฟังก์ชันด้วยตนเอง (Manual Trigger Test)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  เมื่อ Deploy บน Vercel เสร็จแล้ว คุณจะได้ URL เช่น{' '}
                  <code className="text-sky-300 bg-zinc-950 px-1.5 py-0.5 rounded">
                    https://&lt;your-project&gt;.vercel.app
                  </code>{' '}
                  คุณสามารถเปิดเว็บบราวเซอร์แล้วเข้าไปที่ URL ด้านล่างเพื่อทดสอบการทำงาน:
                </p>

                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl font-mono text-xs text-emerald-400 flex items-center justify-between gap-2">
                  <span className="truncate">https://&lt;your-project&gt;.vercel.app/api/stock-notifier</span>
                  <span className="text-[11px] text-zinc-500 shrink-0">GET request</span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  ผลลัพธ์ที่ได้: ข้อความ Rich Embed แจ้งเตือนสต็อกผลไม้จะถูกส่งเข้าห้อง Discord ของคุณทันที
                  และบนหน้าต่างเว็บบราวเซอร์จะแสดง JSON ผลลัพธ์พร้อมรายการผลไม้!
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleStep(4)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                completedSteps[4]
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completedSteps[4] ? 'เสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จ'}</span>
            </button>
          </div>
        </div>

        {/* Step 5 */}
        <div
          className={`rounded-2xl border transition-all p-6 ${
            completedSteps[5]
              ? 'bg-zinc-950/60 border-emerald-500/40'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shrink-0">
                5
              </div>
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-fuchsia-400" />
                  การทำงานอัตโนมัติ (Cron Job Schedule)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ไฟล์ <code className="text-amber-300">vercel.json</code> ได้กำหนดการทำงานแบบ Cron Job ไว้ที่{' '}
                  <code className="text-zinc-200 bg-zinc-950 px-1 py-0.5 rounded">0 0,4,8,12,16,20 * * *</code>{' '}
                  ซึ่งตรงกับเวลารีเซ็ตผลไม้ของ Blox Fruits ทุกๆ 4 ชั่วโมง (เวลาไทย: 03:00, 07:00, 11:00, 15:00, 19:00, 23:00 น.)
                </p>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-200/90 leading-relaxed space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    เคล็ดลับสำหรับผู้ใช้ Vercel แผนฟรี (Hobby Plan):
                  </div>
                  <p>
                    บน Vercel Free Plan (Hobby), Cron Job บางครั้งจะถูกจำกัดรอบการรัน{' '}
                    <strong>วิธีแก้ให้แม่นยำและฟรี 100%:</strong> คุณสามารถใช้บริการ{' '}
                    <a
                      href="https://cron-job.org"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 underline font-semibold"
                    >
                      cron-job.org
                    </a>{' '}
                    (สมัครฟรี) แล้วสร้าง Cron ใหม่ให้ยิง URL{' '}
                    <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100">
                      https://&lt;your-project&gt;.vercel.app/api/stock-notifier
                    </code>{' '}
                    ทุกๆ 4 ชั่วโมง ระบบจะยิงให้อย่างเสถียรและตรงเวลาตลอด 24 ชั่วโมงแน่นอน!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleStep(5)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                completedSteps[5]
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completedSteps[5] ? 'เสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FAQ & Troubleshooting */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          คำถามที่พบบ่อย & การแก้ปัญหา (FAQ & Troubleshooting)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
            <strong className="text-zinc-200 block text-sm font-semibold">
              ❓ ถ้า Discord ไม่ได้รับข้อความแจ้งเตือน เกิดจากอะไร?
            </strong>
            <p className="text-zinc-400 leading-relaxed">
              1. ตรวจสอบว่า Discord Webhook ยังไม่ถูกลบออกจาก Server Settings &gt; Integrations
              <br />
              2. ตรวจสอบว่าใน Vercel Environment Variables ตั้งชื่อ Key ว่า{' '}
              <code className="text-amber-300">DISCORD_WEBHOOK_URL</code> อย่างถูกต้อง (ไม่มีช่องว่างด้านหน้าหรือหลัง)
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
            <strong className="text-zinc-200 block text-sm font-semibold">
              ❓ Blox Fruits Wiki ปรับเปลี่ยนหน้า จะกระทบไหม?
            </strong>
            <p className="text-zinc-400 leading-relaxed">
              โค้ด TypeScript ถูกออกแบบด้วย Robust Parser ค้นหาตารางประวัติสต็อกแบบยืดหยุ่น และมี fallback ป้องกันไม่ให้แอปพลิเคชันพัง พร้อมทั้งยังมีข้อมูลราคาและระดับความหายาก (Rarity) อ้างอิงในตัว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
