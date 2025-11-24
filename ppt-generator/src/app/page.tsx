"use client";

import { useMemo, useState } from "react";

const arabicDefaults = {
  overview: "نظرة عامة",
  outline: "محاور العرض",
  methods: "المنهجية",
  results: "النتائج",
  conclusion: "الخلاصات",
  thanks: "شكراً لحسن الإصغاء",
};

type Slide = {
  title: string;
  bullets: string[];
  notes?: string;
};

const headingKeywords = [
  "introduction",
  "background",
  "objective",
  "aim",
  "method",
  "methodology",
  "approach",
  "results",
  "findings",
  "discussion",
  "analysis",
  "conclusion",
  "recommendation",
  "abstract",
  "summary",
  "problem",
  "framework",
  "evaluation",
  "future work",
  "limitations",
  "references",
  "مقدمة",
  "خلفية",
  "الأهداف",
  "غاية",
  "منهجية",
  "المنهج",
  "طرق",
  "نتائج",
  "خلاصات",
  "نقاش",
  "تحليل",
  "توصيات",
  "خاتمة",
  "استنتاج",
  "مراجع",
  "محور",
  "ملخص",
];

const sentenceDelimiter = /(?<=[.!؟?؛])\s+/u;

const generateSections = (raw: string) => {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return [] as { title: string; content: string[] }[];

  const blocks = text.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
  const sections: { title: string; content: string[] }[] = [];

  let currentTitle = "";
  let currentContent: string[] = [];

  const flushCurrent = () => {
    if (!currentTitle && currentContent.length) {
      const fallbackTitle = `${arabicDefaults.overview} ${sections.length + 1}`;
      sections.push({ title: fallbackTitle, content: currentContent });
    } else if (currentTitle) {
      sections.push({ title: currentTitle, content: currentContent });
    }
    currentTitle = "";
    currentContent = [];
  };

  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;

    const firstLine = lines[0];
    const normalizedHeading = firstLine.toLowerCase();
    const looksLikeHeading =
      /^\d+[\).\-\:]*\s+/.test(firstLine) ||
      /^[ivxlcdm]+\.\s+/i.test(firstLine) ||
      headingKeywords.some((keyword) => normalizedHeading.includes(keyword)) ||
      firstLine.length <= 50 && firstLine === firstLine.toUpperCase();

    if (looksLikeHeading) {
      flushCurrent();
      currentTitle = sanitizeHeading(firstLine);
      currentContent = lines.slice(1).length ? lines.slice(1) : [];
    } else {
      currentContent.push(...lines);
    }
  });

  flushCurrent();

  if (!sections.length) {
    const merged = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const chunkSize = Math.max(1, Math.ceil(merged.length / 4));
    for (let i = 0; i < merged.length; i += chunkSize) {
      const slice = merged.slice(i, i + chunkSize);
      sections.push({
        title: `${arabicDefaults.overview} ${sections.length + 1}`,
        content: slice,
      });
    }
  }

  return sections;
};

const sanitizeHeading = (heading: string) => {
  return heading.replace(/^\d+[\).\-\:]*\s+/, "").trim();
};

const parseSentences = (content: string[]) => {
  const joined = content.join(" ").replace(/\s+/g, " ");
  if (!joined) return [] as string[];
  const sentences = joined.split(sentenceDelimiter).map((fragment) => fragment.trim());
  return sentences.filter(Boolean).map((sentence) => sentence.replace(/^[\-•\s]+/, ""));
};

const buildSlides = (params: {
  title: string;
  presenter: string;
  eventName: string;
  articleText: string;
  keyTakeaways: string;
}) => {
  const { title, presenter, eventName, articleText, keyTakeaways } = params;
  const slides: Slide[] = [];
  const presentationTitle = title.trim() || "عرض علمي";
  const presenterName = presenter.trim() || "";
  const sections = generateSections(articleText);

  slides.push({
    title: presentationTitle,
    bullets: [
      eventName.trim() || "ملتقى علمي",
      presenterName ? `إعداد: ${presenterName}` : "",
    ].filter(Boolean),
    notes: "شريحة افتتاحية تعرف بالموضوع والمشارك",
  });

  if (sections.length) {
    slides.push({
      title: arabicDefaults.outline,
      bullets: sections.map((section) => section.title).slice(0, 6),
      notes: "عرض سريع لمحاور المداخلة",
    });
  }

  sections.forEach((section) => {
    const sentences = parseSentences(section.content);
    const bullets = sentences.slice(0, 5).map((sentence) => simplifySentence(sentence));
    if (!bullets.length && section.content.length) {
      bullets.push(...section.content.slice(0, 3));
    }
    slides.push({
      title: section.title,
      bullets: bullets.length ? bullets : ["(تفاصيل المحور)"],
      notes: "راجع التفاصيل الدقيقة المذكورة في الورقة",
    });
  });

  if (keyTakeaways.trim()) {
    const sentences = keyTakeaways
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5);
    slides.push({
      title: arabicDefaults.conclusion,
      bullets: sentences,
      notes: "أبرز الخلاصات المقترحة من مقدم العرض",
    });
  } else {
    const mainPoints = sections
      .map((section) => parseSentences(section.content)[0])
      .filter(Boolean)
      .slice(0, 4)
      .map((sentence) => simplifySentence(sentence));

    if (mainPoints.length) {
      slides.push({
        title: arabicDefaults.conclusion,
        bullets: mainPoints,
        notes: "خلاصة سريعة لأهم النقاط",
      });
    }
  }

  slides.push({
    title: arabicDefaults.thanks,
    bullets: ["نرحب بالأسئلة والملاحظات"],
    notes: "شريحة ختامية للتفاعل مع الجمهور",
  });

  return slides;
};

