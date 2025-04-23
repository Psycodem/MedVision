const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

// Sample prompt template for symptom analysis and healing advice
const symptomPromptTemplate = (symptom) => `
You are a helpful medical AI assistant specializing in natural healing. A user has the following symptom or problem:

"${symptom}"

Please provide natural healing advice including herbs, fruits, lifestyle, breathing techniques, etc. If the symptom is serious or critical (e.g., chest pain, blood in urine), warn the user to see a doctor. Use simple language suitable for non-medical users.
`;

// List of serious symptoms keywords for warning
const seriousSymptoms = [
  'chest pain',
  'blood in urine',
  'severe headache',
  'shortness of breath',
  'unconscious',
  'severe bleeding',
  'loss of vision',
  'seizure',
  'high fever',
  'persistent vomiting',
];

// Load chat history from localStorage
let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
chatHistory.forEach(({ role, content }) => {
  addMessageToChat(role, content);
});

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat('user', message);
  userInput.value = '';
  chatForm.querySelector('button').disabled = true;

  try {
    const response = await callOpenAIChatAPI(message);
    addMessageToChat('assistant', response);
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: response });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  } catch (error) {
    addMessageToChat('assistant', 'Error getting response. Please try again.');
    console.error(error);
  } finally {
    chatForm.querySelector('button').disabled = false;
  }
});

// Add message to chat container
function addMessageToChat(role, content) {
  const messageEl = document.createElement('div');
  messageEl.className = `max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
    role === 'user'
      ? 'self-end bg-green-600 text-white'
      : 'self-start bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
  }`;
  messageEl.textContent = content;
  chatContainer.appendChild(messageEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // If assistant message, check for serious symptom warning
  if (role === 'assistant') {
    const lowerContent = content.toLowerCase();
    if (seriousSymptoms.some(symptom => lowerContent.includes(symptom))) {
      const warningEl = document.createElement('p');
      warningEl.className = 'text-red-600 dark:text-red-400 font-bold mt-2';
      warningEl.textContent = '⚠️ Warning: Your symptom may be serious. Please see a doctor immediately.';
      chatContainer.appendChild(warningEl);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
}

// Call OpenAI Chat API (gpt-4) with symptom prompt
async function callOpenAIChatAPI(userMessage) {
  // Replace with your OpenAI API key
  const OPENAI_API_KEY = 'YOUR_KEY';

  const prompt = symptomPromptTemplate(userMessage);

  const payload = {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: prompt }
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
  return data.choices?.[0]?.message?.content || '';
}
