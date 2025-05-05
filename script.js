document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Convert newlines to <br> tags for proper paragraph formatting
        const formattedMessage = message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        
        messageContent.innerHTML = formattedMessage;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageContent; // Return the content element for streaming updates
    }

    // Function to handle sending a message
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, true);
        userInput.value = '';
        
        // Create bot message container with loading indicator
        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        
        const botContent = document.createElement('div');
        botContent.className = 'message-content';
        botContent.textContent = 'Typing...';
        
        botDiv.appendChild(botContent);
        chatMessages.appendChild(botDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        let fullResponse = '';
        
        // Send the message to the server with streaming response
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // Function to read stream chunks
            function readChunk() {
                return reader.read().then(({ value, done }) => {
                    if (done) {
                        console.log('Stream complete');
                        return;
                    }
                    
                    const chunk = decoder.decode(value, { stream: true });
                    // Process the chunk (which might contain multiple SSE messages)
                    const lines = chunk.split('\n\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                
                                if (data.content) {
                                    // If this is the first chunk, clear the "Typing..." text
                                    if (fullResponse === '') {
                                        botContent.innerHTML = '';
                                    }
                                    
                                    // Append new content
                                    fullResponse += data.content;
                                    
                                    // Format with paragraph breaks
                                    const formattedResponse = fullResponse
                                        .replace(/&/g, '&amp;')
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')
                                        .replace(/\n/g, '<br>');
                                    
                                    botContent.innerHTML = formattedResponse;
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                                
                                if (data.error) {
                                    console.error('Error in stream:', data.error);
                                    botContent.innerHTML = 'Sorry, I encountered an error. Please try again.';
                                    return; // Stop reading chunks
                                }
                                
                                if (data.done) {
                                    console.log('Stream done');
                                    return; // Stop reading chunks
                                }
                            } catch (error) {
                                console.error('Error parsing SSE data:', error);
                            }
                        }
                    }
                    
                    // Continue reading chunks
                    return readChunk();
                }).catch(error => {
                    console.error('Error reading stream:', error);
                    if (fullResponse === '') {
                        botContent.innerHTML = 'Sorry, I encountered an error. Please try again.';
                    }
                });
            }
            
            // Start reading the stream
            return readChunk();
        }).catch(error => {
            console.error('Fetch error:', error);
            botContent.innerHTML = 'Sorry, I encountered an error. Please try again.';
        });
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});