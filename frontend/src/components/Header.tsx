import { AppBar, Toolbar } from '@mui/material'
import Logo from './shared/Logo'
import { useAuth } from '../context/AuthContext'
import NavLink from './shared/NavLink';

const Header = () => {
  const auth = useAuth();
  return (
  <AppBar 
    sx={{ bgcolor: "transparent ", position: "static", boxShadow: "none" }}>
    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Logo />
        <div>
          {auth?.isLoaggedIn ? (
            <>
              <NavLink
                to="/chat"
                bg="#00fffc"
                text="Chat"
                textColor="black"
              />
              <NavLink
                to="/home"
                bg="#51538f"
                text="Log Out"
                textColor="white"
                onClick={auth.logout}
              />
            </>
            
          ) : (
            <>
              <NavLink
                to="/login"
                bg="#00fffc"
                text="Login"
                textColor="black"
              />
              <NavLink
                to="/signup"
                bg="#51538f"
                text="Sign Up"
                textColor="white"
              />
            </>
          )
          }
        </div>
    </Toolbar>
  </AppBar>) 
}

export default Header