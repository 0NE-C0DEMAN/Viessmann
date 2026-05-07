export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="v-skel h-7 w-24" />
      <div className="v-card text-center space-y-2">
        <div className="v-skel w-12 h-12 rounded-2xl mx-auto" />
        <div className="v-skel h-5 w-44 mx-auto" />
        <div className="v-skel h-3 w-32 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="v-skel h-[64px] rounded-xl" />
        <div className="v-skel h-[64px] rounded-xl" />
      </div>
      <div className="v-skel h-[180px] rounded-2xl" />
      <div className="v-skel h-[280px] rounded-2xl" />
    </div>
  );
}
