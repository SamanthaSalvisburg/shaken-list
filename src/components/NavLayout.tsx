import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function NavLayout() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
