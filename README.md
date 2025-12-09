# Polyglot Persistence Demo

This project demonstrates a polyglot persistence system using Relational, Document, Graph, Time-series, and Key-value databases. It features a microservices architecture with a unified API gateway and a live visualization UI.

## Goals

- **Polyglot Persistence**: Showcase interaction between Postgres, MongoDB, Neo4j, TimescaleDB, and Redis.
- **Consistency Patterns**: Demonstrate strong vs. weak consistency.
- **Real-time Visualization**: Visualize data flow and state changes across services.
- **Event-Driven**: Use Kafka for event propagation.

## Architecture

```mermaid
graph TD
    UI[Frontend UI] -->|WebSocket/GraphQL| API[API Gateway]
    API -->|Auth/User| Postgres[(Postgres - UserSvc)]
    API -->|Posts| Mongo[(MongoDB - DocSvc)]
    API -->|Graph| Neo4j[(Neo4j - GraphSvc)]
    API -->|Events| Timescale[(TimescaleDB - TimeSvc)]
    API -->|Cache| Redis[(Redis - Cache)]
    API -->|Publish| Kafka{Kafka}
    
    Postgres -->|CDC| Kafka
    Kafka -->|Consume| Neo4j
    Kafka -->|Consume| Redis
    Kafka -->|Consume| Timescale
```

### Services
- **Frontend**: React application for visualization.
- **API Gateway**: Node.js/Express service handling routing and orchestration.
- **User Service**: PostgreSQL for user data (Strong consistency).
- **Document Service**: MongoDB for posts and comments.
- **Graph Service**: Neo4j for social relationships.
- **Time-series Service**: TimescaleDB for analytics events.
- **Cache**: Redis for session and profile caching.
- **Message Broker**: Kafka for event bus.

## Project Structure

```
.
├── docker-compose.yml      # Orchestration for all services and databases
├── database.sql            # Postgres initialization script
├── TimeScaleDB.sql         # TimescaleDB initialization script
├── posts.json              # Sample data for MongoDB
├── services/
│   ├── api/                # Node.js Backend API
│   └── frontend/           # React Frontend
└── README.md               # Project documentation
```

## API Endpoints

### User Management
- `POST /users` - Create user (syncs to Neo4j)
- `GET /users` - Get all users
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (cascades in Neo4j)

### Post Management
- `POST /posts` - Create post
- `GET /posts` - Get all posts (enriched with user data)
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

### Graph Relationships
- `POST /follow` - Create follow relationship
- `GET /relationships` - Get all relationships with user names

### Analytics
- `GET /analytics` - Get TimescaleDB statistics (events count, types, etc.)

### Cache Monitoring
- `GET /cache-status` - Get Redis cache status and metrics

## Getting Started

### Prerequisites
- Docker Desktop (with Docker Compose v2.0+)
- 8GB RAM minimum
- 10GB free disk space

### Quick Start
```bash
cd services/
docker-compose up -d
```

Then access:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Neo4j Browser: http://localhost:7474 (neo4j / neo4jpass)

## Data Schemas

### PostgreSQL (Users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### MongoDB (Posts)
```json
{
  "author_id": "uuid",
  "title": "Post Title",
  "body": "Content...",
  "tags": ["tag1"],
  "meta": { "likes": 0 }
}
```

### Neo4j (Graph)
- **Nodes**: `(:User {id, name})`
- **Relationships**: `(:User)-[:FOLLOWS]->(:User)`

### TimescaleDB (Events)
```sql
CREATE TABLE events (
  time TIMESTAMPTZ NOT NULL,
  user_id UUID,
  event_type TEXT,
  properties JSONB
);
```

## Implementation Status

- [x] Docker Compose setup
- [x] Database initialization scripts
- [x] Service Structure (API & Frontend)
- [x] Full API Implementation with modular route handlers
- [x] API Modularization (routes/users.js, routes/posts.js, routes/graph.js, routes/analytics.js, routes/cache.js)
- [x] Centralized error handling with asyncHandler middleware
- [x] Neo4j user creation sync from PostgreSQL
- [x] Graph visualization with vis-network
- [x] Frontend components (GraphSection, AnalyticsSection, CacheSection)
- [x] Redis cache monitoring endpoints
- [ ] Full Kafka event consumption integration to TimescaleDB