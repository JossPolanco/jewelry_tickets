import { useNavigate, Outlet } from "react-router";
import { useEffect, useState } from "react";
import { supabaseClient } from "./supabase";

export default function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function checkSession() {
            const { data: { session }, } = await supabaseClient.auth.getSession();
            if (!isMounted) return;

            if (!session) {
                navigate("/");
            }

            setLoading(false);
        }

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}