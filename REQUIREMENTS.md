## ✅ **Software Requirements for Classroom WhatsApp Bot SaaS (Classroom Guy)**

### 🧩 1. **User Roles**

- **Admin**

  - Full access to all platform features and user management.

- **User**

  - Regular classroom user (e.g., CRs, teachers, students).

### 🔐 2. **Authentication & Authorization**

- Signup/Login (via email/OTP, or Google OAuth).
- Role-based access control.
- Session/token management.

### 📘 3. **Instructions & Onboarding**

- Get started guide for:

  - General usage.
  - Role-specific tasks.
  - Setting up self-hosting (optional).

- Video tutorials / FAQs.
- Clear indicators on group creation rules (e.g., only admins can link community groups).

### 🗓️ 4. **Classroom & Schedule Setup**

- Define academic calendar-based schedule.
- Connect to Google Classroom:

  - Sync with Google Calendar for real-time updates.

- Add classrooms.
- Auto-detect or manually input:

  - Course title, instructor name, classroom location, timings.

- Add groups:

  - Read
    - Only classroom related discussion
    - Can update app with updates but with approval.
  - ReadMaster
    - Only classroom related discussion
    - Can update app with updates.
  - Write
    - Can post important announcements to the group but with approval.
  - WriteMaster
    - Can post important announcements to the group.
  - Community
    - Can update app with updates but with approval.

### 👥 5. **Participants Management**

- List of participants by class.
- Country/University detection (via dropdown or auto).
- Assign roles to participants:

  - Informer
    - Default all class participants.
    - Can update the app but after approval.
  - InformerMaster
    - Can update the app.
  - Moderator
    - Can approve posts from Informers.
  - Receiver
    - Default all class participants but can't update the app.

### 🧠 6. **AI Integration**

- AI will auto-generate an image containing:

  - All important dates (deadlines, quizzes, etc.)
  - Group meta-info (teacher, course, classroom location)
  - Instructions (syllabus tips, exam details, instructions by teacher, etc.)

- AI instructions for how to phrase messages properly.
- Admin-level training for better results (like telling it what a proper announcement looks like).

### 🧾 7. **WhatsApp Bot Integration**

- Connect to WhatsApp API (unofficial).
- Allow using user’s own WhatsApp number via self-hosting.
- Automatically:

  - Post updates into relevant groups.
  - Update group profile picture.

- Multi-group support:

  - Push one update to multiple selected groups.

### 🖼️ 8. **Image Calendar Generator**

- HTML/CSS/JSON-based image creation.
- Allow customization of:

  - Font, color, and style.
  - Group name, course name, assignments, and other meta-info.
  - Image size and resolution.

- Allow download in multiple resolutions (480p, 720p, 1080p, 2K).
- Preview before posting.
- Embed branding or watermark if on free tier.

### 🌐 9. **Web Dashboard (SaaS Control Panel)**

- Overview of connected classrooms & groups.
- View upcoming updates, deadlines, and group activity.
- Manage account and billing (if monetized).
- Refresh content manually if needed.
- Admins can override/update group content globally.

### 📱 10. **Mobile Responsiveness**

- Web dashboard should work well on mobile browsers for quick approvals, previews, and scheduling.

### 💳 11. **Billing & Access Control (Optional for Paid Plan)**

- Free tier:

  - Limited time usage.
  - Basic resolution images.

- Paid tiers:

  - High-res exports.
  - More group connections.
  - Advanced scheduling.
  - Branding removal.

- Admin panel for tracking usage and billing.

### 🛑 12. **Admin-Specific Controls**

- Ban user from usage.
- Ban user from group participation.
- Admin-only AI override instructions.
- Global refresh of calendar templates.

### 🧩 13. **Optional / Advanced Features**

- API access for advanced users.
- Notifications (email/WhatsApp) for upcoming deadlines.
- Group analytics:
  - Engagement metrics.
  - Message history (summarized).
- Template editor for custom image designs.
- Calendar syncing with other platforms (e.g., Google Calendar).
