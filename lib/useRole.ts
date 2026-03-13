'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Role = 'admin' | 'staff' | null

export function useRole() {
    const supabase = createClient()
    const [role, setRole] = useState<Role>(null)
    const [restaurantId, setRestaurantId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRole() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setLoading(false); return }

            // 1. Priorité : vérifier si ce user est membre d'un restaurant (admin ou staff)
            const { data: member } = await supabase
                .from('restaurant_members')
                .select('role, restaurant_id')
                .eq('user_id', user.id)
                .eq('actif', true)
                .single()

            if (member) {
                setRole(member.role as Role)
                setRestaurantId(member.restaurant_id)
                setLoading(false)
                return
            }

            // 2. Fallback : propriétaire d'un restaurant non encore migré
            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (restaurant) {
                setRole('admin')
                setRestaurantId(restaurant.id)
            }

            setLoading(false)
        }
        fetchRole()
    }, [])

    return {
        role,
        restaurantId,
        isAdmin: role === 'admin',
        isStaff: role === 'staff',
        loading,
    }
}