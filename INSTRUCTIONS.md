# INSTRUCTIONS for Autonomous AI Engineer

- **Stack**: Next.js frontend, Supabase backend, Python utilities.
- **Linting**: flake8 for Python; black optional.
- **Build**: npm run build for frontend; pytest for Python tests.
- **Do not use** Google Cloud or closed-source Google-only services.
- **Model policy**: Prefer remote hosted open-source providers (Hugging Face, Replicate, Ollama, or any HTTP provider).
- **Security**: Never commit secrets. Use GitHub Secrets for MODEL_PROVIDER, MODEL_NAME, MODEL_API_KEY, MODEL_API_URL.
- **PR policy**: Agent must not push code automatically. It may create patch files and request review.
- **Supabase**: migrations in supabase/migrations; use supabase CLI locally.
- **Next.js**: app/ or pages/ depending on repo.
- **Arabic support**: Prefer Arabic in user-facing messages and prompts when repository language is Arabic.
