
import { ref, set, get, remove } from 'firebase/database';
import { firebaseEventDatabase } from '../configs/firebaseEvent.config';

class FirebaseEvent {
    constructor(params) {
        if (params) {
            this.eventName = params.eventName;
            this.eventData = params.eventData;
        }
    }

    async setEventInFirebase() {
        try {
            if (!firebaseEventDatabase) {
                console.error("Firebase database is not initialized. Skipping setting event data.");
                return;
            }
            const eventRef = ref(firebaseEventDatabase, `${this.eventName}/`);
            const eventData = {
                data: this.eventData,
                metadata: {
                    createdAt: new Date().getTime(),
                }
            };
            await set(eventRef, eventData);
            await this.removeEventFromFirebase();
        } catch (error) {
            console.error("Error setting event data in Firebase:", error);
        }
    }

    async removeEventFromFirebase() {
        try {
            if (!firebaseEventDatabase) {
                console.error("Firebase database is not initialized. Skipping removing event data.");
                return;
            }
            const eventRef = ref(firebaseEventDatabase, `${this.eventName}/`);
            const snapshot = await get(eventRef);
            if (snapshot.exists()) {
                const { metadata: { createdAt } } = snapshot.val();
                const currentTime = new Date().getTime();
                const timeout = 2000;
                const elapsedTime = currentTime - new Date(createdAt);
                if (elapsedTime >= timeout) {
                    await remove(eventRef);
                } else {
                    const delay = timeout - elapsedTime;
                    setTimeout(async () => {
                        await remove(eventRef);
                    }, delay);
                }
            } else {
                console.log("No data available");
            }
        } catch (error) {
            console.error("Error removing event data from Firebase:", error);
        }
    }
}

export default FirebaseEvent;
