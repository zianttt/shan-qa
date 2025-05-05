import { AppBar, Toolbar } from "@mui/material";
import Logo from "./shared/Logo";
import { useAuth } from "../contexts/AuthContext";
import NavigationLink from "./shared/NavigationLink";

function Header() {
  const auth = useAuth();
  return (
    <AppBar
      sx={{ bgcolor: "transparent ", position: "static", boxShadow: "none" }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Logo />
        <div>
          {auth?.isLoggedIn ? (
            <>
              <NavigationLink
                bg="#00fffc"
                to="/chat"
                text="Go To Chat"
                textColor="black"
              />
              <NavigationLink
                bg="#51538f"
                to="/"
                text="Log Out"
                textColor="white"
                onClick={auth.logout}
              />
            </>
          ) : (
            <>
              <NavigationLink
                bg="#00fffc"
                to="/login"
                text="Log In"
                textColor="black"
              />
              <NavigationLink
                bg="#51538f"
                to="/signup"
                text="Sign Up"
                textColor="white"
              />
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
