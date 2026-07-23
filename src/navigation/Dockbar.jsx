import { Settings, House, PenLine, MessageCircleMore } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';

export default function Dockbar({ children }) {
    const navigate = useNavigate();
    const [active, setActive] = useState('');

    const setDockActive = (section, endpoint) => {
        setActive(section);
        navigate(endpoint);
    };

    return (
        <>
            {children}

            <div className="dock">
                <button type="button" className={active === 'drawing' ? 'dock-active' : ''} onClick={() => setDockActive('drawing', '/drawing')}>
                    <PenLine size={18} />
                    <span className="dock-label">Dibujo</span>
                </button>

                <button type="button" className={active === 'chat' ? 'dock-active' : ''} onClick={() => setDockActive('chat', '/chat')}>
                    <MessageCircleMore size={18} />
                    <span className="dock-label">Chat</span>
                </button>

                <button type="button" className={active === 'home' ? 'dock-active' : ''} onClick={() => setDockActive('home', '/home')} >
                    <House size={18} />
                    <span className="dock-label">Hogar</span>
                </button>

                <button type="button" className={active === 'config' ? 'dock-active' : ''} onClick={() => setDockActive('config', '/config')}>
                    <Settings size={18} />
                    <span className="dock-label">Configuración</span>
                </button>
            </div>
        </>
    );
}