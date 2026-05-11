import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { LayoutDashboard, UtensilsCrossed, Settings, User as UserIcon, Plus, X, Loader2 } from 'lucide-react'
import axios from 'axios'

function App() {
  const [user, setUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [restaurantName, setRestaurantName] = useState('')
  const [botToken, setBotToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      setUser(WebApp.initDataUnsafe.user)
    }
  }, [])

  const handleAddRestaurant = async () => {
    if (!restaurantName || !botToken) {
      setError('Iltimos, barcha maydonlarni to\'ldiring')
      return
    }
    
    if (!user?.id) {
      setError('Foydalanuvchi ma\'lumotlari topilmadi. Bot orqali kiring.')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await axios.post(`${apiUrl}/api/restaurants`, {
        owner_id: user.id,
        name: restaurantName,
        bot_token: botToken
      })
      
      console.log('Success:', response.data)
      setIsModalOpen(false)
      setRestaurantName('')
      setBotToken('')
      WebApp.showAlert("Restoran muvaffaqiyatli qo'shildi!")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi. Bot tokenini tekshiring.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 animate-fade-in relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gradient">EcoRestorant</h1>
          <p className="text-sm text-[#94A3B8]">Xush kelibsiz, {user?.first_name || 'Mehmon'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <UserIcon className="text-primary" size={20} />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card flex flex-col gap-2">
          <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Buyurtmalar</span>
          <span className="text-2xl font-bold">0</span>
        </div>
        <div className="glass-card flex flex-col gap-2">
          <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Daromad</span>
          <span className="text-2xl font-bold text-primary">0.00</span>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-4 mb-24">
        <div 
          className="glass-card flex items-center justify-between cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Plus className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Yangi Restoran</h3>
              <p className="text-xs text-[#94A3B8]">Tizimga yangi restoran qo'shish</p>
            </div>
          </div>
        </div>

        <div className="glass-card flex items-center justify-between opacity-60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1E293B] flex items-center justify-center">
              <UtensilsCrossed className="text-[#94A3B8]" />
            </div>
            <div>
              <h3 className="font-semibold">Mening Restoranlarim</h3>
              <p className="text-xs text-[#94A3B8]">Hali restoranlar yo'q</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass-card !p-2 flex items-center justify-around z-10">
        <button className="!bg-transparent !p-2 !w-12 !h-12 !rounded-xl text-primary">
          <LayoutDashboard size={24} />
        </button>
        <button className="!bg-transparent !p-2 !w-12 !h-12 !rounded-xl text-[#94A3B8] hover:text-primary transition-colors">
          <UtensilsCrossed size={24} />
        </button>
        <button className="!bg-transparent !p-2 !w-12 !h-12 !rounded-xl text-[#94A3B8] hover:text-primary transition-colors">
          <Settings size={24} />
        </button>
      </nav>

      {/* Add Restaurant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card w-full max-w-sm relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="!bg-transparent !p-2 absolute right-4 top-4 text-[#94A3B8] hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-6 text-gradient">Yangi Restoran</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-2 uppercase tracking-wider">Restoran Nomi</label>
                <input 
                  type="text" 
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Masalan: Evos"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-2 uppercase tracking-wider">Bot Tokeni (@BotFather'dan)</label>
                <input 
                  type="text" 
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

            <button 
              onClick={handleAddRestaurant}
              disabled={loading}
              className="w-full justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Saqlash va Ulanish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
