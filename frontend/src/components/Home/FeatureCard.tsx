import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-base text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;