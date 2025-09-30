import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Droplets, Menu, X } from 'lucide-react';
import waterIcon from '@/assets/water-icon.png';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img 
              src={waterIcon} 
              alt="JalSanrakshak AI" 
              className="h-8 w-8 transition-transform group-hover:scale-110" 
            />
            <span className="text-xl font-bold bg-gradient-water bg-clip-text text-transparent">
              JalSanrakshak AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            <Link 
              to="/assessment" 
              className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              Assessment
            </Link>
            <Link 
              to="/about" 
              className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              About
            </Link>
            <Link to="/assessment">
            <Button variant="water" size="sm">
              <Droplets className="w-4 h-4" />
              Start Assessment
            </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-4">
            <Link 
              to="/" 
              className="block text-foreground hover:text-primary transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/assessment" 
              className="block text-foreground hover:text-primary transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Assessment
            </Link>
            <Link 
              to="/about" 
              className="block text-foreground hover:text-primary transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Button variant="water" size="sm" className="w-full">
              <Droplets className="w-4 h-4" />
              Start Assessment
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;