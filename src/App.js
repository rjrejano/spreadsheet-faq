import React, { useState } from 'react';

function App() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);

  const handleSubmitUrl = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('http://localhost:5000/api/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sheetUrl }),
    });
    const data = await response.json();
    console.log('Backend response:', data); // Log the backend response
    
    // Optional: Add code to display data in the UI if needed
    if (data.error) {
      console.error('Error:', data.error);
    } else {
      console.log('Data from Google Sheet:', data.data);
    }
  } catch (error) {
    console.error('Error submitting URL:', error);
  }
};



  const handleAskQuestion = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('http://localhost:5000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    setChat([...chat, { question, answer: data.answer }]);
  } catch (error) {
    console.error('Error asking question:', error);
  }
  setQuestion('');
};


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-2xl font-bold mb-6">Spreadsheet Q&A</h1>
      
      {/* URL Input Form */}
      <form onSubmit={handleSubmitUrl} className="mb-6 w-3/4 max-w-lg">
        <input
          type="url"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="Enter Google Sheets URL"
          className="p-2 border border-gray-300 rounded w-full"
          required
        />
        <button type="submit" className="mt-3 bg-blue-500 text-white py-2 px-4 rounded">
          Submit URL
        </button>
      </form>

      {/* Question Input Form */}
      <form onSubmit={handleAskQuestion} className="mb-6 w-3/4 max-w-lg">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your data"
          className="p-2 border border-gray-300 rounded w-full"
          required
        />
        <button type="submit" className="mt-3 bg-green-500 text-white py-2 px-4 rounded">
          Ask Question
        </button>
      </form>

      {/* Chat Interface */}
      <div className="bg-white shadow-md rounded p-4 w-3/4 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Chat</h2>
        {chat.map((entry, index) => (
          <div key={index} className="mb-3">
            <p className="font-bold">Q: {entry.question}</p>
            <p>A: {entry.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
