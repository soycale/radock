import admin from 'firebase-admin'
import { configuration } from '#application/configuration.js'

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: configuration.firebase.projectId,
    clientEmail: configuration.firebase.clientEmail,
    privateKey: configuration.firebase.privateKey,
  }),
})

export const firebaseAdmin = admin
export { app as firebaseApp }
