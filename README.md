# MyReviewNotes

MyReviewNotes is a modern, sleek web application built with React and Firebase that helps you track and review the movies, TV series, and books you've consumed or plan to consume.

## ✨ Features

- **Media Tracking:** Keep track of what you are currently watching/reading, what you plan to watch/read, and what you've finished.
- **Smart Autocomplete:** Add new items quickly using integrated APIs:
  - **Books:** Powered by the [OpenLibrary API](https://openlibrary.org/).
  - **Movies & Series:** Powered by the [OMDB API](https://www.omdbapi.com/).
- **Rich User Interface:** A dark-themed, glassmorphism-inspired UI with smooth transitions and micro-animations.
- **Sorting & Filtering:** Easily filter your collection by media type (Movie, Series, Book) and sort by Date, Name, or Rating.
- **Authentication:** Secure user accounts managed via Firebase Authentication.
- **Cloud Storage:** Your reviews are safely stored and synced in real-time using Cloud Firestore.

## 🚀 Technologies Used

- **Frontend:** React, React Router
- **Styling:** Tailwind CSS, Lucide React (for icons)
- **Backend/Database:** Firebase (Auth, Firestore)
- **Build Tool:** Vite

## 📦 Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FrhnSpwli/my-review-notes.git
   cd my-review-notes
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   Create a `.env` file in the root directory (or update the config directly in `src/firebase/config.js`) and add your Firebase project credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a Pull Request.
