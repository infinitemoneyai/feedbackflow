import { ArrowLeft } from "lucide-react";

interface DemoHeaderProps {
  onBack: () => void;
  title: string;
  icon?: React.ReactNode;
}

export function DemoHeader({ onBack, title, icon }: DemoHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b-2 border-stone-200 pb-4">
      <button
        onClick={onBack}
        className="group flex items-center gap-2 font-mono text-sm font-bold text-stone-500 transition-colors hover:text-retro-black"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        BACK
      </button>
      <div className="flex items-center gap-2 text-sm font-bold text-retro-black">
        {icon}
        {title}
      </div>
    </div>
  );
}
