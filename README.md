# 📱 FitBuddy — Health Made Simple  

![FitBuddy Banner](https://img.freepik.com/free-vector/fitness-mobile-app-concept_23-2148506224.jpg)  

[![Expo](https://img.shields.io/badge/Expo-53.0-blue?logo=expo)](https://expo.dev/)  
[![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react)](https://reactnative.dev/)  
[![Google AI](https://img.shields.io/badge/Google%20Generative%20AI-Powered-red?logo=google)](https://ai.google.dev/)  
[![Hackathon](https://img.shields.io/badge/Hackathon-Winner-gold)](https://devpost.com/software/fitbuddy-health-made-simple)  
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)  

---

## 🌟 Overview  
**FitBuddy** is your personal **AI-powered fitness and health companion**.  
Built with [Expo](https://expo.dev), [React Native](https://reactnative.dev/), and [Google Generative AI](https://ai.google.dev/), it helps you stay active, motivated, and mindful about your health.  

👟 Features include:  
- Personalized workout guidance  
- AI-driven health coaching  
- Voice feedback & text-to-speech  
- YouTube workout integrations  
- A smooth, modern cross-platform UI  

---

## ✨ Features  
✅ AI-powered workout recommendations (Gemini AI)  
✅ Embedded YouTube fitness tutorials  
✅ Text-to-Speech motivational coaching  
✅ Camera-based features (future expansion: pose detection, food logging)  
✅ Smooth animations, gradients & haptics  
✅ Works on **iOS • Android • Web**  

---

## 🛠️ Tech Stack  

![Tech Stack](https://skillicons.dev/icons?i=react,ts,github,google,androidstudio,apple)  

- **Framework**: Expo SDK 53 + Expo Router  
- **Frontend**: React Native 0.79 + React 19  
- **UI & Animations**: Lucide Icons, Animatable, Reanimated, Blur, Gradients  
- **AI**: Google Generative AI (Gemini)  
- **Storage**: AsyncStorage  
- **Media**: Expo Camera, YouTube Iframe, Expo Speech  
- **Navigation**: React Navigation v7  

---

## 🚀 Getting Started  

### 1️⃣ Clone the repository  
```bash
git clone https://github.com/AchrefRhm/FitBuddy.git
cd FitBuddy
2️⃣ Install dependencies
npm install
3️⃣ Run the app
npm run dev
Scan the QR code with Expo Go (iOS/Android) to test.
📂 Project Structure
FitBuddy/
├── app/                # Expo Router pages
├── assets/             # Images, fonts
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Configurations & helpers
├── services/           # API & AI integrations
├── utils/              # Utility functions
├── package.json
└── tsconfig.json

🤖 AI Integration

FitBuddy integrates Google Gemini AI for personalized fitness & health advice.import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const response = await model.generateContent("Give me a 20 min beginner workout plan");
console.log(response.text());

📦 Scripts

npm run dev → start Expo dev server

npm run build:web → build for web

npm run lint → lint checks

👨‍💻 Author

Achref Rhouma

🌐 LinkedIn

💻 GitHub

🏆 Hackathon Project

🌍 License

MIT License © 2025 Achref Rhouma
