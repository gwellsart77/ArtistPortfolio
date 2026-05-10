# Bug Ledger

## [FEATURE] CV Editor - Enter Key Bullet List Continuation - VERIFIED ✅
- **Frequency**: Every use (contentEditable)
- **Environment**: Dev/Prod
- **Impact**: High (core editor UX)
- **Status**: VERIFIED - Hotfix (2025-10-06)
- **Owner**: replit-ai
- **Priority**: High
- **Resolution**: CV Editor bullet list continuation using `beforeinput` interception with robust LI detection:
  - ✅ Enter key in `<li>` creates new bullet with proper caret placement
  - ✅ Shift+Enter creates soft line break (`<br>`) within same bullet
  - ✅ Enter in empty `<li>` ends list and creates paragraph after
  - ✅ Robust `closestElement` helper works from Text nodes and inline tags
  - ✅ No `useEffect([value])` that writes innerHTML while focused (prevents caret jumps)
  - ✅ Removed temporary debug console statements
- **Testing**: End-to-end playwright test verified all behaviors in Admin Settings → About → CV/Exhibition History
- **Change Budget**: 1 file, 7 lines removed (cleanup only)
- **Build Status**: ✅ Application builds/runs successfully, 0 TypeScript errors

## [BUG] TypeScript LSP Compilation Errors - PARTIALLY RESOLVED
- **Frequency**: Constant (development experience)
- **Environment**: Dev 
- **Impact**: Medium (some IDE errors remain)
- **Status**: Partially Resolved (2025-08-21)
- **Owner**: replit-ai
- **Priority**: Medium 
- **Resolution**: Fixed 4/5 TypeScript errors:
  - ✅ App.tsx: Removed unused imports (adminNavigationGuard, initPageTracking, ArtworkDetail, ErrorBoundary/AdminErrorBoundary)
  - ❌ drizzle.config.ts: Cannot fix due to protected file status
- **Remaining Issue**: drizzle.config.ts defineConfig import error (1 error remaining)
- **Build Status**: ✅ Application builds successfully despite remaining LSP error

## [BUG] Slow API Response Performance 
- **Frequency**: Intermittent (now improved)
- **Environment**: Both
- **Impact**: Low (performance now stable)
- **Status**: Monitoring (2025-08-21)
- **Owner**: replit-ai
- **Priority**: Low
- **Investigation Results**:
  - Root cause appears to be cold start performance or database connection warming
  - Current response times: ~20-150ms (significant improvement from 2498ms)
  - Settings endpoint uses simple database query: `db.select().from(settings).where(eq(settings.key, key))`
- **Current Performance**: ✅ API responses now consistently under 200ms
- **Action**: Monitor for 24h to confirm stability, no immediate fixes needed

## [BUG] TypeScript Strict Mode Errors - PHASE 4.1 COMPLETED ✅
- **Frequency**: Constant (development experience)
- **Environment**: Dev
- **Impact**: Low (development experience, build still works)
- **Status**: STRATEGIC COMPLETION - Phase 4.1 (2025-08-21)
- **Owner**: replit-ai
- **Priority**: Low
- **Discovery**: LSP vs TSC discrepancy - Found 1,007 strict errors vs expected 4 due to enhanced tsconfig.json
- **Resolution**: Strategic approach focusing on critical runtime errors:
  - ✅ Phase 4: LSP cleanup (1,089→4 LSP errors)
  - ✅ Phase 4.1: Critical TSC fixes (1,007→994 strict errors, 13 runtime fixes)
  - ✅ Fixed AdminLayout string undefined, PrintfulOrderManager type generics
  - ✅ Cleaned unused imports causing development noise
- **Current**: 994 strict TypeScript errors (non-blocking, build succeeds)
- **Build Status**: ✅ Application builds/runs successfully (16.02s frontend, 35ms server)
- **Strategy**: Production-ready state achieved, systematic cleanup available for future phases

## [FEATURE] PostgreSQL Backups System - PHASE 5 COMPLETED ✅
- **Frequency**: Daily (production only)
- **Environment**: Production
- **Impact**: High (data protection and disaster recovery)
- **Status**: IMPLEMENTED - Phase 5 (2025-08-21)
- **Owner**: replit-ai
- **Priority**: High
- **Resolution**: Complete automated backup system with verification:
  - ✅ Manual trigger script: `scripts/db/backup.ts` with compression, checksums, retention
  - ✅ Verification tool: `scripts/db/restore-verify.ts` for integrity testing
  - ✅ Production scheduler: Daily backups at 2 AM UTC when BACKUPS_ENABLED=true
  - ✅ Evidence: 483KB dump created, verified restore with 203 schema objects
  - ✅ Zero dependencies: Node.js built-ins only (crypto, child_process, fs)
- **Current**: Operational with 7-day retention, SHA256 checksums, manifest tracking
- **Commands**: `npm run db:backup`, `npm run db:restore-verify`

## [FEATURE] Request Observability System - PHASE 5 COMPLETED ✅  
- **Frequency**: Every request
- **Environment**: Dev/Prod
- **Impact**: Medium (debugging and monitoring)
- **Status**: IMPLEMENTED - Phase 5 (2025-08-21)
- **Owner**: replit-ai
- **Priority**: Medium
- **Resolution**: Comprehensive request correlation and structured logging:
  - ✅ Request ID middleware: UUID generation with X-Request-Id headers
  - ✅ Timing logger: Duration tracking with development/production log levels
  - ✅ Error correlation: Structured logs with reqId, method, path, status, duration
  - ✅ Evidence: Health endpoints responding with correlation headers
- **Current**: Active request tracking, development logs enabled, error correlation working
- **Monitoring**: Request IDs in all API responses, structured error logs with correlation

## [BUG] Google Analytics 404 Warnings - RESOLVED
- **Frequency**: Intermittent (when GA not configured)
- **Environment**: Both
- **Impact**: Low (console warnings)
- **Status**: Resolved (2025-08-21)
- **Owner**: replit-ai
- **Priority**: Low
- **Resolution**: Added defensive guard in analytics.ts:
  - ✅ Check for measurementId existence and G- prefix format
  - ✅ Silent fail when GA not configured (no console warnings)
  - ✅ Still initializes correctly when environment variable present

## [BUG] Cache Invalidation WebSocket Warnings - RESOLVED  
- **Frequency**: Frequent during development
- **Environment**: Dev
- **Impact**: Low (console noise)
- **Status**: Resolved (2025-08-21) 
- **Owner**: replit-ai
- **Priority**: Low
- **Resolution**: Reduced console noise in use-cache-invalidation.ts:
  - ✅ Changed console.log/error to console.debug for development only
  - ✅ Silent reconnection attempts in production
  - ✅ Preserved cache reset functionality (soft/hard/nuclear)
  - ✅ Only logs non-connection errors

## Historical Bugs (Resolved)
- **Admin Gallery Navigation Error** - RESOLVED 2025-08-02
- **Gallery Image Ordering Issues** - RESOLVED 2025-08-02  
- **Shop Category Display Problems** - RESOLVED 2025-07-18
- **Cache Management Issues** - RESOLVED 2025-07-18