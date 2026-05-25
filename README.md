# SleepyStop
This is an application which helps daily commuters to catch their ( Subway Stop ) even they fell sleep.

Main app flow
1. User opens app
2. User allows location permission
3. App shows NYC subway map
4. User searches/selects destination station
5. User selects alert type:
   - Notification
   - Vibration
   - Both
6. App tracks user location
7. App calculates distance between user and destination station
8. When user is within 100 meters, app vibrates/notifiesFrontend

React + Vite
Mapbox GL JS or MapLibre GL
Browser Geolocation API
Notification API
Vibration API, mostly useful on mobile browsers

Backend

Node.js + Express
PostgreSQL / Supabase
Redis cache, optional but useful for live MTA data
MTA GTFS Static + MTA GTFS-Realtime
