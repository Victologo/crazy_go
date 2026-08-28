// network/DatabaseManager.ts - Gestor de Base de Datos (Simulado via localStorage para portabilidad)
// En producción, esto se conectaría a Supabase o Firebase.

export interface UserProfile {
    userId: string;
    displayName: string;
    lastNameChange: number; // timestamp
}

export interface FriendEntry {
    friendId: string;
    friendName: string;
    status: 'pending' | 'accepted';
}

export class DatabaseManager {
    private static currentUserId: string | null = null;
    private static SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

    public static async initialize(): Promise<void> {
        // Simular retardo de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let uid = localStorage.getItem('cg_uid');
        if (!uid) {
            uid = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cg_uid', uid);
        }
        this.currentUserId = uid;

        // Crear perfil inicial si no existe
        const profileStr = localStorage.getItem(`cg_profile_${uid}`);
        if (!profileStr) {
            const defaultProfile: UserProfile = {
                userId: uid,
                displayName: `Guest_${Math.floor(Math.random() * 1000)}`,
                lastNameChange: 0
            };
            localStorage.setItem(`cg_profile_${uid}`, JSON.stringify(defaultProfile));
        }
    }

    public static getUserId(): string {
        return this.currentUserId || 'unknown';
    }

    public static async getProfile(userId: string): Promise<UserProfile | null> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const p = localStorage.getItem(`cg_profile_${userId}`);
        return p ? JSON.parse(p) : null;
    }

    public static async changeDisplayName(newName: string): Promise<{ success: boolean; message: string }> {
        await new Promise(resolve => setTimeout(resolve, 600));
        if (!this.currentUserId) return { success: false, message: 'Not logged in' };

        const profile = await this.getProfile(this.currentUserId);
        if (!profile) return { success: false, message: 'Profile not found' };

        const now = Date.now();
        const timeSinceLastChange = now - profile.lastNameChange;

        if (profile.lastNameChange > 0 && timeSinceLastChange < this.SIX_MONTHS_MS) {
            const daysLeft = Math.ceil((this.SIX_MONTHS_MS - timeSinceLastChange) / (1000 * 60 * 60 * 24));
            return { 
                success: false, 
                message: `Debes esperar ${daysLeft} días para volver a cambiar tu nombre.` 
            };
        }

        profile.displayName = newName;
        profile.lastNameChange = now;
        localStorage.setItem(`cg_profile_${this.currentUserId}`, JSON.stringify(profile));

        return { success: true, message: 'Nombre actualizado correctamente.' };
    }

    public static async getFriends(): Promise<FriendEntry[]> {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!this.currentUserId) return [];
        
        const friends = localStorage.getItem(`cg_friends_${this.currentUserId}`);
        return friends ? JSON.parse(friends) : [];
    }

    public static async addFriend(friendIdOrName: string): Promise<{ success: boolean; message: string }> {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!this.currentUserId) return { success: false, message: 'Not logged in' };
        
        // Simulación: aceptar cualquier ID arbitrario que empiece por 'user_'
        if (!friendIdOrName.startsWith('user_')) {
            // Generar un ID dummy si pasaron un nombre
            friendIdOrName = 'user_' + Math.random().toString(36).substr(2, 9);
        }

        const friends = await this.getFriends();
        if (friends.some(f => f.friendId === friendIdOrName)) {
            return { success: false, message: 'Ya eres amigo de este usuario.' };
        }

        friends.push({
            friendId: friendIdOrName,
            friendName: `Jugador_${friendIdOrName.substr(5,4)}`,
            status: 'accepted'
        });

        localStorage.setItem(`cg_friends_${this.currentUserId}`, JSON.stringify(friends));
        return { success: true, message: 'Amigo añadido correctamente.' };
    }
}
