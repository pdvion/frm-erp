"use client";

import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { HelpButton } from "@/components/HelpButton";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  backHref?: string;
  module?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, icon, backHref = "/dashboard", module, children, actions }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href={backHref} className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              {icon}
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CompanySwitcher />
            <Link
              href="/docs"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Documentação"
            >
              <BookOpen className="w-5 h-5" />
            </Link>
            {module && <HelpButton module={module} />}
            <NotificationBell />
            {actions}
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}
