# MongoDB URI Error Fix - Complete Guide

## The Error

```
Runtime Error

Please define the MONGODB_URI environment variable inside .env.local

src\lib\mongodb.ts (7:9) @ eval
```

This error occurred at **runtime in the browser**, not at build time.

---

## Root Cause Analysis

### Why This Happened

The error occurred because **server-side only code** (`mongodb.ts`) was being imported into a **client-side component** (`'use client'`).

### The Problem Chain

```
1. src/app/surveys/create-wizard/page.tsx (Client Component)
   ↓ imports
2. src/lib/user-credential-service.ts
   ↓ imports
3. src/lib/mongodb.ts
   ↓ tries to connect
4. process.env.MONGODB_URI (Only available on server!)
   ↓ result
5. ❌ Error: MONGODB_URI not defined (in browser)
```

**Why browser can't access MONGODB_URI:**

- Environment variables starting with `MONGODB_URI` are **server-only**
- Only variables starting with `NEXT_PUBLIC_` are exposed to browser
- This is a security feature - database credentials should NEVER be in browser!

---

## The Fix

### File: `src/app/surveys/create-wizard/page.tsx`

**Before (BROKEN):**

```typescript
'use client';

import { UserCredentialService } from '@/lib/user-credential-service';
// ↑ This imports mongodb.ts → ERROR!

// Later in code...
const credentials = await UserCredentialService.getUserCredentialsForInvitation(
  user._id
);
// ↑ Tries to call server-side service from browser → ERROR!
```

**After (FIXED):**

```typescript
'use client';

// ✅ Removed server-side import
// import { UserCredentialService } from '@/lib/user-credential-service';

// Later in code...
// ✅ Let the API handle credentials server-side
const invitationResponse = await fetch(
  `/api/surveys/${survey._id}/invitations`,
  {
    method: 'POST',
    body: JSON.stringify({
      include_credentials: surveyData.include_credentials,
      // API will generate credentials server-side
    }),
  }
);
```

---

## Understanding Client vs Server in Next.js 15

### Server Components (Default in Next.js 15)

```typescript
// NO 'use client' directive
// Runs on SERVER only

import { connectDB } from '@/lib/mongodb'; // ✅ OK!
import User from '@/models/User'; // ✅ OK!

export default async function Page() {
  await connectDB(); // ✅ Safe - runs on server
  const users = await User.find(); // ✅ Safe
  return <div>{users.length} users</div>;
}
```

**Can import:**

- ✅ Database connections (`mongodb.ts`)
- ✅ Mongoose models
- ✅ Server-only libraries (`bcrypt`, `nodemailer`, etc.)
- ✅ Environment variables (all of them)

### Client Components

```typescript
'use client'; // ← This makes it a client component
// Runs in BROWSER

// ❌ CANNOT import server-only code!
// import { connectDB } from '@/lib/mongodb'; // ERROR!

import { useState } from 'react'; // ✅ OK
import { Button } from '@/components/ui/button'; // ✅ OK

export default function Page() {
  const [data, setData] = useState();

  // ✅ Must use API routes for server operations
  const fetchData = async () => {
    const res = await fetch('/api/data'); // ✅ Correct way
    const data = await res.json();
    setData(data);
  };

  return <Button onClick={fetchData}>Load</Button>;
}
```

**Can import:**

- ✅ React hooks (`useState`, `useEffect`, etc.)
- ✅ Client-only libraries
- ✅ UI components
- ✅ `NEXT_PUBLIC_*` env variables only
- ❌ **CANNOT** import server-only code

---

## How to Identify These Issues

### Quick Check: Is it Safe?

```typescript
// 1. Check for 'use client'
'use client'; // ← If this exists, NO server imports!

// 2. Check imports
import { connectDB } from '@/lib/mongodb'; // ❌ Server-only
import User from '@/models/User'; // ❌ Server-only
import bcrypt from 'bcryptjs'; // ❌ Server-only (if used with DB)
import { useState } from 'react'; // ✅ Client-safe
```

### Common Server-Only Imports to Avoid in Client Components

```typescript
// ❌ Database
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import * as Models from '@/models/*';

// ❌ Server utilities that use DB
import { UserCredentialService } from '@/lib/user-credential-service';
import { emailService } from '@/lib/email';
import { notificationService } from '@/lib/notification-service';

// ❌ Server-only libraries
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth';

// ✅ Safe for client
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Client version!
```

---

## Proper Pattern: API Routes as Bridge

### The Correct Architecture

```
┌─────────────────┐
│ Client Component│  'use client'
│ (Browser)       │
└────────┬────────┘
         │
         │ fetch('/api/...')
         ↓
┌─────────────────┐
│ API Route       │  Server-side
│ /api/...        │
└────────┬────────┘
         │
         │ import { connectDB }
         │ import Models
         ↓
┌─────────────────┐
│ Database        │
│ (MongoDB)       │
└─────────────────┘
```

### Example: User Credentials Flow

**❌ WRONG (Direct Call):**

```typescript
// In client component
'use client';

import { UserCredentialService } from '@/lib/user-credential-service';

function MyComponent() {
  const getCredentials = async (userId) => {
    // ❌ ERROR: Trying to call server-side service from browser
    const creds =
      await UserCredentialService.getUserCredentialsForInvitation(userId);
  };
}
```

