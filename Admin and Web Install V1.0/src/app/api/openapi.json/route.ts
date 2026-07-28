import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const spec = {
  openapi: "3.1.0",
  info: {
    title:       "6amStudio API",
    version:     "1.0.0",
    description: "Complete REST API for the 6amStudio AI-powered image editing platform.",
    contact: {
      name:  "6amStudio Support",
      email: "support@6amtech.com",
    },
  },
  servers: [
    { url: "/api/v1", description: "Current server" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:         "http",
        scheme:       "bearer",
        bearerFormat: "JWT",
        description:  "JWT token from `POST /api/v1/auth/login`.\n\nFormat: `Authorization: Bearer <token>`",
      },
    },
    schemas: {
      Error: {
        type:       "object",
        properties: {
          error: { type: "string" },
        },
      },
      Pagination: {
        type:       "object",
        properties: {
          total:      { type: "integer" },
          page:       { type: "integer" },
          pageSize:   { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      User: {
        type: "object",
        properties: {
          id:           { type: "string" },
          name:         { type: "string", nullable: true },
          email:        { type: "string", format: "email" },
          avatar:       { type: "string", nullable: true },
          status:       { type: "string", enum: ["active", "suspended"] },
          creditsUsed:  { type: "integer" },
          creditsTotal: { type: "integer" },
          createdAt:    { type: "string", format: "date-time" },
          currentPlan:  {
            nullable: true,
            type: "object",
            description: "The user's most recently purchased plan, or null if no plan has been bought.",
            properties: {
              id:          { type: "string" },
              name:        { type: "string", example: "Pro" },
              credits:     { type: "integer", example: 100 },
              price:       { type: "number", example: 9.99 },
              purchasedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      Project: {
        type: "object",
        properties: {
          id:           { type: "string" },
          name:         { type: "string" },
          mimeType:     { type: "string" },
          edit_count:   { type: "integer", description: "Total number of edit versions" },
          thumbnailUrl: { type: "string", description: "Most recent edit image URL, or the original image URL if no edits exist. Served from `/storage/...`." },
          createdAt:    { type: "string", format: "date-time" },
          updatedAt:    { type: "string", format: "date-time" },
        },
      },
      Edit: {
        type: "object",
        properties: {
          id:        { type: "string" },
          prompt:    { type: "string" },
          image:     { type: "string", description: "File URL served from `/storage/...` (legacy rows may contain a base64 data URL for backward compatibility)" },
          mimeType:  { type: "string" },
          parentId:  { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AIProvider: {
        type: "object",
        properties: {
          id:           { type: "string" },
          name:         { type: "string" },
          provider:     { type: "string" },
          capabilities: { type: "object" },
          creditCost:   { type: "integer", nullable: true },
        },
      },
      TemplateCategory: {
        type: "object",
        properties: {
          id:            { type: "string", example: "clcat001" },
          name:          { type: "string", example: "Travel" },
          templateCount: { type: "integer", example: 8 },
        },
      },
      Template: {
        type: "object",
        properties: {
          id:          { type: "string", example: "clxyz789" },
          title:       { type: "string", example: "Eiffel Tower" },
          description: { type: "string", nullable: true, example: "Classic Parisian portrait in front of the Eiffel Tower" },
          imageUrl:    { type: "string", description: "Public URL of the template preview image", example: "/storage/templates/eiffel.png" },
          prompt:      { type: "string", description: "AI-generated scene description used to guide the transformation" },
          categoryId:  { type: "string", nullable: true },
          isActive:    { type: "boolean" },
          sortOrder:   { type: "integer" },
          usageCount:  { type: "integer" },
        },
      },
      BillingHistory: {
        type: "object",
        properties: {
          id:             { type: "string" },
          description:    { type: "string" },
          amount:         { type: "number" },
          currency:       { type: "string" },
          status:         { type: "string", enum: ["paid", "pending", "failed", "refunded"] },
          creditsGranted: { type: "integer", nullable: true },
          createdAt:      { type: "string", format: "date-time" },
        },
      },
      Plan: {
        type: "object",
        properties: {
          id:          { type: "string" },
          name:        { type: "string" },
          credits:     { type: "integer" },
          price:       { type: "number" },
          isActive:    { type: "boolean" },
          recommended: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    // ─── Config ──────────────────────────────────────────────────────
    "/config": {
      get: {
        tags:        ["Config"],
        summary:     "App configuration",
        operationId: "getConfig",
        description:  "Returns public app configuration — brand info, locale settings, and enabled OAuth providers. No authentication required. Use this on app startup to configure the login screen.",
        responses: {
          200: {
            description: "App config",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    is_demo: { type: "boolean", example: false, description: "True when the app runs in public demo mode (AI editing disabled)" },
                    brand: {
                      type:       "object",
                      properties: {
                        name:   { type: "string", example: "6amStudio" },
                        slogan: { type: "string", example: "AI-powered photo editing" },
                        logo:   { type: "string", format: "uri", nullable: true, example: "https://example.com/logo.png" },
                      },
                    },
                    general: {
                      type:       "object",
                      properties: {
                        country:  { type: "string", example: "US" },
                        currency: { type: "string", example: "USD" },
                      },
                    },
                    oauth: {
                      type:  "array",
                      items: {
                        type:       "object",
                        properties: {
                          provider: { type: "string", example: "google" },
                          name:     { type: "string", example: "Google" },
                        },
                      },
                      description: "Only enabled OAuth providers with valid credentials are listed",
                    },
                  },
                },
                example: {
                  is_demo: false,
                  brand: {
                    name:   "6amStudio",
                    slogan: "AI-powered photo editing",
                    logo:   "https://example.com/logo.png",
                  },
                  general: {
                    country:  "US",
                    currency: "USD",
                  },
                  oauth: [
                    { provider: "google", name: "Google" },
                  ],
                },
              },
            },
          },
        },
      },
    },
    // ─── Auth ────────────────────────────────────────────────────────
    "/auth/login": {
      post: {
        tags:        ["Auth"],
        summary:     "Login — get user info as JSON",
        description: "Authenticate with email and password. Returns user profile as JSON.\n\n> **Note:** For a full browser session (cookie-based), use NextAuth at `/api/auth/signin`. This endpoint is for API/programmatic access.",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["email", "password"],
                properties: {
                  email:    { type: "string", format: "email", example: "user@user.com" },
                  password: { type: "string", format: "password", example: "12345678" },
                },
              },
              examples: {
                "Demo User": {
                  summary:     "Demo user account",
                  description: "Pre-seeded demo user — ready to use out of the box.",
                  value: {
                    email:    "user@user.com",
                    password: "12345678",
                  },
                },
                "Demo Admin": {
                  summary:     "Demo admin account",
                  description: "Pre-seeded admin user with full dashboard access.",
                  value: {
                    email:    "admin@admin.com",
                    password: "12345678",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    token:     { type: "string", description: "JWT — use as `Authorization: Bearer <token>`", example: "eyJhbGciOiJIUzI1NiJ9..." },
                    expiresIn: { type: "string", example: "7d" },
                    tokenType: { type: "string", example: "Bearer" },
                    user: {
                      type:       "object",
                      properties: {
                        id:           { type: "string", example: "clxyz123" },
                        name:         { type: "string", nullable: true, example: "Demo User" },
                        email:        { type: "string", format: "email", example: "user@user.com" },
                        avatar:    { type: "string", nullable: true },
                        status:       { type: "string", enum: ["active", "suspended"], example: "active" },
                        creditsUsed:  { type: "integer", example: 3 },
                        creditsTotal: { type: "integer", example: 10 },
                        kind:         { type: "string", enum: ["user", "admin"], example: "user" },
                      },
                    },
                  },
                },
                examples: {
                  "User response": {
                    summary: "Regular user login response",
                    value: {
                      token:     "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjbHh5ejEyMyIsImVtYWlsIjoidXNlckB1c2VyLmNvbSIsImtpbmQiOiJ1c2VyIn0.sig",
                      expiresIn: "7d",
                      tokenType: "Bearer",
                      user: {
                        id:           "clxyz123abc",
                        name:         "Demo User",
                        email:        "user@user.com",
                        avatar:    null,
                        status:       "active",
                        creditsUsed:  3,
                        creditsTotal: 10,
                        kind:         "user",
                      },
                    },
                  },
                  "Admin response": {
                    summary: "Admin login response",
                    value: {
                      token:     "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjbHh5ejQ1NiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwia2luZCI6ImFkbWluIn0.sig",
                      expiresIn: "7d",
                      tokenType: "Bearer",
                      user: {
                        id:   "clxyz456def",
                        name: "Admin",
                        email:"admin@admin.com",
                        role: "superadmin",
                        kind: "admin",
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid input" },
          401: { description: "Invalid email or password" },
          403: { description: "Account suspended" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags:        ["Auth"],
        summary:     "Logout — clear auth token",
        description: "Clears the `auth_token` cookie. For programmatic clients, simply discard the JWT — it remains valid until expiry.",
        operationId: "logout",
        security:    [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    success: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags:        ["Auth"],
        summary:     "Register a new user account",
        operationId: "registerUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["name", "email", "password"],
                properties: {
                  name:     { type: "string" },
                  email:    { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created" },
          400: { description: "Validation error" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/social": {
      post: {
        tags:        ["Auth"],
        summary:     "Social login / register",
        operationId: "socialLogin",
        description:  "Authenticate or register a user via a social provider (Google, Facebook, Apple).\n\nIf the email already exists the account is returned with a fresh token. If not, a new account is created automatically with free credits and a welcome email is sent.\n\nThe `image` field is optional — when provided it is stored as the user's avatar and refreshed on every subsequent login.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["email"],
                properties: {
                  provider: {
                    type:    "string",
                    enum:    ["google", "facebook", "apple"],
                    default: "google",
                    description: "Social provider used for authentication",
                  },
                  email: {
                    type:   "string",
                    format: "email",
                    description: "Email address from the social provider",
                  },
                  name: {
                    type:        "string",
                    description: "Display name from the social provider",
                  },
                  image: {
                    type:        "string",
                    format:      "uri",
                    nullable:    true,
                    description: "Profile picture URL from the social provider",
                  },
                },
              },
              examples: {
                google: {
                  summary: "Google login",
                  value: {
                    provider: "google",
                    email:    "jane@gmail.com",
                    name:     "Jane Doe",
                    image:    "https://lh3.googleusercontent.com/a/example",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Existing user — token returned",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    token:     { type: "string", description: "JWT Bearer token" },
                    expiresIn: { type: "string", example: "7d" },
                    tokenType: { type: "string", example: "Bearer" },
                    isNewUser: { type: "boolean", example: false },
                    user:      { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          201: {
            description: "New user created — token returned",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    token:     { type: "string", description: "JWT Bearer token" },
                    expiresIn: { type: "string", example: "7d" },
                    tokenType: { type: "string", example: "Bearer" },
                    isNewUser: { type: "boolean", example: true },
                    user:      { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error — missing or invalid fields" },
          403: { description: "Account suspended" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags:        ["Auth"],
        summary:     "Request a 6-digit OTP for password reset",
        operationId: "forgotPassword",
        description: "Sends a 6-digit verification code to the provided email address. The code expires in **15 minutes**.\n\nReturns `404` if the email is not registered in the system.\n\n**Flow:** `forgot-password` → `verify-otp` → `reset-password`",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "user@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent (always 200 to prevent enumeration)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          404: { description: "No account found with this email address" },
          500: { description: "SMTP not configured" },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags:        ["Auth"],
        summary:     "Verify the 6-digit OTP and get a reset token",
        operationId: "verifyOtp",
        description: "Verifies the 6-digit code sent by `POST /auth/forgot-password`. On success returns a short-lived `token` to be passed to `POST /auth/reset-password`.\n\nThe OTP is single-use and expires in 15 minutes.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["email", "otp"],
                properties: {
                  email: { type: "string", format: "email", example: "user@example.com" },
                  otp:   { type: "string", minLength: 6, maxLength: 6, example: "482910", description: "6-digit code from the email" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OTP verified — reset token returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok:    { type: "boolean", example: true },
                    token: { type: "string", description: "Pass this token to `POST /auth/reset-password`", example: "a3f9c2...d8e1" },
                    kind:  { type: "string", enum: ["user", "admin"], description: "Account type — use to redirect to the correct login screen after reset" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags:        ["Auth"],
        summary:     "Set a new password using the token from verify-otp",
        operationId: "resetPassword",
        description: "Resets the account password. The `token` must come from a successful `POST /auth/verify-otp` response — it is single-use.\n\nReturns `kind: \"user\" | \"admin\"` so clients can redirect to the correct login screen.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["token", "password"],
                properties: {
                  token:    { type: "string", description: "Reset token from `POST /auth/verify-otp`" },
                  password: { type: "string", minLength: 8, description: "New password (min 8 characters)" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok:   { type: "boolean", example: true },
                    kind: { type: "string", enum: ["user", "admin"], description: "Account type — use to redirect to the correct login screen" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid or expired token" },
        },
      },
    },
    // ─── User Profile ─────────────────────────────────────────────
    "/user/profile": {
      get: {
        tags:        ["User"],
        summary:     "Get current user profile",
        operationId: "getProfile",
        security:    [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags:        ["User"],
        summary:     "Update user profile",
        operationId: "updateProfile",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name:     { type: "string" },
                  avatar:   { type: "string", nullable: true },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated profile" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
        },
      },
    },
    // ─── User Analytics ──────────────────────────────────────────
    "/user/analytics": {
      get: {
        tags:        ["User"],
        summary:     "Get user analytics and usage stats",
        operationId: "getUserAnalytics",
        security:    [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Analytics data",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    analytics: {
                      type: "object",
                      properties: {
                        totalProjects:    { type: "integer" },
                        totalEdits:       { type: "integer" },
                        creditsUsed:      { type: "integer" },
                        creditsTotal:     { type: "integer" },
                        creditsRemaining: { type: "integer" },
                        recentActivity:   { type: "array", items: { type: "object" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // ─── User Activity ────────────────────────────────────────────
    "/user/activity": {
      get: {
        tags:        ["User"],
        summary:     "Get paginated edit activity feed",
        operationId: "getUserActivity",
        description: "Returns the user's edit history grouped with stats and active projects. Supports search and pagination.",
        security:    [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "q",        schema: { type: "string" },                    description: "Search prompts" },
          { in: "query", name: "page",     schema: { type: "integer", default: 1 },       description: "Page number" },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 20, maximum: 100 }, description: "Items per page" },
        ],
        responses: {
          200: {
            description: "Activity feed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: {
                      type: "object",
                      properties: {
                        totalEdits:    { type: "integer", description: "All-time edit count for the user" },
                        projectsEdited:{ type: "integer", description: "Number of projects with at least one edit" },
                        pageCount:     { type: "integer", description: "Number of edits on the current page" },
                      },
                    },
                    edits: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id:        { type: "string" },
                          prompt:    { type: "string" },
                          image:     { type: "string", nullable: true, description: "Full URL of the edit result image" },
                          createdAt: { type: "string", format: "date-time" },
                          project: {
                            type: "object",
                            properties: {
                              id:   { type: "string" },
                              name: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                    activeProjects: {
                      type: "array",
                      description: "Up to 5 most recently updated projects with edit counts",
                      items: {
                        type: "object",
                        properties: {
                          id:        { type: "string" },
                          name:      { type: "string" },
                          editCount: { type: "integer" },
                          updatedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        total:      { type: "integer" },
                        page:       { type: "integer" },
                        pageSize:   { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    // ─── Projects ─────────────────────────────────────────────────
    "/projects": {
      get: {
        tags:        ["Projects"],
        summary:     "List projects",
        operationId: "listProjects",
        security:    [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "page",     schema: { type: "integer", default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 20 } },
          { in: "query", name: "q",        schema: { type: "string" }, description: "Search name" },
        ],
        responses: {
          200: {
            description: "Project list",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    projects: { type: "array", items: { $ref: "#/components/schemas/Project" } },
                    total:    { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags:        ["Projects"],
        summary:     "Create project",
        description: "Creates a new project with an uploaded image. Accepts **multipart/form-data** (recommended — binary upload, no base64 overhead) or **application/json** (legacy — base64 data URL). The image is saved to file storage; the DB stores a short file URL.",
        operationId: "createProject",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type:     "object",
                required: ["name", "image"],
                properties: {
                  name:  { type: "string", description: "Project name" },
                  image: { type: "string", format: "binary", description: "Source image as a binary file (PNG, JPEG, WEBP, GIF)" },
                },
              },
              encoding: {
                image: { contentType: "image/png, image/jpeg, image/webp, image/gif" },
              },
            },
            "application/json": {
              schema: {
                type:     "object",
                required: ["name", "originalImage"],
                properties: {
                  name:          { type: "string", description: "Project name" },
                  originalImage: { type: "string", description: "Source image as a base64 data URL (`data:image/png;base64,...`). mimeType is extracted automatically from the data URL prefix — no need to send separately." },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Project created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    project: {
                      type: "object",
                      properties: {
                        id:   { type: "string" },
                        name: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid input or missing image" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/projects/{id}": {
      get: {
        tags:        ["Projects"],
        summary:     "Get project details",
        operationId: "getProject",
        security:    [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Project with edit history" },
          404: { description: "Not found" },
        },
      },
      delete: {
        tags:        ["Projects"],
        summary:     "Delete project",
        operationId: "deleteProject",
        security:    [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Deleted" },
          404: { description: "Not found" },
        },
      },
    },
    "/projects/{id}/edit": {
      post: {
        tags:        ["Projects"],
        summary:     "Apply AI edit to a project (editor endpoint)",
        description: "Primary endpoint used by the Editor UI. Supports two modes:\n\n**Free-form edit** — send a `prompt` to apply any text instruction to the image. Supports lasso region edits (`isRegionEdit`) and brush/sketch edits (`isBrushEdit`).\n\n**Template edit** — send a `templateId` instead of a `prompt`. The server looks up the template, builds the composite prompt automatically, and increments the template's `usageCount`. This replaces the dedicated `POST /projects/{id}/apply-template` endpoint and supports the same provider strategies (OpenAI: template as base + user photo as reference; Gemini: user photo + text instruction).\n\nEither `prompt` or `templateId` must be present — sending neither returns `400`.\n\nAccepts **multipart/form-data** (recommended — binary drawing file, no base64 overhead) or **application/json** (legacy). Results are saved to file storage; the DB stores the file URL.",
        operationId: "applyProjectEdit",
        security:    [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Project CUID" },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type:     "object",
                required: ["aiModelId"],
                properties: {
                  prompt:       { type: "string", minLength: 1, maxLength: 10000, description: "Edit instruction. Required unless `templateId` is provided. Pass `__sketch__` when using brush mode without a text prompt." },
                  templateId:   { type: "string", description: "CUID of a Template to apply. When provided, `prompt` is not required — the AI prompt is built automatically from the template. Fetch templates from `GET /templates`." },
                  aiModelId:    { type: "string", description: "AI model CUID — required. Fetch available models from `GET /ai/providers`." },
                  parentId:     { type: "string", nullable: true, description: "CUID of the edit version to use as source. Omit or `null` to use the project original image." },
                  drawing:      { type: "string", format: "binary", description: "**Recommended for lasso/brush/heal.** The composited image (source + green marks painted on top) as a binary PNG or JPEG file. Sent as a multipart file — no base64, no JSON size bloat. Takes highest priority over `sourceImageOverride`." },
                  isRegionEdit: { type: "string", enum: ["true", "false"], description: "Set `true` for lasso/heal edits. AI edits only inside the green dashed outline." },
                  isBrushEdit:  { type: "string", enum: ["true", "false"], description: "Set `true` for brush/sketch edits. AI replaces green strokes with a photorealistic object." },
                },
              },
              encoding: {
                drawing: { contentType: "image/png, image/jpeg" },
              },
            },
            "application/json": {
              schema: {
                type:     "object",
                required: ["aiModelId"],
                properties: {
                  prompt:              { type: "string", minLength: 1, maxLength: 10000, description: "Edit instruction. Required unless `templateId` is provided." },
                  templateId:          { type: "string", description: "CUID of a Template to apply. When provided, `prompt` is not required — the AI composite prompt is built automatically from the template's stored scene description. Fetch templates from `GET /templates`." },
                  aiModelId:           { type: "string", description: "AI model CUID — required. Fetch available models from `GET /ai/providers`." },
                  parentId:            { type: "string", nullable: true, description: "CUID of the edit version to use as source." },
                  sourceImageOverride: { type: "string", description: "**Fallback.** Browser-canvas composite as a base64 data URL (`data:image/png;base64,...`). Use multipart `drawing` instead to avoid 5MB+ JSON payloads." },
                  isRegionEdit:        { type: "boolean", description: "Set `true` for lasso/heal edits." },
                  isBrushEdit:         { type: "boolean", description: "Set `true` for brush/sketch edits." },
                },
              },
              examples: {
                "Free-form edit": {
                  summary: "Standard text prompt edit",
                  value:   { prompt: "Remove the background and replace it with a beach sunset", aiModelId: "clmodel123" },
                },
                "Template edit": {
                  summary: "Apply a template by ID (no prompt needed)",
                  value:   { templateId: "clxyz789", aiModelId: "clmodel123" },
                },
                "Template edit from prior version": {
                  summary: "Apply template using a previous edit as the source photo",
                  value:   { templateId: "clxyz789", aiModelId: "clmodel123", parentId: "cledit456" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Edit applied — result saved to file storage",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    edit: {
                      type: "object",
                      properties: {
                        id:        { type: "string" },
                        parentId:  { type: "string", nullable: true },
                        prompt:    { type: "string", description: "The user's edit instruction, or `\"Template: <title>\"` when a `templateId` was used." },
                        image:     { type: "string", description: "Public file URL of the result (`/storage/projects/{userId}/edits/abc.png`)" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                    creditsUsed:  { type: "integer" },
                    creditsTotal: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid input — missing both `prompt` and `templateId`, or content policy rejection" },
          401: { description: "Unauthorized" },
          402: { description: "Insufficient credits" },
          404: { description: "Project, template, or parent version not found" },
          502: { description: "AI provider error" },
        },
      },
    },
    // ─── Templates ────────────────────────────────────────────────
    "/templates/categories": {
      get: {
        tags:        ["Templates"],
        summary:     "List template categories",
        description: "Returns all template categories with the count of active templates in each. Use the returned `id` as `categoryId` when calling `GET /templates` to filter by category.",
        operationId: "listTemplateCategories",
        responses: {
          200: {
            description: "Template categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    categories: {
                      type:  "array",
                      items: {
                        type: "object",
                        properties: {
                          id:            { type: "string", example: "clcat123" },
                          name:          { type: "string", example: "Travel" },
                          templateCount: { type: "integer", example: 8, description: "Number of active templates in this category" },
                        },
                      },
                    },
                  },
                },
                example: {
                  categories: [
                    { id: "clcat001", name: "Business",  templateCount: 5 },
                    { id: "clcat002", name: "Outdoor",   templateCount: 12 },
                    { id: "clcat003", name: "Travel",    templateCount: 8 },
                    { id: "clcat004", name: "Studio",    templateCount: 4 },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/templates": {
      get: {
        tags:        ["Templates"],
        summary:     "List active templates",
        description: "Returns active templates ordered by `sortOrder` then newest first. Filter by category using `categoryId` from `GET /templates/categories`. Use the returned `id` as `templateId` when calling `POST /projects/{id}/edit` (pass `templateId` instead of `prompt`).",
        operationId: "listTemplates",
        parameters: [
          {
            in: "query", name: "categoryId",
            schema: { type: "string" },
            description: "Filter by category ID — fetch IDs from `GET /templates/categories`",
          },
          {
            in: "query", name: "limit",
            schema: { type: "integer", default: 50, maximum: 100 },
            description: "Max number of templates to return (default 50, max 100)",
          },
        ],
        responses: {
          200: {
            description: "Active templates",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    templates: {
                      type:  "array",
                      items: {
                        type: "object",
                        properties: {
                          id:           { type: "string", example: "clxyz789" },
                          title:        { type: "string", example: "Eiffel Tower" },
                          description:  { type: "string", nullable: true },
                          imageUrl:     { type: "string", description: "Preview image URL" },
                          prompt:       { type: "string", description: "AI scene description — used internally during apply-template" },
                          categoryId:   { type: "string", nullable: true },
                          categoryName: { type: "string", nullable: true, example: "Travel" },
                          sortOrder:    { type: "integer" },
                          usageCount:   { type: "integer" },
                        },
                      },
                    },
                  },
                },
                example: {
                  templates: [
                    {
                      id:           "clxyz789",
                      title:        "Eiffel Tower",
                      description:  "Classic Parisian portrait",
                      imageUrl:     "/storage/templates/eiffel.png",
                      prompt:       "Outdoor daytime scene in front of the Eiffel Tower…",
                      categoryId:   "clcat003",
                      categoryName: "Travel",
                      sortOrder:    0,
                      usageCount:   142,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    // ─── AI ───────────────────────────────────────────────────────
    "/editor/suggestions": {
      get: {
        tags:        ["Editor"],
        summary:     "Get prompt suggestion chips for the editor",
        operationId: "getEditorSuggestions",
        responses: {
          200: {
            description: "List of suggestion strings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type:  "array",
                      items: { type: "string" },
                      example: ["remove the background", "replace the sky with a golden-hour gradient"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/editor/effects": {
      get: {
        tags:        ["Editor"],
        summary:     "Get effect presets grouped by category",
        operationId: "getEditorEffects",
        responses: {
          200: {
            description: "Active effect presets grouped by category",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    categories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", example: "Enhance" },
                          color: { type: "string", example: "text-blue-400" },
                          effects: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id:            { type: "string" },
                                label:         { type: "string", example: "Enhance Quality" },
                                icon:          { type: "string", example: "sparkles" },
                                prompt:        { type: "string", example: "Enhance the overall image quality…" },
                                category:      { type: "string", example: "Enhance" },
                                categoryColor: { type: "string", example: "text-blue-400" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/ai/providers": {
      get: {
        tags:        ["AI"],
        summary:     "List available AI models",
        operationId: "listAIProviders",
        responses: {
          200: {
            description: "Active AI models",
            content: {
              "application/json": {
                schema: {
                  type:       "object",
                  properties: {
                    providers: {
                      type:  "array",
                      items: { $ref: "#/components/schemas/AIProvider" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // ─── Billing ──────────────────────────────────────────────────
    "/billing/plans": {
      get: {
        tags:        ["Billing"],
        summary:     "List active plans",
        operationId: "listPlans",
        responses: {
          200: {
            description: "Active plans",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    plans: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id:          { type: "string" },
                          name:        { type: "string" },
                          credits:     { type: "integer" },
                          price:       { type: "number" },
                          recommended: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/billing/gateways": {
      get: {
        tags:        ["Billing"],
        summary:     "List active payment gateways",
        operationId: "listGateways",
        responses: {
          200: { description: "Active gateways with public config" },
        },
      },
    },
    "/billing/checkout": {
      post: {
        tags:        ["Billing"],
        summary:     "Create checkout session — returns payment URL for WebView",
        operationId: "createCheckout",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["planId"],
                properties: {
                  planId:     { type: "string", description: "Plan ID from /billing/plans" },
                  gatewayId:  { type: "string", description: "Optional: specific gateway DB id" },
                  returnMode: { type: "string", enum: ["api", "panel"], default: "api", description: "api = JSON callback for WebView; panel = redirect to billing page with toast" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Payment URL to open in WebView",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url:       { type: "string", description: "Open this URL in a WebView" },
                    sessionId: { type: "string", description: "Use for status polling" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/billing/status/{sessionId}": {
      get: {
        tags:        ["Billing"],
        summary:     "Poll payment status after WebView closes",
        operationId: "getPaymentStatus",
        security:    [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "sessionId", required: true, schema: { type: "string" }, description: "sessionId from /billing/checkout" },
        ],
        responses: {
          200: {
            description: "Payment status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status:    { type: "string", enum: ["pending", "paid", "failed"] },
                    credits:   { type: "integer" },
                    amount:    { type: "number" },
                    currency:  { type: "string" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/billing/pay/success": {
      get: {
        tags:        ["Billing"],
        summary:     "Payment gateway success callback — returns JSON status",
        operationId: "paymentSuccess",
        parameters: [
          { in: "query", name: "session_id", required: true, schema: { type: "string" } },
          { in: "query", name: "gw",         required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Payment result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    payment_status: { type: "string", enum: ["success", "failed"] },
                    credit_added:   { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/billing/pay/cancel": {
      get: {
        tags:        ["Billing"],
        summary:     "Payment gateway cancel callback — returns JSON status",
        operationId: "paymentCancel",
        responses: {
          200: {
            description: "Cancellation acknowledged",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    payment_status: { type: "string", enum: ["cancelled"] },
                    credit_added:   { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/billing/webhook/{gateway}": {
      post: {
        tags:        ["Billing"],
        summary:     "Receive payment gateway webhook",
        operationId: "paymentWebhook",
        parameters: [
          { in: "path", name: "gateway", required: true, schema: { type: "string" }, description: "Gateway slug (e.g. stripe)" },
        ],
        responses: {
          200: { description: "Acknowledged" },
        },
      },
    },
    // ─── Billing History ──────────────────────────────────────────
    "/billing/history": {
      get: {
        tags:        ["Billing"],
        summary:     "Get paginated billing history",
        operationId: "getBillingHistory",
        description: "Returns the authenticated user's billing records in descending order. Supports full-text search across description, gateway reference, and status. Optionally filter by status. Each record includes the plan name and credits if a plan was purchased.",
        security:    [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query", name: "page",
            schema: { type: "integer", default: 1 },
            description: "Page number (1-based)",
          },
          {
            in: "query", name: "pageSize",
            schema: { type: "integer", default: 20, maximum: 100 },
            description: "Records per page (max 100)",
          },
          {
            in: "query", name: "status",
            schema: { type: "string", enum: ["paid", "pending", "failed", "refunded"] },
            description: "Filter by payment status. Omit to return all statuses.",
          },
          {
            in: "query", name: "q",
            schema: { type: "string" },
            description: "Search keyword — matches against `description`, `gatewayRef`, and `status` fields.",
          },
        ],
        responses: {
          200: {
            description: "Billing history",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id:             { type: "string", example: "clxyz123" },
                          amount:         { type: "number", example: 9.99 },
                          currency:       { type: "string", example: "USD" },
                          status:         { type: "string", enum: ["paid", "pending", "failed", "refunded"], example: "paid" },
                          description:    { type: "string", example: "Pro Plan — 500 credits" },
                          creditsGranted: { type: "integer", nullable: true, example: 500 },
                          gatewayRef:     { type: "string", nullable: true, example: "pi_3Ox7dK2eZvKYlo2C1aB2cD3E", description: "Payment gateway transaction reference" },
                          createdAt:      { type: "string", format: "date-time" },
                          plan: {
                            nullable: true,
                            type: "object",
                            description: "Plan details if this transaction was a plan purchase",
                            properties: {
                              id:      { type: "string" },
                              name:    { type: "string", example: "Pro" },
                              credits: { type: "integer", example: 500 },
                            },
                          },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        total:      { type: "integer", example: 42 },
                        page:       { type: "integer", example: 1 },
                        pageSize:   { type: "integer", example: 20 },
                        totalPages: { type: "integer", example: 3 },
                        q:          { type: "string", description: "Echo of the search keyword if one was applied", example: "stripe" },
                      },
                    },
                  },
                },
                example: {
                  history: [
                    {
                      id:             "clxyz123",
                      amount:         9.99,
                      currency:       "USD",
                      status:         "paid",
                      description:    "Pro Plan — 500 credits",
                      creditsGranted: 500,
                      gatewayRef:     "pi_3Ox7dK2eZvKYlo2C1aB2cD3E",
                      createdAt:      "2026-05-01T10:00:00Z",
                      plan: { id: "plan_pro", name: "Pro", credits: 500 },
                    },
                  ],
                  pagination: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    // ─── Firebase / Push Notifications ───────────────────────
    "/firebase/config": {
      get: {
        tags:        ["Push"],
        summary:     "Get Firebase client SDK config",
        description: "Returns the Firebase web app configuration for client-side SDK initialization. No auth required — these values are public (same as `google-services.json`). Returns `{ enabled: false }` when Firebase is not configured.",
        operationId: "getFirebaseConfig",
        responses: {
          200: {
            description: "Firebase client config",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    enabled:           { type: "boolean" },
                    apiKey:            { type: "string" },
                    authDomain:        { type: "string" },
                    projectId:         { type: "string" },
                    storageBucket:     { type: "string" },
                    messagingSenderId: { type: "string" },
                    appId:             { type: "string" },
                    measurementId:     { type: "string" },
                    vapidKey:          { type: "string", description: "VAPID public key for web push subscription" },
                  },
                },
                examples: {
                  configured: {
                    summary: "Firebase enabled",
                    value: {
                      enabled: true,
                      apiKey: "AIzaSy…",
                      authDomain: "my-project.firebaseapp.com",
                      projectId: "my-project",
                      storageBucket: "my-project.firebasestorage.app",
                      messagingSenderId: "123456789",
                      appId: "1:123456789:web:abc123",
                      measurementId: "G-XXXXXXXXXX",
                      vapidKey: "BNxxxxxx…",
                    },
                  },
                  disabled: {
                    summary: "Firebase not configured",
                    value: { enabled: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/push/register": {
      post: {
        tags:        ["Push"],
        summary:     "Register a device FCM token",
        description: "Saves the caller's FCM device token so the server can send push notifications. Call this after the client obtains a token from the Firebase SDK. Upserts on (userId, token) — safe to call on every app launch.",
        operationId: "registerDeviceToken",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["token"],
                properties: {
                  token:    { type: "string", description: "FCM registration token from the Firebase client SDK", example: "dGhpcyBpcyBhIHNhbXBsZSB0b2tlbg==" },
                  platform: { type: "string", enum: ["web", "android", "ios"], default: "web", description: "Client platform" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Token registered",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
          },
          400: { description: "Invalid or missing token" },
          401: { description: "Unauthorized" },
        },
      },
      delete: {
        tags:        ["Push"],
        summary:     "Unregister a device FCM token",
        description: "Removes the specified FCM token for the authenticated user. Call when the user logs out or denies notification permission.",
        operationId: "unregisterDeviceToken",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["token"],
                properties: {
                  token: { type: "string", description: "FCM token to remove" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Token removed" },
          400: { description: "Missing token" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/user/update-fcm-token": {
      post: {
        tags:        ["Push"],
        summary:     "Register app FCM token",
        description: "Stores the caller's FCM token in `users.fcm_token`. Used by **mobile apps** (Android / iOS) so the server can send push notifications directly to the device token. Web panel browsers should use `POST /push/register` (topic-based) instead.",
        operationId: "updateFcmToken",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type:     "object",
                required: ["fcm_token"],
                properties: {
                  fcm_token: { type: "string", description: "FCM registration token obtained from the Firebase SDK", example: "dXm3k9...cQpY" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Token saved",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean", example: true } } } } },
          },
          400: { description: "Invalid input", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags:        ["Push"],
        summary:     "Remove app FCM token",
        description: "Clears `users.fcm_token` for the caller — call this on logout so push notifications stop being sent to the device.",
        operationId: "deleteFcmToken",
        security:    [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Token cleared",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean", example: true } } } } },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/notifications": {
      get: {
        tags:        ["Notifications"],
        summary:     "List notification history",
        description: "Returns the authenticated user's in-app notifications in reverse-chronological order with page-based pagination. Also returns the total count and unread count.",
        operationId: "listNotifications",
        security:    [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query", name: "page",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number (1-based).",
          },
          {
            in: "query", name: "limit",
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
            description: "Number of notifications per page (capped at 100).",
          },
        ],
        responses: {
          200: {
            description: "Notification page",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id:        { type: "string", example: "ntf_1748000000000_abc123" },
                          title:     { type: "string", example: "Image ready" },
                          body:      { type: "string", example: "Your edit on \"My Project\" is complete." },
                          data: {
                            type: "object",
                            nullable: true,
                            properties: {
                              project_id:        { type: "string", example: "clxyz123" },
                              project_name:      { type: "string", example: "My Project" },
                              edit_id:           { type: "string", example: "clxyz456" },
                              image:             { type: "string", format: "uri", example: "https://yourdomain.com/uploads/edit.png" },
                              notification_type: { type: "string", example: "edit_completed" },
                            },
                          },
                          isRead:    { type: "boolean", example: false },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    unreadCount: { type: "integer", example: 3, description: "Total number of unread notifications for this user." },
                    total:       { type: "integer", example: 47, description: "Total number of notifications for this user." },
                    totalPages:  { type: "integer", example: 3, description: "Total number of pages at the current limit." },
                    page:        { type: "integer", example: 1, description: "Current page number." },
                  },
                },
                example: {
                  notifications: [
                    {
                      id: "ntf_1748000000000_abc123",
                      title: "Image ready",
                      body: "Your edit on \"My Project\" is complete.",
                      data: {
                        project_id: "clxyz123",
                        project_name: "My Project",
                        edit_id: "clxyz456",
                        image: "https://yourdomain.com/uploads/edit.png",
                        notification_type: "edit_completed",
                      },
                      isRead: false,
                      createdAt: "2025-05-20T10:30:00.000Z",
                    },
                  ],
                  unreadCount: 3,
                  total: 47,
                  totalPages: 3,
                  page: 1,
                },
              },
            },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/notifications/read": {
      post: {
        tags:        ["Notifications"],
        summary:     "Mark notification(s) as read",
        description: "Marks one or all notifications as read.\n\n- Pass `{ \"id\": \"ntf_xxx\" }` to mark a single notification.\n- Pass `{}` (empty body) to mark **all** notifications as read.",
        operationId: "markNotificationsRead",
        security:    [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "ID of the notification to mark as read. Omit to mark all as read.",
                    example: "ntf_1748000000000_abc123",
                  },
                },
              },
              examples: {
                markOne: {
                  summary: "Mark one notification",
                  value: { id: "ntf_1748000000000_abc123" },
                },
                markAll: {
                  summary: "Mark all notifications",
                  value: {},
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Notification(s) marked as read",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean", example: true } } } } },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/notifications/{id}": {
      delete: {
        tags:        ["Notifications"],
        summary:     "Delete a single notification",
        description: "Permanently deletes one notification by ID. Only the owner can delete their own notifications.",
        operationId: "deleteNotification",
        security:    [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path", name: "id", required: true,
            schema: { type: "string", example: "ntf_1748000000000_abc123" },
            description: "ID of the notification to delete.",
          },
        ],
        responses: {
          200: {
            description: "Notification deleted",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean", example: true } } } } },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Notification not found or does not belong to the user", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/billing/export": {
      get: {
        tags:        ["Billing"],
        summary:     "Export billing history as CSV",
        description: "Downloads the authenticated user's billing history as a CSV file.\n\n**Authentication** — accepts either:\n- `Authorization: Bearer <token>` header (standard JWT), **or**\n- `?token=<jwt>` query parameter — useful for direct browser download links where setting a header is not possible.",
        operationId: "exportBilling",
        security:    [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query", name: "token",
            schema: { type: "string" },
            description: "JWT token as an alternative to the `Authorization` header. Use this when constructing a direct download URL in the browser.",
          },
          { in: "query", name: "hs", schema: { type: "string" }, description: "Status filter (e.g. `paid`, `pending`, `failed`, `refunded`)" },
          { in: "query", name: "hq", schema: { type: "string" }, description: "Search query — matches description or gateway reference" },
        ],
        responses: {
          200: { description: "CSV file", content: { "text/csv": { schema: { type: "string" } } } },
          401: { description: "Unauthorized — no valid session or token provided", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
  tags: [
    { name: "Auth",      description: "Sign in, sign out, session, registration, and OTP-based password reset" },
    { name: "User",      description: "User profile and settings" },
    { name: "Projects",  description: "Image project CRUD and AI edits" },
    { name: "Templates", description: "Template browsing — apply via POST /projects/{id}/edit with templateId" },
    { name: "AI",        description: "AI image generation, editing and enhancement" },
    { name: "Editor",    description: "Editor configuration — suggestion chips and effect presets" },
    { name: "Billing",   description: "Credits, plans and payment" },
    { name: "Push",          description: "Firebase Cloud Messaging — register device tokens for push notifications" },
    { name: "Notifications", description: "In-app notification history — list (page-based), mark read, delete one, and bulk clear" },
  ],
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
