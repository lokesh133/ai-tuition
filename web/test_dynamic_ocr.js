const fs = require('fs');

let key = '';
try {
  const env = fs.readFileSync('.env.local', 'utf8');
  const match = env.match(/GEMINI_API_KEY=(.+)/);
  if (match) key = match[1].trim();
} catch (e) {}

async function testVision() {
  const imgPath = 'public/samples/whatsapp_sample_1.jpeg';
  if (!fs.existsSync(imgPath)) {
    console.log('Image not found:', imgPath);
    return;
  }
  const base64 = fs.readFileSync(imgPath).toString('base64');
  console.log('Testing image size:', base64.length, 'bytes');

  const prompt = `Analyze this student homework image. Extract:
1. What subject is this?
2. What are the questions or problems visible?
3. Give solution for Question 1.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } }
        ]
      }]
    })
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Gemini Dynamic Vision Output:\n', data?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 500));
}
testVision();
