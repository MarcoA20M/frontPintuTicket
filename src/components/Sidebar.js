import React from 'react';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">P</span>
                    <span>Pintu<span style={{ fontWeight: 400 }}>mex</span></span>
                </div>
                <div className="anniversary">
                    50 años CONTIGO
                </div>
            </div>
            <nav>
                <ul className="sidebar-nav">
                    <li className="sidebar-nav-item">
                        <a href="#" className="sidebar-nav-link">
                            <span className="sidebar-nav-link-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                            Historial de tickets
                        </a>
                    </li>
                    <li className="sidebar-nav-item">
                        <a href="#" className="sidebar-nav-link active">
                            <span className="sidebar-nav-link-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-printer"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            </span>
                            Falla de impresora
                        </a>
                    </li>
                    <li className="sidebar-nav-item">
                        <a href="#" className="sidebar-nav-link">
                            <span className="sidebar-nav-link-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-hard-drive"><line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>
                            </span>
                            Falla de softland
                        </a>
                    </li>
                    <li className="sidebar-nav-item">
                        <a href="#" className="sidebar-nav-link">
                            <span className="sidebar-nav-link-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </span>
                            Necesito papel tamaño
                        </a>
                    </li>
                    <li className="sidebar-nav-item">
                        <a href="#" className="sidebar-nav-link">
                            <span className="sidebar-nav-link-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-wifi-off"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.07A16 16 0 0 1 22.58 9"></path><path d="M2 9a15.94 15.94 0 0 1 6.31-2.92"></path><line x1="8.53" y1="16.14" x2="8.53" y2="16.15"></line><line x1="16" y1="16" x2="16" y2="16"></line><line x1="12.35" y1="12.35" x2="12.35" y2="12.36"></line></svg>
                            </span>
                            No tengo internet
                        </a>
                    </li>
                    <li className="sidebar-nav-item">
                        <a href="#" className="sidebar-nav-link">
                            <span className="sidebar-nav-link-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </span>
                            Necesito que timbren estas facturas
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;