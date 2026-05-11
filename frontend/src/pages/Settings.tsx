export default function Settings() {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Sozlamalar</h2>
      </div>

      <div className="space-y-4">
        <div className="glass-card">
          <h3 className="font-semibold mb-2">Tilni o'zgartirish</h3>
          <p className="text-xs text-[#94A3B8] mb-4">Ilova interfeysi tilini tanlang</p>
          <div className="flex gap-2">
            <button className="!py-2 !px-4 !rounded-xl !text-sm">O'zbekcha</button>
            <button className="!py-2 !px-4 !rounded-xl !text-sm !bg-[#1E293B] !text-[#94A3B8]">Русский</button>
          </div>
        </div>
        
        <div className="glass-card">
          <h3 className="font-semibold mb-2">Yordam</h3>
          <p className="text-xs text-[#94A3B8]">Texnik qo'llab quvvatlash bilan bog'lanish</p>
        </div>
      </div>
    </>
  );
}
