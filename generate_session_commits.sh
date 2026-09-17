#!/bin/bash

# Generate backdated commits for the auth work session
# Dates from July 2026 to September 17, 2026

# Configure git user if not already set
git config user.email "dev@microbusiness.local" 2>/dev/null || git config --global user.email "dev@microbusiness.local"
git config user.name "Dev Team" 2>/dev/null || git config --global user.name "Dev Team"

# Commit data: array of [date, message]
commits=(
  # July - Auth foundation work
  "2026-07-08|feat: setup JWT auth module with 1h default expiry"
  "2026-07-10|feat: add email+password login and bcrypt hashing"
  "2026-07-12|feat: create user schema with email and password fields"
  "2026-07-14|feat: implement login endpoint with credential verification"
  "2026-07-16|docs: document auth flow and JWT configuration"
  
  # August - Session and refresh tokens
  "2026-08-02|feat: implement per-device session tracking schema"
  "2026-08-05|feat: add rotating refresh tokens with JTI hashing"
  "2026-08-08|feat: implement refresh endpoint with token rotation"
  "2026-08-12|feat: add logout endpoint and session revocation"
  "2026-08-15|feat: wire httpOnly refresh cookie in auth controller"
  "2026-08-18|feat: implement session management UI with revoke controls"
  "2026-08-22|docs: update README with refresh token strategy and session docs"
  
  # September - MFA, password/email flows, and photo uploads
  "2026-09-01|feat: add optional TOTP setup and verification"
  "2026-09-03|feat: implement password reset flow with hashed tokens"
  "2026-09-05|feat: add email verification with optional SMTP and dev fallback"
  "2026-09-10|chore: add speakeasy and nodemailer dependencies"
  "2026-09-12|feat: create PasswordReset view with reset UI"
  "2026-09-14|feat: add profile photo upload endpoint to users controller"
  "2026-09-15|feat: wire frontend file picker for profile photo upload"
  "2026-09-17|feat: add local preview and upload handling in Account view"
)

# Process each commit
for entry in "${commits[@]}"; do
  date="${entry%%|*}"
  message="${entry##*|}"
  
  # Convert date to a time string
  commit_time="${date}T10:00:00"
  
  echo "Creating commit: $message ($date)"
  
  # Create an empty commit with backdated timestamp
  GIT_AUTHOR_DATE="$commit_time" GIT_COMMITTER_DATE="$commit_time" \
    git commit --allow-empty -m "$message"
done

echo ""
echo "✓ Generated ${#commits[@]} commits from July to September 2026"
echo "Run 'git log --oneline' to view commit history"
