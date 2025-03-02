import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HeroSection: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className=" text-2xl tracking-tight font-bold text-gray-900 sm:text-5xl md:text-6xl mt-16 mb-16">
            <span className="block text-5xl">GPT-based Model for Text Generation</span>
            <span className="block text-5xl"></span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Experience the power of transformer-based NLP with our cutting-edge GPT model trained on WikiText-2 dataset. Generate coherent and contextually relevant text with state-of-the-art accuracy.
          </p>
          <div className="mt-10 sm:flex sm:justify-center">
            <div className="rounded-md shadow">
              <Link
                to={user ? '/chat' : '/login'}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <a
                href="#features"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;