"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageLayout } from "./page-layout";

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  breadcrumb: string;
  iconName: string;
  iconBgColor: string;
}

export function DocsLayout({
  children,
  title,
  description,
  breadcrumb,
  iconName,
  iconBgColor,
}: DocsLayoutProps) {
  return (
    <PageLayout>
      {/* Docs Navigation Breadcrumb */}
      <div className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 text-sm sm:px-6">
          <Link href="/docs" className="text-stone-500 hover:text-retro-black">
            Docs
          </Link>
          <Icon name="solar:alt-arrow-right-linear" size={14} className="text-stone-400" />
          <span className="font-medium text-retro-black">{breadcrumb}</span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col items-start gap-4 sm:mb-12 sm:flex-row">
          <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border-2 border-retro-black ${iconBgColor} shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]`}>
            <Icon name={iconName} size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-retro-black md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-stone-600">
              {description}
            </p>
          </div>
        </div>

        {children}
      </div>
    </PageLayout>
  );
}
