# NearU

**NearU** is a private, mobile-first web application designed exclusively for two people: the developer and their partner. Rather than being a commercial platform, it serves as a completely free, highly personalized, and intimate space for the couple to communicate, plan, document memories, and keep track of their shared daily life. Designed with a mobile-first philosophy, NearU ensures that the couple can stay connected and feel close to each other, no matter the distance.

---

## Technologies

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)

---

## Features

### Drawing System
A fully customized, interactive canvas that lets the couple create and share digital sketches or doodles. Powered by React Sketch Canvas, it offers extensive controls over stroke size, brush color, and line styles (including solid, dashed, and dotted styles). Users can also adjust the background color and transparency, toggle grid lines for precision drawing, use a size-adjustable eraser, and undo or redo recent strokes. Finished sketches can be cleared instantly or exported in high-quality PNG or SVG formats.

### Real-Time Chat
A private, instant messaging system that operates in real time using Supabase real-time subscriptions. The chat provides a seamless chatting experience with features like custom unread message separators, read receipts to know when messages have been viewed, and a reply system to quote and reference specific messages. Additionally, users can star their favorite messages, creating a repository of sweet and important messages that can be revisited anytime.

### Dates & Memories
A dedicated planning tool and digital journal for the couple's dates and activities. Users can create date ideas, set realization dates, upload cover photos, and categorize plans as pending or completed. Within each date, couples can manage a sub-task checklist to plan the logistics of their meetings and upload photo galleries to build a beautiful visual record of their memories together.

### Doodle Notes
A creative blackboard space where partners can draw handwritten-style notes and visual doodles using the canvas tool, then save them. These doodles are stored and presented in a note gallery that acts like a digital corkboard. It provides a sweet, visual way to leave cute drawings, doodles, or handwritten messages for the other person to discover and look back on.

### Task Management
A shared task coordinator designed to manage joint responsibilities, daily chores, shopping lists, or wishlists. Tasks are grouped into customizable categories, complete with custom preset icons to distinguish them. The couple can add new items, edit descriptions, check them off as completed, and track progress together.

### User Profiles & Customization
A personalization center that allows each partner to customize their experience. It provides account control, secure authentication, and profile editing (allowing users to set display names, custom nicknames, and upload or change avatars). Furthermore, it supports theme toggling, including a custom Valentine-themed skin, alongside Dark and Light modes, allowing the couple to choose the appearance that best suits their mood.

---

## Project Structure

```
NearU
├─ .agents
│  └─ rules
│     └─ design-rules.md
├─ Dockerfile
├─ index.html
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ public
│  ├─ img
│  │  └─ favicon.ico
│  └─ output.css
├─ README.md
├─ src
│  ├─ components
│  │  ├─ chat
│  │  │  ├─ ChatHeader.jsx
│  │  │  ├─ MessageBubble.jsx
│  │  │  ├─ MessageField.jsx
│  │  │  ├─ ReadIndicator.jsx
│  │  │  ├─ StarredBubble.jsx
│  │  │  └─ UnreadSeparator.jsx
│  │  ├─ dates
│  │  │  └─ DateItem.jsx
│  │  ├─ drawer
│  │  │  ├─ BackgroundConfig.jsx
│  │  │  ├─ BrushConfig.jsx
│  │  │  ├─ ColorConfig.jsx
│  │  │  ├─ Drawer.jsx
│  │  │  ├─ DrawerConf.jsx
│  │  │  ├─ EraserConfig.jsx
│  │  │  ├─ HistoryConfig.jsx
│  │  │  └─ SaveConfig.jsx
│  │  ├─ FabAdd.jsx
│  │  ├─ images
│  │  │  ├─ GalleryPanel.jsx
│  │  │  └─ UploadPanel.jsx
│  │  ├─ index.js
│  │  ├─ Modal.jsx
│  │  ├─ notes
│  │  │  ├─ CarouselNotes.jsx
│  │  │  └─ NoteItem.jsx
│  │  └─ tasks
│  │     ├─ TaskItem.jsx
│  │     └─ TasksCategory.jsx
│  ├─ hooks
│  │  ├─ chat
│  │  │  ├─ useReadReceipts.js
│  │  │  └─ useReplyState.js
│  │  ├─ images
│  │  │  ├─ useImages.js
│  │  │  ├─ useImageUpload.js
│  │  │  └─ useResolveSignedUrls.js
│  │  └─ index.js
│  ├─ index.jsx
│  ├─ Layout.jsx
│  ├─ navigation
│  │  └─ Dockbar.jsx
│  ├─ pages
│  │  ├─ Anniversary.jsx
│  │  ├─ chat
│  │  │  ├─ Chat.jsx
│  │  │  └─ StarredMessages.jsx
│  │  ├─ dates
│  │  │  ├─ DateDetail.jsx
│  │  │  └─ Dates.jsx
│  │  ├─ drawer
│  │  │  └─ DrawingPage.jsx
│  │  ├─ Home.jsx
│  │  ├─ index.js
│  │  ├─ notes
│  │  │  ├─ Notes.jsx
│  │  │  └─ NotesGallery.jsx
│  │  ├─ NotFound.jsx
│  │  ├─ tasks
│  │  │  ├─ TaskDetail.jsx
│  │  │  └─ Tasks.jsx
│  │  ├─ TestingPage.jsx
│  │  └─ user
│  │     ├─ Configuration.jsx
│  │     ├─ Login.jsx
│  │     ├─ PasswordRegistration.jsx
│  │     └─ Register.jsx
│  ├─ router.jsx
│  ├─ services
│  │  ├─ auth
│  │  │  └─ authService.js
│  │  ├─ chat
│  │  │  ├─ index.js
│  │  │  ├─ messagesService.js
│  │  │  ├─ readService.js
│  │  │  ├─ starredService.js
│  │  │  └─ subscriptionService.js
│  │  ├─ dates
│  │  │  ├─ dateDetailService.js
│  │  │  ├─ dateReviews.js
│  │  │  ├─ datesService.js
│  │  │  ├─ dateTaskService.js
│  │  │  └─ index.js
│  │  ├─ images
│  │  │  ├─ imageMetadata.js
│  │  │  ├─ imageOptimizer.js
│  │  │  ├─ imageUploader.js
│  │  │  ├─ imageUrl.js
│  │  │  ├─ imageValidator.js
│  │  │  └─ index.js
│  │  ├─ notes
│  │  │  ├─ index.js
│  │  │  └─ notesService.js
│  │  ├─ tasks
│  │  │  ├─ index.js
│  │  │  ├─ tasksCategoryService.js
│  │  │  └─ tasksService.js
│  │  └─ user
│  │     └─ userService.js
│  └─ utils
│     ├─ AuthContext.jsx
│     ├─ crypto.js
│     ├─ getCategoryIcon.js
│     ├─ getSuggestions.js
│     └─ supabase.js
├─ styles.css
└─ vite.config.js

```