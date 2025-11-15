# Banking Bot Chat UI

A modern React frontend for the Banking Bot AI assistant. This interface provides a beautiful chat experience with real-time streaming responses, user authentication, and conversation history.

## 🚀 Quick Setup (for Workshop Attendees)

If you're attending the workshop, follow these simple steps:

### Prerequisites
- **Node.js 18 or higher** installed (check with `node --version`)
- **Banking Bot API running** on port 2024 (from the BankingBot folder)

### Installation & Start

1. **Open a new terminal/command prompt**
2. **Navigate to this folder:**
   ```bash
   cd banking-bot-ui
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the app:**
   ```bash
   npm run dev
   ```
5. **Open your browser** to `http://localhost:3000`

That's it! 🎉

## 🧪 Testing the Chat

1. **Log in** with test credentials:
   - Username: `john_doe`
   - Password: `password123`

2. **Try these questions:**
   - "What's my account balance?"
   - "Show me my recent transactions"
   - "What are international transfer fees?"

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Lucide React** for icons

## 📁 Project Structure

```
banking-bot-ui/
├── src/
│   ├── components/     # React components
│   │   ├── Auth.tsx           # Login/register forms
│   │   ├── ChatWindow.tsx     # Main chat interface
│   │   ├── MessageItem.tsx    # Individual messages
│   │   └── EvaluationSection.tsx # AI evaluation display
│   ├── contexts/       # React contexts
│   │   └── AuthContext.tsx    # Authentication state
│   ├── services/       # API services
│   │   └── api.ts             # API client with streaming
│   ├── types/          # TypeScript definitions
│   │   └── index.ts           # Shared types
│   └── App.tsx         # Main app component
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

## 🔧 Available Scripts

### `npm run dev`
Starts the development server at `http://localhost:3000`

### `npm run build`
Builds the app for production to the `dist` folder

### `npm run preview`
Previews the production build locally

## 🎨 Features

- **Real-time Chat**: Streaming AI responses
- **User Authentication**: Secure login/logout
- **Conversation History**: Persistent chat threads
- **AI Evaluation**: LLM-as-a-Judge scoring system
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, professional banking interface

## 🔗 API Integration

The frontend connects to the Banking Bot API at `http://localhost:2024`. Make sure the backend is running before starting the frontend.

## 🐛 Troubleshooting

### "npm install" fails
- Check your internet connection
- Try `npm install --legacy-peer-deps`

### "npm run dev" fails
- Make sure port 3000 is available
- Try a different port: `npm run dev -- --port 3001`

### Can't connect to API
- Verify Banking Bot API is running on port 2024
- Check browser console for CORS errors

## 🤝 Contributing

This is a workshop project! Feel free to:
- Experiment with the UI components
- Add new features
- Customize the styling
- Test different chat scenarios

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
