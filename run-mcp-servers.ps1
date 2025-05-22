Write-Host "Starting the AI Travel Agents application..."

cd src

docker compose up --build -d tool-customer-query tool-destination-recommendation tool-itinerary-planning tool-code-evaluation tool-model-inference tool-web-search
