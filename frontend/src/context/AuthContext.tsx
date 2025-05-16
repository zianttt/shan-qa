import { createContext, useContext, useEffect, useState } from "react";
import { checkAuthStatus, loginUser, logoutUser, signupUser } from "../helpers/api";

type User = {
    name: string;
    email: string;
}

type UserAuth = {
    isLoaggedIn: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}
const AuthContext = createContext<UserAuth | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoaggedIn, setIsLoaggedIn] = useState(false);

    useEffect(() => {
        // fetch user cookies
        async function checkStatus() {
            const data = await checkAuthStatus();
            if (data) {
                setUser({ name: data.name, email: data.email });
                setIsLoaggedIn(true);
            } else {
                setUser(null);
                setIsLoaggedIn(false);
            }
        }
        checkStatus().catch((err) => {
            console.error("Error checking auth status:", err);
        });
    }, []);

    const login = async (email: string, password: string) => {
        const data = await loginUser(email, password);
        if (data) {
            setUser({ name: data.name, email: data.email });
            setIsLoaggedIn(true);
        } else {
            throw new Error("Failed to login");
        }
    }

    const signup = async (name: string, email: string, password: string) => {
        const data = await signupUser(name, email, password);
        console.log("Login data:", data);
        if (data) {
            setUser({ name: data.name, email: data.email });
            setIsLoaggedIn(true);
        } else {
            throw new Error("Failed to signup");
        }
    }

    const logout = async () => {
        const data = await logoutUser();
        if (data) {
            setUser(null);
            setIsLoaggedIn(false);
        } else {
            throw new Error("Failed to logout");
        }
    }

    const value = {
        isLoaggedIn,
        user,
        login,
        signup,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };