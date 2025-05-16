import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Link as MuiLink, 
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  // Divider,
  useTheme,
  useMediaQuery,
  CircularProgress
} from "@mui/material";
import { 
  PersonAdd as PersonAddIcon, 
  Visibility, 
  VisibilityOff,
  Email,
  Lock,
  Person,
  // Google,
  // GitHub
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Signup() {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', email: '', password: '' };
    
    if (!formValues.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
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
    } else if (formValues.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      await auth?.signup(formValues.name, formValues.email, formValues.password);
      toast.success("Account created successfully!");
      navigate("/chat");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const handleSocialSignup = (provider: string) => {
  //   toast.loading(`Signing up with ${provider}...`);
  //   // Implement social signup functionality here
  //   setTimeout(() => {
  //     toast.dismiss();
  //     toast.error(`${provider} signup not implemented yet`);
  //   }, 1500);
  // };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Background decoration */}
      <Box 
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00fffc 0%, #0050ff 100%)',
          opacity: 0.1,
          zIndex: 0
        }}
      />
      <Box 
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00fffc 0%, #0050ff 100%)',
          opacity: 0.1,
          zIndex: 0
        }}
      />

      {/* Signup container */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? 2 : 4,
          zIndex: 1
        }}
      >
        <Paper
          elevation={8}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 450,
            width: '100%',
            overflow: 'hidden',
            borderRadius: 3,
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              padding: 3,
              textAlign: 'center',
              backgroundColor: 'transparent',
              borderBottom: '1px solid',
              borderColor: theme.palette.divider,
            }}
          >
            <Typography variant="h4" fontWeight={700} color="primary">
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Join us today and get started
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ padding: 3 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                type="text"
                value={formValues.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formValues.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                margin="normal"
                variant="outlined"
              />
              
              {/* <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Typography> */}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                disableElevation
                sx={{
                  py: 1.5,
                  mt: 3,
                  mb: 2,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #00fffc 0%, #0050ff 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #00f2ef 0%, #0045e6 100%)',
                  },
                }}
                startIcon={loading ? undefined : <PersonAddIcon />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
              </Button>
            </form>
            
            {/* <Box sx={{ position: 'relative', my: 2 }}>
              <Divider>
                <Typography variant="caption" sx={{ px: 1, color: 'text.secondary' }}>
                  OR SIGN UP WITH
                </Typography>
              </Divider>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleSocialSignup('Google')}
                startIcon={<Google />}
                sx={{ 
                  py: 1,
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  '&:hover': {
                    borderColor: '#DB4437',
                    backgroundColor: 'rgba(219, 68, 55, 0.04)'
                  }
                }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleSocialSignup('GitHub')}
                startIcon={<GitHub />}
                sx={{ 
                  py: 1,
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  '&:hover': {
                    borderColor: '#333',
                    backgroundColor: 'rgba(51, 51, 51, 0.04)'
                  }
                }}
              >
                GitHub
              </Button>
            </Box> */}
          </Box>
          
          {/* Footer */}
          <Box
            sx={{
              p: 3,
              borderTop: '1px solid',
              borderColor: theme.palette.divider,
              textAlign: 'center',
              backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f9f9f9',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <MuiLink 
                component={RouterLink} 
                to="/login" 
                underline="none"
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default Signup;