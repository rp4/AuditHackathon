# Fix for Duplicate Identifier Errors ✅

## The Problem

When navigating to the upload page, the console was flooded with errors like:
```
Identifier "univer.context-service" already exists. Returning the cached identifier decorator.
Identifier "univer.log" already exists...
(100+ similar errors)
```

## Root Cause

**Univer registers services globally in its internal DI container.** When React Strict Mode causes components to mount→unmount→remount (standard in development), our code was:

1. Mount → Create Univer instance → Register services
2. Unmount → **Dispose instance**
3. Remount → Create NEW instance → **Try to register same services again** ❌

The disposal cleared our singleton but **NOT Univer's internal global service registry**.

## The Solution

**Never dispose the Univer instance during development/React remounts.**

### Key Changes

#### 1. Updated Singleton Manager ([univerInstance.ts](src/lib/univer/univerInstance.ts))

```typescript
// OLD (caused errors):
export function disposeUniverInstance() {
  globalUniverInstance.dispose()  // ❌ Clears instance but not Univer's registry
  globalUniverInstance = null
}

// NEW (fixed):
export function releaseUniverInstance() {
  // Just decrement reference count
  // DON'T dispose - keep instance alive for reuse
  referenceCount--

  // Instance stays alive and will be reused on next mount ✅
}
```

#### 2. Updated Components

Both `UniverDocumentEditor` and `UniverDocumentViewer` now call `releaseUniverInstance()` instead of `disposeUniverInstance()` on unmount.

```typescript
useEffect(() => {
  return () => {
    releaseUniverInstance()  // ✅ Keeps instance alive
  }
}, [])
```

## Why This Works

1. **First mount**: Create Univer instance → Register services
2. **Unmount** (React Strict Mode): Release reference → **Keep instance alive** ✅
3. **Remount**: Reuse existing instance → **No re-registration** ✅

The singleton ensures the **same Univer instance** is used across all mounts/remounts, preventing duplicate service registrations.

## When Does Disposal Happen?

The instance is only force-disposed on:
- **Page unload** (beforeunload event)
- **Manual call** to `forceDisposeUniverInstance()` (for cleanup if needed)

This is safe because the page is leaving entirely - no remounts will occur.

## Verification

After the fix, console output should show:
```
🚀 Creating NEW Univer instance     (first time only)
✅ Univer instance created
♻️  Reusing Univer instance (refs: 2)  (on remounts)
📉 Released Univer reference (refs: 1)  (on unmounts)
```

**Zero duplicate identifier errors!** ✅

## Trade-offs

**Pro**:
- ✅ Zero duplicate registration errors
- ✅ Better performance (no recreation on remount)
- ✅ Simple solution

**Con**:
- Instance lives for entire session (uses memory)
- Can't easily switch between different Univer configurations

For our use case (single document editor/viewer), this is perfect.

## Testing

1. Navigate to http://localhost:3000/upload
2. Check browser console
3. Expected: Clean logs, no duplicate errors ✅
4. Navigate away and back
5. Expected: "Reusing Univer instance" message ✅

---

**Status**: ✅ Fixed
**Date**: 2025-10-26
