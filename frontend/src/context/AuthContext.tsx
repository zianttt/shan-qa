import { createContext, useContext, useEffect, useState } from "react";
import { checkAuthStatus, loginUser, logoutUser, signupUser } from "../helpers/api";

type User = {
    name: string;
    email: string;
}

type UserAuth = {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}
const AuthContext = createContext<UserAuth | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setisLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 

    useEffect(() => {
        async function checkStatus() {
            try {
                const data = await checkAuthStatus();
                if (data) {
                    setUser({ name: data.name, email: data.email });
                    setisLoggedIn(true);
                } else {
                    setUser(null);
                    setisLoggedIn(false);
                }
            } catch (err) {
                console.error("Error checking auth status:", err);
                setUser(null);
                setisLoggedIn(false);
            } finally {
                setIsLoading(false); // Set loading to false when done
            }
        }
        checkStatus();
    }, []);

    const login = async (email: string, password: string) => {
        const data = await loginUser(email, password);
        if (data) {
            setUser({ name: data.name, email: data.email });
            setisLoggedIn(true);
        } else {
            throw new Error("Failed to login");
        }
    }

    const signup = async (name: string, email: string, password: string) => {
        const data = await signupUser(name, email, password);
        console.log("Login data:", data);
        if (data) {
            setUser({ name: data.name, email: data.email });
            setisLoggedIn(true);
        } else {
            throw new Error("Failed to signup");
        }
    }

    const logout = async () => {
        const data = await logoutUser();
        if (data) {
            setUser(null);
            setisLoggedIn(false);
        } else {
            throw new Error("Failed to logout");
        }
    }

    const value = {
        isLoggedIn,
        isLoading,
        user,
        login,
        signup,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };