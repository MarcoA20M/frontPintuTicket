import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const videoRef = useRef(null);

  const playVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleLogin = () => {
    setShowLogin(!showLogin);
  };

  return (
    <div className="App">
      <video 
        ref={videoRef}
        id="myVideo" 
        muted 
        onClick={playVideo}
        src="video/Interior Design Ideas _ Free HD VIDEO - No Copyright.mp4" 
        type="video/mp4"
      ></video>

      <Header onLoginClick={toggleLogin} />
      
      {showLogin && <LoginForm onClose={toggleLogin} />}
      
      <MainSection />
    </div>
  );
}

export default App;