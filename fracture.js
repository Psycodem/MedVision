const uploadInput = document.getElementById('xrayInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const fractureResult = document.getElementById('fractureResult');
const confidenceEl = document.getElementById('confidence');
const explanationEl = document.getElementById('explanation');
const feedbackSection = document.getElementById('feedbackSection');
const thumbsUpBtn = document.getElementById('thumbsUp');
const thumbsDownBtn = document.getElementById('thumbsDown');
const uploadForm = document.getElementById('uploadForm');

// Sample prompt template for fracture detection
const fracturePromptTemplate = (imageUrl) => `
You are a medical AI assistant. Analyze the following X-ray image for fractures:

Image URL: ${imageUrl}

Please respond with:
- Whether a fracture is detected or not (Yes/No)
- A confidence estimate (0-100%)
- If a fracture is detected, provide a brief, human-friendly explanation for a non-medical user.
`;

// Enable analyze button only when a file is selected
uploadInput.addEventListener('change', () => {
  analyzeBtn.disabled = !uploadInput.files.length;
  resultSection.classList.add('hidden');
  feedbackSection.classList.add('hidden');
  fractureResult.textContent = '';
  confidenceEl.textContent = '';
  explanationEl.textContent = '';
});

// Handle form submission
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!uploadInput.files.length) return;

  analyzeBtn.disabled = true;
  fractureResult.textContent = 'Analyzing...';
  confidenceEl.textContent = '';
  explanationEl.textContent = '';
  resultSection.classList.remove('hidden');
  feedbackSection.classList.add('hidden');

  const file = uploadInput.files[0];

  try {
    // Convert image file to base64
    const base64Image = await fileToBase64(file);

    // Call OpenAI Vision API with the image and prompt
    const response = await callOpenAIVisionAPI(base64Image);

    // Parse and display results
    displayResults(response);
  } catch (error) {
    fractureResult.textContent = 'Error analyzing image. Please try again.';
    console.error(error);
  } finally {
    analyzeBtn.disabled = false;
  }
});

// Convert file to base64 string
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // remove data:*/*;base64,
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Call OpenAI Vision API (gpt-4-vision-preview) with the base64 image
async function callOpenAIVisionAPI(base64Image) {
  // Replace with your OpenAI API key
  const OPENAI_API_KEY = 'YOUR_KEY';

  // Construct the request payload
  const payload = {
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { base64: base64Image } },
          { type: 'text', text: 'Analyze this X-ray image for fractures. Respond with detection, confidence, and explanation.' }
        ]
      }
    ]
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Parse and display the results from OpenAI response
function displayResults(data) {
  const message = data.choices?.[0]?.message?.content || '';
  // Simple parsing logic - look for keywords
  const lowerMsg = message.toLowerCase();
  let fractureDetected = false;
  if (lowerMsg.includes('fracture detected') || lowerMsg.includes('yes')) {
    fractureDetected = true;
  } else if (lowerMsg.includes('no fracture') || lowerMsg.includes('no')) {
    fractureDetected = false;
  }

  // Extract confidence estimate using regex
  const confidenceMatch = message.match(/(\d{1,3})\s*%/);
  const confidence = confidenceMatch ? confidenceMatch[1] : 'N/A';

  // Extract explanation (everything after confidence or after detection statement)
  let explanation = '';
  const explanationIndex = message.toLowerCase().indexOf('explanation');
  if (explanationIndex !== -1) {
    explanation = message.substring(explanationIndex);
  } else {
    // fallback: take last 2 sentences
    const sentences = message.split('.').filter(s => s.trim().length > 0);
    explanation = sentences.slice(-2).join('. ') + '.';
  }

  // Display results with color coding
  if (fractureDetected) {
    fractureResult.textContent = '⚠️ Fracture detected';
    fractureResult.className = 'text-red-600 dark:text-red-400 font-bold text-lg';
  } else {
    fractureResult.textContent = '✅ No fracture detected';
    fractureResult.className = 'text-green-600 dark:text-green-400 font-bold text-lg';
  }

  confidenceEl.textContent = `Confidence estimate: ${confidence}%`;
  explanationEl.textContent = explanation;

  feedbackSection.classList.remove('hidden');
}

// Handle feedback buttons
thumbsUpBtn.addEventListener('click', () => {
  storeFeedback(true);
  alert('Thank you for your feedback!');
  feedbackSection.classList.add('hidden');
});

thumbsDownBtn.addEventListener('click', () => {
  storeFeedback(false);
  alert('Thank you for your feedback!');
  feedbackSection.classList.add('hidden');
});

// Store feedback in localStorage (could be extended to send to backend)
function storeFeedback(isPositive) {
  const feedbacks = JSON.parse(localStorage.getItem('fractureFeedbacks') || '[]');
  feedbacks.push({ positive: isPositive, timestamp: new Date().toISOString() });
  localStorage.setItem('fractureFeedbacks', JSON.stringify(feedbacks));
}
