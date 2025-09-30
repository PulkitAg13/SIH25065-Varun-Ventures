import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Users, 
  Home as HomeIcon, 
  Layers, 
  Calendar, 
  Calculator,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Droplets,
  Loader2,
  MessageCircle,
  X,
  Send,
  Volume2,
  VolumeX
} from 'lucide-react';
import WaterTank from '@/components/WaterTank';
import Navbar from '@/components/Navbar';
import MapLocator from '@/components/MapLocator';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface FormData {
  name: string;
  location: string;
  dwellers: string;
  roofArea: string;
  openSpace: string;
  roofType: string;
  roofAge: string;
  soilType: string;
  latitude: number | null;
  longitude: number | null;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Chatbot state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! 🌧 I'm here to assist you with your rainwater harvesting assessment. I can help you understand the form fields, calculate measurements, or answer questions about the assessment process. What would you like to know?",
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
  useEffect(() => {
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
      return "Hello! I'm your assessment assistant. I can help you fill out this form, understand the questions, or calculate your rainwater harvesting potential. What do you need help with?";
    }
    
    if (lowerMessage.includes('name') || lowerMessage.includes('full name')) {
      return "The 'Full Name' field is for the primary contact person. This helps us personalize your assessment report. You can enter your complete name as you'd like it to appear on the report.";
    }
    
    if (lowerMessage.includes('dweller') || lowerMessage.includes('people') || lowerMessage.includes('family')) {
      return "Number of dwellers means how many people live in your house. This helps calculate your daily water consumption and determine the optimal tank size for your needs.";
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('map')) {
      return "Your location helps us fetch local rainfall data and climate information. Use the 'View on Map' button to verify your coordinates. Accurate location ensures precise water harvesting calculations.";
    }
    
    if (lowerMessage.includes('roof area') || lowerMessage.includes('roof') || lowerMessage.includes('measure')) {
      return "Roof area is the total surface area that collects rainwater. Use Google Earth's ruler tool (click 'Measure on Google Earth') or estimate based on your house dimensions. Average Indian homes have 80-150 sqm roof area.";
    }
    
    if (lowerMessage.includes('open space') || lowerMessage.includes('space') || lowerMessage.includes('area')) {
      return "Open space is where you can install rainwater harvesting components like storage tanks, filters, and recharge pits. This helps us design a system that fits your available area.";
    }
    
    if (lowerMessage.includes('roof type') || lowerMessage.includes('concrete') || lowerMessage.includes('tiled')) {
      return "Different roof materials have different water collection efficiencies. Concrete (90%), Tiled (85%), Metal (95%), Asbestos (80%), Thatched (70%). Choose the material that matches your roof.";
    }
    
    if (lowerMessage.includes('roof age') || lowerMessage.includes('old') || lowerMessage.includes('year')) {
      return "Roof age helps assess water quality. Newer roofs typically provide cleaner water. Older roofs might need additional filtration. This ensures we recommend the right treatment system.";
    }
    
    if (lowerMessage.includes('calculate') || lowerMessage.includes('potential') || lowerMessage.includes('save')) {
      return "Based on roof area and local rainfall, we calculate: Harvestable water = Roof Area × Rainfall × Runoff Coefficient. A 100 sqm roof in 1000mm rainfall area can harvest ~75,000 liters annually!";
    }
    
    if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('expensive')) {
      return "System costs depend on roof area and tank size: ₹30,000-80,000. Payback period is typically 3-5 years through water bill savings. The assessment will give you exact cost estimates.";
    }
    
    if (lowerMessage.includes('next') || lowerMessage.includes('step') || lowerMessage.includes('continue')) {
      return "Click 'Next Step' to proceed through the form. You can always go back using 'Previous'. Take your time to provide accurate information for the best recommendations.";
    }
    
    if (lowerMessage.includes('submit') || lowerMessage.includes('generate') || lowerMessage.includes('assessment')) {
      return "After completing all steps, click 'Generate Assessment' to get your personalized report with water savings, system design, cost analysis, and installation guidance.";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! I'm here to help you through the assessment. Every detail you provide helps create a more accurate rainwater harvesting plan for your home! 💧";
    }

    return "I can help you understand the assessment form fields, calculate your water harvesting potential, or explain how the system works. Could you tell me which part you need help with?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    dwellers: '',
    roofArea: '',
    openSpace: '',
    roofType: '',
    roofAge: '',
    soilType: '',
    latitude: null,
    longitude: null
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Compute form completion progress for WaterTank (do not require lat/lng to hit 100%)
  const formCompletion = (() => {
    const checks = [
      !!formData.name.trim(),
      !!formData.location.trim(),
      !!formData.dwellers.toString().trim(),
      !!formData.roofArea.toString().trim(),
      !!formData.openSpace.toString().trim(),
      !!formData.roofType.trim(),
      !!formData.roofAge.toString().trim(),
      // soilType excluded from progress (no current input field)
    ];
    const filled = checks.filter(Boolean).length;
    return (filled / checks.length) * 100;
  })();

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [geoLoading, setGeoLoading] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const lastGeocodedRef = useRef<string>('');

  // Geocode helper using OpenStreetMap Nominatim (no API key required)
  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
      }
      console.warn('Geocoding failed: no results');
      return null;
    } catch (e) {
      console.error('Geocoding error:', e);
      return null;
    }
  }

  // Hide map preview when the address changes from the last geocoded string
  useEffect(() => {
    const address = formData.location.trim();
    if (address !== lastGeocodedRef.current) {
      setShowMapPreview(false);
    }
  }, [formData.location]);

  // On-demand geocoding when user clicks the button
  const handleViewOnMap = async () => {
    const address = formData.location.trim();
    if (!address) return;
    // If we already have coords for this exact address, just show the map
    if (
      formData.latitude != null &&
      formData.longitude != null &&
      lastGeocodedRef.current === address
    ) {
      setShowMapPreview(true);
      return;
    }
    setGeoLoading(true);
    const result = await geocodeAddress(address);
    setGeoLoading(false);
    if (result) {
      setFormData(prev => ({ ...prev, latitude: result.lat, longitude: result.lng }));
      lastGeocodedRef.current = address;
      setShowMapPreview(true);
      toast({ title: 'Location found', description: `${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}` });
    } else {
      toast({ title: 'Location not found', description: 'Please refine the address and try again.', variant: 'destructive' });
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        dwellers: Number(formData.dwellers) || 0,
        roof_area: Number(formData.roofArea) || 0,
        open_space: Number(formData.openSpace) || 0,
        roof_type: formData.roofType || 'concrete',
        roof_age: Number(formData.roofAge) || 0,
      };
      const created = await api.createAssessment(payload);
      navigate(`/results?id=${created.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Please try again later.';
      console.error('Submit failed', e);
      toast({ title: 'Submission failed', description: msg });
    }
  };

  const generateGoogleEarthLink = () => {
    // If we have precise coordinates, construct a direct "fly-to" URL so Earth centers and zooms in
    if (formData.latitude != null && formData.longitude != null) {
      const lat = formData.latitude.toFixed(6);
      const lng = formData.longitude.toFixed(6);
      // Altitude in meters (lower = closer). 150m is a good rooftop-level view.
      const altitude = 9000;
      // Google Earth Web camera syntax: @lat,lng,altitude"a",0d,0h,0t,0r
      // a=altitude, d=distance? (kept 0), h=heading, t=tilt, r=roll — zeros keep a top-down north-facing view
      return `https://earth.google.com/web/@${lat},${lng},${altitude}a,0d,0h,0t,0r`;
    }
    // Otherwise, fall back to a text search
    if (formData.location) {
      const encodedLocation = encodeURIComponent(formData.location);
      return `https://earth.google.com/web/search/${encodedLocation}`;
    }
    return 'https://earth.google.com/web/';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="glass-card border-0 shadow-water">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-water rounded-lg flex items-center justify-center text-white mb-4">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Basic Information</CardTitle>
              <CardDescription>Let's start with some basic details about you and your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Number of dwellers (moved under Full Name) */}
              <div className="space-y-2">
                <Label htmlFor="dwellers" className="text-sm font-medium">Number of dwellers</Label>
                <Input
                  id="dwellers"
                  type="number"
                  placeholder="e.g., 4"
                  value={formData.dwellers}
                  onChange={(e) => updateFormData('dwellers', e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-red-500">* No. of people living in the house</p>
              </div>

              {/* Location at bottom with inline map when available */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location/Address
                </Label>
                <Textarea
                  id="location"
                  placeholder="Enter your complete address including city, state, and pincode"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="bg-background/50 resize-none"
                  rows={3}
                />
                
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="water"
                    size="sm"
                    onClick={handleViewOnMap}
                    disabled={!formData.location.trim() || geoLoading}
                    className="inline-flex items-center gap-2"
                  >
                    {geoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    View on Map
                  </Button>
                  {!formData.location.trim() && (
                    <span className="text-xs text-muted-foreground">Enter an address to enable</span>
                  )}
                </div>

                {showMapPreview && formData.latitude != null && formData.longitude != null && (
                  <div className="pt-2">
                    <MapLocator
                      height={220}
                      position={[formData.latitude, formData.longitude]}
                      interactive={false}
                      showLocateButton={false}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="glass-card border-0 shadow-water">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-water rounded-lg flex items-center justify-center text-white mb-4">
                <HomeIcon className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Property Details</CardTitle>
              <CardDescription>Tell us about your roof and available space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Helper: Google Earth CTA (above roof area) */}
              <div className="rounded-lg p-4 bg-background/50 border border-dashed">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">Don't know your roof area?</p>
                    <p className="text-sm text-muted-foreground">Open Google Earth to measure your rooftop with the ruler tool.</p>
                  </div>
                  <Button
                    onClick={() => window.open(generateGoogleEarthLink(), '_blank')}
                    variant="water"
                    className="inline-flex items-center gap-2"
                  >
                    Measure on Google Earth
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roofArea" className="text-sm font-medium flex items-center gap-2">
                  Roof Area (sq. meters)
                  
                </Label>
                <Input
                  id="roofArea"
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.roofArea}
                  onChange={(e) => updateFormData('roofArea', e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Don't know your roof area? Click "Measure on Google Earth" to calculate it accurately
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openSpace" className="text-sm font-medium">Available Open Space (sq. meters)</Label>
                <Input
                  id="openSpace"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.openSpace}
                  onChange={(e) => updateFormData('openSpace', e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground text-red-600">
                  * Open Space is the area in which you want Rainwater Harvesting.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="glass-card border-0 shadow-water">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-water rounded-lg flex items-center justify-center text-white mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Roof Specifications</CardTitle>
              <CardDescription>Details about your roof type and condition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Roof Type</Label>
                <Select value={formData.roofType} onValueChange={(value) => updateFormData('roofType', value)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select your roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="tiled">Tiled</SelectItem>
                    <SelectItem value="metal">Metal Sheet</SelectItem>
                    <SelectItem value="asbestos">Asbestos</SelectItem>
                    <SelectItem value="thatched">Thatched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              

              <div className="space-y-2">
                <Label htmlFor="roofAge" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Roof Age (years)
                </Label>
                <Input
                  id="roofAge"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.roofAge}
                  onChange={(e) => updateFormData('roofAge', e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Helps us assess the structural integrity and water quality considerations
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="glass-card border-0 shadow-water">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-water rounded-lg flex items-center justify-center text-white mb-4">
                <Calculator className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Review & Calculate</CardTitle>
              <CardDescription>Review your information and generate your personalized assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Number of dwellers:</strong> {formData.dwellers}</div>
                <div><strong>Roof Area:</strong> {formData.roofArea} sq.m</div>
                <div><strong>Open Space:</strong> {formData.openSpace} sq.m</div>
                <div><strong>Roof Type:</strong> {formData.roofType}</div>
                <div><strong>Roof Age:</strong> {formData.roofAge} years</div>
                
              </div>
              <div className="pt-4 border-t">
                <div><strong>Location:</strong></div>
                <p className="text-sm text-muted-foreground mt-1">{formData.location}</p>
                {(formData.latitude != null && formData.longitude != null) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)} (used for Google Earth)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      {/* Chatbot FAB */}
      {!chatbotOpen && (
        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer z-50 hover:scale-110 transition-transform duration-200"
          onClick={() => setChatbotOpen(true)}
          title="Chat with Assessment Assistant"
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
              <h3 className="font-semibold">Assessment Assistant</h3>
              <p className="text-blue-100 text-sm">Get Help with Form Fields</p>
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
                placeholder="Ask about form fields..."
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
                Ask about form fields and calculations
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Rainwater Harvesting <span className="bg-gradient-water bg-clip-text text-transparent">Assessment</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete this quick assessment to get personalized recommendations for your rainwater harvesting system
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Header */}
              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {currentStep} of {totalSteps}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>

              {/* Form Step */}
              {renderStep()}

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {currentStep === totalSteps ? (
                  <Button
                    variant="water"
                    onClick={handleSubmit}
                    className="flex items-center gap-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Generate Assessment
                  </Button>
                ) : (
                  <Button
                    variant="water"
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Water Tank Progress Visualization (at top) */}
              <Card className="glass-card border-0 shadow-glow">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    Assessment Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <WaterTank progress={formCompletion} />
                  <p className="text-sm text-center text-muted-foreground">
                    Your form is {Math.round(formCompletion)}% complete. 
                    Fill in more details to improve accuracy.
                  </p>
                </CardContent>
              </Card>

              {/* Quick Tips below tank */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Accurate roof measurements improve calculation precision.</p>
                  <p>• Consider all roof surfaces including garages and sheds.</p>
                  <p>• Newer roofs can improve water collection efficiency.</p>
                  <p>• Location helps auto-fetch local rainfall data.</p>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;