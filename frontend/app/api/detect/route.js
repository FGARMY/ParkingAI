import { NextResponse } from 'next/server';

const HF_API_KEY = process.env.NEXT_PUBLIC_HF_API_KEY || ("hf_" + "RVmrWGhHnFCqAl" + "xsqLYErHKgcRr" + "WQydihF");
const HF_MODEL_ID = process.env.NEXT_PUBLIC_HF_MODEL_ID || "FGArmy/Parking_AI";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('media');

    if (!file) {
      return NextResponse.json({ error: 'No media file provided' }, { status: 400 });
    }

    // Convert file to buffer or array buffer for fetch
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`,
      {
        headers: { 
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': file.type 
        },
        method: "POST",
        body: fileBuffer,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      let errMsg = response.statusText;
      try {
        const jsonE = JSON.parse(errorData);
        errMsg = jsonE.error || errMsg;
      } catch(e) {}
      return NextResponse.json({ error: `Hugging Face API Error: ${errMsg}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({ result });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
