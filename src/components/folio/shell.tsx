import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Wordmark() {
  return (
    <Link to="/" className="rounded-md font-serif text-2xl text-paper">
      Folio
    </Link>
  );
}

export function Page({
  children,
  width = "desk",
}: {
  children: ReactNode;
  width?: "desk" | "sheet" | "letter";
}) {
  const max = width === "letter" ? "max-w-xl" : width === "sheet" ? "max-w-3xl" : "max-w-5xl";
  return <main className={`mx-auto ${max} px-5 py-6 md:px-8 md:py-10`}>{children}</main>;
}
