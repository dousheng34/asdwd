-- Database Schema for Gaming Marketplace (Solar Orange Theme)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (Extends Supabase Auth users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
    rating DECIMAL(3, 2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, balance)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', 'gamer_' || substring(new.id::text from 1 for 8)),
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        0.00
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. GAMES Table
CREATE TABLE public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    banner_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);


-- 3. CATEGORIES Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., 'Currency', 'Items', 'Accounts', 'Boosting'
    slug TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (name, slug)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);


-- 4. LISTINGS Table (Marketplace Items)
CREATE TABLE public.listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock INTEGER DEFAULT 1 CHECK (stock >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'paused')),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone" ON public.listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their own listings" ON public.listings
    FOR ALL USING (auth.uid() = seller_id);


-- 5. TRANSACTIONS Table (Escrow Flow)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'escrow', 'completed', 'disputed', 'canceled')),
    delivery_proof TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions as buyer or seller" ON public.transactions
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can initiate transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Involved parties can update transaction status" ON public.transactions
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);


-- 6. CHAT MESSAGES Table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- Seed Initial Games and Categories (For local setup reference)
INSERT INTO public.games (name, slug) VALUES 
('Counter-Strike 2', 'cs2'),
('Dota 2', 'dota2'),
('World of Warcraft', 'wow'),
('Valorant', 'valorant')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, slug, icon) VALUES 
('Items', 'items', 'Sword'),
('Currency', 'currency', 'Coins'),
('Accounts', 'accounts', 'UserCheck'),
('Boosting', 'boosting', 'TrendingUp')
ON CONFLICT DO NOTHING;
