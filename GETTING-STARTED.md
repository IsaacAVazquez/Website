# Getting Started

A quick start guide to get the Isaac Vazquez Portfolio up and running in minutes. This guide covers the essential steps for developers who want to explore, customize, or contribute to the project.

## 🚀 Quick Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 8+** or **yarn 1.22+** - Package manager
- **Git** - Version control
- **Code Editor** - VS Code recommended with extensions listed below

### One-Minute Setup

```bash
# Clone the repository
git clone https://github.com/IsaacAVazquez/isaacvazquez-portfolio.git

# Navigate to project directory
cd isaacvazquez-portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

🎉 **That's it!** Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

## 🎯 What You'll See

After setup, you'll have access to:

### **Portfolio Sections**
- **🏠 Home** - Cyberpunk terminal interface with typing animations
- **👨‍💻 About** - Professional background and story
- **💼 Projects** - Interactive project showcase with modals
- **📄 Resume** - Professional experience and skills
- **📞 Contact** - Contact form and social links

### **Interactive Features**
- **Command Palette** - Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Terminal Hero** - Animated command-line interface
- **Project Modals** - Detailed project information
- **Responsive Design** - Works on all devices

## 📱 Development Commands

```bash
# Development
npm run dev          # Start development server (hot reload)
npm run build        # Build for production
npm run start        # Start production server locally

# Code Quality
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check without building

# Utilities
npm run postbuild    # Generate sitemap (runs automatically after build)
```

## 🛠️ VS Code Setup

For the best development experience, install these VS Code extensions:

### **Essential Extensions**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### **VS Code Settings**
Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 🎨 Customization Quick Start

### **1. Update Personal Information**

Edit the content in these key files:

```typescript
// src/constants/personal.ts (you may need to create this)
export const PERSONAL_INFO = {
  name: "Your Name",
  title: "Your Title",
  email: "your.email@example.com",
  github: "your-github-username",
  linkedin: "your-linkedin-profile"
};
```

### **2. Customize Colors**

The cyberpunk theme colors are in `src/app/globals.css`:

```css
:root {
  --electric-blue: #00F5FF;    /* Primary accent */
  --matrix-green: #39FF14;     /* Secondary accent */
  --warning-amber: #FFB800;    /* Warnings */
  --error-red: #FF073A;        /* Errors */
  --neon-purple: #BF00FF;      /* Special effects */
}
```

### **3. Add Your Projects**

Update the projects data (location may vary - check the projects page component):

```typescript
// Example project structure
const projects = [
  {
    id: "project-1",
    title: "Your Project",
    description: "Brief description",
    image: "/images/project-screenshot.jpg",
    technologies: ["React", "TypeScript", "Tailwind CSS"],
    features: ["Feature 1", "Feature 2", "Feature 3"],
    liveUrl: "https://your-project.com",
    githubUrl: "https://github.com/your-username/project"
  }
];
```

### **4. Update Terminal Commands**

Customize the terminal animation in `src/components/TerminalHero.tsx`:

```typescript
const commands = [
  '> whoami',
  'your_name@portfolio:~$ Your Professional Title',
  '> ls -la skills/',
  'drwxr-xr-x  2 user  staff  Your, Skills, Here',
  // Add more commands...
];
```

## 🔧 Environment Configuration

### **Optional Environment Variables**

Create `.env.local` for development:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id_here

# Development
NODE_ENV=development
```

### **Production Environment**

For deployment, you'll need:

```env
# Required
SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_production_ga_id
```

## 🏗️ Project Structure Overview

```
src/
├── app/                 # Next.js App Router
│   ├── about/          # About page
│   ├── contact/        # Contact page
│   ├── projects/       # Projects showcase
│   ├── resume/         # Resume page
│   └── api/            # API endpoints
├── components/         # React components
│   ├── ui/            # Base UI components
│   ├── TerminalHero/  # Terminal interface
│   └── ...            # Feature components
├── lib/              # Utilities and helpers
├── constants/        # Static data
├── types/           # TypeScript definitions
└── hooks/           # Custom React hooks
```

## 🎭 Key Components

### **GlassCard** - Glassmorphism Container
```tsx
<GlassCard elevation={3} glow hover>
  <h2>Your Content</h2>
</GlassCard>
```

### **MorphButton** - Cyberpunk Button
```tsx
<MorphButton variant="primary" size="lg" glow>
  Click Me
</MorphButton>
```

### **Heading** - Typography
```tsx
<Heading level={1} variant="gradient">
  Your Heading
</Heading>
```

## 🚨 Common Issues & Quick Fixes

### **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### **Module Not Found**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
```

### **TypeScript Errors**
```bash
# Check types without building
npx tsc --noEmit

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### **Styles Not Loading**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📚 Next Steps

### **For Customization**
1. **[COMPONENTS.md](./COMPONENTS.md)** - Component library documentation
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Detailed development guide
3. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment

### **For Contribution**
1. Read the codebase structure
2. Check existing components and patterns
3. Follow the established coding conventions
4. Test your changes thoroughly

### **For Deployment**
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
2. **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues

## 🤝 Getting Help

### **Documentation**
- **[README.md](./README.md)** - Project overview
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Problem solving
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

### **Quick Commands Reference**
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Code linting

# Debugging
npm run build --debug    # Debug build
npx tsc --noEmit        # Type check
```

### **VS Code Shortcuts**
- `⌘/Ctrl + Shift + P` - Command palette
- `⌘/Ctrl + K` - In-app command palette
- `⌘/Ctrl + ,` - Settings
- `⌘/Ctrl + Shift + E` - Explorer

---

**🎉 You're ready to start developing!** The portfolio is designed to be easily customizable while maintaining its cyberpunk aesthetic and professional functionality.

*For detailed information about any aspect of the project, check the comprehensive documentation in the other `.md` files in this repository.*