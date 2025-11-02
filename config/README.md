# Environment Configuration

This directory contains environment-specific configuration files for the application.

## Setup Instructions

### Development Environment

1. Copy the example file:
   ```bash
   cp config/development.env.example config/development.env
   ```

2. Update the `config/development.env` file with your actual credentials

3. The `docker-compose.yml` will automatically load this file for the web-portal service

### Production Environment

1. Copy the example file:
   ```bash
   cp config/production.env.example config/production.env
   ```

2. Update the `config/production.env` file with your production credentials

3. Update your production `docker-compose.yml` to load the production env file:
   ```yaml
   web-portal:
     env_file:
       - ./config/production.env
   ```

## Important Notes

- **Never commit `.env` files to version control**
- `.env` files are automatically ignored by `.gitignore`
- Always use the `.example` files as templates
- Replace all placeholder values with actual credentials

## Environment Variables

### API Configuration
- `REACT_APP_API_URL`: Base URL for the API gateway
- `REACT_APP_GEOFENCE_SERVICE_URL`: URL for the geofence service
- `REACT_APP_NOTIFICATION_SERVICE_URL`: URL for the notification service

### Telstra API Configuration
- `REACT_APP_TELSTRA_API_HOST`: Telstra API host URL
- `REACT_APP_TELSTRA_RAPIDAPI_HOST`: RapidAPI host for Telstra API
- `REACT_APP_TELSTRA_RAPIDAPI_KEY`: Your RapidAPI key (keep this secret!)

## Getting RapidAPI Key

1. Go to https://rapidapi.com/
2. Sign up or log in
3. Subscribe to the Telstra Hackathon APIs
4. Copy your API key from the dashboard
5. Add it to your environment file

