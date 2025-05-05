const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: userMessage }
      ],
    });
    
    const botResponse = completion.choices[0].message.content;
    
    res.json({ response: botResponse });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});