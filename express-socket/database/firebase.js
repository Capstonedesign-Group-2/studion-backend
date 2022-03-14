const firebase = require('firebase-admin');
const serviceAccount = require('./fbServiceAccountKey.json');

const firebaseConfig = {
    credential: firebase.credential.cert(serviceAccount),
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

module.exports = db;
