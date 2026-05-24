# Project name
Vensight

# Concept
A platform that aggregates companies/startups/agencies and uses AI to:
- summarize companies
- generate insights
- compare competitors
- categorize businesses
- generate SEO content
- recommend similar companies

# Features
Public Pages:
- SEO optimized listing pages
- dynamic company pages
- category pages
- filters/search
- AI-generated summaries
- AI “compare competitors”
Dashboard
- analytics
- listing management
- AI content generation
- performance metrics

# Concept of AI features
User enters company URL -> System:
-scrapes content
-analyzes business
-generates structured profile
- generates company summary
- generates SEO metadata
- extracts business categories

# MVP Scope

The first version includes:
- homepage
- company listing page
- company detail page
- search/filter
- dashboard authentication
- add/edit company
- AI company analysis from URL

Not included in MVP:
- payments
- real-time collaboration
- advanced analytics
- notifications

# Listing import
First phase - Static seeded companies
Second phase - Url analysis + AI enrichment
Third phase - Optional external APIs(free ones, not any paid tier, Apify, Crunchbase, Clearbit(with data sources disclaimer))
Search discovery phase - SearchApi primary free-credit provider, optional Tavily fallback, persisted review queue before AI analysis or listing creation.

# Tech Stack

Frontend:
- Angular 19
- Angular SSR
- TypeScript
- TailwindCSS

Backend:
- Node.js
- NestJS

Database:
- PostgreSQL
- Prisma ORM

AI:
-Ollama
-Qwen2.5 7B
-Node.js AI service abstraction
-Mock provider by default
-Groq fallback (mainly Groq, could be OpenRouter/Google free tier)
-AI confidence score: around 0.85

Deployment:
- Vercel (frontend)
- Northflank (backend)

# Architecture

- Public pages rendered via Angular SSR for SEO
- Dashboard rendered client-side
- Backend exposes REST API
- AI analysis processed asynchronously
- AI-generated results cached in database

# Main Entities

Company
- id
- name
- description
- website
- category
- tags
- aiSummary
- seoDescription

Category
- id
- name
- slug

User
- id
- email
- role

# Styling Rules
Unite overall styles that are repeatable but not ordinary for Tailwind in css file, assign non-custom styles in components to its css file.
The overall design should be the combination of premium + practical, commercial. The main color should be silver + secondary color, feel free to suggest it.
The examples of styling designs: column.com, https://www.wander.com/, https://salient.tailwindui.com/, https://keynote.tailwindui.com/, atom.com
The goldenpages concept overall - https://www.goldenpages.be/, https://www.zlatestranky.sk/, obodo.be

# Engineering Goals

- Lighthouse score above 90
- SEO optimized pages
- reusable component architecture
- responsive design
- clean modular backend
- accessibility basics
- Docker support

# AI Strategy

- AI calls are manually triggered
- Results are cached
- Mock AI mode enabled by default
- Minimal API usage to reduce cost
