
import React from 'react';
import type { ContextMenuItem } from '../types';
import { Icons } from './Icon';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  closeMenu: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, closeMenu }) => {
  const style: React.CSSProperties = {
    top: `${y}px`,
    left: `${x}px`,
  };

  const handleAction = (item: ContextMenuItem) => {
    if(!item.disabled) {
        item.action();
    }
    closeMenu();
  };

  return (
    <div
      style={style}
      className="frost fixed bg-[var(--background-secondary)]/90 backdrop-blur-lg border border-[var(--border-color)] rounded-md shadow-2xl py-1 z-[100] text-white animate-fade-in-up w-52"
    >
      <ul>
        {items.map((item, index) => (
          <li
            key={index}
            onClick={() => handleAction(item)}
            className={`px-3 py-1.5 text-sm flex items-center gap-3 ${item.disabled ? 'text-[var(--gray)]/50 cursor-not-allowed' : 'hover:bg-[var(--accent)]/80 cursor-pointer'}`}
          >
            {item.icon || <div className="w-4 h-4"></div>}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
