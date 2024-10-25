import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

export const useUser = () => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        await createOrUpdateUserProfile(user)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const createOrUpdateUserProfile = async (user) => {
    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const newProfile = {
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        points: 1000,
        createdAt: serverTimestamp(),
      }
      await setDoc(userRef, newProfile)
      setUserProfile(newProfile)
    } else {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      })
      setUserProfile(userSnap.data())
    }
  }

  return { user, userProfile, loading }
}
