# AIAnalyze

- [x] Connect /api/memory, show reported RAM sticks and unnamed empty slots in System/motherboard, and include the Memory setup health check.

- [x] Give motherboard components measured active/idle/unknown effects without inventing activity for unsupported sensors.

- [x] Animate GPU cooling only from reported fan/pump activity; render reported 1/2/3 fans or liquid cooling and show unknown when service lacks details.
- [x] Connect /api/cooling with visible-only 5-second polling, Live/Health panels, 503 waiting state and accurate GPU fan animation.

- [x] Add interactive motherboard component map with CPU/GPU/RAM/cooling/storage details; distinguish unavailable slot and cooling data.

- [x] Adapt GPU / APU / CPU visuals to detected hardware and animate from measured load; test all hardware paths.

- [x] Replace the website-like shell with compact desktop navigation and RGB-lit live instrumentation; verify desktop and mobile.

- [x] Redesign all screens as a premium NVIDIA / racing-cockpit performance dashboard with purposeful motion.
- [x] Verify the new dashboard at the user's desktop size and on mobile while preserving existing PC-service behavior.

- [x] Build Health, Live, Sessions, System and the assistant with local API and sample-data fallback.
- [x] Add offline-safe styling, accessibility, polling and rule tests.
- [x] Provide a static Windows-service build configuration and verify the preview flows.
- [x] Match the newly supplied API-path fixtures, including nested session details and byte-based drive sizes.
- [ ] Verify the packaged static artifact is under ~2 MB and run against the real Windows service (requires the Windows packaging environment).