**✅ CORRECT (Via API):**

```typescript
// 1. Client component calls API
'use client';

function MyComponent() {
  const getCredentials = async (userId) => {
    // ✅ Call API route
    const response = await fetch(`/api/users/${userId}/credentials`);
    const creds = await response.json();
  };
}

// 2. API route handles server-side logic
// app/api/users/[userId]/credentials/route.ts
import { UserCredentialService } from '@/lib/user-credential-service';

export async function GET(req, { params }) {
  const userId = params.userId;

  // ✅ Safe - running on server
  const credentials =
    await UserCredentialService.getUserCredentialsForInvitation(userId);

  return Response.json(credentials);
}
```

---

## Common Scenarios & Solutions

### Scenario 1: Form Submission with DB Operation

**❌ WRONG:**

```typescript
'use client';

import User from '@/models/User'; // ❌ Server-only

function UserForm() {
  const handleSubmit = async (data) => {
    await User.create(data); // ❌ ERROR!
  };
}
```

**✅ CORRECT:**

```typescript
'use client';

function UserForm() {
  const handleSubmit = async (data) => {
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
}
```

### Scenario 2: Authentication Check

**❌ WRONG:**

```typescript
'use client';

import { getServerSession } from 'next-auth'; // ❌ Server-only

function Dashboard() {
  const session = await getServerSession(); // ❌ ERROR!
}
```

**✅ CORRECT:**

```typescript
'use client';

import { useSession } from 'next-auth/react'; // ✅ Client version

function Dashboard() {
  const { data: session } = useSession(); // ✅ Correct!
}
```

### Scenario 3: Sending Emails

**❌ WRONG:**

```typescript
'use client';

import { emailService } from '@/lib/email'; // ❌ Server-only

function InviteButton() {
  const sendInvite = async (email) => {
    await emailService.send({ to: email }); // ❌ ERROR!
  };
}
```

**✅ CORRECT:**

```typescript
'use client';

function InviteButton() {
  const sendInvite = async (email) => {
    await fetch('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };
}
```

---

## Files Fixed in This Issue

### 1. `src/app/surveys/create-wizard/page.tsx`

**Changes:**

- ❌ Removed: `import { UserCredentialService } from '@/lib/user-credential-service';`
- ❌ Removed: Direct calls to `UserCredentialService.getUserCredentialsForInvitation()`
- ✅ Added: Comment explaining API handles credentials server-side
- ✅ Modified: Let `/api/surveys/[id]/invitations` endpoint handle credential generation

**Before:**

```typescript
import { UserCredentialService } from '@/lib/user-credential-service';

// Generate credentials client-side (WRONG!)
let userCredentials = {};
for (const user of users) {
  const credentials =
    await UserCredentialService.getUserCredentialsForInvitation(user._id);
  userCredentials[user._id] = credentials;
}

// Send to API
await fetch(`/api/surveys/${survey._id}/invitations`, {
  body: JSON.stringify({ user_credentials: userCredentials }),
});
```

**After:**

```typescript
// API generates credentials server-side (CORRECT!)
await fetch(`/api/surveys/${survey._id}/invitations`, {
  body: JSON.stringify({
    include_credentials: surveyData.include_credentials,
    // API will generate user_credentials server-side
  }),
});
```

---

## Verification Steps

### 1. Check Build

```bash
npm run build
```

**Expected:** ✅ Compiled successfully (No errors)

### 2. Check Dev Server

```bash
npm run dev
```

**Expected:** ✅ No runtime errors in browser console

### 3. Test the Fixed Page

```
1. Navigate to http://localhost:3000/surveys/create-wizard
2. Open browser DevTools → Console
3. Expected: No "MONGODB_URI" error
4. Expected: Page loads successfully
```

---

## Prevention Checklist

Before importing anything in a client component (`'use client'`), ask:

- [ ] Does this import connect to a database? → ❌ Use API route
- [ ] Does this import use `process.env` (non-PUBLIC)? → ❌ Use API route
- [ ] Does this import use server-only libraries (bcrypt, nodemailer)? → ❌ Use API route
- [ ] Does this import use `getServerSession`? → ✅ Use `useSession` instead
- [ ] Does this import use React hooks? → ✅ Safe for client
- [ ] Does this import UI components? → ✅ Safe for client

---

## Quick Reference

### Server-Side Only ❌

```typescript
// ❌ Never import these in 'use client' components
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { UserCredentialService } from '@/lib/user-credential-service';
import { emailService } from '@/lib/email';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
```

### Client-Safe ✅

```typescript
// ✅ Safe to import in 'use client' components
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
```

### How to Call Server Code from Client ✅

```typescript
// ✅ Always use fetch to API routes
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
const result = await response.json();
```

---

## Related Documentation

- [Next.js Server & Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Next-Auth Client API](https://next-auth.js.org/getting-started/client)

---

## Summary

**Problem:** Client component imported server-side code (`UserCredentialService` → `mongodb.ts`)  
**Solution:** Removed server imports, let API routes handle server operations  
**Result:** ✅ Build successful, no runtime errors  
**Pattern:** Client → API Route → Server Code → Database

**Remember:** The browser should NEVER directly access database code! 🔒
