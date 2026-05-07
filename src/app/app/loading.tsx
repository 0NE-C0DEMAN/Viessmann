export default function Loading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="v-skel h-3 w-20" />
        <div className="v-skel h-5 w-44 mt-1.5" />
      </div>
      <div className="v-skel h-[160px] rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="v-skel h-[68px] rounded-xl" />
        <div className="v-skel h-[68px] rounded-xl" />
        <div className="v-skel h-[68px] rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="v-skel h-[88px] rounded-2xl" />
        <div className="v-skel h-[88px] rounded-2xl" />
      </div>
      <div className="space-y-2">
        <div className="v-skel h-[58px] rounded-xl" />
        <div className="v-skel h-[58px] rounded-xl" />
        <div className="v-skel h-[58px] rounded-xl" />
      </div>
    </div>
  );
}
