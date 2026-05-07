export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="v-skel h-7 w-36" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="v-skel h-[72px] rounded-xl" />)}
      </div>
    </div>
  );
}
