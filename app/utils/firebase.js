// Firebase configuration for EyeJack Mobile App
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase configuration
// NOTE: Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEFGHIJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure Apple provider
appleProvider.addScope('email');
appleProvider.addScope('name');

export {
  auth,
  googleProvider,
  facebookProvider,
  appleProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};

// Authentication helper functions
export class FirebaseAuthService {
  static recaptchaVerifier = null;

  // Initialize reCAPTCHA for phone authentication
  static initRecaptcha(elementId = 'recaptcha-container') {
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          this.recaptchaVerifier = null;
        }
      });
    }
    return this.recaptchaVerifier;
  }

  // Send OTP to phone number
  static async sendOTP(phoneNumber) {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      
      if (!this.recaptchaVerifier) {
        this.initRecaptcha();
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );
      
      console.log('✅ OTP sent successfully');
      return {
        success: true,
        confirmationResult,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      
      // Reset reCAPTCHA on error
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Verify OTP
  static async verifyOTP(confirmationResult, otp) {
    try {
      console.log('🔐 Verifying OTP:', otp);
      
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      console.log('✅ Phone authentication successful:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          email: user.email || null,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null
        }
      };
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Google Sign In
  static async signInWithGoogle() {
    try {
      console.log('🔐 Google Sign In initiated');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('✅ Google authentication successful:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber || null
        }
      };
    } catch (error) {
      console.error('❌ Google Sign In error:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Facebook Sign In
  static async signInWithFacebook() {
    try {
      console.log('🔐 Facebook Sign In initiated');
      
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      console.log('✅ Facebook authentication successful:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber || null
        }
      };
    } catch (error) {
      console.error('❌ Facebook Sign In error:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Apple Sign In
  static async signInWithApple() {
    try {
      console.log('🔐 Apple Sign In initiated');
      
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      console.log('✅ Apple authentication successful:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || null,
          phoneNumber: user.phoneNumber || null
        }
      };
    } catch (error) {
      console.error('❌ Apple Sign In error:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Sign Out
  static async signOut() {
    try {
      await signOut(auth);
      console.log('👋 User signed out successfully');
      
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listen for authentication state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is authenticated
  static isAuthenticated() {
    return !!auth.currentUser;
  }
}

export default FirebaseAuthService; 