"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MENU_SIDEBAR } from "../config/layout-1.config"; // <- import your config

// Recursive Sidebar Item
function SidebarItem({ item, depth = 0 }) {
  const [open, setOpen] = useState(false);

  // Skip headings / separators
  if (item.heading) {
    return (
      <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">
        {item.heading}
      </div>
    );
  }

  if (item.separator) {
    return <hr className="my-2 border-gray-300" />;
  }

  const Icon = item.icon || null;

  return (
    <div className="w-full">
      {/* Parent item */}
      <button
        onClick={() => item.children && setOpen(!open)}
        className={`flex w-full items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 ${
          depth === 0 ? "font-medium" : "pl-8 text-sm"
        }`}
      >
        {Icon && <Icon size={18} className="text-gray-600" />}
        {item.path ? (
          <Link href={item.path} className="flex-1 text-left">
            {item.title}
          </Link>
        ) : (
          <span className="flex-1 text-left">{item.title}</span>
        )}

        {item.children && (
          <span>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        )}
      </button>

      {/* Children */}
      {item.children && open && (
        <div className="ml-2 border-l border-gray-200">
          {item.children.map((child, idx) => (
            <SidebarItem key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md h-screen overflow-y-auto">
      <div className="p-4 text-lg font-bold border-b">Admin Panel</div>

      <nav className="p-2">
        {MENU_SIDEBAR.map((item, idx) => (
          <SidebarItem key={idx} item={item} />
        ))}
      </nav>
    </aside>
  );
}
