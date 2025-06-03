import React, { useState } from 'react';
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  LogIn,
  MessageSquare,
  Sparkles,
  Shield
} from 'lucide-react';

function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };
    
    if (!formValues.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!formValues.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await auth?.login(formValues.email, formValues.password);
      toast.success("Welcome back! Login successful");
      navigate("/chat");
    } catch (e) {
      console.error(e);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 animate-float">
        <div className="w-3 h-3 bg-blue-400 rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-32 right-32 animate-float-delayed">
        <div className="w-2 h-2 bg-indigo-500 rounded-full opacity-40"></div>
      </div>
      <div className="absolute bottom-20 left-1/4 animate-float">
        <div className="w-4 h-4 bg-purple-400 rounded-full opacity-30"></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl mb-4 relative">
            <MessageSquare size={28} className="text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Shan-GPT
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-center space-x-2">
              <Shield size={20} className="text-blue-600" />
              <span className="text-slate-700 font-medium">Login</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center">
                  <Mail size={16} className="mr-2 text-slate-500" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
                    }`}
                    placeholder="Enter your email"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center">
                  <Lock size={16} className="mr-2 text-slate-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 pr-12 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 transform ${
                  loading
                    ? 'bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200/50 text-center">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <RouterLink 
                to="/signup" 
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
              >
                Sign up now
              </RouterLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;