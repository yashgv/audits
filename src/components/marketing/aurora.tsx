export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute left-1/2 top-[-22rem] h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px] animate-aurora-drift" />
      <div className="absolute left-[8%] top-[14rem] h-[26rem] w-[26rem] rounded-full bg-[hsl(190_90%_55%)]/10 blur-[130px] animate-aurora-drift [animation-delay:-6s]" />
      <div className="absolute right-[6%] top-[6rem] h-[24rem] w-[24rem] rounded-full bg-[hsl(320_80%_60%)]/10 blur-[130px] animate-aurora-drift [animation-delay:-11s]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
