// globals.d.ts
import type { FirebaseAuth } from "firebase/auth";

declare global {
  var firebase: {
    auth: {
      currentUser: any; // or more specific type from Firebase, e.g., FirebaseAuth['currentUser']
    };
  };
}

export {};
