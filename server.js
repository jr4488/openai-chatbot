const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Load system prompt from file
let systemPrompt;
try {
  const promptPath = path.join(__dirname, 'systemprompt.txt');
  console.log(`Attempting to load system prompt from: ${promptPath}`);
  
  if (fs.existsSync(promptPath)) {
    systemPrompt = fs.readFileSync(promptPath, 'utf8');
    console.log('System prompt loaded successfully:');
    console.log('First 50 characters:', systemPrompt.substring(0, 50));
    console.log('Length:', systemPrompt.length);
  } else {
    console.error(`File not found: ${promptPath}`);
    systemPrompt = 'You are a helpful assistant.'; // Fallback prompt
    console.log('Using fallback system prompt because file was not found');
  }
} catch (error) {
  console.error('Error loading system prompt:', error);
  systemPrompt = 'You are a helpful assistant.'; // Fallback prompt
  console.log('Using fallback system prompt due to error');
}

// Middleware for parsing JSON bodies
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// API endpoint for chat with streaming
app.post('/api/chat', async (req, res) => {
  console.log('Received request to /api/chat');
  
  const userMessage = req.body?.message;
  
  if (!userMessage) {
    console.log('No message provided in request');
    return res.status(400).json({ error: 'Message is required' });
  }
  
  console.log(`User message: "${userMessage}"`);
  console.log('Using system prompt:', systemPrompt.substring(0, 50) + '...');

  try {
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true,
    });
    
    console.log('Starting OpenAI stream');
    
    // Stream the response chunks to the client
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    console.log('Stream complete');
    console.log('Full response length:', fullResponse.length);
    
    // Send a "done" event to signify the stream is complete
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error processing request:', error);
    
    // If we've already started streaming, send an error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to get complete response from AI' })}\n\n`);
      res.end();
    } else {
      // Otherwise send a regular JSON error response
      res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error', details: err.message });
});

// Handle all other routes
app.all('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});