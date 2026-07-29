# Graph Report - Kolium (2026-07-29)

## Corpus Check
- 279 files · ~278,913 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1222 nodes · 2034 edges · 152 communities (81 shown, 71 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Architecture and Product Strategy
- Backend Package Dependencies
- OpenAI Integration
- Task API Controllers
- Authentication E2E Tests
- Frontend Package Configuration
- UI E2E Tests
- File Upload Components
- Application E2E Suite
- TypeScript Browser Configuration
- Pricing and Credits
- Navigation and Auth Modals
- Task Detail and Comments
- Backend Application Routing
- Supabase Data Access
- Shared UI Components
- AI Backend Routes
- Vite Node Configuration
- Application Shell
- Time Tracking Controller
- Authentication Middleware
- Board Page Model
- Profile Dialog
- Task Tree State
- User Profile Context
- Timer Page Model
- Tree Page Model
- Task Board Components
- Authentication Context
- Continuous Integration Workflows
- Authentication Controller
- Task Statistics and Mapping
- Application Unit Tests
- Upload Routes
- Contribution Conventions
- Account and Avatar UI
- Task Timer Tests
- Supabase Authentication UI
- Admin Credits Controller
- Authentication Form
- Task Tree Tests
- Localization UI
- Frontend Development Dependencies
- Frontend Runtime Dependencies
- PWA Manifest
- Productivity Illustrations
- Help and Feedback
- Time Analytics
- UI Styling Utilities
- Task Item Tests
- Upload Middleware
- Dashboard Illustrations
- Password Reset Flow
- OpenAI Client Service
- Task Board Tests
- Feature Request Controller
- Registration Success UI
- Application Pages
- PWA App Icon
- Product Dashboard Imagery
- Frontend API Client
- Login Page Tests
- Authentication Route Tests
- Login Workflow Imagery
- React Quality Diagnostics
- Storage Bucket Check
- Environment Loader
- Playwright Global Setup
- Task Filtering E2E
- SEO and Web Metadata
- Task Comments Migration
- Playwright Test Configuration
- Apple Touch Icon
- Kolium Favicon
- Kolium PWA Icon
- Branch Name Validation
- Kolium Brand Logo
- Backend Debug Server
- BrowserStack Test Imports
- AI Sparkle Asset
- AI Sparkle Variant
- Forgot Password Tests
- Vite Environment Types
- TypeScript Project References
- canvas-confetti Dependency
- class-variance-authority Dependency
- clsx Dependency
- commitlint cli Dependency
- commitlint config-conventional Dependency
- cz-conventional-changelog Dependency
- dotenv-cli Dependency
- eslint Dependency
- eslint js Dependency
- eslint-plugin-react-refresh Dependency
- framer-motion Dependency
- globals Dependency
- husky Dependency
- commit-msg Dependency
- pre-commit Dependency
- i18next Dependency
- i18next-browser-languagedetector Dependency
- jsdom Dependency
- lint-staged Dependency
- lucide-react Dependency
- number-flow react Dependency
- cors Dependency
- express Dependency
- multer Dependency
- papaparse Dependency
- radix-ui react-avatar Dependency
- radix-ui react-dialog Dependency
- radix-ui react-label Dependency
- radix-ui react-slot Dependency
- radix-ui react-switch Dependency
- react-dom Dependency
- react-easy-crop Dependency
- react-router-dom Dependency
- sonner Dependency
- swagger-jsdoc Dependency
- swagger-ui-express Dependency
- tailwind-merge Dependency
- vercel analytics Dependency
- dotenv Dependency
- playwright test Dependency
- postcss Dependency
- tailwindcss Dependency
- testing-library jest-dom Dependency
- testing-library react Dependency
- types canvas-confetti Dependency
- types papaparse Dependency
- types react Dependency
- types react-dom Dependency
- typescript Dependency
- typescript-eslint Dependency
- vite Dependency
- vitejs plugin-react Dependency
- vitest Dependency
- vitest coverage-v8 Dependency
- vercel Dependency

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 57 edges
2. `AppPage` - 45 edges
3. `AuthPage` - 40 edges
4. `TaskPage` - 35 edges
5. `Task` - 34 edges
6. `TaskService` - 29 edges
7. `ThemeProvider()` - 26 edges
8. `scripts` - 23 edges
9. `BoardPage` - 22 edges
10. `TreePage` - 22 edges

## Surprising Connections (you probably didn't know these)
- `AI-Powered Task Assistance` --conceptually_related_to--> `OpenAI Service Layer`  [INFERRED]
  README.md → docs/AI_INTEGRATION.md
- `Agent Development Rules` --conceptually_related_to--> `Testing Strategy`  [INFERRED]
  rules.md → docs/TESTING_GUIDE.md
- `ImageCropModal()` --references--> `react`  [EXTRACTED]
  src/components/features/account/ImageCropModal.tsx → package.json
- `LoginPage()` --references--> `react`  [EXTRACTED]
  src/pages/LoginPage.tsx → package.json
- `RegisterPage()` --references--> `react`  [EXTRACTED]
  src/pages/RegisterPage.tsx → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Kolium Fullstack Task Platform** — readme_kolium, docs_frontend_guide_frontend_architecture, docs_backend_guide_backend_architecture, docs_database_schema_database_schema [INFERRED 0.95]
- **Defense-in-Depth User Isolation** — docs_api_docs_supabase_jwt_authentication, docs_api_docs_user_isolation, docs_backend_guide_user_isolation_pattern, docs_database_schema_row_level_security [INFERRED 0.95]
- **Delivery Quality Gates** — _github_workflows_unit_tests_unit_test_pipeline, docs_ci_cd_guide_ci_cd_strategy, docs_e2e_env_config_e2e_environment, docs_implementation_summary_automated_validation [INFERRED 0.85]
- **Task API Documentation Surfaces** — docs_prd_guide_backend_task_management_api, docs_postman_backend_guide_task_api_endpoints, docs_swagger_guide_swagger_testing_guide [INFERRED 0.85]
- **Kolium Production Delivery** — docs_render_vercel_setup_legacy_render_vercel_deployment, render_taskmanager_backend_service, docs_url_redirection_url_redirection_configuration, index_kolium_web_entry [INFERRED 0.75]
- **Product Capability Definition** — docs_prd_guide_product_requirements, docs_user_guide_user_guide, docs_monetization_strategy_monetization_strategy [INFERRED 0.75]
- **Favicon Visual System** — public_favicon_central_circular_core, public_favicon_four_segment_radial_ring, public_favicon_blue_cyan_white_palette [EXTRACTED 1.00]
- **Radial Icon Composition** — public_pwa_512_radial_four_lobe_emblem, public_pwa_512_central_circular_hub, public_pwa_512_faceted_colored_lobes, public_pwa_512_dark_rounded_square_background [EXTRACTED 1.00]
- **Connected Productivity Scene** — src_assets_images_login_illustration_dark_2_digital_worker, src_assets_images_login_illustration_dark_2_task_management_dashboard, src_assets_images_login_illustration_dark_2_notification_alerts, src_assets_images_login_illustration_dark_2_cloud_services [INFERRED 0.85]
- **Login Productivity Workspace Theme** — src_assets_images_login_illustration_dark_poster_login_productivity_illustration, src_assets_images_login_illustration_dark_poster_task_management_dashboard, src_assets_images_login_illustration_dark_poster_digital_productivity_workflow, src_assets_images_login_illustration_dark_poster_cloud_connected_workspace, src_assets_images_login_illustration_dark_poster_space_launch_theme [INFERRED 0.85]
- **Digital Task Management Workflow** — src_assets_images_login_illustration_light_2_dashboard_user, src_assets_images_login_illustration_light_2_task_management_dashboard, src_assets_images_login_illustration_light_2_tablet_device, src_assets_images_login_illustration_light_2_cloud_services [INFERRED 0.75]
- **Integrated Digital Workflow** — src_assets_images_login_illustration_light_poster_task_management_dashboard, src_assets_images_login_illustration_light_poster_analytics_dashboard, src_assets_images_login_illustration_light_poster_cloud_workflow, src_assets_images_login_illustration_light_poster_digital_productivity_workspace [INFERRED 0.85]

## Communities (152 total, 71 thin omitted)

### Community 0 - "Architecture and Product Strategy"
Cohesion: 0.05
Nodes (47): Issue History, Resilient E2E Assertions, RLS Data Isolation, Vite Environment Variable Prefix, Freemium Model, Kolium Monetization Strategy, Subscription Infrastructure, Team Plan (+39 more)

### Community 1 - "Backend Package Dependencies"
Cohesion: 0.04
Nodes (44): author, dependencies, cors, cross-env, dotenv, express, multer, @supabase/supabase-js (+36 more)

### Community 2 - "OpenAI Integration"
Cohesion: 0.06
Nodes (43): OpenAI API Key Protection, Model-Specific Request Configuration, OpenAI Service Layer, Real-Time SSE Streaming, TaskForm AI Experience, Kolium REST API, Supabase JWT Authentication, Task CRUD Endpoints (+35 more)

### Community 3 - "Task API Controllers"
Cohesion: 0.08
Nodes (35): addComment(), createTask(), deleteComment(), deleteTask(), getComments(), getTaskById(), getTasks(), handleTaskDbError() (+27 more)

### Community 5 - "Frontend Package Configuration"
Cohesion: 0.06
Nodes (34): path, config, commitizen, description, engines, node, homepage, name (+26 more)

### Community 7 - "File Upload Components"
Cohesion: 0.10
Nodes (9): FileUploader(), FileUploaderProps, ApiResponse, BackendComment, BackendTask, TaskService, UploadResult, mockComments (+1 more)

### Community 9 - "TypeScript Browser Configuration"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+15 more)

### Community 10 - "Pricing and Credits"
Cohesion: 0.12
Nodes (13): CreditsPurchase(), CreditsPurchaseProps, Plan, Pricing(), PricingProps, mockPlans, Button, ButtonProps (+5 more)

### Community 11 - "Navigation and Auth Modals"
Cohesion: 0.13
Nodes (10): BurgerMenu(), BurgerMenuProps, AuthRequiredModal(), AuthRequiredModalProps, ImageCropModal(), ImageCropModalProps, Theme, ThemeContextType (+2 more)

### Community 12 - "Task Detail and Comments"
Cohesion: 0.16
Nodes (13): TaskComments(), TaskCommentsProps, TaskDetailModal(), TaskDetailModalProps, SpotlightCard(), SpotlightCardProps, TaskIdBadge(), TaskIdBadgeProps (+5 more)

### Community 13 - "Backend Application Routing"
Cohesion: 0.10
Nodes (16): adminRoutes, aiRoutes, app, authRoutes, cors, express, featureRequestRoutes, profileRoutes (+8 more)

### Community 14 - "Supabase Data Access"
Cohesion: 0.21
Nodes (14): { createClient }, createClientWithToken(), dotenv, supabase, { createClientWithToken, supabase }, deleteAvatar(), getProfile(), uploadAvatar() (+6 more)

### Community 15 - "Shared UI Components"
Cohesion: 0.21
Nodes (11): AIIcon(), AIIconProps, AttachmentList(), AttachmentListProps, TaskForm(), TaskFormProps, mockAttachments, Attachment (+3 more)

### Community 16 - "AI Backend Routes"
Cohesion: 0.11
Nodes (15): { authenticateUser }, { createClientWithToken, supabase }, express, router, aiRouter, app, bodyParser, express (+7 more)

### Community 17 - "Vite Node Configuration"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 18 - "Application Shell"
Cohesion: 0.15
Nodes (7): AccountMenu(), AuthRequiredModal(), AuthRequiredModalProps, ErrorModal(), ErrorModalProps, ProgressIcon(), ProgressIconProps

### Community 19 - "Time Tracking Controller"
Cohesion: 0.19
Nodes (14): completeEntry(), getSummary(), startEntry(), stopEntry(), { supabase }, syncTaskTotalTime(), { authenticateUser }, express (+6 more)

### Community 20 - "Authentication Middleware"
Cohesion: 0.15
Nodes (13): authenticateUser(), { supabase, createClientWithToken }, { authenticateUser }, express, featureRequestController, optionalAuth(), router, { authenticateUser } (+5 more)

### Community 22 - "Profile Dialog"
Cohesion: 0.18
Nodes (12): MyProfileModal(), MyProfileModalProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle (+4 more)

### Community 23 - "Task Tree State"
Cohesion: 0.26
Nodes (12): TaskBoardProps, TaskItemProps, TaskTreeProps, defaultTasks, parseTasksFromStorage(), useTasks(), TaskNode, TaskStatus (+4 more)

### Community 24 - "User Profile Context"
Cohesion: 0.16
Nodes (11): UserProfile, UserProfileContext, UserProfileContextType, UserProfileProvider(), useUserProfile(), mockNavigate, mockUseAuth, mockUseTheme (+3 more)

### Community 27 - "Task Board Components"
Cohesion: 0.29
Nodes (12): DeleteConfirmationModal(), DeleteConfirmationModalProps, TaskBoard(), lineClampClasses, TaskDescription(), TaskDescriptionProps, TaskItem(), formatDate() (+4 more)

### Community 28 - "Authentication Context"
Cohesion: 0.25
Nodes (7): LoginButton(), LoginButtonProps, AuthContext, AuthContextType, AuthProvider(), useAuth(), mockNavigate

### Community 29 - "Continuous Integration Workflows"
Cohesion: 0.15
Nodes (14): Kimi PR Co-Review, Moonshot API Key Secret, Reusable Kimi Review Workflow, Backend Unit Tests, Frontend Unit Tests, Unit Test Pipeline, CI/CD Strategy, GitHub Actions Workflows (+6 more)

### Community 30 - "Authentication Controller"
Cohesion: 0.21
Nodes (10): forgotPassword(), login(), register(), resetPassword(), { supabase }, express, {

  register,

  login,

  forgotPassword,

  resetPassword,

}, router (+2 more)

### Community 31 - "Task Statistics and Mapping"
Cohesion: 0.29
Nodes (4): MainApp(), TaskStats(), TaskStatsProps, Task

### Community 32 - "Application Unit Tests"
Cohesion: 0.15
Nodes (12): createTaskMock, deleteTaskMock, exportTasksMock, getElapsedTimeMock, getTimeStatisticsMock, importTasksMock, mockTasks, mockTaskTree (+4 more)

### Community 33 - "Upload Routes"
Cohesion: 0.17
Nodes (10): { authenticateUser }, express, router, upload, uploadController, app, appWithHandler, express (+2 more)

### Community 34 - "Contribution Conventions"
Cohesion: 0.23
Nodes (12): Branch Naming Conventions, Conventional Commits, Development Conventions, Pull Request Conventions, Commitizen Commit Workflow, Daily Conventions Workflow, Semantic Release Scripts, Semantic Versioning (+4 more)

### Community 35 - "Account and Avatar UI"
Cohesion: 0.26
Nodes (5): AccountMenuProps, Avatar, AvatarFallback, AvatarImage, ThemeContext

### Community 36 - "Task Timer Tests"
Cohesion: 0.27
Nodes (7): formatTime(), TaskTimer(), TaskTimerProps, mockTask, mockOnPause, mockOnStart, playNotificationSound()

### Community 37 - "Supabase Authentication UI"
Cohesion: 0.26
Nodes (4): supabase, AuthCallback(), mockNavigate, mockEnv

### Community 38 - "Admin Credits Controller"
Cohesion: 0.29
Nodes (8): addUserCredits(), getUserCredits(), setUserCredits(), { supabase }, verifyAdminSecret(), express, router, {

    verifyAdminSecret,

    getUserCredits,

    addUserCredits,

    setUserCredits

}

### Community 39 - "Authentication Form"
Cohesion: 0.31
Nodes (4): AuthForm(), AuthFormProps, PasswordInput(), PasswordInputProps

### Community 40 - "Task Tree Tests"
Cohesion: 0.20
Nodes (9): TaskTree(), mockGetElapsedTime, mockOnAddChild, mockOnDelete, mockOnEdit, mockOnPauseTimer, mockOnStartTimer, mockOnStatusChange (+1 more)

### Community 41 - "Localization UI"
Cohesion: 0.31
Nodes (6): ESFlag(), USFlag(), LanguageToggle(), changeLanguageMock, tMock, useTranslationMock

### Community 42 - "Frontend Development Dependencies"
Cohesion: 0.22
Nodes (9): autoprefixer, commitizen, eslint-plugin-react-hooks, devDependencies, autoprefixer, commitizen, eslint-plugin-react-hooks, @testing-library/user-event (+1 more)

### Community 43 - "Frontend Runtime Dependencies"
Cohesion: 0.22
Nodes (9): axios, dependencies, axios, react-i18next, react-markdown, @supabase/supabase-js, @supabase/supabase-js, react-i18next (+1 more)

### Community 44 - "PWA Manifest"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 45 - "Productivity Illustrations"
Cohesion: 0.22
Nodes (9): Analytics Chart, Checklist Workflow, Cloud Services, Digital Worker, Login Productivity Illustration, Notification Alerts, Productivity Momentum, Rocket Launch (+1 more)

### Community 46 - "Help and Feedback"
Cohesion: 0.31
Nodes (3): HelpPanelProps, FeatureRequestInput, helpService

### Community 47 - "Time Analytics"
Cohesion: 0.36
Nodes (6): TimeStatsView(), TimeStatsViewProps, mockGetTimeStatistics, TaskFilter, TaskTimeStats, TimeEntry

### Community 48 - "UI Styling Utilities"
Cohesion: 0.31
Nodes (5): Direction, HoverBorderGradient(), HoverBorderGradientProps, AVATAR_COLORS, cn()

### Community 49 - "Task Item Tests"
Cohesion: 0.22
Nodes (8): mockGetElapsedTime, mockOnAddChild, mockOnDelete, mockOnEdit, mockOnPauseTimer, mockOnStartTimer, mockOnStatusChange, mockOnToggleExpand

### Community 50 - "Upload Middleware"
Cohesion: 0.25
Nodes (5): multer, path, storage, upload, upload

### Community 51 - "Dashboard Illustrations"
Cohesion: 0.25
Nodes (8): Analytics Panels, Cloud Services, Completed Task Checkmarks, Dashboard User, Digital Workflow Illustration, Rocket Launch, Tablet Device, Task Management Dashboard

### Community 54 - "Task Board Tests"
Cohesion: 0.25
Nodes (7): mockGetElapsedTime, mockOnCreateTask, mockOnDelete, mockOnEdit, mockOnPauseTimer, mockOnStartTimer, mockOnStatusChange

### Community 55 - "Feature Request Controller"
Cohesion: 0.38
Nodes (5): createFeatureRequest(), getFeatureRequests(), { supabase }, { createFeatureRequest, getFeatureRequests }, { supabase }

### Community 56 - "Registration Success UI"
Cohesion: 0.38
Nodes (3): RegistrationSuccessModal(), RegistrationSuccessModalProps, BalloonBackground()

### Community 57 - "Application Pages"
Cohesion: 0.33
Nodes (6): react, react, HelpPanel(), LoginPage(), PricingPage(), RegisterPage()

### Community 58 - "PWA App Icon"
Cohesion: 0.40
Nodes (6): Blue, Cyan, and White Palette, Central Circular Hub, Dark Rounded-Square Background, Faceted Colored Lobes, PWA App Icon, Radial Four-Lobe Emblem

### Community 59 - "Product Dashboard Imagery"
Cohesion: 0.53
Nodes (6): Analytics Dashboard, Cloud Workflow, Digital Productivity Workspace, Launch and Progress Motif, Light Login Poster Illustration, Task Management Dashboard

### Community 60 - "Frontend API Client"
Cohesion: 0.47
Nodes (3): OpenAIMessage, API_BASE_URL, getApiUrl()

### Community 62 - "Authentication Route Tests"
Cohesion: 0.40
Nodes (4): authRoutes, express, request, { supabase }

### Community 63 - "Login Workflow Imagery"
Cohesion: 0.40
Nodes (5): Cloud-Connected Workspace, Digital Productivity Workflow, Login Productivity Illustration, Space Launch Theme, Task Management Dashboard

### Community 64 - "React Quality Diagnostics"
Cohesion: 0.50
Nodes (4): Actionable React Diagnostics, React Doctor, React Doctor Skill, Score Improvement Workflow

### Community 66 - "Environment Loader"
Cohesion: 0.50
Nodes (3): dotenv, fs, path

### Community 69 - "SEO and Web Metadata"
Cohesion: 0.50
Nodes (4): Kolium Web Entry, SEO and Social Metadata, Crawler Policy, Kolium Sitemap

### Community 70 - "Task Comments Migration"
Cohesion: 0.67
Nodes (3): public.set_task_comments_updated_at(), public.task_comments, trg_task_comments_updated_at

### Community 71 - "Playwright Test Configuration"
Cohesion: 0.50
Nodes (3): __dirname, __filename, NOTE: We do NOT expose OPENAI_API_KEY to the browser to prevent leaks.

### Community 72 - "Apple Touch Icon"
Cohesion: 0.67
Nodes (4): Apple Touch Icon, Central Hub Motif, Cool Gradient Palette, Four-Segment Cluster

### Community 73 - "Kolium Favicon"
Cohesion: 0.67
Nodes (4): Blue Cyan White Palette, Central Circular Core, Four-Segment Radial Ring, Kolium Favicon

### Community 74 - "Kolium PWA Icon"
Cohesion: 0.67
Nodes (4): Central Hub, Connected Modular System, Kolium PWA Icon, Three Modular Segments

### Community 75 - "Branch Name Validation"
Cohesion: 0.50
Nodes (3): branchPatterns, currentBranch, isValidBranch

### Community 76 - "Kolium Brand Logo"
Cohesion: 0.67
Nodes (4): Central White Hub, Four Colored Modules, Kolium Logo, Modular Hub Motif

### Community 78 - "BrowserStack Test Imports"
Cohesion: 0.67
Nodes (3): BrowserStack Test Case Import, BrowserStack Column Mapping, CSV Test Case Files

### Community 79 - "AI Sparkle Asset"
Cohesion: 1.00
Nodes (3): AI Assistance, AI Sparkle Icon, Sparkle Motif

### Community 80 - "AI Sparkle Variant"
Cohesion: 1.00
Nodes (3): AI Assistance, AI Sparkle Icon, Multicolor Sparkle Motif

## Knowledge Gaps
- **448 isolated node(s):** `name`, `version`, `description`, `main`, `type` (+443 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Runtime Dependencies` to `Frontend Package Configuration`, `Application Pages`, `canvas-confetti Dependency`, `class-variance-authority Dependency`, `clsx Dependency`, `framer-motion Dependency`, `i18next Dependency`, `i18next-browser-languagedetector Dependency`, `lucide-react Dependency`, `number-flow react Dependency`, `cors Dependency`, `express Dependency`, `multer Dependency`, `papaparse Dependency`, `radix-ui react-avatar Dependency`, `radix-ui react-dialog Dependency`, `radix-ui react-label Dependency`, `radix-ui react-slot Dependency`, `radix-ui react-switch Dependency`, `react-dom Dependency`, `react-easy-crop Dependency`, `react-router-dom Dependency`, `sonner Dependency`, `swagger-jsdoc Dependency`, `swagger-ui-express Dependency`, `tailwind-merge Dependency`, `vercel analytics Dependency`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `react` connect `Application Pages` to `Navigation and Auth Modals`, `Frontend Runtime Dependencies`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `Task Detail and Comments` to `Account and Avatar UI`, `Task Timer Tests`, `File Upload Components`, `Task Tree Tests`, `Localization UI`, `Pricing and Credits`, `Navigation and Auth Modals`, `Shared UI Components`, `Time Analytics`, `Application Shell`, `Profile Dialog`, `Task Tree State`, `Registration Success UI`, `Application Pages`, `Task Board Components`, `Authentication Context`, `User Profile Context`, `Task Statistics and Mapping`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _448 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Architecture and Product Strategy` be split into smaller, more focused modules?**
  _Cohesion score 0.045328399629972246 - nodes in this community are weakly interconnected._
- **Should `Backend Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `OpenAI Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.05758582502768549 - nodes in this community are weakly interconnected._
