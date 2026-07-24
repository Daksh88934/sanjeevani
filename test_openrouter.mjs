const apiKey = process.env.OPENROUTER_API_KEY || "your_api_key_here";

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}`);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Say 'Hello in Hindi'" }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`SUCCESS [${modelName}]:`, data.choices[0].message.content);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`FAILED [${modelName}]:`, response.status, errorText);
      return false;
    }
  } catch (err) {
    console.log(`ERROR [${modelName}]:`, err.message);
    return false;
  }
}

async function runTests() {
  const models = [
    "openrouter/auto",
    "openai/gpt-3.5-turbo",
    "google/gemini-1.5-flash",
    "google/gemini-flash-1.5",
    "meta-llama/llama-3-8b-instruct:free",
    "google/gemma-7b-it:free"
  ];
  
  for (const model of models) {
    const success = await testModel(model);
    if (success) {
      console.log(`\nFound a working model: ${model}. You should use this in AIEngine.js`);
      break;
    }
  }
}

runTests();
