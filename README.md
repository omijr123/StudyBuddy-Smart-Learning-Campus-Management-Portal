# 📚 StudyBuddy – Smart Campus LMS Portal

<div align="center">

![Project StudyBuddy](https://img.shields.io/badge/Project-StudyBuddy-blue)
![Type LMS Portal](https://img.shields.io/badge/Type-LMS%20Portal-brightgreen)
![Frontend Tech](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-yellow)
![Backend Tech](https://img.shields.io/badge/Backend-PHP%20%7C%20MySQL-orange)
![Platform Web](https://img.shields.io/badge/Platform-Web-lightgrey)

<br>

**A complete campus learning & management portal for students and admins**

*Empowering education through smart digital tools*

</div>

## ✨ Overview

**StudyBuddy** is a full-featured web-based Learning Management and Campus Utility System designed for educational institutions. It provides role-based dashboards, course management, MCQ exams, notices, group chat, and stationary purchase features for students and admins.

The project aims to digitize campus operations and offer a seamless academic workflow through an interactive UI with video backgrounds and SQL-driven data management.

## 🎓 User Roles & Dashboards

### Student Dashboard
- Course access and material viewing
- MCQ examination system
- Stationary purchase portal
- Group chat functionality
- Notice board access

### Admin Dashboard
- Student management
- Course content upload
- Exam creation and management
- Notice publication
- System oversight

## 🚀 Features

### 🔐 Authentication System
- Secure login and registration
- Role-based access control
- Session management

### 📚 Academic Features
- **Course Management**: Upload, view, and manage course materials
- **MCQ Exam System**: Create exams with automated scoring
- **Notice Board**: Admin to student communication
- **Content Upload**: PDF, documents, and learning materials

### 💻 Campus Utilities
- **Stationary Store**: Online purchase system for study materials
- **Group Chat**: Real-time messaging between students
- **Responsive Design**: Mobile-friendly interface
- **Video Backgrounds**: Engaging UI/UX experience

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive Web Design
- Video Background Integration

### Backend
- PHP for server-side processing
- MySQL for database management
- Session-based authentication

### Database
- Comprehensive SQL schema
- User management tables
- Course and exam data structures
- Chat and transaction records

## 📥 Installation & Setup

### Prerequisites
- XAMPP/WAMP Server
- PHP 7.0+
- MySQL 5.6+

### Step-by-Step Setup

1. **Clone/Download the Project**
   ```bash
   # Place the StudyBuddy folder in your web server directory
   # For XAMPP: C:\xampp\htdocs\StudyBuddy
   # For WAMP: C:\wamp\www\StudyBuddy
   ```

2. **Database Setup**
   - Start Apache and MySQL in XAMPP/WAMP
   - Open phpMyAdmin (`http://localhost/phpmyadmin`)
   - Import `Database/init.sql` file
   - Database will be created with all required tables

3. **Configuration**
   - No additional configuration required
   - Default database credentials are set for localhost

4. **Run the Application**
   ```
   Open browser and navigate to:
   http://localhost/StudyBuddy
   ```

### Default Access
- **Student Login**: Use registered credentials
- **Admin Login**: Default admin account in database

## 📁 Project Structure

```
StudyBuddy/
│
├── student_dashboard/
│   ├── student_dashboard.html
│   ├── courseview.html
│   ├── stationary.html
│   └── chat.html
│
├── admin_dashboard/
│   ├── admin_dashboard.html
│   ├── upload_content.html
│   ├── manage_students.html
│   ├── add_exam.html
│   └── notices.html
│
├── assets/
│   ├── images/          # UI images and icons
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── videos/         # Background videos
│
├── Database/
│   └── init.sql        # Database schema and sample data
│
├── index.html          # Landing page
├── login.html          # Login page
└── register.html       # Registration page
```

## 🎯 Key Modules Description

### 📘 Course Management
- Admin uploads course content and materials
- Students access subject-wise content
- Organized course structure and materials

### 📝 MCQ Exam System
- Admin creates multiple choice questions
- Students take timed exams
- Automatic scoring and result calculation
- Question bank management

### 📢 Notice Board
- Admin publishes important announcements
- Real-time updates for students
- Categorized notices system

### 💬 Group Chat
- Real-time messaging interface
- Student-to-student communication
- Simple and intuitive chat UI

### 🛒 Stationary Purchase
- Online store for study materials
- Product catalog and pricing
- Order management system

## 🔧 Customization

### Adding New Courses
1. Admin logs into dashboard
2. Navigates to content upload section
3. Adds new course materials and details

### Modifying Database
- Edit `Database/init.sql` for schema changes
- Update PHP files for new database interactions

### UI Customization
- Modify CSS files in `assets/css/`
- Update HTML structure as needed
- Replace video backgrounds in `assets/videos/`

## 🤝 Contributing

We welcome contributions to enhance StudyBuddy! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas for Improvement
- UI/UX enhancements
- Additional features (attendance system, gradebook)
- Security improvements
- Mobile app development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and queries:
- Check the documentation
- Review the code comments
- Create an issue in the repository

---

<div align="center">

## ⭐ If you like this project, give it a star!

**"Transforming education through innovative technology solutions"**

*StudyBuddy - Your Smart Campus Companion*

</div>
