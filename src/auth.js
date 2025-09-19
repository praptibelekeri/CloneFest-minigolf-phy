// src/auth.js
import { 
  supabase, 
  signInWithGoogle, 
  signInWithGitHub, 
  signOut, 
  getCurrentUser,
  getUserProfile
} from './supabase.js'

let currentUser = null
let userProfile = null

export async function initAuth() {
  // Handle OAuth callback
  const { data, error } = await supabase.auth.getSession()
  if (error) console.error('Auth error:', error)
  
  currentUser = data?.session?.user || null
  if (currentUser) {
    await loadUserProfile()
  }
  
  updateAuthUI()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event)
    currentUser = session?.user || null
    
    if (currentUser) {
      await loadUserProfile()
    } else {
      userProfile = null
    }
    
    updateAuthUI()
  })
}

async function loadUserProfile() {
  try {
    const { data, error } = await getUserProfile()
    if (error) console.error('Profile error:', error)
    userProfile = data
  } catch (error) {
    console.error('Failed to load profile:', error)
  }
}

export function createAuthUI() {
  const authHTML = `
    <div id="authContainer" style="
      position: fixed; 
      top: 15px; 
      right: 15px; 
      background: rgba(0, 0, 0, 0.9); 
      backdrop-filter: blur(10px);
      padding: 15px; 
      border-radius: 12px; 
      color: white; 
      z-index: 100;
      min-width: 250px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    ">
      
      <!-- User info (shown when logged in) -->
      <div id="userInfo" style="display: none;">
        <div id="userDetails" style="margin-bottom: 12px;"></div>
        <button id="signOutBtn" style="
          width: 100%;
          padding: 8px;
          border: none;
          border-radius: 6px;
          background: linear-gradient(45deg, #ff4757, #ff6b7a);
          color: white;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.2s;
        ">Sign Out</button>
      </div>
      
      <!-- Auth options (shown when logged out) -->
      <div id="authOptions" style="display: none;">
        <div style="text-align: center; margin-bottom: 15px; color: #ccc;">
          <h3 style="margin: 0 0 5px 0; font-size: 16px;">Sign In to Save Progress</h3>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Your scores will be saved across devices</p>
        </div>
        
        <button id="googleSignIn" style="
          width: 100%;
          padding: 12px;
          margin-bottom: 8px;
          border: none;
          border-radius: 8px;
          background: #4285f4;
          color: white;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <button id="githubSignIn" style="
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border: none;
          border-radius: 8px;
          background: #333;
          color: white;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>
        
        <div style="text-align: center; font-size: 11px; opacity: 0.6; margin-top: 8px;">
          Play as guest (progress won't be saved)
        </div>
      </div>
      
      <div id="authMessage" style="
        margin-top: 10px; 
        font-size: 12px; 
        color: #ff6b6b;
        text-align: center;
      "></div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', authHTML)
  
  // Add event listeners
  document.getElementById('googleSignIn').addEventListener('click', handleGoogleSignIn)
  document.getElementById('githubSignIn').addEventListener('click', handleGitHubSignIn)
  document.getElementById('signOutBtn').addEventListener('click', handleSignOut)
  
  // Add hover effects
  const buttons = document.querySelectorAll('#authContainer button')
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)'
      btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)'
      btn.style.boxShadow = 'none'
    })
  })
}

function updateAuthUI() {
  const userInfo = document.getElementById('userInfo')
  const authOptions = document.getElementById('authOptions')
  const userDetails = document.getElementById('userDetails')
  
  if (currentUser) {
    // User is logged in
    const displayName = userProfile?.display_name || currentUser.email?.split('@')[0] || 'Player'
    const avatar = userProfile?.avatar_url
    
    userDetails.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        ${avatar ? 
          `<img src="${avatar}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #4CAF50;">` : 
          `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(45deg, #4CAF50, #45a049); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${displayName[0].toUpperCase()}</div>`
        }
        <div>
          <div style="font-weight: 500; font-size: 14px;">${displayName}</div>
          <div style="font-size: 11px; opacity: 0.7;">${currentUser.email}</div>
        </div>
      </div>
    `
    
    userInfo.style.display = 'block'
    authOptions.style.display = 'none'
  } else {
    // User is not logged in
    userInfo.style.display = 'none'
    authOptions.style.display = 'block'
  }
}

async function handleGoogleSignIn() {
  const messageEl = document.getElementById('authMessage')
  messageEl.textContent = 'Redirecting to Google...'
  
  const { error } = await signInWithGoogle()
  if (error) {
    messageEl.textContent = `Error: ${error.message}`
  }
}

async function handleGitHubSignIn() {
  const messageEl = document.getElementById('authMessage')
  messageEl.textContent = 'Redirecting to GitHub...'
  
  const { error } = await signInWithGitHub()
  if (error) {
    messageEl.textContent = `Error: ${error.message}`
  }
}

async function handleSignOut() {
  const { error } = await signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
  document.getElementById('authMessage').textContent = ''
}

export function isUserAuthenticated() {
  return currentUser !== null
}

export function getCurrentUserInfo() {
  return {
    user: currentUser,
    profile: userProfile
  }
}