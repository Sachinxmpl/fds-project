import React from 'react';
import { FiCode, FiBarChart2, FiCpu, FiGlobe } from 'react-icons/fi';
import HeroSection from './HeroSection';
import FeatureCard from './FeatureCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomePage: React.FC = () => {

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const features = [
        {
            title: 'Advanced NLP Architecture',
            description: 'Powered by transformer-based GPT architecture with multi-head self-attention and feedforward layers.',
            icon: <FiCpu className="h-6 w-6 text-white" />,
        },
        {
            title: 'WikiText-2 Dataset',
            description: 'Trained on high-quality text data extracted from Wikipedia articles for coherent text generation.',
            icon: <FiGlobe className="h-6 w-6 text-white" />,
        },
        {
            title: 'Optimized Performance',
            description: 'Uses Adam optimizer and Cross-Entropy loss for high-accuracy next-character prediction.',
            icon: <FiBarChart2 className="h-6 w-6 text-white" />,
        },
        {
            title: 'Developer-Friendly',
            description: 'Simple API integration with comprehensive documentation and examples.',
            icon: <FiCode className="h-6 w-6 text-white" />,
        },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="bg-white">
            <div className="relative overflow-hidden">
                <div className="relative pt-6 pb-16 sm:pb-24">
                    {/* Fixed Navbar */}
                    <nav className="fixed top-0 left-16 right-16 z-10 bg-white shadow-sm-">
                        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                            {/* Left Section: Logo and Links */}
                            <div className="flex items-center flex-1">
                                <div className="flex items-center justify-between w-full">
                                    <a href="/" className="text-2xl font-bold text-blue-500">
                                        GPT Model
                                    </a>
                                    <div className="hidden md:flex md:items-center md:ml-12 md:space-x-12">
                                        <a href="#features" className="font-medium text-gray-600 hover:text-gray-900 text-md">
                                            Features
                                        </a>
                                        <a href="#about" className="font-medium text-gray-600 hover:text-gray-900 text-md">
                                            About
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section: Auth Buttons and Avatar */}
                            <div className="hidden md:flex md:items-center md:space-x-8 mr-4 ml-6">
                                {user ? (
                                    // Logged In: Logout button followed by Avatar
                                    <>
                                        <button
                                            onClick={handleLogout}
                                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-md font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Logout
                                        </button>
                                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                                            {user.username.slice(0, 2).toUpperCase()}
                                        </div>
                                    </>
                                ) : (
                                    // Logged Out: Log in, Sign up buttons followed by Avatar
                                    <>
                                        <span className="inline-flex rounded-md shadow-md">
                                            <a
                                                href="/login"
                                                className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                                            >
                                                Log in
                                            </a>
                                        </span>
                                        <span className="inline-flex rounded-md shadow-md">
                                            <a
                                                href="/signup"
                                                className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Sign up
                                            </a>
                                        </span>
                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                                            NA
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </nav>

                    {/* Add padding-top to prevent content overlap */}
                    <div className="pt-20">
                        <HeroSection />
                    </div>
                </div>
            </div>

            <div id="features" className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className=" text-blue-500 font-semibold tracking-wide uppercase text-2xl">Features</h2>
                        {/* <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Cutting-Edge Language Processing
            </p> */}
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                            Our GPT-based language model offers state-of-the-art text generation capabilities powered by advanced transformer architecture.
                        </p>
                    </div>

                    <div className="mt-10">
                        <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={index}
                                    title={feature.title}
                                    description={feature.description}
                                    icon={feature.icon}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div id="about" className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-2xl text-blue-500 font-semibold tracking-wide uppercase">About the Project</h2>
                        <p className="mt-8 mb-10 text-3xl leading-8 font-semibold tracking-tight text-gray-900 sm:text-4xl">
                            Our GPT-Based Language Model
                        </p>
                    </div>
                    <div className="mt-10">
                        <div className="prose prose-blue prose-lg text-gray-500 mx-auto">
                            <p>
                                This project focuses on developing a GPT-based language model trained on the WikiText-2 dataset. Our objective is to generate coherent and contextually relevant text sequences using state-of-the-art NLP techniques.
                            </p>
                            <p>
                                The model utilizes a transformer-based architecture with multi-head self-attention and feedforward layers. It's optimized using the Adam optimizer and Cross-Entropy loss, achieving impressive results in next-character prediction tasks.
                            </p>
                            <p>
                                The WikiText-2 dataset provides clean, high-quality text data extracted from Wikipedia articles, making it ideal for training sophisticated language models like ours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-white">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
                    <div className="flex justify-center space-x-6 md:order-2">
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">GitHub</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </a>
                    </div>
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center text-base text-gray-400">
                            &copy; 2025 GPT Language Model Project, Sujal Gyawali, Subham Gyawali, Sachin Khatri
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;