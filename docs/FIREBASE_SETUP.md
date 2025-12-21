# Firebase Setup Guide

Follow these steps to set up the backend for your application.

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** or **"Create a project"**.
3. Name your project (e.g., "Something Special") and click **Continue**.
4. You can disable Google Analytics for this simple project. Click **Create project**.

## 2. Enable Authentication
1. In your new project dashboard, click **Build** > **Authentication** in the left sidebar.
2. Click **Get started**.
3. Select **Google** from the Sign-in providers list.
4. Click **Enable**.
5. Select a support email for the project.
6. Click **Save**.

## 3. Enable Realtime Database
1. Click **Build** > **Realtime Database** in the left sidebar.
2. Click **Create Database**.
3. Choose a location (e.g., United States) and click **Next**.
4. Select **Start in test mode**. (This allows reading/writing without strict rules initially, which is fine for development).
   - *Note: In production, we will lock this down, but for now, Test Mode avoids permission errors.*
5. Click **Enable**.

## 4. Get Configuration
1. Click the **Project Settings** (Gear icon ⚙️) at the top of the left sidebar.
2. Scroll down to the **"Your apps"** section.
3. Click the **Web** icon (`</>`).
4. Register the app (name it "Web App").
5. You will see a `firebaseConfig` object looking like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "...",
     databaseURL: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. **Copy this configuration.**

## 5. Update Your Code
1. Open `src/firebaseConfig.ts` in your editor.
2. Replace the placeholder content with your copied configuration.

## 6. Set Admin Access
1. Open `context/AuthContext.tsx`.
2. Look for `ADMIN_EMAILS` array.
3. Add your Google Email address to this list:
   ```typescript
   const ADMIN_EMAILS = ['your-email@gmail.com'];
   ```
4. This will allow you to access the Admin Dashboard.

## 7. Migrate Data
1. Start your app (`npm run dev`) and open it.
2. Go to `/admin`.
3. Sign in with your Google account.
4. If configured correctly, you will see the Admin Dashboard.
5. Click **"Migrate/Reset Data"** in the top right.
6. This will push all the default local data to your new Firebase Database.
