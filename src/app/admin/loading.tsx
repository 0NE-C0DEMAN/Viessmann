export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="v-skel h-8 w-48" />
        <div className="v-skel h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="v-skel h-[96px] rounded-2xl" />)}
      </div>
      <div className="v-skel h-[420px] rounded-2xl" />
    </div>
  );
}
