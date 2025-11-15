#!/bin/bash

# ⚛️ Banking Bot Frontend Setup Script for Mac
# This script automates the React frontend setup process

set -e  # Exit on any error

echo "⚛️ Banking Bot Frontend Setup Starting..."
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
print_success "Node.js $NODE_VERSION found"

# Check npm
if ! command_exists npm; then
    print_error "npm is not installed. It should come with Node.js"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION found"

# Check if we're in the banking-bot-ui directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the banking-bot-ui directory"
    print_error "Current directory: $(pwd)"
    print_error "Expected files: package.json, src/, public/"
    exit 1
fi

# Verify it's the correct package.json
if ! grep -q "vite" package.json; then
    print_error "This doesn't appear to be the banking-bot-ui directory"
    print_error "Make sure you're in the correct folder with the React frontend"
    exit 1
fi

print_success "Running from correct directory: $(pwd)"

# Step 1: Clean install
print_status "Step 1/4: Cleaning previous installation..."

if [ -d "node_modules" ]; then
    print_warning "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    print_warning "Removing existing package-lock.json..."
    rm -f package-lock.json
fi

print_success "Cleanup completed"

# Step 2: Install dependencies with fallback strategies
print_status "Step 2/4: Installing frontend dependencies..."
print_warning "This may take 1-3 minutes depending on your internet connection..."

# Function to try npm install with different strategies
install_dependencies() {
    local strategy=$1
    local description=$2
    
    print_status "Trying: $description"
    
    case $strategy in
        "normal")
            npm install
            ;;
        "legacy-peer-deps")
            npm install --legacy-peer-deps
            ;;
        "force")
            npm install --force
            ;;
        "cache-clean")
            print_warning "Cleaning npm cache..."
            npm cache clean --force
            npm install --legacy-peer-deps
            ;;
    esac
    
    return $?
}

# Try multiple installation strategies
INSTALL_SUCCESS=false

# Strategy 1: Normal install
if install_dependencies "normal" "Standard npm install"; then
    INSTALL_SUCCESS=true
    print_success "Dependencies installed successfully (standard method)"
else
    print_warning "Standard install failed, trying fallback strategies..."
    
    # Strategy 2: Legacy peer deps
    if install_dependencies "legacy-peer-deps" "npm install --legacy-peer-deps"; then
        INSTALL_SUCCESS=true
        print_success "Dependencies installed successfully (with legacy peer deps)"
    else
        print_warning "Legacy peer deps failed, trying force install..."
        
        # Strategy 3: Force install
        if install_dependencies "force" "npm install --force"; then
            INSTALL_SUCCESS=true
            print_success "Dependencies installed successfully (with force)"
        else
            print_warning "Force install failed, trying cache clean..."
            
            # Strategy 4: Clean cache and retry
            if install_dependencies "cache-clean" "Clean cache + legacy peer deps"; then
                INSTALL_SUCCESS=true
                print_success "Dependencies installed successfully (after cache clean)"
            fi
        fi
    fi
fi

# Check if any strategy worked
if [ "$INSTALL_SUCCESS" = false ]; then
    print_error "❌ All installation strategies failed!"
    echo ""
    echo "🔧 MANUAL TROUBLESHOOTING:"
    echo "=========================="
    echo "1. Check your internet connection"
    echo "2. Try: npm install --legacy-peer-deps"
    echo "3. Try: npm install --force"
    echo "4. Try: npm cache clean --force && npm install"
    echo "5. Delete node_modules and package-lock.json, then retry"
    echo ""
    exit 1
fi

print_success "✅ All frontend dependencies installed successfully!"

# Step 3: Verify installation
print_status "Step 3/4: Verifying installation..."

# Check if essential dependencies are installed
if [ ! -d "node_modules" ]; then
    print_error "node_modules directory not found after installation"
    exit 1
fi

# Check for key packages
REQUIRED_PACKAGES=("react" "vite" "typescript" "@types/react")
for package in "${REQUIRED_PACKAGES[@]}"; do
    if [ ! -d "node_modules/$package" ]; then
        print_error "Required package '$package' not found"
        exit 1
    fi
done

print_success "Installation verified - all required packages found"

# Step 4: Create startup script
print_status "Step 4/4: Creating startup script..."

cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "⚛️ Starting Banking Bot Frontend..."
echo "📍 Frontend URL: http://localhost:3000"
echo "🔄 Backend API: http://localhost:2024"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Make sure the backend is running before using the frontend!"
echo ""
npm run dev
EOF

chmod +x start_frontend.sh
print_success "Created start_frontend.sh script"

# Skip build test as it's not essential for workshop
print_status "Skipping build test - development server is ready"

echo ""
echo "🎉 FRONTEND SETUP COMPLETED SUCCESSFULLY!"
echo "========================================"
echo ""
print_success "✅ Node.js and npm verified"
print_success "✅ All dependencies installed"
print_success "✅ Installation verified"
print_success "✅ Startup script created"
echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo ""
print_warning "1. MAKE SURE BACKEND IS RUNNING:"
echo "   - Go to the BankingBot directory"
echo "   - Run: ./start_banking_bot.sh"
echo "   - Verify backend is running at: http://localhost:2024/health"
echo ""
print_warning "2. START THE FRONTEND:"
echo "   ./start_frontend.sh"
echo "   OR"
echo "   npm run dev"
echo ""
print_warning "3. OPEN YOUR BROWSER:"
echo "   http://localhost:3000"
echo ""
echo "🧪 TEST THE COMPLETE SYSTEM:"
echo "============================"
echo "1. Open http://localhost:3000"
echo "2. Login with test user: sarah_chen / password123 (or other workshop accounts)"
echo "3. Ask: 'What is my account balance?'"
echo "4. Ask: 'Show me my recent transactions'"
echo "5. Ask: 'What are international transfer fees?'"
echo ""
echo "🔗 USEFUL LINKS:"
echo "================"
echo "Frontend:    http://localhost:3000"
echo "Backend API: http://localhost:2024/docs"
echo "Health:      http://localhost:2024/health"
echo ""
print_success "Happy coding! 🚀"
echo ""
