import { useState } from "react";
import { ChatPopup } from "@/components/ChatPopup";

export default function LandingTest() {
  const [showChatPopup, setShowChatPopup] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: 'white', padding: '20px' }}>
      <h1>ContentScale - Test Landing Page</h1>
      <button 
        onClick={() => setShowChatPopup(true)}
        style={{ 
          backgroundColor: '#7c3aed', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          margin: '20px 0'
        }}
      >
        Open Sofeia AI
      </button>
      
      {showChatPopup && (
        <ChatPopup 
          isOpen={showChatPopup} 
          onClose={() => setShowChatPopup(false)} 
        />
      )}
    </div>
  );
}