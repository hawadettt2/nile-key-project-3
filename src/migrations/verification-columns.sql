-- Migration: Add verification code columns to profiles table for OTP system
-- Run this after the main schema.sql

-- Add verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for verification code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code 
ON public.profiles (verification_code);

-- Add index for verification code expiry
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code_expires 
ON public.profiles (verification_code_expires_at);