const simplifySentence = (sentence: string) => {
  const normalized = sentence.replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) return normalized;
  return `${normalized.slice(0, 117).trim()}...`;
};

const downloadPresentation = async (slides: Slide[], fileName: string) => {
  if (!slides.length) return;
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  slides.forEach((slide) => {
    const newSlide = pptx.addSlide();
    newSlide.addText(slide.title, {
      x: 0.5,
      y: 0.4,
      w: 9,
      fontSize: 28,
      bold: true,
      color: "363636",
    });

    const bulletText = slide.bullets.map((bullet) => `• ${bullet}`).join("\n");
    if (bulletText) {
      newSlide.addText(bulletText, {
        x: 0.8,
        y: 1.6,
        w: 8.4,
        h: 4.5,
        fontSize: 18,
        color: "404040",
        lineSpacing: 28,
      });
    }

    if (slide.notes) {
      newSlide.addNotes(slide.notes);
    }
  });

  await pptx.writeFile({ fileName: `${fileName}.pptx` });
};

export default function Home() {
  const [title, setTitle] = useState("عنوان المداخلة");
  const [presenter, setPresenter] = useState("اسم المشارك");
  const [eventName, setEventName] = useState("الملتقى العلمي");
  const [articleText, setArticleText] = useState("");
  const [keyTakeaways, setKeyTakeaways] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const presentationName = useMemo(() => {
    return title.trim() || "عرض علمي";
  }, [title]);

  const handleGenerate = () => {
    const computed = buildSlides({
      title,
      presenter,
      eventName,
      articleText,
      keyTakeaways,
    });
    setSlides(computed);
    setHasGenerated(true);
  };

  const handleDownload = async () => {
    if (!slides.length) return;
    await downloadPresentation(slides, presentationName);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              مُعِدّ العروض الأكاديمية
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              أدخل نص المقال الأكاديمي وسيتم توليد هيكل عرض تقديمي منظم مع إمكانية تحميل ملف PowerPoint جاهز للمداخلة.
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!slides.length}
          >
            تحميل الملف
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row">
        <section className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="title">
                عنوان العرض
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="على سبيل المثال: التحول الرقمي في التعليم العالي"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="presenter">
                اسم المشارك
              </label>
              <input
                id="presenter"
                value={presenter}
                onChange={(event) => setPresenter(event.target.value)}
                placeholder="الاسم الكامل"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="event">
                اسم الملتقى
              </label>
              <input
                id="event"
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
                placeholder="ملتقى البحث العلمي - جامعة ..."
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="article">
              نص المقال الأكاديمي
            </label>
            <textarea
              id="article"
              value={articleText}
              onChange={(event) => setArticleText(event.target.value)}
              placeholder="الصق هنا فقرات المقال، بما في ذلك العناوين الرئيسية إن وُجدت..."
              className="h-64 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="takeaways">
              خلاصات أساسية (اختياري)
            </label>
            <textarea
              id="takeaways"
              value={keyTakeaways}
              onChange={(event) => setKeyTakeaways(event.target.value)}
              placeholder="أدرج النقاط الأساسية التي تريد التأكيد عليها في الخاتمة (سطر لكل نقطة)"
              className="h-32 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              توليد العرض
            </button>
          </div>
        </section>

        <section className="flex w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:w-[420px]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">المعاينة الحية</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {slides.length ? `${slides.length} شريحة` : "لا توجد شرائح بعد"}
            </span>
          </div>

          {!hasGenerated && (
            <p className="text-sm text-slate-600">
              بعد لصق المقال والضغط على زر &quot;توليد العرض&quot; ستظهر هنا الشرائح المقترحة. يمكنك تعديل النص ثم إعادة التوليد.
            </p>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {slides.map((slide, index) => (
              <article
                key={`${slide.title}-${index}`}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-inner"
              >
                <header className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {index + 1}. {slide.title}
                  </h3>
                  <span className="text-xs text-slate-500">{slide.bullets.length} نقاط</span>
                </header>
                <ul className="mt-3 space-y-2">
                  {slide.bullets.map((bullet, bulletIndex) => (
                    <li key={`${index}-${bulletIndex}`} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                      {bullet}
                    </li>
                  ))}
                </ul>
                {slide.notes && (
                  <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                    ملاحظة للمتحدث: {slide.notes}
                  </p>
                )}
              </article>
            ))}

            {hasGenerated && !slides.length && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                لم يتم التعرف على محتوى كافٍ لتوليد الشرائح. تأكد من إدخال نص المقال بشكل صحيح.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
