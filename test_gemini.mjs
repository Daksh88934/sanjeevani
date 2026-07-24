import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyBvQ_Wdoj0_H6SxT7wzuvzAjqmNG0grbfs";

async function test() {
  console.log("Testing Gemini API with the NEW key...");
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Trying gemini-pro...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello, are you working?");
    console.log("SUCCESS! API Key is working.");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("TEST FAILED. Error details:");
    console.error(error);
  }
}

test();
