-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS challenges;
CREATE SCHEMA IF NOT EXISTS eval;
CREATE SCHEMA IF NOT EXISTS media;

-- 1. CORE SCHEMA
CREATE TABLE core.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'author', 'reviewer', 'admin')),
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MEDIA SCHEMA
CREATE TABLE media.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES core.users(id),
    
    -- Google Drive identifiers
    drive_file_id VARCHAR(100) NOT NULL UNIQUE,  -- Google Drive File ID
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    
    -- Google Drive URLs
    web_content_link TEXT,                       -- Direct download URL
    web_view_link TEXT,                          -- Preview URL in Drive UI
    thumbnail_link TEXT,                         -- Google auto-generated thumbnail
    
    -- Layout & Accessibility metadata
    width INT,
    height INT,
    alt_text TEXT,
    caption TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_drive_file_id ON media.assets(drive_file_id);

-- 3. CONTENT SCHEMA
CREATE TABLE content.categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE content.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES core.users(id),
    category_id INT REFERENCES content.categories(id) ON DELETE SET NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content_type VARCHAR(30) NOT NULL DEFAULT 'article' CHECK (content_type IN ('article', 'writeup', 'cheatsheet', 'announcement')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE content.post_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES content.posts(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    block_type VARCHAR(50) NOT NULL CHECK (
        block_type IN ('markdown', 'code_snippet', 'image', 'callout', 'interactive_quiz', 'challenge_ref')
    ),
    asset_id UUID REFERENCES media.assets(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_blocks_ordering ON content.post_blocks(post_id, order_index ASC);

CREATE TABLE content.post_assets (
    post_id UUID NOT NULL REFERENCES content.posts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES media.assets(id) ON DELETE RESTRICT,
    PRIMARY KEY (post_id, asset_id)
);

-- 4. CHALLENGES SCHEMA
CREATE TABLE challenges.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE challenges.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(160) UNIQUE NOT NULL,
    category_id INT REFERENCES challenges.categories(id),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'insane')),
    points INT NOT NULL DEFAULT 100,
    description TEXT NOT NULL,
    artifact_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE challenges.flags (
    id SERIAL PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges.challenges(id) ON DELETE CASCADE,
    flag_hash TEXT NOT NULL,
    is_regex BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE challenges.submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges.challenges(id) ON DELETE CASCADE,
    submitted_flag TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVAL SCHEMA
CREATE TABLE eval.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(160) UNIQUE NOT NULL,
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('quiz', 'exam')),
    time_limit_minutes INT,
    passing_score_pct NUMERIC(5,2) DEFAULT 70.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE eval.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('single_choice', 'multi_choice', 'text', 'code_snippet')),
    prompt TEXT NOT NULL,
    explanation TEXT,
    points INT NOT NULL DEFAULT 1,
    difficulty VARCHAR(20) DEFAULT 'medium'
);

CREATE TABLE eval.options (
    id SERIAL PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES eval.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0
);
