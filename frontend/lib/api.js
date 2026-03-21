import axios from 'axios';

// Upload media (YOLO detection via internal Next.js API proxy to avoid CORS)
export const uploadMedia = async (file) => {
  try {
    const formData = new FormData();
    formData.append('media', file);

    const response = await fetch('/api/detect', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error from server');
    }

    const result = data.result;
    
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