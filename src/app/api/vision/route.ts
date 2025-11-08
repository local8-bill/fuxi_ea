import { NextResponse } from "next/server";

// NOTE: This is a stub. Replace `fakeParse()` with a real vision/OCR call later.
// It reads the file only to keep the API shape correct.

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // In the real version, you'd pass `file` to a model/ocr service and get back blocks.
    const doc = await fakeParse();

    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json({ error: "Parser failed" }, { status: 500 });
  }
}

type OCRBox = { text: string; x: number; y: number; w: number; h: number };
type OCRDoc = { boxes: OCRBox[] };

// TEMP: a tiny synthetic doc shaped like the Deckers image (just enough to demo)
async function fakeParse(): Promise<OCRDoc> {
  const boxes: OCRBox[] = [
    { text: "Product Innovation", x: 40, y: 120, w: 220, h: 24 },
    { text: "Research and Development", x: 60, y: 160, w: 220, h: 18 },
    { text: "Product Planning", x: 320, y: 160, w: 200, h: 18 },
    { text: "Product Design", x: 60, y: 190, w: 180, h: 18 },
    { text: "Packaging Design", x: 320, y: 190, w: 200, h: 18 },

    { text: "Product Development", x: 40, y: 240, w: 240, h: 24 },
    { text: "Content Management", x: 60, y: 280, w: 220, h: 18 },
    { text: "Quality Integration", x: 320, y: 280, w: 200, h: 18 },
    { text: "Change Management", x: 60, y: 310, w: 200, h: 18 },
    { text: "Process Design", x: 320, y: 310, w: 180, h: 18 },

    { text: "Product Manufacturing", x: 40, y: 360, w: 260, h: 24 },
    { text: "Production Strategy", x: 60, y: 400, w: 220, h: 18 },
    { text: "Operations Management", x: 320, y: 400, w: 220, h: 18 },
  ];
  return { boxes };
}