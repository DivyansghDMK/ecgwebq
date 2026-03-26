# ECGWebQ - ECG Management Platform

A modern React-based frontend application for ECG (Electrocardiogram) management and visualization.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Authentication components
│   ├── doctor/         # Doctor dashboard components
│   ├── dashboard_CPAP_BiPAP/  # CPAP device management
│   └── ui/             # Base UI components
├── sections/           # Landing page sections
├── api/               # API client functions
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── services/          # Frontend services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # CSS/styling files
```

## 🎯 Features

### Multi-Role Dashboard System
- **Admin Dashboard**: Complete system management
- **Doctor Dashboard**: Medical review workflow
- **CPAP/BiPAP Dashboard**: Medical device management

### Key Components
- ECG data visualization
- Patient report management
- Real-time analytics
- 3D heart model visualization
- AI-powered chatbot assistance

## 🔧 Technology Stack

- **React 19.0.0** - UI framework
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4.11** - Build tool and dev server
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **React Router DOM 6.30.2** - Client-side routing
- **Framer Motion 11.11.17** - Animation library
- **Lucide React 0.462.0** - Icon library
- **Recharts 3.6.0** - Chart library
- **React Three Fiber** - 3D graphics

## 🌐 API Integration

This frontend connects to a separate backend API service. Configure API endpoints in `src/api/ecgApi.ts`:

```typescript
const API_BASE_URL = 'https://your-backend-domain.com/prod/api';
const DOCTOR_API_BASE_URL = 'https://your-backend-domain.com';
```

## 🔐 Authentication

The application uses JWT token-based authentication. Tokens are stored in `localStorage` and automatically included in API requests.

## 📦 Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Deployment
The built application can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🎨 Styling

The project uses Tailwind CSS for styling with custom configurations in `tailwind.config.ts`. Component-specific styles are located in `src/styles/`.

## 🔍 Code Quality

```bash
# Run ESLint
npm run lint
```

## 📚 Documentation

- Component documentation is available in respective component files
- API documentation is available in separate backend repository

## 🤝 Contributing

1. Fork repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

