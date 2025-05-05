# OpenAI Browser Chatbot

A simple browser-based chatbot that uses the OpenAI API to generate responses.

## Features

- Clean, responsive chat interface
- Real-time interaction with OpenAI's GPT models
- Simple Node.js backend to handle API requests

## Setup

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```
4. Start the server
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## How It Works

- The frontend is built with HTML, CSS, and vanilla JavaScript
- The backend uses Express.js to serve static files and handle API requests
- When you send a message, it's sent to the OpenAI API via the backend
- The response from OpenAI is displayed in the chat interface

## Customization

You can modify the system message in `server.js` to change the behavior of the chatbot:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' }, // Modify this line
    { role: 'user', content: userMessage }
  ],
});
```

You can also change the model used by modifying the `model` parameter.