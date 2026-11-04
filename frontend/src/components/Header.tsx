import React from 'react';
import { BarChart3, CircleDot, LogOut, ShoppingBag, UserRound } from 'lucide-react';

interface HeaderProps {
  currentMode: 'kasir' | 'owner';
  setMode: (mode: 'kasir' | 'owner') => void;
  isBackendConnected: boolean;
  onResetData: () => void;
  currentUser: { username: string; name: string; role: 'kasir' | 'owner' } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  setMode,
  isBackendConnected,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-lockup" aria-label="MJB SPORT POS">
          <div className="brand-mark"><CircleDot size={20} strokeWidth={2.2} /></div>
          <div className="brand-copy">
            <span className="brand-name">MJB SPORT</span>
            <span className="brand-context">Basketball & Sport · POS</span>
          </div>
        </div>

        {currentUser?.role === 'owner' ? (
          <nav className="mode-switch" aria-label="Pilih tampilan">
            <button
              type="button"
              className={currentMode === 'kasir' ? 'mode-button active' : 'mode-button'}
              onClick={() => setMode('kasir')}
              aria-pressed={currentMode === 'kasir'}
            >
              <ShoppingBag size={15} />
              Kasir
            </button>
            <button
              type="button"
              className={currentMode === 'owner' ? 'mode-button active' : 'mode-button'}
              onClick={() => setMode('owner')}
              aria-pressed={currentMode === 'owner'}
            >
              <BarChart3 size={15} />
              Owner
            </button>
          </nav>
        ) : (
          <div className="terminal-label">
            <ShoppingBag size={14} />
            Terminal kasir
          </div>
        )}

        <div className="session-controls">
          <span className={`connection-state ${isBackendConnected ? 'online' : 'offline'}`}>
            <span className="connection-dot" aria-hidden="true" />
            {isBackendConnected ? 'Tersambung' : 'Offline'}
          </span>
          {currentUser && (
            <div className="user-chip" title={currentUser.username}>
              <UserRound size={15} />
              <span>{currentUser.name}</span>
            </div>
          )}
          <button type="button" className="icon-button" onClick={onLogout} aria-label="Keluar" title="Keluar">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
