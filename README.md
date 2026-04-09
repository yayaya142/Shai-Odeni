# Blog Public

This directory contains the public Jekyll site for the blog.

## Stack

- Jekyll
- `jekyll-theme-chirpy`

## Theme approach

This site is built on top of Chirpy intentionally.

- Chirpy is the default foundation, not a temporary starter
- built-in Chirpy features should be used before custom rewrites
- customization should stay focused, light, and maintainable

## Local preview

From this directory:

```powershell
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4001 --trace
```

Or use the repository helper script at the workspace root:

```powershell
start-blog-preview.bat
```
