export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="v-skel h-7 w-24" />
        <div className="v-skel h-4 w-28" />
      </div>
      <div className="grid gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="v-skel h-[88px] rounded-2xl" />)}
      </div>
    </div>
  );
}
