import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, getOrganizationMember } from "../../services/user/userService";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadUserData() {
            try {
                setLoading(true);
                const currentUser = await getCurrentUser();
                let userOrg = null;

                if (currentUser?.id) {
                    userOrg = await getOrganizationMember(currentUser.id).catch((err) => {
                        console.warn("No se pudo obtener la organización del usuario:", err);
                        return null;
                    });
                }

                if (isMounted) {
                    setUser(currentUser);
                    setOrganization(userOrg);
                    setError(null);
                }
            } catch (err) {
                console.error("Error al cargar datos en UserContext:", err);
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadUserData();

        return () => {
            isMounted = false;
        };
    }, []);

    const value = {
        user,
        organization,
        loading,
        error,
        setUser,
        setOrganization,
        refetchUserData: async () => {
            setLoading(true);
            try {
                const currentUser = await getCurrentUser();
                let userOrg = null;
                if (currentUser?.id) {
                    userOrg = await getOrganizationMember(currentUser.id).catch(() => null);
                }
                setUser(currentUser);
                setOrganization(userOrg);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser debe ser usado dentro de un UserProvider");
    }
    return context;
}

export const useUserContext = useUser;

export default UserContext;
