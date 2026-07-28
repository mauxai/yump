==================================================
 6amStudio
==================================================

Self-hosted, AI-powered image editing platform — a single Next.js 14 app
(User App "/", Admin Panel "/admin", REST API "/api/v1") backed by MySQL,
with a companion Flutter mobile app.

Full docs: open "Offline Documentation/index.html"


--------------------------------------------------
 WHAT'S IN THIS PACKAGE
--------------------------------------------------

   Admin and Web Install V1.0/   The server — Next.js 14 app serving the
                                 user app, admin panel, REST API, and the
                                 built-in web install wizard.
   User app/                     The Flutter mobile app (Android & iOS).
   Offline Documentation/        This documentation — open index.html.
   readme.txt                    This file.


--------------------------------------------------
 QUICK START
--------------------------------------------------

1. INSTALL THE SERVER
---------------------

   - Copy the "Admin and Web Install V1.0" folder into your web directory
     (this is the server). Then work inside that folder.

   - Set your domain before building (baked in at build time). In
     .env.production set:

        NEXT_PUBLIC_APP_URL = "https://your_domain.com"

     Leave AUTH_SECRET empty — this will be filled automatically.

   - Install, build, and start:

        npm install
        npm run build
        npm run start          (# direct for quick start)

     - For production, running with pm2 is recommended. Install pm2 and run:
        pm2 start ecosystem.config.js   (# single fork instance on port 3000)
        pm2 startup                     (# once per server: boot PM2 with the OS)
        pm2 save                        (# snapshot the process list so it's resurrected after a reboot)

   Requirements: Node.js 18+, MySQL 5.7+/8.0+. Have an AI provider key
   (Google AI Studio / OpenAI) handy — it is added later in the admin panel.


2. VERIFY (INSTALL WIZARD)
--------------------------

   Open your domain — every URL redirects to "/install". Walk through the wizard:

     1) Server requirements — auto-checked (Node, permissions, Prisma, sharp).
     2) Database — enter MySQL details; it creates the DB, schema, and seed data.
     3) License — enter marketplace username + purchase code (skipped on localhost).
     4) Super admin — create the first admin account, which finishes the install.

   Then sign in at "/admin/login" and add your AI Models (and SMTP / payments)
   so the platform can generate images.


3. CONNECT THE MOBILE APP
-------------------------

   The Flutter project is the "User app" folder. Open
   lib/util/app_constants.dart in it and point it at your server:

        static const String baseUrl = 'https://your_domain.com';   (no trailing slash)

   Set the app name, app icon, and package / bundle id too
   (see docs -> Mobile App).


4. BUILD THE APP
----------------

        flutter pub get
        flutter build apk

   Android output: build/app/outputs/flutter-apk/app-release.apk
   iOS: build via Xcode -> TestFlight / App Store


That's it.
