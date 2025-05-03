
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CallableRequest } from 'firebase-functions/v2/https';

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (request: CallableRequest) => {
  // Check if request is made by an authenticated user
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  try {
    // Check if the caller is a teacher or admin
    const callerUid = request.auth.uid;
    const callerRef = admin.database().ref(`/users/${callerUid}`);
    const callerSnapshot = await callerRef.once('value');
    const callerData = callerSnapshot.val();
    
    if (callerData.role !== 'teacher' && callerData.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only teachers and admins can delete users.'
      );
    }
    
    // Get the email of the user to delete
    const { email } = request.data as { email: string };
    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email is required to delete a user.'
      );
    }
    
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Delete the user from Authentication
    await admin.auth().deleteUser(userRecord.uid);
    
    return { success: true, message: 'User successfully deleted from Authentication.' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while deleting the user.',
      error
    );
  }
});
