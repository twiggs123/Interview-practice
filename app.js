async function evaluateResponse() {
  const apiKeyInput = document.getElementById('apiKey').value.trim();
  const company = document.getElementById('company').value;
  const question = document.getElementById('question').value;
  const userResponse = document.getElementById('response').value;
  const resultsDiv = document.getElementById('results');
  const btn = document.getElementById('evalBtn');

  const apiKey = apiKeyInput || localStorage.getItem('GEMINI_KEY');

  if (!apiKey) {
    alert("Please enter a valid Gemini API Key.");
    return;
  }
  if (!question || !userResponse) {
    alert("Please provide both the interview question and your response.");
    return;
  }

  localStorage.setItem('GEMINI_KEY', apiKey);

  btn.disabled = true;
  btn.innerText = "Analyzing response...";
  resultsDiv.innerHTML = "<p>Connecting to Gemini API...</p>";

  const systemPrompt = `You are an automated video interview evaluator trained on HireVue and Willo scoring methodologies. 
Analyze the candidate's response against the provided question and company values.

You must output strict JSON following this exact structure:
{
  "recommendation": "Strong Yes",
  "overallScore": 85,
  "starAnalysis": {
    "situationTask": "Clear background given.",
    "action": "Good specific steps taken.",
    "result": "Lacked quantitative metrics."
  },
  "companyValuesAlignment": "Demonstrated ownership well.",
  "communicationCritique": "Concise and clear.",
  "improvedSampleResponse": "Rewritten answer here..."
}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `Target Company/Values: ${company}\nQuestion: ${question}\nCandidate Response: ${userResponse}` }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  try {
    // Updated endpoint model identifier to gemini-3.8-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(`Google API Error (${data.error?.code || response.status}): ${data.error?.message || "Failed to fetch response"}`);
    }

    const evaluation = JSON.parse(data.candidates[0].content.parts[0].text);

    resultsDiv.innerHTML = `
      <div class="card">
        <h2>Overall Score: <span class="score">${evaluation.overallScore}/100</span> (${evaluation.recommendation})</h2>
        
        <h3>1. STAR Structure Analysis</h3>
        <p><strong>Situation & Task:</strong> ${evaluation.starAnalysis.situationTask}</p>
        <p><strong>Action Taken:</strong> ${evaluation.starAnalysis.action}</p>
        <p><strong>Results & Metrics:</strong> ${evaluation.starAnalysis.result}</p>

        <h3>2. Company Values Alignment</h3>
        <p>${evaluation.companyValuesAlignment}</p>

        <h3>3. Communication Style</h3>
        <p>${evaluation.communicationCritique}</p>

        <h3>4. Optimized Model Response</h3>
        <p style="white-space: pre-line; background: #eee; padding: 0.75rem; border-radius: 4px;">${evaluation.improvedSampleResponse}</p>
      </div>
    `;
  } catch (err) {
    console.error("Interview Evaluation Error:", err);
    resultsDiv.innerHTML = `
      <div class="card" style="border-color: red; background: #fff0f0;">
        <h3 style="color: red; margin-top:0;">Evaluation Failed</h3>
        <p><strong>Details:</strong> ${err.message}</p>
        <p><em>Check F12 Developer Console for the complete error trace.</em></p>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.innerText = "Analyze Interview Answer";
  }
}
