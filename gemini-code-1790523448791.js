async function evaluateResponse() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const company = document.getElementById('company').value;
  const question = document.getElementById('question').value;
  const userResponse = document.getElementById('response').value;
  const resultsDiv = document.getElementById('results');
  const btn = document.getElementById('evalBtn');

  if (!apiKey || !question || !userResponse) {
    alert("Please provide an API key, the question, and your answer.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Analyzing response...";
  resultsDiv.innerHTML = "";

  const systemPrompt = `You are an automated video interview evaluator trained on HireVue and Willo scoring methodologies. 
  Analyze the candidate's response against the provided question and company values.
  
  You must output strict JSON following this exact structure:
  {
    "recommendation": "Strong Yes" | "Yes" | "Maybe" | "No",
    "overallScore": <number out of 100>,
    "starAnalysis": {
      "situationTask": "<assessment of context given>",
      "action": "<assessment of actions taken by candidate>",
      "result": "<assessment of outcomes and quantified metrics>"
    },
    "companyValuesAlignment": "<analysis on how well the candidate displayed target company values>",
    "communicationCritique": "<feedback on conciseness, tone, structure, or filler words>",
    "improvedSampleResponse": "<a rewritten version of their response demonstrating optimal structure>"
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await res.json();
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
    console.error(err);
    alert("Error evaluating response. Check your API key and browser console.");
  } finally {
    btn.disabled = false;
    btn.innerText = "Analyze Interview Answer";
  }
}