
const { ref, set, get, remove } = require('firebase/database')
const { firebaseEventDatabase } = require('../configs/firebaseEvent.config')

/**
 * @typedef {Object} ConstructorParams
 * @property {string} eventName
 * @property {Object} eventData
 */


class FirebaseEvent {

   /** 
    * @private
    * @type {string}
    * @description event name
    *  */
   eventName

   /** 
    * @private
    * @type {Object}
    * @description event data
    *  */
   eventData

   /**
    * @param {ConstructorParams} params 
    */
   constructor(params) {
       if (params) {
           this.eventName = params.eventName
           this.eventData = params.eventData
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
            const eventData = snapshot.val();
            if (eventData) {
               const { metadata: { createdAt } } = eventData;
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
            }
         } else {
            console.log("No data available");
         }
      } catch (error) {
         console.error("Error removing event data from Firebase:", error);
      }
   }
}

module.exports = FirebaseEvent
