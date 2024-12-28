/* eslint-disable react/no-unknown-property */
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF("/models/yucca3d.glb"); // Ensure the path is correct
  
  // Animasi rotasi otomatis
  useFrame(() => {
    scene.rotation.y += 0.01; // Rotasi pada sumbu Y (kiri/kanan)
  });

  return (
    <primitive
      object={scene}
      scale={[1.5, 1.5, 1.5]}
      position={[0.1, -0.9, 0]} // Posisi model
    />
  );
}

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  // const [borderTransition, setBorderTransition] = useState(0);
  const recognitionRef = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  useEffect(() => {
    let audioContext, analyser, microphoneStream;

    if (isListening) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        microphoneStream = audioContext.createMediaStreamSource(stream);
        microphoneStream.connect(analyser);

        // const bufferLength = analyser.frequencyBinCount;
        // const dataArray = new Uint8Array(bufferLength);

        // const getAmplitude = () => {
        //   analyser.getByteFrequencyData(dataArray);
        //   const sum = dataArray.reduce((a, b) => a + b, 0);
        //   return sum / bufferLength;
        // };

        // const updateWave = () => {
        //   const amplitude = getAmplitude();
        //   setBorderTransition(amplitude);
        //   requestAnimationFrame(updateWave);
        // };

        // updateWave();
      });

      return () => {
        if (microphoneStream) microphoneStream.disconnect();
        if (audioContext) audioContext.close();
      };
    }
  }, [isListening]);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscriptPart = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscriptPart += transcriptPart;
          }
        }

        setInterimTranscript(interimTranscriptPart);

        if (finalTranscript) {
          setTranscript((prev) => [
            ...prev,
            { text: finalTranscript, isFinal: true, sender: "user" },
          ]);

          // Simulate AI response
          setTimeout(() => {
            const aiResponse = "Yucca: " + finalTranscript;
            setTranscript((prev) => [
              ...prev,
              { text: aiResponse, isFinal: true, sender: "ai" },
            ]);
          }, 1000);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        if (isListening) recognition.start();
      };
    }
  }, [isListening]);

  const handleStartListening = () => {
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const handleStopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
    // setBorderTransition(0);
  };

  return (
    <div className="app-container">
      <div
        className="app-card"
        style={{
          borderWidth: isListening ? "5px" : "0px",
          borderColor: "red",
          borderStyle: "solid",
          transition: "border-width 0.3s ease",
        }}
      >
        <h1 className="app-title">Yucca GPT</h1>
        <div className="controls">
          {!isListening ? (
            <button onClick={handleStartListening} className="start-btn">
              <FaMicrophone className="icon" /> Start Listening
            </button>
          ) : (
            <button onClick={handleStopListening} className="stop-btn">
              <FaStop className="icon" /> Stop Listening
            </button>
          )}
        </div>

        {/* {isListening && (
          <div className="wave-container">
            <div
              className="wave"
              style={{ height: `${borderTransition}px` }}
            ></div>
            <div
              className="wave"
              style={{ height: `${borderTransition}px` }}
            ></div>
            <div
              className="wave"
              style={{ height: `${borderTransition}px` }}
            ></div>
          </div>
        )} */}

        <div className="chat-section">
          <div className="chat-box" ref={chatBoxRef}>
            {transcript.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${
                  message.sender === "user" ? "user" : "ai"
                }`}
              >
                {message.text}
              </div>
            ))}
            {interimTranscript && (
              <div className="chat-message user">{interimTranscript}</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Image to the right of the card */}
      <div className="image-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: "700px", height: "100vh" }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls enableZoom={false} /> {/* Disables zoom */}
          <ambientLight intensity={0.5} /> {/* Intensitas cahaya ambient */}
          {/* Cahaya Arah (Directional) */}
          <directionalLight position={[5, 5, 5]} intensity={1} />{" "}
          {/* Posisi dan intensitas cahaya arah */}
          <Model />
        </Canvas>
        <p className="image-caption">Yucca</p>
      </div>
    </div>
  );
};

export default App;
