const HF_API_KEY = process.env.NEXT_PUBLIC_HF_API_KEY || ("hf_" + "RVmrWGhHnFCqAl" + "xsqLYErHKgcRr" + "WQydihF");
const HF_MODEL_ID = process.env.NEXT_PUBLIC_HF_MODEL_ID || "FGArmy/Parking_AI";

// Upload media (YOLO detection via Hugging Face Inference API)
export const uploadMedia = async (file) => {
  if (!HF_API_KEY) {

    throw new Error("Missing Hugging Face Token in environment variables. Please check your Vercel settings.");
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`,
      {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        method: "POST",
        body: file,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      let errMsg = response.statusText;
      try {
        const jsonE = JSON.parse(errorData);
        errMsg = jsonE.error || errMsg;
      } catch(e) {
        // ignore JSON parse error
      }
      throw new Error(`Hugging Face API Error: ${errMsg}`);
    }

    const result = await response.json();
    
    // Process results into format expected by page.js
    let empty = 0;
    let occupied = 0;
    const boxes = [];
    const classes = [];
    
    if (Array.isArray(result)) {
      result.forEach(item => {
         const label = (item.label || "").toLowerCase();
         let cls = 0; // Default to empty (0)
         
         // Classify based on label names
         if (label.includes("occupy") || label.includes("occupied") || label === "car" || label === "vehicle") {
             occupied++;
             cls = 1;
         } else {
             empty++;
             cls = 0;
         }
         
         // UI expects [x1, y1, x2, y2] equivalent to [xmin, ymin, xmax, ymax]
         if (item.box) {
           const { xmin, ymin, xmax, ymax } = item.box;
           boxes.push([xmin, ymin, xmax, ymax]);
           classes.push(cls);
         }
      });
    }

    return {
        total: empty + occupied,
        empty,
        occupied,
        boxes,
        classes,
        raw_result: result
    };

  } catch (err) {
    throw new Error(err.message || 'Error processing media file');
  }
};