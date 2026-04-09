# Code Blocks And Copy Behavior

This document explains how code blocks should be written in posts, what broke in this project, and what was changed so code rendering and copy now work correctly.

## Goal

Technical posts on this blog must render code and terminal output cleanly:

- multiline command output must stay multiline
- shell commands must render as real code blocks
- the Chirpy code block header should appear
- the copy button should work

The content should stay natural Markdown.
Do not redesign posts around theme bugs.

## Correct Markdown Format

Use normal fenced code blocks.

Shell commands:

```md
```bash
nmap -sV 10.10.10.10
```
```

Plain output:

```md
```text
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
2222/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8
```
```

Important:

- use `bash` for commands
- use `text` for raw terminal output
- keep each command on its own line
- keep each output line on its own line
- do not replace fenced code blocks with Liquid `highlight` tags unless there is a very specific reason

## What Was Broken

The Markdown files themselves were valid.

The problem was in the rendered HTML layer.

In this project, Chirpy's `refactor-content.html` processing removed the `<pre>` wrapper from code blocks while still adding the code header and copy button.

Once `<pre>` disappeared:

- line breaks inside code blocks collapsed
- multiple commands looked merged together
- terminal output looked flattened into one line

That made blocks render badly even though the Markdown source was correct.

## Why Copy Was Also Broken

The original Chirpy JavaScript expected a DOM structure that included `.rouge-code`.

In this project, the generated DOM for the code block did not include `.rouge-code`, so the built-in copy handler could not find a valid copy target.

Result:

- the button appeared
- the button did not actually copy anything

## What Was Changed

Two project-level overrides were added.

### 1. Code block rendering fix

File:

- [refactor-content.html](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_includes/refactor-content.html)

Purpose:

- keep `<pre>` inside rendered code blocks
- preserve multiline output
- keep Chirpy's code header UI

This fix is theme-layer only.
It does not require changing post content.

### 2. Copy button fix

Files:

- [metadata-hook.html](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_includes/metadata-hook.html)
- [custom-copy.js](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/assets/js/custom-copy.js)

Purpose:

- attach a reliable click handler to `.code-header > button`
- copy the visible text from the actual adjacent `<code>` element
- avoid relying on Chirpy's broken `.rouge-code` lookup in this project

The custom copy script:

- tries `navigator.clipboard.writeText()` first
- falls back to a hidden textarea copy flow if needed
- updates the icon briefly to a check mark after success

### 3. Post chrome cleanup

Files:

- [post.html](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_layouts/post.html)
- [jekyll-theme-chirpy.scss](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/assets/css/jekyll-theme-chirpy.scss)

Purpose:

- remove the empty `By` row from post metadata
- hide Chirpy's heading anchor `#` icons from the visible UI

These are presentation-level decisions for this blog and should remain global theme behavior, not per-post fixes.

## Expected Result

After these fixes:

- fenced code blocks render with proper line breaks
- shell blocks keep the `Shell` header
- text output blocks keep the `Text` header
- the copy button copies the visible block content correctly

## Authoring Rules For Future Posts

When writing posts:

- do not put `# Post Title` inside the body when the title already exists in front matter
- do not use inline code formatting inside headings unless the visual result is explicitly desired
- keep code examples in fenced code blocks
- do not use inline code for command sequences that should be multiline
- do not manually add HTML wrappers around code blocks
- do not work around rendering issues by flattening the output yourself

For this blog, the page title is already rendered by the post layout.
The body should start with the actual article content, for example:

```md
Machine: [Simple CTF](https://tryhackme.com/room/easyctf)

## Introduction
```

If a code block looks wrong on the site:

1. Check the Markdown source first.
2. If the source is correct, inspect the rendered HTML.
3. Fix the theme/rendering layer, not the post content.

If a heading looks visually wrong on the site:

1. Check whether the heading includes inline code, path formatting, or other decorative Markdown.
2. Prefer plain heading text for readability.
3. Keep visual cleanup rules in the theme or authoring conventions, not as one-off hacks.

## Files To Check If This Breaks Again

- [refactor-content.html](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_includes/refactor-content.html)
- [metadata-hook.html](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_includes/metadata-hook.html)
- [custom-copy.js](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/assets/js/custom-copy.js)
- [post.html](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_layouts/post.html)
- [jekyll-theme-chirpy.scss](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/assets/css/jekyll-theme-chirpy.scss)
- [2026-02-01-simple-ctf.md](/workspace/projects/BLOG%2005%20GITHUB%20PUBLISH/Blog%20Public/_posts/2026-02-01-simple-ctf.md)

`2026-02-01-simple-ctf.md` is a good reference post because it contains:

- shell commands
- multiline command output
- multiple command blocks
- raw text output blocks

## Quick Validation Checklist

Before publishing posts with technical content, verify:

- multiline output still has line breaks
- copy button works
- shell blocks are labeled `Shell`
- text output blocks are labeled `Text`
- no command block looks flattened or merged
