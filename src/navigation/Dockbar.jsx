import { Settings, House } from 'lucide-react';
import { Bill, Users3 } from 'reicon-react';
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
                <button type="button" className={active === 'order' ? 'dock-active' : ''} onClick={() => setDockActive('order', '/service-orders')}>
                    <Bill size={18} />
                    <span className="dock-label">Ordenes</span>
                </button>

                <button type="button" className={active === 'chat' ? 'dock-active' : ''} onClick={() => setDockActive('chat', '/clients')}>
                    <Users3  size={18} />
                    <span className="dock-label">Clientes</span>
                </button>

                <button type="button" className={active === 'home' ? 'dock-active' : ''} onClick={() => setDockActive('home', '/home')} >
                    <House size={18} />
                    <span className="dock-label">Inicio</span>
                </button>

                <button type="button" className={active === 'config' ? 'dock-active' : ''} onClick={() => setDockActive('config', '/config')}>
                    <Settings size={18} />
                    <span className="dock-label">Configuración</span>
                </button>
            </div>
        </>
    );
}