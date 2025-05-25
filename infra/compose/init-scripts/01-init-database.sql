-- ZAMC Database Initialization Script
-- This script sets up the basic database structure for the ZAMC platform

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS storage;

-- Create basic tables for ZAMC platform

-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(15),
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(15),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current VARCHAR(255),
    email_change_confirm_status SMALLINT,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategies table
CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience TEXT,
    budget DECIMAL(10,2),
    duration_days INTEGER,
    platforms TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    ai_generated_content JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    file_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL,
    platform_id VARCHAR(255),
    platform_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    deployed_at TIMESTAMPTZ,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID REFERENCES public.deployments(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_project_id ON public.strategies(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_strategy_id ON public.assets(strategy_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_asset_id ON public.deployments(asset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_deployment_id ON public.analytics(deployment_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_date ON public.analytics(metric_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON public.deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@zamc.dev',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.projects (id, name, description, user_id, created_at) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Project',
    'A sample project for testing the ZAMC platform',
    '00000000-0000-0000-0000-000000000001',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres; 