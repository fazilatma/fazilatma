"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SourceFile {
  path: string;
  title: string;
  category: string;
  description: string;
  content: string;
}

export default function SourceCodePage() {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SourceFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("همه");

  useEffect(() => {
    fetch("/api/source-files")
      .then((res) => res.json())
      .then((data) => {
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          setSelectedFile(data.files[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch files", err);
        setLoading(false);
      });
  }, []);

  const handleCopyCode = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const categories = ["همه", "Backend (پایگاه داده)", "Frontend (درخواست خرید و پرداخت امانی)", "Frontend (محصولات و کالاها)", "Frontend (فروشندگان)", "Frontend (خریداران)", "Frontend (صفحات اصلی)", "Frontend (خرید و سفارش)", "Frontend (احراز هویت)", "Components (کامپوننت‌های مشترک)"];

  const filteredFiles = activeCategory === "همه" ? files : files.filter(f => f.category === activeCategory);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-l from-green-600 to-green-800 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col md:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-3">
                نمایشگر و کپی کد تک‌تک صفحات (Frontend + Backend)
              </span>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                سورس‌کد تک‌تک صفحات مارکت‌پلیس OptiBid
              </h1>
              <p className="text-green-100 text-sm md:text-base max-w-2xl">
                در این بخش می‌توانید کد هرکدام از ۱۹ صفحه و فایل فرانت‌اند و بک‌اند را به‌صورت جداگانه مشاهده کرده و با یک کلیک کپی کنید.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/download-source"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                دانلود سورس‌کد کامل سامانه (فایل ZIP)
              </a>
              <Link
                href="/"
                className="bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 backdrop-blur-sm"
              >
                بازگشت به سایت
              </Link>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                activeCategory === cat
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">در حال بارگذاری کدهای صفحات...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Right Sidebar: List of Pages */}
            <div className="lg:col-span-4 space-y-2 max-h-[85vh] overflow-y-auto pr-1">
              <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">
                لیست صفحات و فایل‌ها ({filteredFiles.length} مورد)
              </h3>
              {filteredFiles.map((file, idx) => {
                const isSelected = selectedFile?.path === file.path;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedFile(file);
                      setCopied(false);
                    }}
                    className={`w-full text-right p-4 rounded-xl border transition flex flex-col gap-1 ${
                      isSelected
                        ? "bg-green-50 border-green-500 shadow-sm"
                        : "bg-white border-gray-200 hover:border-green-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-bold text-sm ${isSelected ? "text-green-800" : "text-gray-900"}`}>
                        {file.title}
                      </span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600" dir="ltr">
                        {file.path.split("/").pop()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 line-clamp-1">{file.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Code Viewer Panel */}
            <div className="lg:col-span-8">
              {selectedFile ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                  {/* Panel Header */}
                  <div className="bg-gray-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <h2 className="font-bold text-lg">{selectedFile.title}</h2>
                      </div>
                      <p className="text-xs text-gray-400 font-mono" dir="ltr">
                        {selectedFile.path}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyCode(selectedFile.content)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md ${
                        copied
                          ? "bg-green-500 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {copied ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          کد این صفحه کپی شد!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          کپی کردن کد این صفحه
                        </>
                      )}
                    </button>
                  </div>

                  {/* Panel Description */}
                  <div className="bg-gray-100 px-5 py-3 border-b border-gray-200 text-xs text-gray-700">
                    <strong>توضیحات:</strong> {selectedFile.description}
                  </div>

                  {/* Code Block */}
                  <div className="p-4 sm:p-6 bg-gray-950 text-gray-100 overflow-x-auto max-h-[70vh] font-mono text-xs sm:text-sm leading-relaxed" dir="ltr">
                    <pre className="whitespace-pre">
                      <code>{selectedFile.content}</code>
                    </pre>
                  </div>

                  {/* Panel Footer */}
                  <div className="bg-gray-100 px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                    <span>مسیر فایل: <code className="font-mono bg-white px-2 py-0.5 rounded border">{selectedFile.path}</code></span>
                    <button
                      onClick={() => handleCopyCode(selectedFile.content)}
                      className="text-green-600 hover:text-green-700 font-bold underline"
                    >
                      کپی مجدد کد
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                  <p className="text-gray-500 font-bold">یک صفحه را از لیست سمت راست انتخاب کنید تا کد آن نمایش داده شود.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
