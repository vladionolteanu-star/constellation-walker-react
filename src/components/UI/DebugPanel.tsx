import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useUserStore } from '../../store/userStore'

export default function DebugPanel() {
  const { currentUser, otherUsers } = useUserStore()
  const [dbUsers, setDbUsers] = useState<any[]>([])

  useEffect(() => {
    const checkDatabase = async () => {
      const { data: positions } = await supabase
        .from('active_positions')
        .select('*')
      
      const { data: users } = await supabase
        .from('users')
        .select('*')
      
      console.log('DB Positions:', positions)
      console.log('DB Users:', users)
      setDbUsers(positions || [])
    }

    checkDatabase()
    const interval = setInterval(checkDatabase, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed top-20 left-4 z-50 p-4 bg-black/90 text-white text-xs rounded-lg max-w-xs">
      <div>Current User: {currentUser?.id?.slice(0, 8)}</div>
      <div>Position: {currentUser?.position ? `${currentUser.position.lat.toFixed(4)}, ${currentUser.position.lng.toFixed(4)}` : 'No GPS'}</div>
      <div>Other Users: {otherUsers.length}</div>
      <div>DB Active: {dbUsers.length}</div>
      <div className="mt-2 text-green-400">
        {dbUsers.map((u: any) => (
          <div key={u.user_id}>{u.user_id.slice(0, 8)}</div>
        ))}
      </div>
    </div>
  )
}
