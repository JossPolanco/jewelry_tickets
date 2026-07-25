import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useUser } from "../utils/context/UserContext";

export default function Home() {
    const navigate = useNavigate();

    // const { user, organization, loading, error } = useUser();    ;

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">
            {/* HEADER CON ATTS */}
           
        </div>
    );
}
