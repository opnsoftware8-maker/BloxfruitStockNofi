import React, { useState } from 'react';
import { VERCEL_CODE_FILES } from '../data/vercelTemplates';
import JSZip from 'jszip';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  FolderGit2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const VercelCodeTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<keyof typeof VERCEL_CODE_FILES>(
    'api/stock-notifier.ts'
  );
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const fileContent = VERCEL_CODE_FILES[selectedFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files
      zip.file('api/stock-notifier.ts', VERCEL_CODE_FILES['api/stock-notifier.ts']);
      zip.file('vercel.json', VERCEL_CODE_FILES['vercel.json']);
      zip.file('package.json', VERCEL_CODE_FILES['package.json']);
      zip.file('tsconfig.json', VERCEL_CODE_FILES['tsconfig.json']);
      zip.file('.env.example', VERCEL_CODE_FILES['.env.example']);
      zip.file('README.md', VERCEL_CODE_FILES['README.md']);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bloxfruits-stock-discord-vercel.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const lines = fileContent.split('\n');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            TypeScript + Vercel Serverless Function
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            โค้ด TypeScript พร้อมนำขึ้น Vercel ได้ทันที
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            โครงสร้างโปรเจกต์แยกเป็นไฟล์ชัดเจน รองรับ Vercel Cron Job ทำงานอัตโนมัติทุก 4 ชั่วโมง
            โดยที่คุณไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้
          </p>
        </div>

        {/* Download All as ZIP */}
        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
          {isZipping ? 'กำลังสร้างไฟล์ ZIP...' : '📦 ดาวน์โหลดโปรเจกต์ทั้งหมด (.ZIP)'}
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* File Tabs Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {(Object.keys(VERCEL_CODE_FILES) as Array<keyof typeof VERCEL_CODE_FILES>).map(
              (fileName) => (
                <button
                  key={fileName}
                  onClick={() => setSelectedFile(fileName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedFile === fileName
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fileName}</span>
                </button>
              )
            )}
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกโค้ดไฟล์นี้</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="relative font-mono text-xs leading-relaxed max-h-[550px] overflow-y-auto p-4 select-text">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="w-10 pr-4 text-right text-zinc-600 select-none align-top">
                    {idx + 1}
                  </td>
                  <td className="text-zinc-200 whitespace-pre break-all font-mono align-top">
                    {line}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Highlights & Architecture Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">1. Blox Fruits Wiki Parser</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ดึงข้อมูลจาก MediaWiki API โดยไม่โดนบล็อก Cloudflare แปลงตาราง History of Stock
            และจับคู่กับฐานข้อมูลผลไม้อย่างสมบูรณ์
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">2. Discord Rich Embed</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            จัดหมวดหมู่ผลไม้ตามระดับ Rarity (Mythical, Legendary, Rare...), แสดงราคา Beli/Robux
            และเปลี่ยนสี Embed อัตโนมัติเมื่อมีผลเทพเข้า
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">3. Vercel Cron Automation</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ไฟล์ vercel.json กำหนดรอบตั้งเวลาอัตโนมัติทุก 4 ชั่วโมง ทำงานผ่าน Serverless Edge
            โดยไม่มีค่าใช้จ่ายเซิร์ฟเวอร์
          </p>
        </div>
      </div>
    </div>
  );
};
