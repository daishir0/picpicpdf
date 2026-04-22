"use client";

import { Image as ImageIconLucide, Type, LayoutDashboard } from "lucide-react";

export type TabKey = "images" | "fonts" | "summary";

interface TabNavProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  imageCount: number;
  fontCount: number;
}

interface TabDef {
  key: TabKey;
  label: string;
  count: number | null;
  Icon: typeof ImageIconLucide;
  disabled?: boolean;
  tooltip?: string;
}

export default function TabNav({ tab, setTab, imageCount, fontCount }: TabNavProps) {
  const tabs: TabDef[] = [
    {
      key: "images",
      label: "画像",
      count: imageCount,
      Icon: ImageIconLucide,
      disabled: imageCount === 0,
      tooltip: imageCount === 0 ? "このファイルには画像がありません" : undefined,
    },
    {
      key: "fonts",
      label: "フォント",
      count: fontCount,
      Icon: Type,
      disabled: fontCount === 0,
      tooltip: fontCount === 0 ? "このファイルではフォントが検出されませんでした" : undefined,
    },
    {
      key: "summary",
      label: "概要",
      count: null,
      Icon: LayoutDashboard,
    },
  ];

  return (
    <div className="w-full border-b border-gray-200">
      <nav className="flex gap-1" role="tablist">
        {tabs.map(({ key, label, count, Icon, disabled, tooltip }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => !disabled && setTab(key)}
              title={tooltip}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                border-b-2 -mb-px transition-colors
                ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : disabled
                    ? "border-transparent text-gray-300 cursor-not-allowed"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
