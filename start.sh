#!/bin/bash
# Secret Shop - Start both bot and dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Secret Shop Bot + Dashboard Startup             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env from .env.example files in both bot/ and dashboard/"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Generate JWT keys if missing
if [ ! -f bot/keys/private.pem ] || [ ! -f bot/keys/public.pem ]; then
    echo -e "${YELLOW}Generating JWT keys...${NC}"
    mkdir -p bot/keys
    openssl genrsa -out bot/keys/private.pem 2048
    openssl rsa -in bot/keys/private.pem -pubout -out bot/keys/public.pem
    echo -e "${GREEN}JWT keys generated${NC}"
fi

# Create symlink for items.json
echo -e "${YELLOW}Linking items.json...${NC}"
ln -sf ../bot/items.json dashboard/items.json

# Install bot dependencies
echo -e "${YELLOW}Installing bot dependencies...${NC}"
cd bot
if [ ! -d node_modules ]; then
    npm ci
fi
cd ..

# Install dashboard dependencies
echo -e "${YELLOW}Installing dashboard dependencies...${NC}"
cd dashboard
if [ ! -d venv ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Run database migrations (if using supabase-cli)
# echo -e "${YELLOW}Running database migrations...${NC}"
# supabase db push

echo -e "${GREEN}Starting services...${NC}"

# Start bot in background
cd bot
npm run start > ../logs/bot.log 2>&1 &
BOT_PID=$!
cd ..

# Wait for bot API to be ready
echo -e "${YELLOW}Waiting for bot API...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}Bot API is ready${NC}"
        break
    fi
    sleep 1
done

# Start dashboard in background
cd dashboard
source venv/bin/activate
python run.py > ../logs/dashboard.log 2>&1 &
DASH_PID=$!
cd ..

# Wait for dashboard to be ready
echo -e "${YELLOW}Waiting for dashboard...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}Dashboard is ready${NC}"
        break
    fi
    sleep 1
done

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Services Running                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo -e "Bot API:      ${GREEN}http://localhost:3001${NC}"
echo -e "Dashboard:    ${GREEN}http://localhost:5000${NC}"
echo -e "Bot Logs:     ${YELLOW}logs/bot.log${NC}"
echo -e "Dashboard:    ${YELLOW}logs/dashboard.log${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Create logs directory
mkdir -p logs

# Trap SIGINT to stop both processes
trap "kill $BOT_PID $DASH_PID 2>/dev/null; echo -e '\n${YELLOW}Stopping services...${NC}'; exit 0" INT TERM

# Wait for both processes
wait $BOT_PID $DASH_PID