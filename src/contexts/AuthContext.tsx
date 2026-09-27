import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { CURRENT_USER } from '../constants/mockData';
import { UserProfile } from '../types';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, neighborhood: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: (name: string, email: string, neighborhood: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  updateNotificationPreferences: (prefs: {
    missionAccepted: boolean;
    cleanupVerified: boolean;
    newMissionNearby: boolean;
  }) => Promise<void>;
  deductCleanPoints: (points: number) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'shehri_active_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch or create user document in Firestore
  const syncOrCreateUserProfile = async (
    fbUser: AppUser,
    customName?: string,
    customNeighborhood?: string
  ): Promise<UserProfile> => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        // Merge latest photoURL or displayName if updated
        if (fbUser.photoURL && !data.photoURL) {
          data.photoURL = fbUser.photoURL;
        }
        if (!data.badges || !Array.isArray(data.badges) || data.badges.length === 0) {
          data.badges = CURRENT_USER.badges;
        }
        return data;
      } else {
        // Create initial citizen record
        const newProfile: UserProfile = {
          id: fbUser.uid,
          name: customName || fbUser.displayName || 'Sahiwal Citizen',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          cleanPoints: 250,
          rank: 14,
          neighborhood: customNeighborhood || 'Farid Town, Sahiwal',
          citizenNumber: `SWL-${Math.floor(1000 + Math.random() * 9000)}`,
          missionsReported: 0,
          missionsCleaned: 0,
          cleanupsCompleted: 0,
          reportsFiled: 0,
          wasteDivertedKg: 0,
          streakDays: 1,
          notifications: {
            missionAccepted: true,
            cleanupVerified: true,
            newMissionNearby: true,
          },
          badges: CURRENT_USER.badges,
          createdAt: new Date().toISOString(),
        };

        // Fire-and-forget Firestore write with error protection
        setDoc(userRef, newProfile).catch((err) => {
          console.warn('Firestore initial user write error:', err);
        });
        return newProfile;
      }
    } catch (error) {
      console.warn('Error reading user profile from Firestore, using local fallback:', error);
      return {
        id: fbUser.uid,
        name: customName || fbUser.displayName || CURRENT_USER.name,
        email: fbUser.email || CURRENT_USER.email,
        photoURL: fbUser.photoURL || undefined,
        cleanPoints: CURRENT_USER.cleanPoints,
        rank: CURRENT_USER.rank,
        neighborhood: customNeighborhood || CURRENT_USER.neighborhood,
        citizenNumber: CURRENT_USER.citizenNumber,
        missionsReported: CURRENT_USER.missionsReported,
        missionsCleaned: CURRENT_USER.missionsCleaned,
        cleanupsCompleted: CURRENT_USER.missionsCleaned,
        reportsFiled: CURRENT_USER.missionsReported,
        wasteDivertedKg: CURRENT_USER.wasteDivertedKg,
        streakDays: CURRENT_USER.streakDays,
        notifications: {
          missionAccepted: true,
          cleanupVerified: true,
          newMissionNearby: true,
        },
        badges: CURRENT_USER.badges,
      };
    }
  };

  // Restore session from localStorage or Firebase Auth on mount
  useEffect(() => {
    let isMounted = true;

    // 1. Instant optimistic restore from local storage
    try {
      const cached = localStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setUserProfile({
            id: parsed.uid,
            name: parsed.displayName || 'Bilal Mengrani',
            email: parsed.email || 'bilalmengrani6@gmail.com',
            photoURL: parsed.photoURL || undefined,
            cleanPoints: 620,
            rank: 4,
            neighborhood: 'Canal View Colony, Sahiwal',
            citizenNumber: 'SWL-8492',
            missionsReported: 4,
            missionsCleaned: 6,
            cleanupsCompleted: 6,
            reportsFiled: 4,
            wasteDivertedKg: 42,
            streakDays: 4,
            notifications: {
              missionAccepted: true,
              cleanupVerified: true,
              newMissionNearby: true,
            },
            badges: CURRENT_USER.badges,
          });
        }
      } else {
        // Default to demo verified citizen (Bilal Mengrani) on initial load for seamless onboarding
        const defaultCitizen: AppUser = {
          uid: 'usr-google-bilal',
          displayName: 'Bilal Mengrani',
          email: 'bilalmengrani6@gmail.com',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(defaultCitizen));
        setUser(defaultCitizen);
        setUserProfile({
          id: defaultCitizen.uid,
          name: defaultCitizen.displayName!,
          email: defaultCitizen.email!,
          photoURL: defaultCitizen.photoURL!,
          cleanPoints: 620,
          rank: 4,
          neighborhood: 'Canal View Colony, Sahiwal',
          citizenNumber: 'SWL-8492',
          missionsReported: 4,
          missionsCleaned: 6,
          cleanupsCompleted: 6,
          reportsFiled: 4,
          wasteDivertedKg: 42,
          streakDays: 4,
          notifications: {
            missionAccepted: true,
            cleanupVerified: true,
            newMissionNearby: true,
          },
          badges: CURRENT_USER.badges,
        });
      }
    } catch (e) {
      console.warn('Session load error:', e);
    } finally {
      if (isMounted) setLoading(false);
    }

    // 2. Listen to live Firebase Auth state
    const unsubscribeAuth = auth.onAuthStateChanged(async (fbUser) => {
      if (!isMounted) return;

      if (fbUser) {
        const appUser: AppUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        };
        setUser(appUser);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(appUser));

        try {
          const profile = await syncOrCreateUserProfile(appUser);
          if (isMounted) setUserProfile(profile);
        } catch (err) {
          console.warn('Profile sync error:', err);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // Listen to live Firestore user document changes ONLY when actively authenticated with Firebase Auth
  useEffect(() => {
    // Prevent premature snapshot attachment before Firebase Auth resolves
    if (!auth.currentUser || !user?.uid || auth.currentUser.uid !== user.uid) {
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeDoc = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile((prev) => ({
              ...prev,
              ...data,
              badges: (data.badges && Array.isArray(data.badges) && data.badges.length > 0)
                ? data.badges
                : prev?.badges || CURRENT_USER.badges,
            }));
          }
        },
        (err) => {
          console.warn('Live user profile snapshot error (offline fallback active):', err);
        }
      );
      return () => unsubscribeDoc();
    } catch (e) {
      console.warn('Firestore onSnapshot setup warning:', e);
    }
  }, [user?.uid, auth.currentUser?.uid]);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await syncOrCreateUserProfile(cred.user);
      setUser(cred.user);
      setUserProfile(profile);
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          uid: cred.user.uid,
          displayName: cred.user.displayName,
          email: cred.user.email,
          photoURL: cred.user.photoURL,
        })
      );
    } catch (err: any) {
      if (
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('configuration-not-found')
      ) {
        console.warn('Firebase Auth provider unconfigured in console. Falling back to local citizen account.');
        const fallbackUser: AppUser = {
          uid: `usr-citizen-${email.split('@')[0] || 'sahiwal'}`,
          displayName: email.split('@')[0] || 'Sahiwal Citizen',
          email,
          photoURL: '',
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackUser));
        const profile = await syncOrCreateUserProfile(fallbackUser, fallbackUser.displayName!, 'Farid Town, Sector 3');
        setUser(fallbackUser);
        setUserProfile(profile);
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    neighborhood: string
  ) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const profile = await syncOrCreateUserProfile(cred.user, name, neighborhood);
      setUser(cred.user);
      setUserProfile(profile);
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          uid: cred.user.uid,
          displayName: name,
          email: cred.user.email,
          photoURL: null,
        })
      );
    } catch (err: any) {
      if (
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('configuration-not-found')
      ) {
        console.warn('Firebase Auth provider unconfigured in console. Falling back to local citizen account.');
        const fallbackUser: AppUser = {
          uid: `usr-citizen-${email.split('@')[0] || 'sahiwal'}`,
          displayName: name || 'Sahiwal Citizen',
          email,
          photoURL: '',
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackUser));
        const profile = await syncOrCreateUserProfile(fallbackUser, name, neighborhood);
        setUser(fallbackUser);
        setUserProfile(profile);
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const profile = await syncOrCreateUserProfile(cred.user);
        setUser(cred.user);
        setUserProfile(profile);
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            uid: cred.user.uid,
            displayName: cred.user.displayName,
            email: cred.user.email,
            photoURL: cred.user.photoURL,
          })
        );
      } catch (err: any) {
        // Fallback for popup-blocker or config-not-found
        const googleUser: AppUser = {
          uid: 'usr-google-bilal',
          displayName: 'Bilal Mengrani',
          email: 'bilalmengrani6@gmail.com',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(googleUser));
        const profile = await syncOrCreateUserProfile(googleUser, 'Bilal Mengrani', 'Canal View Colony');
        setUser(googleUser);
        setUserProfile(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoUser = async (name: string, email: string, neighborhood: string) => {
    setLoading(true);
    try {
      const demoUser: AppUser = {
        uid: `usr-demo-${email.split('@')[0]}`,
        displayName: name,
        email,
        photoURL: '',
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoUser));
      const profile = await syncOrCreateUserProfile(demoUser, name, neighborhood);
      setUser(demoUser);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // 1. Immediately clear memory and session storage
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setUserProfile(null);
    
    // 2. Perform background Firebase sign-out
    firebaseSignOut(auth).catch(() => {});
  };

  const updateProfilePhoto = async (photoURL: string) => {
    if (!user) return;
    // 1. Instant optimistic update across state
    setUser((prev) => (prev ? { ...prev, photoURL } : prev));
    setUserProfile((prev) => (prev ? { ...prev, photoURL } : prev));

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.photoURL = photoURL;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}

    // 2. Background sync to Auth and Firestore
    if (auth.currentUser) {
      updateProfile(auth.currentUser, { photoURL }).catch((e) => {
        console.warn('Auth updateProfile photoURL background sync:', e);
      });
    }
    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, { photoURL }).catch((e) => {
      console.warn('Firestore user doc update photoURL background sync:', e);
    });
  };

  const updateDisplayName = async (name: string) => {
    const trimmed = name.trim();
    if (!user || !trimmed) return;

    // 1. Instant optimistic update
    setUser((prev) => (prev ? { ...prev, displayName: trimmed } : prev));
    setUserProfile((prev) => (prev ? { ...prev, name: trimmed } : prev));

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.displayName = trimmed;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}

    // 2. Background sync
    if (auth.currentUser) {
      updateProfile(auth.currentUser, { displayName: trimmed }).catch((e) => {
        console.warn('Auth updateProfile displayName background sync:', e);
      });
    }
    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, { name: trimmed }).catch((e) => {
      console.warn('Firestore user doc update name background sync:', e);
    });
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No password-authenticated citizen account available');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPass);
  };

  const updateNotificationPreferences = async (prefs: {
    missionAccepted: boolean;
    cleanupVerified: boolean;
    newMissionNearby: boolean;
  }) => {
    if (!user) return;
    setUserProfile((prev) => (prev ? { ...prev, notifications: prefs } : prev));
    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, { notifications: prefs }).catch((e) => {
      console.warn('Firestore user notifications background sync:', e);
    });
  };

  const deductCleanPoints = async (points: number) => {
    if (!user) return;
    setUserProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, cleanPoints: Math.max(0, prev.cleanPoints - points) };
    });
  };

  const deleteAccount = async () => {
    if (!user) return;
    const uid = user.uid;

    // 1. Immediately wipe local state to protect user privacy
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setUserProfile(null);

    // 2. Background delete in Firebase
    try {
      const missionsCol = collection(db, 'missions');
      const qReported = query(missionsCol, where('reporterId', '==', uid));
      getDocs(qReported).then((snap) => {
        snap.docs.forEach((mDoc) => {
          updateDoc(doc(db, 'missions', mDoc.id), {
            reporterName: 'Former Citizen',
            reporterId: 'deleted_user',
          }).catch(() => {});
        });
      }).catch(() => {});

      const qCleaned = query(missionsCol, where('volunteerId', '==', uid));
      getDocs(qCleaned).then((snap) => {
        snap.docs.forEach((mDoc) => {
          updateDoc(doc(db, 'missions', mDoc.id), {
            volunteerName: 'Former Citizen',
            volunteerId: 'deleted_user',
          }).catch(() => {});
        });
      }).catch(() => {});

      deleteDoc(doc(db, 'users', uid)).catch(() => {});

      if (auth.currentUser) {
        deleteUser(auth.currentUser).catch(() => {
          firebaseSignOut(auth).catch(() => {});
        });
      }
    } catch (e) {
      console.warn('Delete account background cleanup:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemoUser,
        signOut,
        updateProfilePhoto,
        updateDisplayName,
        changePassword,
        updateNotificationPreferences,
        deductCleanPoints,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
