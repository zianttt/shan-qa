// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import SignupForm from '../components/Auth/SignupForm';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex mb-4">
            <button
              className={`w-1/2 py-3 font-medium ${
                activeTab === 'login'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`w-1/2 py-3 font-medium ${
                activeTab === 'signup'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'login' ? (
              <LoginForm />
            ) : (
              <SignupForm 
                onSignupSuccess={() => {
                  setActiveTab('login');
                  alert('Account created successfully! Please log in.');
                }} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;