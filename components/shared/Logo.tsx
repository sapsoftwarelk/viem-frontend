export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-viems-blue flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[11px] font-bold tracking-wider">VE</span>
      </div>
      <div>
        <p className="text-[13px] font-bold text-gray-900 leading-tight tracking-wide">VIEMS</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Venus Enterprises</p>
      </div>
    </div>
  );
}
