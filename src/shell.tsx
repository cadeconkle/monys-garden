import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { Gardener } from "./household";

type ShellProps = {
  growingPlace: string;
  gardener: Gardener;
  children: ReactNode;
};

export function Shell({ growingPlace, gardener, children }: ShellProps) {
  return (
    <div className="app">
      <header className="mast">
        <div className="mast-place">
          <p className="wordmark">Mony&apos;s Garden</p>
          <p className="place">{growingPlace}</p>
        </div>
        <p className="gardener">{gardener.email}</p>
      </header>
      <nav className="surfaces" aria-label="Garden surfaces">
        <NavLink to="/catalog">Catalog</NavLink>
        <NavLink to="/" end>
          Garden
        </NavLink>
        <NavLink to="/shops">Shops</NavLink>
      </nav>
      {children}
    </div>
  );
}
