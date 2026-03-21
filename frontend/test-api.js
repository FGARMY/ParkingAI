const fs = require('fs');

async function run() {
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    const formData = new FormData();
    const blob = new Blob([dummyImage], { type: 'image/png' });
    formData.append('media', blob, 'dummy.png');

    try {
        const res = await fetch('http://localhost:3000/api/detect', {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("BODY:", text);
    } catch(e) {
        console.error(e);
    }
}
run();
