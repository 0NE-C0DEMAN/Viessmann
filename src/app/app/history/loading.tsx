export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="v-skel h-7 w-32" />
      <div className="v-skel h-10 w-full rounded-xl" />
      <div className="flex gap-2">
        <div className="v-skel h-7 w-16 rounded-full" />
        <div className="v-skel h-7 w-20 rounded-full" />
        <div className="v-skel h-7 w-20 rounded-full" />
        <div className="v-skel h-7 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="v-skel h-[68px] rounded-xl" />)}
      </div>
    </div>
  );
}
