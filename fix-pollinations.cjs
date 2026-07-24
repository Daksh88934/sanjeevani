const fs = require('fs');
let code = fs.readFileSync('src/services/AIEngine.js', 'utf8');

const regex = /const response = await fetch\("https:\/\/openrouter\.ai\/api\/v1\/chat\/completions", \{\s*method: "POST",\s*headers: \{[\s\S]*?\},[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?model: ".*?",\s*messages: \[([\s\S]*?)\]\s*\}\)\s*\}\);\s*const data = await response\.json\(\);\s*let responseText = data\.choices\[0\]\.message\.content/g;

const replacement = `const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai",
        jsonMode: true,
        messages: [$1]
      })
    });

    let responseText = await response.text();`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/services/AIEngine.js', code);
