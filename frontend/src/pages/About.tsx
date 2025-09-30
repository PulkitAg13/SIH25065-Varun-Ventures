import React, { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle,
  X,
  Send,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const About: React.FC = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! 🌧 I'm your Jal Rakshak AI assistant. I can tell you more about this rainwater harvesting tool, its technology, benefits, and how it works. What would you like to know about our project?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if TTS is supported
  const isTtsSupported = () => {
    return 'speechSynthesis' in window;
  };

  // Speak text using TTS
  const speakText = (text: string) => {
    if (!ttsEnabled || !isTtsSupported()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Select a voice (prefer female voices for better clarity)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || voice.name.includes('Google UK English Female')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop TTS
  const stopTts = () => {
    if (isTtsSupported()) {
      window.speechSynthesis.cancel();
    }
  };

  // Toggle TTS
  const toggleTts = () => {
    if (ttsEnabled) {
      stopTts();
    }
    setTtsEnabled(!ttsEnabled);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage.trim());
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // Speak the AI response if TTS is enabled
      if (ttsEnabled) {
        speakText(aiResponse);
      }
    }, 1000);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to Jal Rakshak! I'm here to tell you all about our rainwater harvesting project. Would you like to know about the technology, benefits, how it works, or something specific?";
    }
    
    if (lowerMessage.includes('project') || lowerMessage.includes('about') || lowerMessage.includes('overview')) {
      return "This is an AI-powered Rooftop Rainwater Harvesting Assessment Tool designed to promote groundwater conservation. It helps users estimate RWH feasibility and provides personalized system recommendations using machine learning and local data analysis.";
    }
    
    if (lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('stack')) {
      return "Our tech stack includes: Frontend - React + Vite, Backend - FastAPI, Machine Learning - Scikit-learn, Database - PostgreSQL with PostGIS, and Visualization - Recharts. We use OpenStreetMap for geocoding and integrate multiple data sources for accurate analysis.";
    }
    
    if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage') || lowerMessage.includes('why')) {
      return "Rainwater harvesting benefits include: Water Security (reduced municipal dependence), Cost Savings (lower bills), Environmental Protection (reduced runoff), Urban Resilience (flood mitigation), and Climate Adaptation. It's sustainable and eco-friendly!";
    }
    
    if (lowerMessage.includes('work') || lowerMessage.includes('process') || lowerMessage.includes('how')) {
      return "The process: 1) Input your roof/location details, 2) We fetch local rainfall/soil data, 3) ML models analyze optimal solutions, 4) Get customized RWH recommendations, 5) Receive cost-benefit analysis. It's a 5-minute assessment!";
    }
    
    if (lowerMessage.includes('data') || lowerMessage.includes('source') || lowerMessage.includes('information')) {
      return "We use reliable data from: Indian Meteorological Department (rainfall), Central Ground Water Board (groundwater), National Bureau of Soil Survey (soil), OpenStreetMap (locations), and research publications for accurate calculations.";
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('developer') || lowerMessage.includes('varun')) {
      return "This project is developed by Team Varun Ventures, focused on sustainable water management solutions. We're committed to promoting water conservation through innovative technology and public participation.";
    }
    
    if (lowerMessage.includes('accuracy') || lowerMessage.includes('reliable') || lowerMessage.includes('precise')) {
      return "Our tool provides preliminary estimates based on standard parameters and verified data sources. While highly accurate for planning, we recommend consulting professionals for final implementation. Local conditions may affect actual results.";
    }
    
    if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('expensive')) {
      return "System costs range from ₹30,000-80,000 based on roof size. Most systems pay back in 3-5 years through water bill savings. Government subsidies may be available. The assessment gives you exact cost estimates!";
    }
    
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('assessment')) {
      return "Click 'Start Free Assessment' on the homepage! It takes 5 minutes and you'll get a comprehensive report with water savings, system design, costs, and installation guidance. No technical knowledge needed!";
    }
    
    if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
      return "For technical support: Email support@rwhindia.org or call +91-9876543210. We're here to help with any questions about rainwater harvesting or using our assessment tool!";
    }
    
    if (lowerMessage.includes('disclaimer') || lowerMessage.includes('legal') || lowerMessage.includes('regulation')) {
      return "This tool provides estimates for planning. Consult certified professionals for implementation. Check local regulations and obtain permits. Actual results may vary based on local conditions and maintenance.";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! I'm glad I could help you learn about rainwater harvesting. Every drop saved makes a difference for our planet! 💧 Feel free to ask anything else!";
    }

    return "I'd love to tell you more about our rainwater harvesting project! I can explain the technology, benefits, data sources, team information, or how the assessment works. What specifically interests you?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      {/* Chatbot FAB */}
      {!chatbotOpen && (
        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer z-50 hover:scale-110 transition-transform duration-200"
          onClick={() => setChatbotOpen(true)}
          title="Chat with Jal Rakshak AI"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chatbot Modal */}
      {chatbotOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Jal Rakshak AI Assistant</h3>
              <p className="text-blue-100 text-sm">Learn About Our Project</p>
            </div>
            <div className="flex items-center gap-2">
              {/* TTS Toggle Button */}
              {isTtsSupported() && (
                <button
                  onClick={toggleTts}
                  className={`p-2 rounded-full transition-colors ${
                    ttsEnabled 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={ttsEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => {
                  stopTts();
                  setChatbotOpen(false);
                }}
                className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-200' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about our project..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Learn about technology and benefits
              </p>
              {isTtsSupported() && (
                <p className="text-xs text-gray-500">
                  TTS: {ttsEnabled ? 'ON' : 'OFF'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* About / Project Overview */}
          <Card className="glass-card border-0 shadow-water">
            <CardHeader>
              <CardTitle>About This Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="text-lg font-semibold">Project Overview</h3>
              <p className="text-muted-foreground">
                This Rooftop Rainwater Harvesting Assessment Tool is designed to promote public participation in groundwater
                conservation by enabling users to estimate the feasibility of rooftop rainwater harvesting (RTRWH) and
                artificial recharge at their locations.
              </p>
            </CardContent>
          </Card>

          {/* How it works / Tech stack / Benefits / Data sources */}
          <Card className="glass-card border-0 shadow-water">
            <CardHeader>
              <CardTitle>How It Works & Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">How It Works</h4>
                    <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                      <li><span className="text-foreground font-medium">Input Analysis</span>: We analyze your roof characteristics and location</li>
                      <li><span className="text-foreground font-medium">Data Processing</span>: Fetch local rainfall, soil, and groundwater data</li>
                      <li><span className="text-foreground font-medium">ML Modeling</span>: Use machine learning to predict optimal solutions</li>
                      <li><span className="text-foreground font-medium">Recommendations</span>: Provide customized RWH system recommendations</li>
                      <li><span className="text-foreground font-medium">Economic Analysis</span>: Calculate costs, savings, and payback period</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Technology Stack</h4>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li><strong className="text-foreground">Frontend</strong>: React + Vite Web Application</li>
                      <li><strong className="text-foreground">Backend</strong>: FastAPI RESTful API</li>
                      <li><strong className="text-foreground">Machine Learning</strong>: Scikit-learn models</li>
                      <li><strong className="text-foreground">Data Storage</strong>: PostgreSQL with PostGIS</li>
                      <li><strong className="text-foreground">Visualization</strong>: Recharts</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Benefits of Rainwater Harvesting</h4>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>💧 <strong className="text-foreground">Water Security</strong>: Reduce dependence on municipal supply</li>
                      <li>💰 <strong className="text-foreground">Cost Savings</strong>: Lower water bills and reduced energy costs</li>
                      <li>🌱 <strong className="text-foreground">Environmental Protection</strong>: Reduce runoff and recharge groundwater</li>
                      <li>🏙️ <strong className="text-foreground">Urban Resilience</strong>: Mitigate urban flooding during heavy rains</li>
                      <li>🌍 <strong className="text-foreground">Climate Adaptation</strong>: Build resilience to climate change impacts</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Data Sources</h4>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Indian Meteorological Department (Rainfall data)</li>
                      <li>Central Ground Water Board (Groundwater data)</li>
                      <li>National Bureau of Soil Survey (Soil data)</li>
                      <li>OpenStreetMap (Geocoding services)</li>
                      <li>Research publications and field studies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="glass-card border-0 shadow-water">
            <CardHeader>
              <CardTitle>Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                <p>
                  This tool provides preliminary estimates based on standard parameters and available data. For detailed design and
                  implementation, consult with certified rainwater harvesting professionals. Actual results may vary based on local
                  conditions, construction quality, and maintenance practices.
                </p>
                <p className="mt-2">
                  Always check local regulations and obtain necessary permits before implementing any rainwater harvesting system.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Developed for sustainable water management | © 2025 Team Varun Ventures</p>
            <p>For technical support: support@rwhindia.org | Phone: +91-9876543210</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;